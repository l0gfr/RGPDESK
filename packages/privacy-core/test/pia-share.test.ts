import { describe, it, expect } from "vitest";
import { createWorkspace, createActivity, createImpactAssessment, createPiaRisk, createPiaMeasure, putImpactAssessment, recordPiaReview, knowledge, projectPiaPublication, recordPiaPublication, renderPiaPublication, reviseWorkspace, PIA_SHARE_SECTIONS, type PiaShareOptions } from "../src/index";
let seq = 9500;
const id = () => `00000000-0000-4000-8000-${String(seq++).padStart(12, "0")}`;
const now = "2026-09-23T10:00:00.000Z";
function fixture() {
  let master = createWorkspace(id(), "Organisme fictif", now);
  const a = createActivity(master.id, id(), "controller"); a.title = "Titre retenu"; a.internalNotes = "CANARY_INTERNAL_ACTIVITY"; master.activities = [a];
  const pia = createImpactAssessment(master.id, a, id());
  for (const n of [...pia.content.necessity.notes, ...pia.content.principles]) {
    n.facts = knowledge("CANARY_FACT"); n.evidence = knowledge("CANARY_EVIDENCE"); n.objections = knowledge("CANARY_OBJECTION"); n.assessment = knowledge(`assessment:${n.questionId}`);
  }
  const risk = createPiaRisk(id()); risk.threats = knowledge("CANARY_INTERNAL_THREAT"); pia.content.risks = [risk];
  const measure = createPiaMeasure(id()); measure.riskIds = [risk.id]; measure.evidence = knowledge("CANARY_MEASURE_EVIDENCE"); pia.content.measures = [measure];
  master = putImpactAssessment(master, pia, master.revision, now);
  master = recordPiaReview(master, pia.id, { id: id(), author: "Fictif", reason: "À approfondir", outcome: "rework" }, master.revision, now);
  const options: PiaShareOptions = { piaId: pia.id, reviewId: null, sections: ["context"], recipient: "Comité fictif", scope: "Extrait fictif", reservations: "Travail inachevé" };
  return { master, pia: master.impactAssessments[0]!, options, risk, measure };
}
describe("explicit AIPD restitution", () => {
  it("excludes private notes and all opaque IDs even when every section is selected", async () => {
    const { master, pia, options, risk, measure } = fixture();
    options.sections = Object.keys(PIA_SHARE_SECTIONS) as PiaShareOptions["sections"]; options.reviewId = pia.reviews[0]!.id;
    const p = projectPiaPublication(master, options, id(), now); const html = await renderPiaPublication(p);
    expect(html).not.toContain("CANARY_");
    for (const value of [master.id, pia.id, pia.activityId, risk.id, measure.id, options.reviewId, p.id]) expect(html).not.toContain(value);
    expect(html).toContain("Travail inachevé"); expect(html).toContain("Scénarios et niveaux déclarés");
    expect(html).toContain("Examen des principes RGPD"); expect(html).toContain("default-src 'none'");
    expect(html).not.toMatch(/<script|<iframe|<img|<link/i);
  });
  it("does not share any unselected section and refuses ambiguous or empty selection", () => {
    const { master, pia, options } = fixture();
    const p = projectPiaPublication(master, options, id(), now);
    expect(new Set(p.rows.map((r) => r.section))).toEqual(new Set([PIA_SHARE_SECTIONS.context]));
    for (const sections of [[], ["context", "context"], ["measures"], ["decision"], ["__proto__"]]) {
      expect(() => projectPiaPublication(master, { ...options, sections: sections as PiaShareOptions["sections"] }, id(), now)).toThrow("INVALID");
    }
    expect(() => projectPiaPublication(master, { ...options, reviewId: id() }, id(), now)).toThrow("INVALID");
    expect(pia.content.principles[0]!.facts).toEqual(knowledge("CANARY_FACT"));
  });
  it("labels reordered answers by their semantic question IDs", () => {
    const { master, pia, options } = fixture(); pia.content.necessity.notes.reverse();
    const p = projectPiaPublication(master, { ...options, sections: ["necessity"] }, id(), now);
    expect(p.rows.find((r) => r.label === "Résultat recherché")?.value).toBe("assessment:objective");
    expect(p.rows.find((r) => r.label === "Position et suites")?.value).toBe("assessment:conclusion");
  });
  it("retains the selected historical context and immutable exact projected values", () => {
    let { master, pia, options } = fixture();
    const activities = structuredClone(master.activities); activities[0]!.title = "Titre ultérieur";
    master = reviseWorkspace(master, master.revision, now, { activities });
    const p = projectPiaPublication(master, { ...options, reviewId: pia.reviews[0]!.id }, id(), now);
    expect(p.rows.find((r) => r.label === "Activité")?.value).toBe("Titre retenu");
    master = recordPiaPublication(master, p, master.revision, now);
    const altered = structuredClone(p); altered.rows[0]!.value = "Réécriture";
    expect(() => reviseWorkspace(master, master.revision, now, { piaPublications: [altered] })).toThrow("INVALID");
    expect(() => recordPiaPublication(master, p, master.revision - 1, now)).toThrow("CONFLICT");
  });
  it("escapes hostile values in every HTML surface, preserving text without executable markup", async () => {
    const { master, options } = fixture(); const payload = '<img src=x onerror="alert(1)"><script>alert(1)</script>&';
    master.organization.name = payload;
    const p = projectPiaPublication(master, { ...options, recipient: payload, scope: payload, reservations: payload }, id(), now);
    const html = await renderPiaPublication(p);
    expect(html).not.toContain(payload); expect(html).toContain("&lt;img src=x onerror=&quot;"); expect(html).not.toContain("<script>");
    expect(html).toMatch(/style-src 'sha256-[A-Za-z0-9+/=]+'/);
  });
  it("caps preserved reports without replacing earlier history", () => {
    let { master, options } = fixture();
    for (let i = 0; i < 8; i++) { const p = projectPiaPublication(master, options, id(), now); master = recordPiaPublication(master, p, master.revision, now); }
    const before = JSON.stringify(master);
    expect(() => projectPiaPublication(master, options, id(), now)).toThrow("INVALID");
    expect(JSON.stringify(master)).toBe(before);
  });
});
