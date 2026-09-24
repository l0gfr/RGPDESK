import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PIA_SHARE_SECTIONS,
  piaReportBody,
  renderPiaPublication,
  type PiaPublication,
  type PiaReportNode,
} from "../src/index";

const publication = (rows: PiaPublication["rows"]): PiaPublication => ({
  id: "private-publication-id",
  workspaceId: "private-workspace-id",
  piaId: "private-study-id",
  revision: 1,
  createdAt: "2026-09-24T10:00:00.000Z",
  recipient: "Comité fictif",
  scope: "Périmètre choisi",
  reservations: "Réserves explicites",
  sourceLabel: "Revue conservée",
  rows,
});
function elements(node: PiaReportNode): Exclude<PiaReportNode, string>[] {
  return typeof node === "string"
    ? []
    : [node, ...node.children.flatMap(elements)];
}
function content(node: PiaReportNode): string {
  return typeof node === "string" ? node : node.children.map(content).join(" ");
}
const row = (
  section: keyof typeof PIA_SHARE_SECTIONS,
  label: string,
  value: string,
) => ({ section: PIA_SHARE_SECTIONS[section], label, value });

describe("passive AIPD folio", () => {
  it("preserves every selected row, including reordered, duplicated and historical labels", async () => {
    const p = publication([
      row("measures", "Mesure 4", "Mesure choisie"),
      row("measures", "Mesure 4 · Scénarios liés", "Risque 9"),
      row("risks", "Risque 9", "Scénario choisi"),
      row("risks", "Risque 9", "Titre supplémentaire conservé"),
      row(
        "risks",
        "Risque 9 · Niveaux déclarés",
        "Ancienne appréciation libre",
      ),
      row("risks", "Champ ancien", "Valeur historique"),
      row("principles", "Droits : suites", "Suite non adjacente"),
      row("principles", "Droits", "Position humaine"),
      row("necessity", "Utilité réelle", "Utilité argumentée"),
      row("necessity", "Utilité réelle : suites", "Complément attendu"),
      row("alternatives", "Option 7 · Choix motivé", "Option examinée"),
      row("alternatives", "Option 7", "Libellé historique de l’option"),
      row("context", "Personnes", "Personnes décrites"),
      row("opinions", "Avis du DPO", "Avis rédigé"),
      {
        section: "Rubrique historique",
        label: "Champ historique",
        value: "Texte à conserver",
      },
    ]);
    const before = JSON.stringify(p);
    const tree = piaReportBody(p),
      nodes = elements(tree);
    const markers = nodes.filter((n) => n.attrs["data-pia-row"] !== undefined);
    expect(
      markers.map((n) => Number(n.attrs["data-pia-row"])).sort((a, b) => a - b),
    ).toEqual(p.rows.map((_, i) => i));
    for (const r of p.rows) expect(content(tree)).toContain(r.value);
    const historicalOption = markers.find(n => content(n).includes("Libellé historique de l’option"))!;
    expect(content(historicalOption)).toContain("Option 7");
    expect(content(historicalOption)).not.toContain("Mesure déclarée");
    const ids = new Set(nodes.map((n) => n.attrs.id).filter(Boolean));
    for (const a of nodes.filter((n) => n.tag === "a"))
      expect(ids.has(a.attrs.href!.slice(1))).toBe(true);
    expect(nodes.filter((n) => n.attrs.href === "#pia-risk-0")).toHaveLength(1);
    expect(nodes.filter((n) => n.attrs.href === "#pia-measure-0")).toHaveLength(
      1,
    );
    expect(await renderPiaPublication(p)).toBe(await renderPiaPublication(p));
    expect(JSON.stringify(p)).toBe(before);
  });

  it("never imports unselected context, decisions or measures into the graphical summary", async () => {
    const html = await renderPiaPublication(
      publication([row("risks", "Contenu", "À documenter")]),
    );
    expect(html).toContain("Non inclus");
    expect(html).not.toContain("POSITION COMMUNIQUÉE");
    expect(html).not.toContain("Mesures reliées dans cet extrait");
    expect(html).not.toContain('ar-risk"');
    expect(html).not.toContain("private-");
    for (const label of [
      PIA_SHARE_SECTIONS.context,
      PIA_SHARE_SECTIONS.decision,
      PIA_SHARE_SECTIONS.measures,
    ]) {
      expect(html).not.toContain(`<h2>${label}</h2>`);
    }
  });

  it("shows four independent declared levels and does not turn unknown levels into low risk", () => {
    const levels = (
      initial: string,
      likelihood: string,
      residual: string,
      residualLikelihood: string,
    ) =>
      row(
        "risks",
        "Risque 1 · Niveaux déclarés",
        `Gravité initiale : ${initial} ; vraisemblance initiale : ${likelihood} ; gravité résiduelle : ${residual} ; vraisemblance résiduelle : ${residualLikelihood}.`,
      );
    const tree = piaReportBody(
      publication([
        row("risks", "Risque 1", "Scénario"),
        levels("4", "2", "3", "non appréciée"),
      ]),
    );
    const scales = elements(tree).filter((n) => n.attrs.class === "ar-scale");
    expect(
      scales.map(
        (n) =>
          elements(n).filter((c) => c.attrs.class === "ar-tick ar-filled")
            .length,
      ),
    ).toEqual([4, 2, 3, 0]);
    expect(content(scales[3]!)).toContain("Non appréciée");
    const unknown = piaReportBody(
      publication([
        levels(
          "non appréciée",
          "non appréciée",
          "non appréciée",
          "non appréciée",
        ),
      ]),
    );
    expect(
      elements(unknown).filter((n) => n.attrs.class === "ar-tick ar-filled"),
    ).toHaveLength(0);
    const custom = piaReportBody(publication([levels("5", "2", "3", "1")]));
    expect(
      elements(custom).filter((n) => n.attrs.class === "ar-scale"),
    ).toHaveLength(0);
    expect(content(custom)).toContain("Gravité initiale : 5");
  });

  it("keeps unresolved measure references verbatim instead of inventing links", () => {
    const p = publication([
      row("risks", "Risque 1", "Risque connu"),
      row("measures", "Mesure 1 · Scénarios liés", "Risque 1, Risque 99"),
    ]);
    const field = elements(piaReportBody(p)).find(
      (n) => n.attrs["data-pia-row"] === "1",
    )!;
    expect(content(field)).toContain("Risque 1, Risque 99");
    expect(elements(field).filter((n) => n.tag === "a")).toHaveLength(0);
  });

  it("uses text-only publication data and pins the complete passive stylesheet in the CSP", async () => {
    const text =
      '<svg onload="alert(1)"><a href="javascript:alert(1)">x</a></svg>&';
    const p = publication([
      { section: text, label: text, value: text },
      row("risks", "Risque 1", text),
    ]);
    p.recipient = text;
    p.reservations = text;
    p.scope = text;
    p.sourceLabel = text;
    const nodes = elements(piaReportBody(p));
    for (const n of nodes)
      for (const [name, value] of Object.entries(n.attrs)) {
        expect(name).not.toMatch(/^on/i);
        expect(value).not.toContain(text);
        if (name === "href")
          expect(value).toMatch(/^#pia-(section|risk|measure)-\d+$/);
      }
    const html = await renderPiaPublication(p);
    expect(html).not.toContain(text);
    expect(html).toContain("&lt;svg onload=&quot;");
    expect(html).not.toMatch(/<(script|iframe|link|img|form)\b/i);
    const css = /<style>([\s\S]+?)<\/style>/.exec(html)![1]!;
    expect(html).toContain(
      `style-src 'sha256-${createHash("sha256").update(css).digest("base64")}'`,
    );
    expect(css).not.toMatch(/url\(|@import/i);
  });
});
