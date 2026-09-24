import { describe, it, expect } from "vitest";
import { assertWorkspace, createActivity, createWorkspace, createImpactAssessment, createPiaAlternative, createPiaMeasure, createPiaRisk, knowledge, migrateWorkspace, piaOpenPoints, piaReviewState, putImpactAssessment, recordPiaReview, reviseWorkspace, projectShare, renderShareFiles, type PiaContent } from "../src/index";
let sequence = 3000;
const id = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const now = "2026-09-22T16:00:00.000Z";
function fixture() {
  let master = createWorkspace(id(), "Organisation fictive AIPD", now);
  const activity = createActivity(master.id, id(), "controller"); master.activities.push(activity);
  activity.analysis.notes[0]!.facts = knowledge("PRIVATE_ORIGINAL_ARGUMENT");
  const pia = createImpactAssessment(master.id, activity, id());
  master = putImpactAssessment(master, pia, master.revision, now);
  return { master, pia, activity };
}
function document(content: PiaContent) {
  const k = () => knowledge("Justification fictive pour le test, sans conclusion juridique");
  content.screening.forEach((c) => { c.answer = "no"; c.reason = k(); }); content.screeningDecision = "voluntary"; content.applicability = k(); content.screeningReason = k();
  for (const note of [...content.principles, ...content.necessity.notes]) { note.assessment = k(); note.evidence = k(); }
  const alternative = createPiaAlternative(id()); for (const key of ["purpose", "description", "effectiveness", "impacts", "evidence", "choice"] as const) alternative[key] = k(); content.alternatives.push(alternative);
  content.evaluationMethod = k(); const risk = createPiaRisk(id());
  for (const key of ["event", "people", "rights", "impacts", "threats", "supports", "existingMeasures", "initialReason", "residualReason"] as const) risk[key] = k();
  risk.initialSeverity = risk.residualSeverity = "2"; risk.initialLikelihood = risk.residualLikelihood = "2"; risk.residualHigh = "no"; content.risks.push(risk);
  content.dpoAdvice = content.peopleConsultation = content.authorityConsultation = content.monitoring = k(); content.reviewDue = "2026-12-01";
}
describe("AIPD working dossier", () => {
  it("migrates v3 without mutating existing notes, identifiers or revision", () => {
    const { master } = fixture(); const old = JSON.parse(JSON.stringify(master)); old.format = "rgpd-master-v3"; delete old.impactAssessments; delete old.dpoCases; delete old.piaPublications;
    const original = JSON.stringify(old); const next = migrateWorkspace(old);
    expect(next.format).toBe("rgpd-master-v9"); expect(next.impactAssessments).toEqual([]);
    expect(next.activities).toEqual(old.activities); expect(next.revision).toBe(old.revision); expect(JSON.stringify(old)).toBe(original);
    old.impactAssessments = []; expect(() => migrateWorkspace(old)).toThrow("INVALID");
  });
  it("starts undecided and carries a separate copy of existing analysis", () => {
    const { master, pia, activity } = fixture(); assertWorkspace(master);
    expect(pia.content.screening.every((c) => c.answer === "unknown")).toBe(true);
    expect(pia.content.screeningDecision).toBe("unknown"); expect(pia.content.risks).toEqual([]);
    pia.content.necessity.notes[0]!.facts = knowledge("NEW_PRIVATE_ARGUMENT");
    expect(activity.analysis.notes[0]!.facts).toEqual(knowledge("PRIVATE_ORIGINAL_ARGUMENT"));
    expect(piaReviewState(master, pia)).toBe("unreviewed");
    expect(() => recordPiaReview(master, pia.id, { id: id(), author: "Auteur fictif", reason: "Motif fictif", outcome: "proceed" }, master.revision, now)).toThrow("INVALID");
  });
  it("never treats unknown residual risk or a planned guarantee as an accepted risk", () => {
    const { pia } = fixture(); document(pia.content); expect(piaOpenPoints(pia.content)).toEqual([]);
    pia.content.risks[0]!.residualHigh = "unknown"; expect(piaOpenPoints(pia.content).length).toBeGreaterThan(0);
    pia.content.risks[0]!.residualHigh = "yes"; expect(piaOpenPoints(pia.content).join()).toContain("article 36");
    pia.content.risks[0]!.residualHigh = "no"; pia.content.risks[0]!.residualSeverity = "1";
    expect(piaOpenPoints(pia.content).join()).toContain("réduction");
    const measure = createPiaMeasure(id()); measure.riskIds = [pia.content.risks[0]!.id]; pia.content.measures.push(measure);
    for (const key of ["description", "owner", "evidence", "effectiveness", "failure"] as const) measure[key] = knowledge("Fictif"); measure.due = "2026-10-01";
    expect(piaOpenPoints(pia.content).length).toBeGreaterThan(0); measure.status = "verified"; expect(piaOpenPoints(pia.content)).toEqual([]);
  });
  it("freezes context and analysis, detects later provider/finality/evidence changes and forbids rewriting history", () => {
    let { master, pia, activity } = fixture();
    master = recordPiaReview(master, pia.id, { id: id(), author: "Auteur fictif", reason: "Compléments attendus", outcome: "rework" }, master.revision, now);
    pia = master.impactAssessments[0]!; const frozen = JSON.stringify(pia.reviews[0]); expect(piaReviewState(master, pia)).toBe("unchanged");
    const changed = structuredClone(activity); changed.title = "Finalité fictive modifiée";
    master = reviseWorkspace(master, master.revision, now, { activities: [changed] });
    expect(piaReviewState(master, pia)).toBe("changed"); expect(JSON.stringify(pia.reviews[0])).toBe(frozen);
    const altered = structuredClone(pia); altered.reviews[0]!.reason = "Réécriture";
    expect(() => reviseWorkspace(master, master.revision, now, { impactAssessments: [altered] })).toThrow("INVALID");
    expect(() => reviseWorkspace(master, master.revision, now, { impactAssessments: [] })).toThrow("INVALID");
    const forged = structuredClone(pia); forged.reviews.push({ ...structuredClone(pia.reviews[0]!), id: id(), revision: master.revision + 1 });
    expect(() => reviseWorkspace(master, master.revision, now, { impactAssessments: [forged] })).toThrow("INVALID");
  });
  it("requires an explicit human decision and never lets a processor record the controller decision", () => {
    let { master, pia } = fixture(); document(pia.content); master = putImpactAssessment(master, pia, master.revision, now);
    const decision = { id: id(), author: "Responsable déclaré fictif", reason: "Position fictive", outcome: "proceed" as const };
    const next = recordPiaReview(master, pia.id, decision, master.revision, now); expect(next.impactAssessments[0]!.reviews[0]!.outcome).toBe("proceed");
    const processor = createActivity(master.id, master.activities[0]!.id, "processor"); master.activities = [processor];
    expect(() => recordPiaReview(master, pia.id, decision, master.revision, now)).toThrow("INVALID");
  });
  it("rejects duplicate criteria, orphan risk links, opaque ID collisions, unknown methods and oversized values", () => {
    for (const mutate of [
      (p: ReturnType<typeof fixture>["pia"]) => { p.content.screening[1]!.criterionId = p.content.screening[0]!.criterionId; },
      (p: ReturnType<typeof fixture>["pia"]) => { const m = createPiaMeasure(id()); m.riskIds.push(id()); p.content.measures.push(m); },
      (p: ReturnType<typeof fixture>["pia"]) => { p.content.risks.push(createPiaRisk(p.id)); },
      (p: ReturnType<typeof fixture>["pia"]) => { Object.assign(p, { methodVersion: "future" }); },
      (p: ReturnType<typeof fixture>["pia"]) => { p.content.monitoring = knowledge("x".repeat(4001)); },
      (p: ReturnType<typeof fixture>["pia"]) => { p.content.risks = Array.from({ length: 31 }, () => createPiaRisk(id())); },
    ]) { const { master, pia } = fixture(); mutate(pia); expect(() => assertWorkspace(master)).toThrow("INVALID"); }
  });
  it("keeps AIPD data and opaque identifiers out of every register sharing profile", () => {
    const { master, pia, activity } = fixture(); const risk = createPiaRisk(id()); risk.rights = knowledge('PRIVATE_PIA_<img src=x onerror="alert(1)">'); pia.content.risks.push(risk);
    pia.content.dpoAdvice = knowledge("PRIVATE_PIA_DPO_ADVICE"); assertWorkspace(master);
    for (const profile of ["article30-controller", "internal-review"] as const) {
      const share = projectShare(master, { profile, recipient: "Destinataire fictif", scope: "Test fictif", activityIds: [activity.id], documentIds: [], clientId: null, reservations: [] }, id, now);
      for (const text of Object.values(renderShareFiles(share))) { expect(text).not.toContain("PRIVATE_"); expect(text).not.toContain(pia.id); expect(text).not.toContain(risk.id); }
      expect(() => projectShare(master, { profile, recipient: "Fictif", scope: "Fictif", activityIds: [activity.id], documentIds: [], clientId: null, reservations: [] }, () => risk.id, now)).toThrow();
    }
  });
  it("rejects concurrent edits and caps preserved reviews without dropping any history", () => {
    let { master, pia } = fixture();
    for (let i = 0; i < 8; i++) master = recordPiaReview(master, pia.id, { id: id(), author: "Fictif", reason: "Réexamen fictif", outcome: "rework" }, master.revision, now);
    const bytes = JSON.stringify(master);
    expect(() => recordPiaReview(master, pia.id, { id: id(), author: "Fictif", reason: "Réexamen", outcome: "rework" }, master.revision, now)).toThrow("INVALID");
    expect(() => putImpactAssessment(master, master.impactAssessments[0]!, master.revision - 1, now)).toThrow("CONFLICT"); expect(JSON.stringify(master)).toBe(bytes);
  });
  it("validates the role of historical decisions and never recycles identifiers from an old review", () => {
    let { master, pia, activity } = fixture(); document(pia.content);
    master = putImpactAssessment(master, pia, master.revision, now);
    master = recordPiaReview(master, pia.id, { id: id(), author: "Fictif", reason: "Décision fictive", outcome: "proceed" }, master.revision, now);
    const forged = structuredClone(master);
    forged.impactAssessments[0]!.reviews[0]!.context.activity = createActivity(master.id, activity.id, "processor");
    expect(() => assertWorkspace(forged)).toThrow("INVALID");
    const edited = structuredClone(master.impactAssessments[0]!);
    const historicalRiskId = edited.content.risks[0]!.id; edited.content.risks = [];
    master = putImpactAssessment(master, edited, master.revision, now);
    let calls = 0;
    expect(() => projectShare(master, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [activity.id], documentIds: [], clientId: null, reservations: [] }, () => calls++ === 0 ? historicalRiskId : id(), now)).toThrow("INVALID");
  });
});
