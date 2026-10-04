import { type Activity, type DataFlow, type FlowConnection, type FlowSequence, knowledge, knowledgeText, type Knowledge } from "./model";
import { PrivacyError } from "./validation";

export type FlowDirection = "previous" | "next";
const directions: readonly FlowDirection[] = ["previous", "next"];
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const opposite = (direction: FlowDirection): FlowDirection => direction === "previous" ? "next" : "previous";
const sequence = (flow: DataFlow): FlowSequence => flow.sequence ??= { previous: { state: "unknown" }, next: { state: "unknown" } };

function assertConnection(value: FlowConnection): void {
  if (!value || typeof value !== "object" || !["unknown", "none", "pending", "linked"].includes(value.state)) throw new PrivacyError("INVALID");
  if (value.state === "linked") {
    if (Object.keys(value).length !== 2 || Object.keys(value).some(key => key !== "state" && key !== "flowIds") || !Array.isArray(value.flowIds) || !value.flowIds.length || value.flowIds.length > 20 || new Set(value.flowIds).size !== value.flowIds.length || value.flowIds.some(id => typeof id !== "string" || !uuid.test(id))) throw new PrivacyError("INVALID");
  } else if (Object.keys(value).length !== 1 || !Object.hasOwn(value, "state")) throw new PrivacyError("INVALID");
}

/** Direct edges only. Cycles can describe repeated processing and never require recursion. */
export function assertFlowConnections(activity: Activity): void {
  const flows = new Map(activity.flows.map(flow => [flow.id, flow]));
  if (flows.size !== activity.flows.length || flows.size > 20) throw new PrivacyError("INVALID");
  for (const flow of activity.flows) {
    if (!flow.sequence) continue;
    if (Object.keys(flow.sequence).length !== 2 || !Object.hasOwn(flow.sequence, "previous") || !Object.hasOwn(flow.sequence, "next")) throw new PrivacyError("INVALID");
    for (const direction of directions) {
      const connection = flow.sequence[direction];
      assertConnection(connection);
      if (connection.state !== "linked") continue;
      for (const id of connection.flowIds) {
        const peer = flows.get(id), back = peer?.sequence?.[opposite(direction)];
        if (id === flow.id || !peer || back?.state !== "linked" || !back.flowIds.includes(flow.id)) throw new PrivacyError("INVALID");
      }
    }
  }
}

/** Update both ends of the explicitly selected relationships on a new activity. */
export function setFlowConnection(activity: Activity, flowId: string, direction: FlowDirection, connection: FlowConnection): Activity {
  assertFlowConnections(activity);
  if (!directions.includes(direction)) throw new PrivacyError("INVALID");
  assertConnection(connection);
  const original = activity.flows.find(flow => flow.id === flowId);
  if (!original || (connection.state === "linked" && connection.flowIds.some(id => id === flowId || !activity.flows.some(flow => flow.id === id)))) throw new PrivacyError("INVALID");
  const next = structuredClone(activity), flow = next.flows.find(item => item.id === flowId)!;
  const before = flow.sequence?.[direction], selected = connection.state === "linked" ? connection.flowIds : [];
  if (before?.state === "linked") for (const id of before.flowIds.filter(id => !selected.includes(id))) {
    const peer = next.flows.find(item => item.id === id)!, back = sequence(peer)[opposite(direction)];
    if (back.state === "linked") {
      const retained = back.flowIds.filter(id => id !== flowId);
      peer.sequence![opposite(direction)] = retained.length ? { state: "linked", flowIds: retained } : { state: "pending" };
    }
  }
  sequence(flow)[direction] = structuredClone(connection);
  for (const id of selected) {
    const peer = next.flows.find(item => item.id === id)!, back = sequence(peer)[opposite(direction)];
    peer.sequence![opposite(direction)] = { state: "linked", flowIds: [...new Set([...(back.state === "linked" ? back.flowIds : []), flowId])] };
  }
  assertFlowConnections(next);
  return next;
}

/** A removed link becomes pending, never an invented declaration of no other flow. */
export function removeFlow(activity: Activity, flowId: string): Activity {
  assertFlowConnections(activity);
  if (!activity.flows.some(flow => flow.id === flowId)) throw new PrivacyError("INVALID");
  const next = structuredClone(activity);
  next.flows = next.flows.filter(flow => flow.id !== flowId);
  for (const flow of next.flows) for (const direction of directions) {
    const connection = flow.sequence?.[direction];
    if (connection?.state !== "linked" || !connection.flowIds.includes(flowId)) continue;
    const retained = connection.flowIds.filter(id => id !== flowId);
    flow.sequence![direction] = retained.length ? { state: "linked", flowIds: retained } : { state: "pending" };
  }
  assertFlowConnections(next);
  return next;
}

export function flowLabel(activity: Activity, flowId: string): string {
  const index = activity.flows.findIndex(flow => flow.id === flowId), flow = activity.flows[index];
  return flow?.journey ? `Parcours ${flow.journey.reference}` : index >= 0 ? `Flux ${index + 1}` : "Flux à vérifier";
}

export function connectionText(activity: Activity, connection: FlowConnection | undefined, direction: FlowDirection): string {
  if (!connection || connection.state === "unknown") return "Non renseigné";
  if (connection.state === "none") return direction === "previous" ? "Aucun flux précédent" : "Aucun flux suivant";
  if (connection.state === "pending") return "En attente de description";
  return connection.state === "linked" ? connection.flowIds.map(id => flowLabel(activity, id)).join(" ; ") : "Non renseigné";
}

/** Preserve existing share formats: text only, without sequence objects or private IDs. */
export function flowOperationText(activity: Activity, flow: DataFlow, operation: Knowledge): Knowledge {
  if (!flow.sequence) return operation;
  return knowledge([knowledgeText(operation) || "Opération à préciser", `Flux précédent : ${connectionText(activity, flow.sequence.previous, "previous")}`, `Flux suivant : ${connectionText(activity, flow.sequence.next, "next")}`].join("\n"));
}
