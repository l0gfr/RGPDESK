import { expect, test } from "vitest";
import { assertWorkspace, knowledgeText, piaOpenPoints, putImpactAssessment } from "@rgpdesk/privacy-core";
import { createDemoWorkspace } from "./demo";
import { findRightsPrompts, RIGHTS_PROMPTS, riskFromRightsPrompt } from "./rights-catalogue";
import { RIGHTS_RISK_ANGLES, RIGHTS_RISK_METHOD } from "./rights-risk-method";

test("rights prompts remain source-bound local questions with explicit scope limits", () => {
  expect(new Set(RIGHTS_PROMPTS.map(item => item.id)).size).toBe(RIGHTS_PROMPTS.length);
  for (const item of RIGHTS_PROMPTS) {
    const source = new URL(item.source);
    expect(source.protocol).toBe("https:");
    expect(source.hostname).toBe("ks.echr.coe.int");
    expect(source.pathname).toMatch(/^\/documents\/d\/echr-ks\/guide_[a-z0-9_]+$/);
    expect(source.hash).toMatch(/^#page=\d+$/);
    expect(item.reference).toContain("§");
    expect(item.edition).toMatch(/202[56]/);
    expect(item.limit.length).toBeGreaterThan(50);
  }
  expect(findRightsPrompts("DONNEES bancaires").map(item => item.id)).toEqual(["banking"]);
  expect(findRightsPrompts("banque").map(item => item.id)).toEqual(["banking"]);
  expect(findRightsPrompts("", "14").map(item => item.id)).toEqual(["discrimination"]);
  expect(findRightsPrompts("banque", "9")).toEqual([]);
  expect(findRightsPrompts("correspondance", "8").map(item => item.id)).toContain("correspondence");
  expect(findRightsPrompts("pluralisme", "10").map(item => item.id)).toEqual(["pluralism"]);
  expect(findRightsPrompts('<img src=x onerror="alert(1)">')).toEqual([]);
  expect(findRightsPrompts("", "unexpected")).toEqual([]);
  expect(riskFromRightsPrompt("__proto__", crypto.randomUUID())).toBeNull();
});

test("choosing a right cannot decide applicability, a scenario, a risk level or an approval", () => {
  for (const prompt of RIGHTS_PROMPTS) {
    for (const angle of [undefined, ...RIGHTS_RISK_ANGLES.map(item => item.id)]) {
      const risk = riskFromRightsPrompt(prompt.id, crypto.randomUUID(), angle)!;
      expect(risk.title.length).toBeLessThanOrEqual(160);
      expect(risk.title).toContain("à examiner");
      expect(risk.rights).toMatchObject({ state: "documented" });
      if (angle) {
        expect(knowledgeText(risk.rights)).toContain(RIGHTS_RISK_ANGLES.find(item => item.id === angle)!.title);
        expect(knowledgeText(risk.rights)).toContain(RIGHTS_RISK_METHOD.source);
      } else {
        expect(knowledgeText(risk.rights)).not.toContain("Angle choisi");
        expect(knowledgeText(risk.rights)).not.toContain(RIGHTS_RISK_METHOD.source);
      }
      for (const key of ["event", "people", "impacts", "threats", "supports", "existingMeasures", "initialReason", "residualReason"] as const) expect(risk[key]).toEqual({ state: "unknown" });
      for (const key of ["initialSeverity", "initialLikelihood", "residualSeverity", "residualLikelihood", "residualHigh"] as const) expect(risk[key]).toBe("unknown");
    }
  }
});

test("rights and angle references fit saved studies without changing former reviews", () => {
  const master = createDemoWorkspace(() => crypto.randomUUID(), "2026-09-22T12:00:00.000Z");
  const before = structuredClone(master);
  // Validate all subjects together, once per angle; avoid recreating the entire demo per prompt.
  for (const angle of [undefined, ...RIGHTS_RISK_ANGLES.map(item => item.id)]) {
    const study = structuredClone(master.impactAssessments[0]!);
    study.content.risks.push(...RIGHTS_PROMPTS.map(prompt => riskFromRightsPrompt(prompt.id, crypto.randomUUID(), angle)!));
    const next = putImpactAssessment(master, study, master.revision, "2026-09-30T12:00:00.000Z");
    expect(() => assertWorkspace(next)).not.toThrow();
    expect(piaOpenPoints(next.impactAssessments[0]!.content).length).toBeGreaterThan(0);
    expect(next.impactAssessments[0]!.reviews).toEqual(before.impactAssessments[0]!.reviews);
    expect(master).toEqual(before);
  }
});

test("unknown risk angles fail closed even if supplied outside the typed UI", () => {
  const fromExternalChoice = riskFromRightsPrompt as (promptId: string, id: string, angle: unknown) => unknown;
  for (const angle of ["unexpected", "__proto__", "constructor", "", null, {}, ["integrity"]]) {
    expect(fromExternalChoice("autonomy", crypto.randomUUID(), angle)).toBeNull();
  }
});
