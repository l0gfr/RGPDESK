import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { buildDemoReports, demoReportParts } from "./demo-reports";
import { PIA_SHARE_SECTIONS } from "@rgpdesk/privacy-core";
test("the fixed final dossier includes both roles and every shareable PIA section without internal examples or active content", async () => {
  const reports = await buildDemoReports();
  expect(reports).toEqual(await buildDemoReports());
  expect(reports.map(r=>r.slug)).toEqual(["registre","sous-traitance","aipd"]);
  for (const report of reports) {
    const parts=demoReportParts(report.html);
    const page = readFileSync(new URL(`../../pages/app/privacy/demo/${report.slug}/index.astro`, import.meta.url), "utf8");
    expect(page).toContain(parts.body);
    expect(parts.body).not.toMatch(/NOTE INTERNE|EXERCICE \/ référence inventée|<(?:script|iframe|input)/);
    expect(report.html).toContain("DÉMONSTRATION FICTIVE");
    expect(report.html.length).toBeLessThan(200_000);
    const file = report.slug === "aipd" ? "pia" : "register";
    expect(parts.style).toBe(readFileSync(new URL(`./assets/demo-report-${file}.css`, import.meta.url), "utf8"));
  }
  expect(reports[0]!.html).toContain('aria-label="Synthèse direction"');
  expect(reports[0]!.html).toContain('aria-label="Cartographie sélectionnée"');
  expect(reports[1]!.html).toContain("Ateliers pour un client");
  for (const section of Object.values(PIA_SHARE_SECTIONS)) expect(reports[2]!.html).toContain(`<h2>${section}</h2>`);
  expect(reports[2]!.html).toContain("Aucune mise en œuvre autorisée");
  expect(()=>demoReportParts('<body>untrusted</body>')).toThrow();
  expect(()=>demoReportParts('<style>body{}</style><body><script>alert(1)</script></body>')).toThrow();
});
