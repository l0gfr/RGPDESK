import { expect, test } from "vitest";
import { assertWorkspace, piaOpenPoints, putImpactAssessment } from "@rgpdesk/privacy-core";
import { createDemoWorkspace } from "./demo";
import { findRightsPrompts, RIGHTS_PROMPTS, riskFromRightsPrompt } from "./rights-catalogue";

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
  expect(findRightsPrompts('<img src=x onerror="alert(1)">')).toEqual([]);
  expect(findRightsPrompts("", "unexpected")).toEqual([]);
  expect(riskFromRightsPrompt("__proto__", crypto.randomUUID())).toBeNull();
});

test("choosing a right cannot decide applicability, a scenario, a risk level or an approval", () => {
  for (const prompt of RIGHTS_PROMPTS) {
    const risk = riskFromRightsPrompt(prompt.id, crypto.randomUUID())!;
    expect(risk.title.length).toBeLessThanOrEqual(160);
    expect(risk.title).toContain("à examiner");
    expect(risk.rights).toMatchObject({ state: "documented" });
    for (const key of ["event", "people", "impacts", "threats", "supports", "existingMeasures", "initialReason", "residualReason"] as const) expect(risk[key]).toEqual({ state: "unknown" });
    for (const key of ["initialSeverity", "initialLikelihood", "residualSeverity", "residualLikelihood", "residualHigh"] as const) expect(risk[key]).toBe("unknown");
    const master = createDemoWorkspace(() => crypto.randomUUID(), "2026-09-22T12:00:00.000Z");
    const before = structuredClone(master);
    const study = structuredClone(master.impactAssessments[0]!);
    study.content.risks.push(risk);
    const next = putImpactAssessment(master, study, master.revision, "2026-09-25T12:00:00.000Z");
    expect(() => assertWorkspace(next)).not.toThrow();
    expect(piaOpenPoints(next.impactAssessments[0]!.content).length).toBeGreaterThan(0);
    expect(next.impactAssessments[0]!.reviews).toEqual(before.impactAssessments[0]!.reviews);
    expect(master).toEqual(before);
  }
});
