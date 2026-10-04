import { type Activity, type DataFlow, type FlowConnection, type FlowStep, type Knowledge, unknown } from "./model";
import { assertJourneys, nextJourneyReference } from "./flow-journeys";
import { setFlowConnection } from "./flow-connections";
import { PrivacyError } from "./validation";

export interface FlowIntermediaryOptions { intermediary: Knowledge; stepId?: string }
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const forbiddenText = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

function selectedStep(flow: DataFlow, stepId: string | undefined): FlowStep | undefined {
  if (!flow.journey) { if (stepId !== undefined) throw new PrivacyError("INVALID"); return undefined; }
  const step = stepId ? flow.journey.steps.find(step => step.id === stepId) : flow.journey.steps.length === 1 ? flow.journey.steps[0] : undefined;
  if (!step) throw new PrivacyError("INVALID");
  return step;
}

/** Declare two actual movements without inventing the new handoff's operation or channel. */
export function insertFlowIntermediary(activity: Activity, flowId: string, options: FlowIntermediaryOptions, id: () => string): Activity {
  assertJourneys(activity);
  if (!options || typeof options !== "object" || Object.keys(options).some(key => key !== "intermediary" && key !== "stepId") || !Object.hasOwn(options, "intermediary") || (options.stepId !== undefined && (typeof options.stepId !== "string" || !uuid.test(options.stepId)))) throw new PrivacyError("INVALID");
  const intermediary = options.intermediary;
  if (!intermediary || typeof intermediary !== "object" || intermediary.state !== "documented" || Object.keys(intermediary).length !== 2 || !Object.hasOwn(intermediary, "state") || !Object.hasOwn(intermediary, "value") || typeof intermediary.value !== "string" || !intermediary.value.trim() || intermediary.value.length > 4000 || forbiddenText.test(intermediary.value)) throw new PrivacyError("INVALID");
  const original = activity.flows.find(flow => flow.id === flowId);
  if (!original) throw new PrivacyError("INVALID");
  const selected = selectedStep(original, options.stepId);
  if (activity.flows.length >= 20) throw new PrivacyError("LIMIT");
  const existingIds = new Set([activity.id, activity.workspaceId, ...(activity.role === "controller" ? activity.purposes.map(purpose => purpose.id) : []), ...(activity.dataGroups ?? []).map(group => group.id), ...(activity.flowSupports ?? []).map(support => support.id), ...activity.flows.flatMap(flow => [flow.id, ...(flow.journey?.steps ?? []).map(step => step.id)])]);
  const fresh = () => { const value = id(); if (typeof value !== "string" || !uuid.test(value) || existingIds.has(value)) throw new PrivacyError("INVALID"); existingIds.add(value); return value; };
  const second = structuredClone(original); second.id = fresh(); delete second.sequence;
  const following: FlowConnection = structuredClone(original.sequence?.next ?? { state: "unknown" });
  // Detach the original next edges first; their peers remain present and reciprocal.
  let next = setFlowConnection(activity, flowId, "next", { state: "pending" });
  const first = next.flows.find(flow => flow.id === flowId)!;
  if (selected && first.journey && second.journey) {
    const index = original.journey!.steps.findIndex(step => step.id === selected.id);
    first.journey.steps = first.journey.steps.slice(0, index + 1);
    const receiving = first.journey.steps[index]!;
    receiving.destination = structuredClone(intermediary); delete receiving.destinationRef;
    receiving.location = unknown(); receiving.access = unknown();
    second.journey.reference = nextJourneyReference(next, second.dataGroupIds![0]!);
    second.journey.steps = second.journey.steps.slice(index);
    second.journey.steps.forEach(step => step.id = fresh());
    const handoff = second.journey.steps[0]!;
    handoff.source = structuredClone(intermediary); delete handoff.sourceRef;
    handoff.operation = unknown(); handoff.channel = unknown(); handoff.when = unknown(); handoff.supportIds = [];
  } else {
    first.destination = structuredClone(intermediary); delete first.destinationRef;
    first.location = unknown(); first.access = unknown();
    second.source = structuredClone(intermediary); delete second.sourceRef;
    second.operation = unknown(); second.channel = unknown();
  }
  const insertion = next.flows.findIndex(flow => flow.id === flowId) + 1;
  next.flows = [...next.flows.slice(0, insertion), second, ...next.flows.slice(insertion)];
  next = setFlowConnection(next, second.id, "next", following);
  next = setFlowConnection(next, flowId, "next", { state: "linked", flowIds: [second.id] });
  assertJourneys(next);
  return next;
}
