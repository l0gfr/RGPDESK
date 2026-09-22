import { describe, it, expect } from "vitest";
import { createWorkspace, createActivity, createPurpose, createDataFlow, createContractReview, knowledge, unknown, assertWorkspace, assertShare, migrateWorkspace, projectShare, renderShareFiles, reviseWorkspace, evaluateWorkspace, type EvidenceReference } from "../src/index";
let sequence = 1;
const id = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const now = "2026-09-22T15:00:00.000Z";
function fixture() {
  const master = createWorkspace(id(), "Mission fictive", now);
  const activity = createActivity(master.id, id(), "controller");
  if (activity.role !== "controller") throw new Error("role");
  activity.purposes.push(createPurpose(id())); master.activities.push(activity);
  return { master, activity };
}
describe("internal analysis and explicitly declared flows", () => {
  it("starts with unknown facts, no flow or legal decision, and validates the current version", () => {
    const { master, activity } = fixture(); assertWorkspace(master);
    expect(master.format).toBe("rgpd-master-v3"); expect(activity.flows).toEqual([]);
    expect(activity.purposes[0]!.legalBasis).toEqual(unknown());
    expect(activity.analysis.notes).toHaveLength(8);
    for (const note of activity.analysis.notes) for (const field of ["facts", "evidence", "objections", "assessment", "followUp"] as const) expect(note[field]).toEqual(unknown());
    expect(master.decisions).toEqual([]);
  });
  it("migrates v2 in memory preserving existing content, IDs, revision and historical deliveries", () => {
    const { master, activity } = fixture(); activity.recipients = knowledge("Destinataires historiques fictifs");
    const previous = JSON.parse(JSON.stringify(master)); previous.format = "rgpd-master-v2";
    for (const row of previous.activities) { delete row.analysis; delete row.flows; }
    const bytes = JSON.stringify(previous); const upgraded = migrateWorkspace(previous);
    expect(JSON.stringify(previous)).toBe(bytes); expect(upgraded.revision).toBe(master.revision);
    expect(upgraded.id).toBe(master.id); expect(upgraded.activities[0]!.recipients).toEqual(activity.recipients);
    expect(upgraded.activities[0]!.flows).toEqual([]); expect(upgraded.activities[0]!.analysis.operations).toEqual(unknown());
    expect(upgraded.deliveries).toEqual(master.deliveries);
    expect(() => migrateWorkspace({ ...previous, analysis: "INJECTED" })).toThrow("INVALID");
    previous.activities[0].flows = []; expect(() => migrateWorkspace(previous)).toThrow("INVALID");
  });
  it("rejects duplicate, missing or unknown question identifiers and method versions", () => {
    for (const mutate of [
      (a: ReturnType<typeof fixture>["activity"]) => { a.analysis.notes[1]!.questionId = a.analysis.notes[0]!.questionId; },
      (a: ReturnType<typeof fixture>["activity"]) => { a.analysis.notes.pop(); },
      (a: ReturnType<typeof fixture>["activity"]) => { a.analysis.notes[0]!.questionId = "__proto__"; },
      (a: ReturnType<typeof fixture>["activity"]) => { Object.assign(a.analysis, { methodVersion: "future" }); },
    ]) { const { master, activity } = fixture(); mutate(activity); expect(() => assertWorkspace(master)).toThrow("INVALID"); }
  });
  it("bounds flows, rejects ambiguous controls and duplicate IDs, and keeps text inert", () => {
    const { master, activity } = fixture(); const flow = createDataFlow(id()); activity.flows.push(flow);
    flow.source = knowledge('<img src=x onerror="alert(1)">'); assertWorkspace(master);
    flow.data = knowledge("x".repeat(4001)); expect(() => assertWorkspace(master)).toThrow("INVALID");
    flow.data = knowledge("Ambiguous\u202Einput"); expect(() => assertWorkspace(master)).toThrow("INVALID");
    flow.data = unknown(); flow.id = activity.purposes[0]!.id; expect(() => assertWorkspace(master)).toThrow("INVALID");
    activity.flows = Array.from({ length: 21 }, () => createDataFlow(id())); expect(() => assertWorkspace(master)).toThrow("INVALID");
  });
  it("accepts historical share catalogues but refuses an unrecognized catalogue", () => {
    const { master, activity } = fixture();
    const dto = projectShare(master, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [activity.id], documentIds: [], clientId: null, reservations: [] }, id, now);
    expect(dto.catalogVersion).toBe("fr-eu-2026-09-22.draft-2");
    dto.catalogVersion = "fr-eu-2026-09-22.draft-1"; expect(() => assertShare(dto)).not.toThrow();
    dto.catalogVersion = "unknown-version"; expect(() => assertShare(dto)).toThrow("INVALID_SHARE");
  });
  it("refuses documents beyond the bounded reader node budget before they can be persisted", () => {
    const { master } = fixture();
    master.activities = Array.from({ length: 200 }, () => {
      const activity = createActivity(master.id, id(), "controller");
      activity.flows = Array.from({ length: 20 }, () => createDataFlow(id()));
      return activity;
    });
    expect(JSON.stringify(master).length).toBeLessThan(2 * 1024 * 1024);
    expect(() => assertWorkspace(master)).toThrow("LIMIT");
  });
  it("a flow or analysis change increments the revision and refuses concurrent revisions", () => {
    const { master, activity } = fixture(); const changed = structuredClone(activity); changed.flows.push(createDataFlow(id()));
    const next = reviseWorkspace(master, master.revision, now, { activities: [changed] });
    expect(next.revision).toBe(master.revision + 1); expect(master.activities[0]!.flows).toEqual([]);
    expect(() => reviseWorkspace(next, master.revision, now, { activities: [changed] })).toThrow("CONFLICT");
  });
  it("keeps analysis, access, flow text, contract notes and their IDs out of every shared file", () => {
    const { master, activity } = fixture();
    activity.analysis.operations = knowledge("PRIVATE_OPERATIONS_DPO"); activity.analysis.access = knowledge("PRIVATE_ACCESS_DPO");
    for (const note of activity.analysis.notes) for (const key of ["facts", "evidence", "objections", "assessment", "followUp"] as const) note[key] = knowledge("PRIVATE_ANALYSIS_" + key);
    const flow = createDataFlow(id()); for (const key of ["source", "destination", "operation", "data", "channel", "location", "access"] as const) flow[key] = knowledge("PRIVATE_FLOW_" + key); activity.flows.push(flow);
    const partyId = id(); master.parties.push({ id: partyId, workspaceId: master.id, name: "Client fictif", contact: unknown() });
    const processor = createActivity(master.id, id(), "processor"); if (processor.role !== "processor") throw new Error(); processor.controllerIds.push(partyId); processor.analysis = structuredClone(activity.analysis); processor.flows.push({ ...structuredClone(flow), id: id() }); master.activities.push(processor);
    for (const profile of ["article30-controller", "article30-processor", "internal-review", "client-excerpt"] as const) {
      const selected = ["article30-processor", "client-excerpt"].includes(profile) ? processor.id : activity.id;
      const dto = projectShare(master, { profile, recipient: "Fictif", scope: "Fictif", activityIds: [selected], documentIds: [], clientId: profile === "client-excerpt" ? partyId : null, reservations: [] }, id, now);
      for (const bytes of Object.values(renderShareFiles(dto))) { expect(bytes).not.toContain("PRIVATE_"); expect(bytes).not.toContain(flow.id); }
    }
    expect(() => projectShare(master, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [activity.id], documentIds: [], clientId: null, reservations: [] }, () => flow.id, now)).toThrow();
  });
});
describe("article 28 examination", () => {
  function contractFixture() {
    const { master, activity } = fixture(); const party = { id: id(), workspaceId: master.id, name: "Prestataire fictif", contact: unknown() }; master.parties.push(party); activity.review.subcontractorIds.push(party.id);
    const doc: EvidenceReference = { id: id(), workspaceId: master.id, title: "Contrat fictif", category: "contract", contractReview: null, activityIds: [activity.id], purposeIds: [], partyIds: [party.id], scope: "Prestation fictive", version: "1", declaredAuthor: "Fictif", internalRef: "PRIVATE_CONTRACT_PATH", publicReference: "", reservations: "", sensitivity: "internal", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: null, audience: "", channel: "", availability: unknown() };
    master.documents.push(doc); return { master, activity, doc };
  }
  it("a reference or a review checkbox never substitutes for clause and guarantee notes", () => {
    const { master, doc } = contractFixture(); assertWorkspace(master);
    const finding = () => evaluateWorkspace(master, "2026-09-22").find((f) => f.ruleId === "R-005");
    expect(finding()?.message).toContain("Clauses"); doc.contractReview = createContractReview();
    doc.status = "reviewed"; doc.reviewedAt = now; doc.reviewedRevision = master.revision; expect(finding()).toBeTruthy();
    for (const note of doc.contractReview.notes) note.assessment = knowledge("Appréciation humaine fictive");
    expect(finding()).toBeTruthy();
    for (const note of doc.contractReview.notes) note.evidence = knowledge("Référence de passage fictive");
    expect(finding()).toBeUndefined(); expect(doc.contractReview.notes).toHaveLength(11);
  });
  it("rejects duplicate clause keys and contract notes on another category; never shares notes", () => {
    const { master, activity, doc } = contractFixture(); doc.contractReview = createContractReview();
    doc.contractReview.notes[0]!.facts = knowledge("PRIVATE_CONTRACT_REVIEW"); doc.publicReference = "Référence publique fictive";
    const dto = projectShare(master, { profile: "internal-review", recipient: "Fictif", scope: "Fictif", activityIds: [activity.id], documentIds: [doc.id], clientId: null, reservations: [] }, id, now);
    for (const file of Object.values(renderShareFiles(dto))) expect(file).not.toContain("PRIVATE_");
    doc.category = "analysis"; expect(() => assertWorkspace(master)).toThrow("INVALID"); doc.category = "contract";
    doc.contractReview.notes[1]!.questionId = doc.contractReview.notes[0]!.questionId; expect(() => assertWorkspace(master)).toThrow("INVALID");
  });
});
