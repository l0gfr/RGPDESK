import { describe, expect, it } from "vitest";
import { createWorkspace, createActivity, createPurpose, createDataFlow, createImpactAssessment, createDpoCase, createPiaRisk, createPiaMeasure, createContractReview, putDpoCase, putImpactAssessment, recordDpoReview, recordPiaReview, reviseWorkspace, putActivity, putDocument, knowledge, unknown, piaChanges, piaReviewState, dpoChangeDetails, dpoChanges, assertWorkspace, type Workspace, type EvidenceReference } from "../src/index";
let sequence = 18000;
const id = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const now = "2026-09-23T10:00:00.000Z";
function fixture() {
  let w = createWorkspace(id(), "Organisation fictive de recette", now);
  const a = createActivity(w.id, id(), "controller");
  if (a.role !== "controller") throw Error("fixture");
  a.title = "Accès au local fictif";
  a.purposes = [createPurpose(id()), createPurpose(id())]; a.purposes[0]!.description = knowledge("Sécuriser le local fictif");
  a.recipients = knowledge("Gestionnaire des accès");
  a.flows = [createDataFlow(id()), createDataFlow(id())]; a.flows[0]!.destination = knowledge("Équipe sécurité");
  const party = { id: id(), workspaceId: w.id, name: "Prestataire fictif", contact: unknown() };
  const system = { id: id(), workspaceId: w.id, name: "Support fictif", description: unknown() };
  a.participantIds = [party.id]; a.systemIds = [system.id];
  const d: EvidenceReference = { id: id(), workspaceId: w.id, title: "Contrat fictif", category: "contract", activityIds: [a.id], purposeIds: [], partyIds: [party.id], scope: "Accès fictifs", version: "1", declaredAuthor: "Équipe fictive", internalRef: "ARMOIRE_FICTIVE_A", publicReference: "", reservations: "Clauses à examiner", sensitivity: "internal", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: null, audience: "", channel: "", availability: unknown(), contractReview: createContractReview() };
  w = reviseWorkspace(w, w.revision, now, { activities: [a], documents: [d], parties: [party], systems: [system] });
  const p = createImpactAssessment(w.id, a, id());
  const r = createPiaRisk(id()); r.title = "Scénario fictif A"; p.content.risks.push(r);
  const m = createPiaMeasure(id()); m.riskIds = [r.id]; p.content.measures.push(m);
  w = putImpactAssessment(w, p, w.revision, now);
  const c = createDpoCase(w.id, id(), "interest"); c.activityIds = [a.id]; c.purposeId = a.purposes[0]!.id;
  w = putDpoCase(w, c, w.revision, now);
  w = recordPiaReview(w, p.id, { id: id(), author: "DPO fictif", reason: "Attendre les garanties", outcome: "rework" }, w.revision, now);
  w = recordDpoReview(w, c.id, { id: id(), author: "DPO fictif", reason: "Comparer les alternatives", outcome: "rework" }, w.revision, now);
  return w;
}
const comparisons = (w: Workspace) => [piaChanges(w, w.impactAssessments[0]!), dpoChangeDetails(w, w.dpoCases[0]!)];
describe("review facts, evidence and changes", () => {
  it("compares a changed fact in both linked dossiers without copying inputs or changing the recorded positions", () => {
    let w = fixture(); const previous = JSON.stringify(w), histories = JSON.stringify([w.impactAssessments[0]!.reviews, w.dpoCases[0]!.reviews]);
    const a = structuredClone(w.activities[0]!); a.recipients = knowledge("Gestionnaire et équipe d’astreinte fictive");
    const next = putActivity(w, a, w.revision, now);
    expect(JSON.stringify(w)).toBe(previous); w = next;
    for (const changes of comparisons(w)) expect(changes).toEqual([expect.objectContaining({ label: "Destinataires", area: "flow", before: "Gestionnaire des accès", after: "Gestionnaire et équipe d’astreinte fictive" })]);
    expect(JSON.stringify([w.impactAssessments[0]!.reviews, w.dpoCases[0]!.reviews])).toBe(histories);
    expect(w.activities[0]!.role === "controller" && w.activities[0]!.purposes[0]!.legalBasis).toEqual(unknown());
  });
  it("ignores revisions, unrelated activities, actions and documents outside the reviewed scope", () => {
    let w = fixture(); const a = createActivity(w.id, id(), "controller"); a.title = "Dossier séparé";
    const d = { ...structuredClone(w.documents[0]!), id: id(), activityIds: [a.id], partyIds: [], internalRef: "AUTRE_CLIENT_INVISIBLE" };
    w = reviseWorkspace(w, w.revision, now, { activities: [...w.activities, a], documents: [...w.documents, d] });
    for (const changes of comparisons(w)) expect(changes).toEqual([]);
    expect(piaReviewState(w,w.impactAssessments[0]!)).toBe("unchanged");
    expect(dpoChanges(w,w.dpoCases[0]!)).toEqual([]);
  });
  it("does not mistake reordering identified facts or links for a substantive change", () => {
    const w = fixture();
    const a = w.activities[0]!; if (a.role !== "controller") throw Error("fixture");
    a.purposes.reverse(); a.flows.reverse(); a.analysis.notes.reverse();
    w.impactAssessments[0]!.content.screening.reverse(); w.impactAssessments[0]!.content.principles.reverse(); w.dpoCases[0]!.content.notes.reverse();
    assertWorkspace(w); for (const changes of comparisons(w)) expect(changes).toEqual([]);
  });
  it("shows old and current document version, location and scope without opening the reference", () => {
    let w = fixture(); const d = structuredClone(w.documents[0]!); d.version = "2"; d.internalRef = "ARMOIRE_FICTIVE_B"; d.reservations = "Nouvelle réserve fictive";
    w = putDocument(w,d,now);
    for (const changes of comparisons(w)) {
      expect(changes).toHaveLength(3);
      expect(changes).toContainEqual(expect.objectContaining({ label: "Version", before: "1", after: "2", area: "evidence" }));
      expect(changes).toContainEqual(expect.objectContaining({ label: "Où retrouver le document", before: "ARMOIRE_FICTIVE_A", after: "ARMOIRE_FICTIVE_B" }));
    }
    expect(w.impactAssessments[0]!.reviews[0]!.context.documents[0]!.version).toBe("1");
  });
  it("distinguishes missing facts, unknowns, additions and removals", () => {
    const w = fixture(); const a = w.activities[0]!; a.dataCategories = knowledge("À documenter");
    a.flows = [];
    const changes = piaChanges(w,w.impactAssessments[0]!);
    expect(changes).toContainEqual(expect.objectContaining({ label: "Catégories de données", kind: "changed", before: "À documenter", after: "À documenter (état de renseignement modifié)" }));
    expect(changes.filter((c) => c.kind === "removed")).toHaveLength(14);
    const d = structuredClone(w.documents[0]!); d.id = id(); d.title = "Justificatif complémentaire"; w.documents.push(d);
    expect(piaChanges(w,w.impactAssessments[0]!).some((c) => c.subject === d.title && c.kind === "added")).toBe(true);
  });
  it("tracks replacements with identical labels, contract review arguments and linked system changes", () => {
    const w = fixture(); const a = w.activities[0]!;
    const other = { ...w.systems[0]!, id: id() }; w.systems.push(other); a.systemIds = [other.id];
    w.documents[0]!.contractReview!.notes[0]!.evidence = knowledge("Passage fictif à relire");
    const changes = piaChanges(w,w.impactAssessments[0]!);
    expect(changes).toContainEqual(expect.objectContaining({ label: "Systèmes liés", after: "Support fictif (composition des liens modifiée)" }));
    expect(changes.some((c) => c.area === "evidence" && c.after === "Passage fictif à relire")).toBe(true);
  });
  it("shows changed AIPD arguments and risk links by readable name, not a technical identifier", () => {
    const w = fixture(); const p=w.impactAssessments[0]!, r=createPiaRisk(id()); r.title = "Scénario fictif B"; p.content.risks.push(r); p.content.measures[0]!.riskIds = [r.id];
    p.content.necessity.notes[0]!.assessment = knowledge("Une autre option reste à comparer");
    const changes = piaChanges(w,p);
    expect(changes).toContainEqual(expect.objectContaining({ label: "Scénarios liés", before: "Scénario fictif A", after: "Scénario fictif B" }));
    expect(changes.some((c) => c.after === "Une autre option reste à comparer")).toBe(true);
    for (const c of changes) expect(c.before+c.after).not.toContain(r.id);
  });
  it("adds a human review as a new baseline without overwriting the earlier context", () => {
    let w = fixture(); const old=JSON.stringify(w.impactAssessments[0]!.reviews[0]);
    const a=structuredClone(w.activities[0]!); a.flows[0]!.destination=knowledge("Autre équipe fictive"); w=putActivity(w,a,w.revision,now);
    expect(piaChanges(w,w.impactAssessments[0]!).length).toBeGreaterThan(0);
    w=recordPiaReview(w,w.impactAssessments[0]!.id,{ id:id(), author:"DPO fictif", reason:"Effets à approfondir",outcome:"rework" },w.revision,now);
    expect(piaChanges(w,w.impactAssessments[0]!)).toEqual([]);
    expect(JSON.stringify(w.impactAssessments[0]!.reviews[0])).toBe(old);
    expect(dpoChangeDetails(w,w.dpoCases[0]!).length).toBeGreaterThan(0);
  });
  it("shows one shared document modification once across a multi-activity review", () => {
    let w = fixture(); const a = createActivity(w.id, id(), "controller"); a.title = "Second périmètre fictif";
    w = putActivity(w, a, w.revision, now);
    const doc = structuredClone(w.documents[0]!); doc.activityIds.push(a.id); w = putDocument(w, doc, now);
    const item = createDpoCase(w.id, id(), "rights"); item.activityIds = w.activities.map((a) => a.id);
    w = putDpoCase(w, item, w.revision, now);
    w = recordDpoReview(w, item.id, { id: id(), author: "DPO fictif", reason: "Référence commune à relire", outcome: "rework" }, w.revision, now);
    doc.version = "2"; w = putDocument(w, doc, now);
    const changes = dpoChangeDetails(w, w.dpoCases.find((c) => c.id === item.id)!);
    expect(changes).toEqual([expect.objectContaining({ label: "Version", before: "1", after: "2" })]);
  });
  it("links shared evidence with the activity in one revision and preserves other links and review history", () => {
    let w = fixture(); const a = createActivity(w.id, id(), "controller"); a.title = "Activité complémentaire";
    const old = JSON.stringify(w), doc = w.documents[0]!;
    const linked = putActivity(w, a, w.revision, now, [doc.id]);
    expect(linked.revision).toBe(w.revision + 1); expect(JSON.stringify(w)).toBe(old);
    expect(linked.documents[0]!.activityIds).toEqual([w.activities[0]!.id, a.id]);
    expect(linked.documents).toHaveLength(1);
    expect(linked.documents[0]!.internalRef).toBe(doc.internalRef);
    expect(linked.impactAssessments[0]!.reviews).toEqual(w.impactAssessments[0]!.reviews);
    const detached = putActivity(linked, a, linked.revision, now, []);
    expect(detached.documents[0]!.activityIds).toEqual([w.activities[0]!.id]);
    expect(detached.documents[0]!.status).toBe("declared");
    expect(() => putActivity(w, a, w.revision, now, [id()])).toThrow();
    expect(() => putActivity(w, a, w.revision, now, [doc.id, doc.id])).toThrow();
    expect(() => putActivity(w, a, w.revision - 1, now, [doc.id])).toThrow();
    expect(() => putActivity(w, { ...a, workspaceId: id() }, w.revision, now, [doc.id])).toThrow();
    expect(JSON.stringify(w)).toBe(old);
  });
  it("detaches only the selected activity's purpose links and retains the documentary record", () => {
    let w = fixture(); const a = w.activities[0]!; if (a.role !== "controller") throw Error("fixture");
    const doc = { ...w.documents[0]!, category: "notice" as const, contractReview: null, purposeIds: [a.purposes[0]!.id] };
    w = putDocument(w, doc, now);
    const next = putActivity(w, a, w.revision, now, []);
    expect(next.documents).toHaveLength(1); expect(next.documents[0]!.purposeIds).toEqual([]);
    expect(w.documents[0]!.purposeIds).toEqual(doc.purposeIds);
  });
  it("reports removed scenarios and measures without inventing an added empty record", () => {
    const w = fixture(); const p = w.impactAssessments[0]!;
    p.content.measures = []; p.content.risks = [];
    assertWorkspace(w);
    const changes = piaChanges(w, p);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every((change) => change.kind === "removed")).toBe(true);
  });
  it("does not invent an old position for a dossier without a review", () => {
    const w=fixture(), p=createImpactAssessment(w.id,w.activities[0]!,id()), d=createDpoCase(w.id,id(),"rights");
    expect(piaChanges(w,p)).toEqual([]); expect(piaReviewState(w,p)).toBe("unreviewed"); expect(dpoChangeDetails(w,d)).toEqual([]);
    expect(dpoChanges(w,d)).toEqual(["Première revue à préparer"]);
  });
});
