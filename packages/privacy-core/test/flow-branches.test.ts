import { describe, expect, it } from "vitest";
import { assertWorkspace, createActivity, createDataFlow, createDataGroup, createFlowStep, createPurpose, createWorkspace, knowledge, unknown, assertFlowConnections, connectionText, setFlowConnection, removeFlow, splitFlow, previewFlowBranches, resolveFlow, projectShare, createImpactAssessment, recordPiaReview, putActivity, piaReviewState } from "../src/index";
import type { FlowBranchOptions, FlowConnection } from "../src/index";

let seq = 870000;
const id = () => `00000000-0000-4000-8000-${String(seq++).padStart(12, "0")}`;
const now = "2026-10-04T10:00:00.000Z";
function fixture(journey = true) {
  const w = createWorkspace(id(), "Organisme fictif", now), a = createActivity(w.id, id(), "controller");
  if (a.role !== "controller") throw Error("fixture");
  a.title = "Activité fictive"; a.purposes = [createPurpose(id())]; a.purposes[0]!.description = knowledge("Sous-finalité fictive");
  a.dataGroups = [createDataGroup(id(), 1)]; a.dataGroups[0]!.data = knowledge("Catégories fictives");
  a.flowSupports = [{ id: id(), code: 1, name: "Support fictif A" }, { id: id(), code: 2, name: "Support fictif B" }];
  const f = createDataFlow(id());
  if (journey) {
    f.dataGroupIds = [a.dataGroups[0]!.id];
    f.journey = { reference: "1a", purposeIds: [a.purposes[0]!.id], steps: [createFlowStep(id()), createFlowStep(id())] };
    f.journey.steps[0]!.operation = knowledge("Collecte fictive"); f.journey.steps[1]!.operation = knowledge("Relecture fictive");
    f.journey.steps.forEach(step => { step.access = knowledge("Fonction fictive habilitée"); step.supportIds = [a.flowSupports![0]!.id]; });
  } else f.operation = knowledge("Collecte fictive");
  a.flows = [f, createDataFlow(id()), createDataFlow(id())]; w.activities = [a]; assertWorkspace(w);
  return { w, a, f, step: f.journey?.steps[0] };
}

describe("explicit previous and next flow relationships", () => {
  it("adds reciprocal parents and children, changes only the requested side and preserves the source", () => {
    const { a, f } = fixture(), before = JSON.stringify(a), peers = a.flows.slice(1).map(flow => flow.id);
    const connected = setFlowConnection(a, f.id, "next", { state: "linked", flowIds: peers });
    expect(JSON.stringify(a)).toBe(before); expect(f.sequence).toBeUndefined(); assertFlowConnections(connected);
    expect(connected.flows[0]!.sequence).toEqual({ previous: { state: "unknown" }, next: { state: "linked", flowIds: peers } });
    for (const peer of connected.flows.slice(1)) expect(peer.sequence).toEqual({ previous: { state: "linked", flowIds: [f.id] }, next: { state: "unknown" } });
    const changed = setFlowConnection(connected, f.id, "next", { state: "linked", flowIds: [peers[0]!] });
    expect(changed.flows[2]!.sequence!.previous).toEqual({ state: "pending" });
    expect(changed.flows[1]!.sequence!.previous).toEqual({ state: "linked", flowIds: [f.id] });
    expect(connectionText(changed, changed.flows[0]!.sequence!.next, "next")).toBe("Flux 2");
  });
  it("keeps none, pending, unknown distinct and accepts a bounded cycle", () => {
    const { a, f } = fixture();
    const connected = setFlowConnection(a, f.id, "next", { state: "linked", flowIds: [a.flows[1]!.id] });
    const cycle = setFlowConnection(connected, f.id, "previous", { state: "linked", flowIds: [a.flows[1]!.id] });
    assertFlowConnections(cycle);
    const cleared = setFlowConnection(cycle, f.id, "next", { state: "none" });
    expect(cleared.flows[0]!.sequence!.previous.state).toBe("linked");
    expect(connectionText(cleared, cleared.flows[0]!.sequence!.next, "next")).toBe("Aucun flux suivant");
    expect(connectionText(a, undefined, "previous")).toBe("Non renseigné");
    expect(connectionText(a, { state: "pending" }, "previous")).toBe("En attente de description");
  });
  it("removes a flow without inventing no remaining relationship and retains other edges", () => {
    const { a, f } = fixture(), peers = a.flows.slice(1).map(flow => flow.id);
    const connected = setFlowConnection(a, f.id, "next", { state: "linked", flowIds: peers });
    const joined = setFlowConnection(connected, peers[1]!, "previous", { state: "linked", flowIds: [f.id, peers[0]!] });
    const before = JSON.stringify(joined), removed = removeFlow(joined, f.id);
    expect(JSON.stringify(joined)).toBe(before); expect(removed.flows).toHaveLength(2);
    expect(removed.flows[0]!.sequence!.previous).toEqual({ state: "pending" });
    expect(removed.flows[1]!.sequence!.previous).toEqual({ state: "linked", flowIds: [peers[0]!] });
    assertFlowConnections(removed);
  });
  it.each(["self", "foreign", "duplicate", "empty", "oversized", "extra"])("rejects %s before changing an activity", kind => {
    const { a, f } = fixture(), before = JSON.stringify(a);
    let connection: FlowConnection = { state: "linked", flowIds: [a.flows[1]!.id] };
    if (kind === "self") connection.flowIds = [f.id];
    if (kind === "foreign") connection.flowIds = [id()];
    if (kind === "duplicate") connection.flowIds.push(connection.flowIds[0]!);
    if (kind === "empty") connection.flowIds = [];
    if (kind === "oversized") connection.flowIds = Array.from({ length: 21 }, id);
    if (kind === "extra") connection = Object.assign({ state: "none" as const }, { payload: "Fictional invalid field" });
    expect(() => setFlowConnection(a, f.id, "next", connection)).toThrow("INVALID"); expect(JSON.stringify(a)).toBe(before);
  });
  it("rejects a one-sided edge in current and frozen contexts", () => {
    const { w, a, f } = fixture(); f.sequence = { previous: { state: "unknown" }, next: { state: "linked", flowIds: [a.flows[1]!.id] } };
    expect(() => assertWorkspace(w)).toThrow("INVALID"); delete f.sequence;
    w.impactAssessments = [createImpactAssessment(w.id, a, id())];
    const reviewed = recordPiaReview(w, w.impactAssessments[0]!.id, { id: id(), author: "Rôle fictif", reason: "Revue fictive", outcome: "rework" }, w.revision, now);
    reviewed.impactAssessments[0]!.reviews[0]!.context.activity.flows[0]!.sequence = { previous: { state: "unknown" }, next: { state: "linked", flowIds: [a.flows[1]!.id] } };
    expect(() => assertWorkspace(reviewed)).toThrow("INVALID");
  });
  it("renders only flow labels in selected export text and marks a relationship-only change for review", () => {
    const { w, a, f } = fixture(false), next = setFlowConnection(a, f.id, "next", { state: "linked", flowIds: [a.flows[1]!.id] });
    w.activities = [next]; assertWorkspace(w);
    expect(resolveFlow(next.flows[0]!, next, w).operation).toEqual(knowledge("Collecte fictive"));
    const dto = projectShare(w, { profile: "article30-controller", recipient: "Destinataire fictif", scope: "Périmètre fictif", reservations: [], activityIds: [a.id], documentIds: [], clientId: null, flowIds: [f.id] }, id, now);
    expect(dto.flows![0]!.operation).toEqual(knowledge("Collecte fictive\nFlux précédent : Non renseigné\nFlux suivant : Flux 2"));
    for (const privateId of a.flows.map(flow => flow.id)) expect(JSON.stringify(dto)).not.toContain(privateId);
    w.impactAssessments = [createImpactAssessment(w.id, next, id())];
    const reviewed = recordPiaReview(w, w.impactAssessments[0]!.id, { id: id(), author: "Rôle fictif", reason: "Revue fictive", outcome: "rework" }, w.revision, now);
    const updated = putActivity(reviewed, setFlowConnection(next, f.id, "next", { state: "pending" }), reviewed.revision, now);
    expect(piaReviewState(updated, updated.impactAssessments[0]!)).toBe("changed");
  });
  it("keeps a 4000-character operation readable and refuses an oversized selected export without truncation", () => {
    const { w, a, f } = fixture(false); f.operation = { state: "documented", value: "x".repeat(4000) };
    const next = setFlowConnection(a, f.id, "next", { state: "none" }); w.activities = [next]; assertWorkspace(w);
    expect(resolveFlow(next.flows[0]!, next, w).operation).toEqual(f.operation);
    const options = { profile: "article30-controller" as const, recipient: "Destinataire fictif", scope: "Périmètre fictif", reservations: [], activityIds: [a.id], documentIds: [], clientId: null };
    expect(() => projectShare(w, options, id, now)).not.toThrow();
    expect(() => projectShare(w, { ...options, flowIds: [f.id] }, id, now)).toThrow("LIMIT");
    expect(f.operation.value).toHaveLength(4000);
  });
});

describe("explicit independent flow alternatives", () => {
  it("creates each operation × channel × location × support branch with shared facts and reciprocal joins", () => {
    const { w, a, f, step } = fixture();
    let connected = setFlowConnection(a, f.id, "previous", { state: "linked", flowIds: [a.flows[1]!.id] });
    connected = setFlowConnection(connected, f.id, "next", { state: "linked", flowIds: [a.flows[2]!.id] });
    const options: FlowBranchOptions = { stepId: step!.id, operations: [knowledge("Opération fictive A"), knowledge("Opération fictive B")], channels: [knowledge("Canal fictif A"), knowledge("Canal fictif B")], locations: [knowledge("Lieu fictif A"), knowledge("Lieu fictif B")], supportIds: a.flowSupports!.map(support => support.id) };
    const before = JSON.stringify(connected); expect(previewFlowBranches(connected, f.id, options)).toBe(16);
    const split = splitFlow(connected, f.id, options, id); w.activities = [split]; assertWorkspace(w);
    expect(JSON.stringify(connected)).toBe(before); expect(split.flows).toHaveLength(18);
    const branches = split.flows.filter(flow => flow.journey);
    expect(branches[0]!.id).toBe(f.id); expect(branches[0]!.journey!.steps.map(step => step.id)).toEqual(f.journey!.steps.map(step => step.id));
    expect(new Set(branches.map(flow => flow.journey!.reference)).size).toBe(16);
    expect(new Set(branches.flatMap(flow => flow.journey!.steps.map(step => step.id))).size).toBe(32);
    expect(new Set(branches.map(flow => { const s = flow.journey!.steps[0]!; return JSON.stringify([s.operation, s.channel, s.location, s.supportIds]); })).size).toBe(16);
    for (const branch of branches) {
      expect(branch.dataGroupIds).toEqual(f.dataGroupIds); expect(branch.journey!.purposeIds).toEqual(f.journey!.purposeIds);
      expect(branch.journey!.steps[1]!.operation).toEqual(f.journey!.steps[1]!.operation); expect(branch.journey!.steps[0]!.access).toEqual(step!.access);
      expect(branch.journey!.steps[0]!.supportIds).toHaveLength(1); expect(branch.operation).toEqual(unknown());
    }
    expect(split.flowSupports).toEqual(a.flowSupports); expect(split.dataGroups).toEqual(a.dataGroups);
    expect(split.flows[1]!.sequence!.next).toEqual({ state: "linked", flowIds: branches.map(flow => flow.id) });
    expect(split.flows[2]!.sequence!.previous).toEqual({ state: "linked", flowIds: branches.map(flow => flow.id) });
  });
  it("splits a flat flow while preserving unknown shared facts and no undeclared sequence", () => {
    const { w, a, f } = fixture(false), before = JSON.stringify(a);
    const split = splitFlow(a, f.id, { operations: [knowledge("Opération fictive A"), knowledge("Opération fictive B")] }, id);
    w.activities = [split]; assertWorkspace(w); expect(JSON.stringify(a)).toBe(before); expect(split.flows).toHaveLength(4);
    for (const branch of [split.flows[0]!, split.flows[3]!]) { expect(branch.source).toEqual(unknown()); expect(branch.location).toEqual(unknown()); expect(branch.sequence).toBeUndefined(); }
  });
  it("refuses oversized products and totals before allocating IDs or mutating the source", () => {
    const { a, f, step } = fixture(), before = JSON.stringify(a); let calls = 0;
    const options = { stepId: step!.id, operations: Array.from({ length: 5 }, (_, i) => knowledge(`Opération fictive ${i}`)), locations: Array.from({ length: 5 }, (_, i) => knowledge(`Lieu fictif ${i}`)) };
    expect(() => previewFlowBranches(a, f.id, options)).toThrow("LIMIT");
    expect(() => splitFlow(a, f.id, options, () => { calls++; return id(); })).toThrow("LIMIT"); expect(calls).toBe(0); expect(JSON.stringify(a)).toBe(before);
    a.flows.push(...Array.from({ length: 16 }, () => createDataFlow(id())));
    expect(() => splitFlow(a, f.id, { stepId: step!.id, channels: [knowledge("Canal fictif A"), knowledge("Canal fictif B"), knowledge("Canal fictif C")] }, id)).toThrow("LIMIT");
  });
  it.each(["foreign-step", "no-step", "foreign-support", "empty", "duplicate", "reversed-keys", "whitespace-duplicate", "oversized-text", "control-text", "extra", "id-collision"])("rejects %s without mutating the source", kind => {
    const { a, f, step } = fixture(), before = JSON.stringify(a);
    let options: FlowBranchOptions = { stepId: step!.id, operations: [knowledge("Opération fictive A"), knowledge("Opération fictive B")] };
    if (kind === "foreign-step") options.stepId = id(); if (kind === "no-step") delete options.stepId;
    if (kind === "foreign-support") options.supportIds = [id()]; if (kind === "empty") options.operations = [];
    if (kind === "duplicate") options.operations = [knowledge("Même déclaration fictive"), knowledge("Même déclaration fictive")];
    if (kind === "reversed-keys") options.operations = [{ state: "documented", value: "Même déclaration fictive" }, { value: "Même déclaration fictive", state: "documented" }];
    if (kind === "whitespace-duplicate") options.operations = [{ state: "documented", value: "Même déclaration fictive" }, { state: "documented", value: " Même déclaration fictive " }];
    if (kind === "oversized-text") options.operations = [{ state: "documented", value: "x".repeat(4001) }];
    if (kind === "control-text") options.operations = [{ state: "documented", value: "Fictif\u202e" }];
    if (kind === "extra") options = Object.assign(options, { payload: "Fictif" });
    expect(() => splitFlow(a, f.id, options, kind === "id-collision" ? () => f.id : id)).toThrow("INVALID"); expect(JSON.stringify(a)).toBe(before);
  });
  it("refuses a support branch that would silently retain a different endpoint support", () => {
    const { a, f, step } = fixture(); step!.sourceRef = `support:${a.flowSupports![0]!.id}`;
    const before = JSON.stringify(a);
    expect(() => splitFlow(a, f.id, { stepId: step!.id, supportIds: a.flowSupports!.map(support => support.id) }, id)).toThrow("INVALID"); expect(JSON.stringify(a)).toBe(before);
    const flat = fixture(false); expect(() => splitFlow(flat.a, flat.f.id, { supportIds: flat.a.flowSupports!.map(support => support.id) }, id)).toThrow("INVALID");
  });
  it("keeps reciprocal connections when a repeated process uses the same peer on both sides", () => {
    const { w, a, f, step } = fixture();
    let connected = setFlowConnection(a, f.id, "previous", { state: "linked", flowIds: [a.flows[1]!.id] });
    connected = setFlowConnection(connected, f.id, "next", { state: "linked", flowIds: [a.flows[1]!.id] });
    const split = splitFlow(connected, f.id, { stepId: step!.id, channels: [knowledge("Canal fictif A"), knowledge("Canal fictif B")] }, id);
    w.activities = [split]; assertWorkspace(w);
    const branchIds = [f.id, split.flows[3]!.id];
    expect(split.flows[1]!.sequence!.previous).toEqual({ state: "linked", flowIds: branchIds });
    expect(split.flows[1]!.sequence!.next).toEqual({ state: "linked", flowIds: branchIds });
  });
});
