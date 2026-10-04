import { type Activity, type DataFlow, type FlowStep, type Knowledge } from "./model";
import { assertJourneys, nextJourneyReference } from "./flow-journeys";
import { assertFlowConnections, setFlowConnection } from "./flow-connections";
import { PrivacyError } from "./validation";

export interface FlowBranchOptions {
  stepId?: string;
  operations?: Knowledge[];
  channels?: Knowledge[];
  locations?: Knowledge[];
  supportIds?: string[];
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const forbiddenText = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

function target(flow: DataFlow, options: FlowBranchOptions): DataFlow | FlowStep {
  if (!flow.journey) {
    if (options.stepId !== undefined || options.supportIds !== undefined) throw new PrivacyError("INVALID");
    return flow;
  }
  const step = options.stepId ? flow.journey.steps.find(step => step.id === options.stepId) : flow.journey.steps.length === 1 ? flow.journey.steps[0] : undefined;
  if (!step) throw new PrivacyError("INVALID");
  return step;
}

function optionsCount(activity: Activity, flowId: string, options: FlowBranchOptions): number {
  assertJourneys(activity);
  if (!options || typeof options !== "object" || Object.keys(options).some(key => !["stepId", "operations", "channels", "locations", "supportIds"].includes(key)) || (options.stepId !== undefined && (typeof options.stepId !== "string" || !uuid.test(options.stepId)))) throw new PrivacyError("INVALID");
  const flow = activity.flows.find(flow => flow.id === flowId);
  if (!flow) throw new PrivacyError("INVALID");
  const step = target(flow, options);
  let count = 1;
  for (const values of [options.operations, options.channels, options.locations]) {
    if (values === undefined) continue;
    if (!Array.isArray(values) || !values.length || values.length > 20) throw new PrivacyError("INVALID");
    for (const value of values) {
      if (!value || typeof value !== "object" || (value.state === "unknown" ? Object.keys(value).length !== 1 || !Object.hasOwn(value, "state") : value.state !== "documented" || Object.keys(value).length !== 2 || !Object.hasOwn(value, "state") || !Object.hasOwn(value, "value") || typeof value.value !== "string" || !value.value.trim() || value.value.length > 4000 || forbiddenText.test(value.value))) throw new PrivacyError("INVALID");
    }
    if (new Set(values.map(value => value.state === "documented" ? JSON.stringify([value.state, value.value.trim()]) : value.state)).size !== values.length) throw new PrivacyError("INVALID");
    count *= values.length;
    if (count > 20) throw new PrivacyError("LIMIT");
  }
  if (options.supportIds !== undefined) {
    const ids = options.supportIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 20 || new Set(ids).size !== ids.length || ids.some(id => !activity.flowSupports?.some(support => support.id === id))) throw new PrivacyError("INVALID");
    // A branch cannot silently retain a second support via an endpoint reference.
    for (const ref of [step.sourceRef, step.destinationRef]) if (ref?.startsWith("support:") && ids.some(id => ref !== `support:${id}`)) throw new PrivacyError("INVALID");
    count *= ids.length;
  }
  if (count > 20 || activity.flows.length + count - 1 > 20) throw new PrivacyError("LIMIT");
  return count;
}

/** The count is checked before generating combinations or consuming IDs. */
export function previewFlowBranches(activity: Activity, flowId: string, options: FlowBranchOptions): number {
  return optionsCount(activity, flowId, options);
}

/** Expand only explicitly independent alternatives; shared facts and catalogues stay linked. */
export function splitFlow(activity: Activity, flowId: string, options: FlowBranchOptions, id: () => string): Activity {
  const count = optionsCount(activity, flowId, options), original = activity.flows.find(flow => flow.id === flowId)!;
  if (count === 1 && ![options.operations, options.channels, options.locations, options.supportIds].some(Boolean)) throw new PrivacyError("INVALID");
  let next = structuredClone(activity);
  const existingIds = new Set([activity.id, activity.workspaceId, ...(activity.role === "controller" ? activity.purposes.map(purpose => purpose.id) : []), ...(activity.dataGroups ?? []).map(group => group.id), ...(activity.flowSupports ?? []).map(support => support.id), ...activity.flows.flatMap(flow => [flow.id, ...(flow.journey?.steps ?? []).map(step => step.id)])]);
  const fresh = () => { const value = id(); if (typeof value !== "string" || !uuid.test(value) || existingIds.has(value)) throw new PrivacyError("INVALID"); existingIds.add(value); return value; };
  const source = target(original, options), stepIndex = original.journey?.steps.findIndex(step => step.id === source.id) ?? -1;
  let branchIndex = 0;
  for (const operation of options.operations ?? [source.operation]) for (const channel of options.channels ?? [source.channel]) for (const location of options.locations ?? [source.location]) for (const supportId of options.supportIds ?? [undefined]) {
    const branch = branchIndex === 0 ? next.flows.find(flow => flow.id === flowId)! : structuredClone(original);
    if (branchIndex > 0) {
      branch.id = fresh();
      if (branch.journey) {
        branch.journey.reference = nextJourneyReference(next, branch.dataGroupIds![0]!);
        branch.journey.steps.forEach(step => step.id = fresh());
      }
      // Reciprocal edges are added by the helper after the new flow exists.
      const links = branch.sequence;
      delete branch.sequence;
      next.flows.push(branch);
      if (links) {
        next = setFlowConnection(next, branch.id, "previous", links.previous);
        next = setFlowConnection(next, branch.id, "next", links.next);
      }
    }
    const stored = next.flows.find(flow => flow.id === branch.id)!, chosen = stored.journey ? stored.journey.steps[stepIndex]! : stored;
    chosen.operation = structuredClone(operation); chosen.channel = structuredClone(channel); chosen.location = structuredClone(location);
    if (supportId !== undefined && "supportIds" in chosen) chosen.supportIds = [supportId];
    branchIndex++;
  }
  assertJourneys(next); assertFlowConnections(next);
  return next;
}
