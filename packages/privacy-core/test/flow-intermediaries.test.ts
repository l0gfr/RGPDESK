import { describe, expect, it } from "vitest";
import { assertWorkspace, createActivity, createDataFlow, createDataGroup, createFlowStep, createPurpose, createWorkspace, knowledge, unknown, setFlowConnection, insertFlowIntermediary, createImpactAssessment, recordPiaReview, putActivity, piaReviewState } from "../src/index";
import type { FlowIntermediaryOptions } from "../src/index";

let sequence = 880000;
const id = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const now = "2026-10-04T10:00:00.000Z";
function fixture(journey = false) {
  const workspace = createWorkspace(id(), "Organisme fictif", now), activity = createActivity(workspace.id, id(), "controller");
  if (activity.role !== "controller") throw Error("fixture");
  activity.title = "Fiches fictives"; activity.purposes = [createPurpose(id())]; activity.purposes[0]!.description = knowledge("Organiser un événement fictif");
  activity.dataGroups = [createDataGroup(id(), 1)]; activity.dataGroups[0]!.data = knowledge("Catégories fictives"); activity.dataGroups[0]!.people = knowledge("Participants fictifs");
  const flow = createDataFlow(id()); flow.dataGroupIds = [activity.dataGroups[0]!.id];
  if (journey) {
    activity.flowSupports = [{ id: id(), code: 1, name: "Support fictif A" }, { id: id(), code: 2, name: "Support fictif B" }];
    flow.journey = { reference: "1a", purposeIds: [activity.purposes[0]!.id], steps: Array.from({ length: 3 }, () => createFlowStep(id())) };
    for (const [index, step] of flow.journey.steps.entries()) {
      step.source = knowledge(`Origine fictive ${index}`); step.destination = knowledge(`Destination fictive ${index}`); step.operation = knowledge(`Opération fictive ${index}`);
      step.channel = knowledge(`Canal fictif ${index}`); step.location = knowledge(`Lieu fictif ${index}`); step.access = knowledge(`Fonction fictive ${index}`); step.when = knowledge(`Condition fictive ${index}`); step.supportIds = [activity.flowSupports[0]!.id];
    }
  } else {
    flow.source = knowledge("Participants fictifs"); flow.destination = knowledge("Organisateurs fictifs"); flow.operation = knowledge("Collecte des fiches fictives");
    flow.channel = knowledge("Formulaire fictif"); flow.location = knowledge("Lieu fictif des organisateurs"); flow.access = knowledge("Fonction fictive des organisateurs");
  }
  activity.flows = [flow, createDataFlow(id()), createDataFlow(id())]; workspace.activities = [activity]; assertWorkspace(workspace);
  return { workspace, activity, flow };
}

describe("a declared intermediary creates two sequential flows", () => {
  it("retains flat flow facts on their known side and leaves the new handoff to describe", () => {
    const { workspace, activity, flow } = fixture(), before = JSON.stringify(activity), intermediary = knowledge("Étudiant collecteur fictif");
    const updated = insertFlowIntermediary(activity, flow.id, { intermediary }, id); workspace.activities = [updated]; assertWorkspace(workspace);
    expect(JSON.stringify(activity)).toBe(before); expect(updated.flows).toHaveLength(4);
    const [first, second] = updated.flows;
    expect(first!.id).toBe(flow.id); expect(first!.source).toEqual(flow.source); expect(first!.destination).toEqual(intermediary);
    expect(first!.operation).toEqual(flow.operation); expect(first!.channel).toEqual(flow.channel); expect(first!.location).toEqual(unknown()); expect(first!.access).toEqual(unknown());
    expect(second!.source).toEqual(intermediary); expect(second!.destination).toEqual(flow.destination); expect(second!.operation).toEqual(unknown()); expect(second!.channel).toEqual(unknown());
    expect(second!.location).toEqual(flow.location); expect(second!.access).toEqual(flow.access); expect(second!.dataGroupIds).toEqual(flow.dataGroupIds);
    expect(first!.sequence).toEqual({ previous: { state: "unknown" }, next: { state: "linked", flowIds: [second!.id] } });
    expect(second!.sequence).toEqual({ previous: { state: "linked", flowIds: [flow.id] }, next: { state: "unknown" } });
    expect(updated.dataGroups).toEqual(activity.dataGroups); expect(updated.role === "controller" ? updated.purposes : undefined).toEqual(activity.purposes);
  });
  it("preserves a linked original destination without copying its name into the first recipient", () => {
    const { workspace, activity, flow } = fixture();
    const party = { id: id(), workspaceId: workspace.id, name: "Organisateurs fictifs liés", contact: unknown() };
    workspace.parties = [party]; flow.destinationRef = `party:${party.id}`; flow.destination = unknown(); assertWorkspace(workspace);
    const updated = insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Collecteur fictif") }, id); workspace.activities = [updated]; assertWorkspace(workspace);
    expect(updated.flows[0]!.destinationRef).toBeUndefined(); expect(updated.flows[1]!.destinationRef).toBe(flow.destinationRef); expect(updated.flows[1]!.destination).toEqual(unknown());
  });
  it("splits a chosen journey step while keeping earlier steps and cloning later steps with fresh IDs", () => {
    const { workspace, activity, flow } = fixture(true), before = JSON.stringify(activity), selected = flow.journey!.steps[1]!, intermediary = knowledge("Intermédiaire fictif");
    selected.destinationRef = `support:${activity.flowSupports![1]!.id}`; selected.destination = unknown();
    const source = JSON.stringify(activity), updated = insertFlowIntermediary(activity, flow.id, { intermediary, stepId: selected.id }, id); workspace.activities = [updated]; assertWorkspace(workspace);
    expect(JSON.stringify(activity)).toBe(source); expect(before).not.toBe(source);
    const first = updated.flows[0]!, second = updated.flows[1]!;
    expect(first.journey!.reference).toBe("1a"); expect(second.journey!.reference).toBe("1b"); expect(first.journey!.steps).toHaveLength(2); expect(second.journey!.steps).toHaveLength(2);
    expect(first.journey!.steps[0]).toEqual(flow.journey!.steps[0]); expect(first.journey!.steps[1]!.id).toBe(selected.id);
    expect(first.journey!.steps[1]!.destination).toEqual(intermediary); expect(first.journey!.steps[1]!.destinationRef).toBeUndefined();
    expect(first.journey!.steps[1]!.operation).toEqual(selected.operation); expect(first.journey!.steps[1]!.channel).toEqual(selected.channel); expect(first.journey!.steps[1]!.location).toEqual(unknown()); expect(first.journey!.steps[1]!.access).toEqual(unknown());
    const handoff = second.journey!.steps[0]!;
    expect(handoff.source).toEqual(intermediary); expect(handoff.sourceRef).toBeUndefined(); expect(handoff.destinationRef).toBe(selected.destinationRef); expect(handoff.destination).toEqual(unknown());
    expect(handoff.operation).toEqual(unknown()); expect(handoff.channel).toEqual(unknown()); expect(handoff.when).toEqual(unknown()); expect(handoff.supportIds).toEqual([]);
    expect(handoff.location).toEqual(selected.location); expect(handoff.access).toEqual(selected.access);
    expect(second.journey!.steps[1]).toEqual({ ...flow.journey!.steps[2], id: second.journey!.steps[1]!.id });
    const originalIds = flow.journey!.steps.map(step => step.id); for (const step of second.journey!.steps) expect(originalIds).not.toContain(step.id);
    expect(second.journey!.purposeIds).toEqual(flow.journey!.purposeIds); expect(second.dataGroupIds).toEqual(flow.dataGroupIds); expect(updated.flowSupports).toEqual(activity.flowSupports);
  });
  it.each([0, 2])("keeps ordered steps when the selected journey step is at index %i", index => {
    const { workspace, activity, flow } = fixture(true);
    const updated = insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Collecteur fictif"), stepId: flow.journey!.steps[index]!.id }, id);
    workspace.activities = [updated]; assertWorkspace(workspace);
    expect(updated.flows[0]!.journey!.steps).toHaveLength(index + 1); expect(updated.flows[1]!.journey!.steps).toHaveLength(3 - index);
    expect(updated.flows[0]!.journey!.steps.map(step => step.id)).toEqual(flow.journey!.steps.slice(0, index + 1).map(step => step.id));
  });
  it("moves old children to the second flow and keeps parents, joins and genuine loops reciprocal", () => {
    const { workspace, activity, flow } = fixture(), peers = activity.flows.slice(1).map(flow => flow.id);
    let connected = setFlowConnection(activity, flow.id, "previous", { state: "linked", flowIds: [peers[0]!] });
    connected = setFlowConnection(connected, flow.id, "next", { state: "linked", flowIds: peers });
    connected = setFlowConnection(connected, peers[1]!, "previous", { state: "linked", flowIds: [flow.id, peers[0]!] });
    const before = JSON.stringify(connected), updated = insertFlowIntermediary(connected, flow.id, { intermediary: knowledge("Collecteur fictif") }, id); workspace.activities = [updated]; assertWorkspace(workspace);
    expect(JSON.stringify(connected)).toBe(before); const first = updated.flows[0]!, second = updated.flows[1]!, peerA = updated.flows[2]!, peerB = updated.flows[3]!;
    expect(first.sequence!.previous).toEqual({ state: "linked", flowIds: [peers[0]!] }); expect(first.sequence!.next).toEqual({ state: "linked", flowIds: [second.id] });
    expect(second.sequence!.previous).toEqual({ state: "linked", flowIds: [flow.id] }); expect(second.sequence!.next).toEqual({ state: "linked", flowIds: peers });
    expect(peerA.sequence!.next).toEqual({ state: "linked", flowIds: [flow.id, peers[1]!] }); expect(peerA.sequence!.previous).toEqual({ state: "linked", flowIds: [second.id] });
    expect(peerB.sequence!.previous).toEqual({ state: "linked", flowIds: [peers[0]!, second.id] });
  });
  it.each(["none", "pending", "unknown"] as const)("moves the declared %s next state to the second flow", state => {
    const { workspace, activity, flow } = fixture(); const connected = setFlowConnection(activity, flow.id, "next", { state });
    const updated = insertFlowIntermediary(connected, flow.id, { intermediary: knowledge("Collecteur fictif") }, id); workspace.activities = [updated]; assertWorkspace(workspace);
    expect(updated.flows[1]!.sequence!.next).toEqual({ state }); expect(updated.flows[0]!.sequence!.next.state).toBe("linked");
  });
  it("preserves frozen review contexts and marks the changed actual journey for human review", () => {
    const { workspace, activity, flow } = fixture(true); workspace.impactAssessments = [createImpactAssessment(workspace.id, activity, id())];
    const reviewed = recordPiaReview(workspace, workspace.impactAssessments[0]!.id, { id: id(), author: "Rôle fictif", reason: "Revue fictive", outcome: "rework" }, workspace.revision, now), frozen = JSON.stringify(reviewed.impactAssessments[0]!.reviews);
    const split = insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Intermédiaire fictif"), stepId: flow.journey!.steps[1]!.id }, id);
    const updated = putActivity(reviewed, split, reviewed.revision, now); assertWorkspace(updated);
    expect(JSON.stringify(updated.impactAssessments[0]!.reviews)).toBe(frozen); expect(piaReviewState(updated, updated.impactAssessments[0]!)).toBe("changed");
  });
  it.each(["unknown", "empty", "too-long", "control", "extra-knowledge", "extra-options", "foreign-flow", "foreign-step", "flat-step", "collision", "invalid-id"])("rejects %s without changing the source", kind => {
    const { activity, flow } = fixture(), before = JSON.stringify(activity); let flowId = flow.id;
    let options: FlowIntermediaryOptions = { intermediary: knowledge("Collecteur fictif") };
    if (kind === "unknown") options.intermediary = unknown(); if (kind === "empty") options.intermediary = { state: "documented", value: "  " };
    if (kind === "too-long") options.intermediary = { state: "documented", value: "x".repeat(4001) }; if (kind === "control") options.intermediary = { state: "documented", value: "Fictif\u202e" };
    if (kind === "extra-knowledge") options.intermediary = Object.assign(knowledge("Collecteur fictif"), { payload: "Fictif" }); if (kind === "extra-options") options = Object.assign(options, { reference: `party:${id()}` });
    if (kind === "foreign-flow") flowId = id(); if (kind === "foreign-step" || kind === "flat-step") options.stepId = id();
    expect(() => insertFlowIntermediary(activity, flowId, options, kind === "collision" ? () => flow.id : kind === "invalid-id" ? () => "invalid" : id)).toThrow("INVALID"); expect(JSON.stringify(activity)).toBe(before);
  });
  it("rejects a foreign journey step and checks the flow ceiling before consuming IDs", () => {
    const { activity, flow } = fixture(true), before = JSON.stringify(activity);
    expect(() => insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Collecteur fictif"), stepId: id() }, id)).toThrow("INVALID"); expect(JSON.stringify(activity)).toBe(before);
    activity.flows.push(...Array.from({ length: 17 }, () => createDataFlow(id()))); const full = JSON.stringify(activity); let calls = 0;
    expect(() => insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Collecteur fictif"), stepId: flow.journey!.steps[0]!.id }, () => { calls++; return id(); })).toThrow("LIMIT");
    expect(calls).toBe(0); expect(JSON.stringify(activity)).toBe(full);
  });
  it("keeps the source untouched when the ID factory collides after a new journey has been prepared", () => {
    const { activity, flow } = fixture(true), before = JSON.stringify(activity); let calls = 0;
    expect(() => insertFlowIntermediary(activity, flow.id, { intermediary: knowledge("Collecteur fictif"), stepId: flow.journey!.steps[1]!.id }, () => ++calls === 1 ? id() : flow.journey!.steps[0]!.id)).toThrow("INVALID");
    expect(calls).toBe(2); expect(JSON.stringify(activity)).toBe(before);
  });
});
