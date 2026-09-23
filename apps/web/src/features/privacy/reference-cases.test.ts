import { describe, expect, it } from "vitest";
import { assertWorkspace, resolvedFlows, putDocument, recordDpoReview, dpoChangeDetails, recordPiaReview, piaChanges, projectShare, renderShareFiles, reviseWorkspace, unknown, createImpactAssessment } from "@rgpdesk/privacy-core";
import { REFERENCE_CASES, createReferenceWorkspace } from "./reference-cases";
import { DemoSession } from "./demo-session";
import { searchWorkspace } from "./search";
const id = () => crypto.randomUUID(), at = "2026-09-23T10:00:00.000Z";
describe("versioned fictitious reference corpus, awaiting human review", () => {
  it("covers five SME and five association cases without duplicate identifiers", () => { expect(REFERENCE_CASES).toHaveLength(10); expect(new Set(REFERENCE_CASES.map((c) => c.id)).size).toBe(10); expect(REFERENCE_CASES.filter((c) => c.sector === "PME")).toHaveLength(5); });
  it.each(REFERENCE_CASES)("$id: links facts once, keeps legal choices unknown and permits four separate readings", (example) => {
    const w = createReferenceWorkspace(example.id,id,at); assertWorkspace(w);
    const a = w.activities[0]!; if (a.role !== "controller") throw Error("fixture");
    expect(a.purposes[0]!.legalBasis).toEqual(unknown()); expect(a.purposes[0]!.retention.period).toEqual(unknown());
    expect(a.analysis.notes.every((n) => n.assessment.state === "unknown")).toBe(true);
    expect(w.impactAssessments[0]!.content.screeningDecision).toBe("unknown");
    expect(w.impactAssessments[0]!.content.necessity.notes.every((n) => n.assessment.state === "unknown")).toBe(true);
    expect(w.dpoCases[0]!.reviews).toEqual([]); expect(example.review.length).toBeGreaterThan(70);
    const changed = reviseWorkspace(w,w.revision,at,{systems:[{...w.systems[0]!,name:"Nouvel outil fictif"}]});
    expect(resolvedFlows(changed.activities[0]!,changed)[0]!.destination).toEqual({state:"documented",value:"Nouvel outil fictif"});
    expect(searchWorkspace(changed,"Nouvel outil fictif").results.some((r) => r.kind === "activity")).toBe(true);
    expect(a.flows[0]!.destination).toEqual(unknown());
  });
  it("paie: a changed annex exposes the affected reviews while preserving their old evidence", () => {
    let w = createReferenceWorkspace("paie",id,at);
    w = recordDpoReview(w,w.dpoCases[0]!.id,{id:id(),author:"Relecteur fictif",outcome:"rework",reason:"Attendre le test de restauration"},w.revision,at);
    w = recordPiaReview(w,w.impactAssessments[0]!.id,{id:id(),author:"Relecteur fictif",outcome:"rework",reason:"Analyse à poursuivre"},w.revision,at);
    const old = JSON.stringify([w.dpoCases[0]!.reviews,w.impactAssessments[0]!.reviews]);
    w = putDocument(w,{...w.documents[0]!,version:"EXERCICE-v2"},at);
    expect(dpoChangeDetails(w,w.dpoCases[0]!)).toContainEqual(expect.objectContaining({label:"Version",before:"EXERCICE-v1",after:"EXERCICE-v2"}));
    expect(piaChanges(w,w.impactAssessments[0]!)).toContainEqual(expect.objectContaining({label:"Version"}));
    expect(JSON.stringify([w.dpoCases[0]!.reviews,w.impactAssessments[0]!.reviews])).toBe(old);
  });
  it("practice cases remain isolated and their public projection excludes internal citations", () => {
    const s = new DemoSession(id,at,"accompagnement"), other = new DemoSession(id,at,"sport"); const w = s.read();
    const dto = projectShare(w,{profile:"internal-review",recipient:"Comité fictif",scope:"Cas fictif",reservations:[],activityIds:[w.activities[0]!.id],documentIds:[],clientId:null,presentation:true,flowIds:[w.activities[0]!.flows[0]!.id]},id,at);
    const serialized = JSON.stringify(renderShareFiles(dto));
    expect(serialized).not.toContain(w.documents[0]!.id); expect(serialized).not.toContain("Point 1 de l’entretien fictif");
    expect(dto.flows).toHaveLength(1); s.clear(); expect(() => s.read()).toThrow("LOCKED"); expect(other.read().activities[0]!.title).toContain("mineurs");
  });
  it("never promotes an RGPD appreciation into a new necessity assessment", () => {
    const w = createReferenceWorkspace("badges",id,at), a = w.activities[0]!;
    a.analysis.notes[0]!.assessment = {state:"documented",value:"Position relative à une autre question"};
    const p = createImpactAssessment(w.id,a,id());
    expect(p.content.necessity.notes[0]!.assessment).toEqual(unknown());
  });
});
