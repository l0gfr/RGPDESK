import type { PiaPublication } from "./dpo-model";
import type { PiaShareSection } from "./pia-share";

// A closed presentation tree shared by the passive file and the DOM preview.
// Publication values can only become text. No template or attribute comes from a row.
export type PiaReportNode =
  | string
  | {
      tag:
        | "body"
        | "main"
        | "header"
        | "footer"
        | "section"
        | "article"
        | "nav"
        | "div"
        | "span"
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "strong"
        | "a"
        | "dl"
        | "dt"
        | "dd"
        | "svg"
        | "path";
      attrs: Record<string, string>;
      children: PiaReportNode[];
    };
const n = (
  tag: Exclude<PiaReportNode, string>["tag"],
  attrs: Record<string, string>,
  ...children: PiaReportNode[]
): PiaReportNode => ({ tag, attrs, children });
const p = (text: string, cls = "") => n("p", { class: cls }, text);
const paths = {
  context: "M3 3h6v6H3ZM15 15h6v6h-6ZM6 9v9h9M15 3h6v6h-6ZM9 6h6M18 9v6",
  principles: "M5 3h14v18H5ZM9 7h6M9 11h6M9 15h4M3 6h4M3 10h4M3 14h4M3 18h4",
  necessity: "M12 3v18M7 21h10M4 7h16M5 7l-3 7h6ZM19 7l-3 7h6Z",
  alternatives: "M3 12h6M9 12V5h11M9 12v7h11M17 2l3 3-3 3M17 16l3 3-3 3",
  risks:
    "M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6M6 20v-2a6 6 0 0 1 12 0v2M3 4 1 9l2 5M21 4l2 5-2 5",
  measures: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6",
  opinions: "M3 4h18v12h-9l-5 4v-4H3ZM7 8h10M7 12h6",
  decision: "m4 6 2 2 4-4M13 6h7m-16 8 2 2 4-4M13 14h7M13 20h7",
};
const icon = (key: PiaShareSection) =>
  n(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    },
    n("path", { d: paths[key] }),
  );
type Row = PiaPublication["rows"][number] & { index: number };
type Group = { number: string; rows: Row[] };
function groups(rows: Row[], prefix: string) {
  const pattern = new RegExp(`^${prefix} ([1-9][0-9]*)(?: · .+)?$`),
    grouped = new Map<string, Group>(),
    rest: Row[] = [];
  for (const r of rows) {
    const match = pattern.exec(r.label);
    if (!match) {
      rest.push(r);
      continue;
    }
    const number = match[1]!;
    if (!grouped.has(number)) grouped.set(number, { number, rows: [] });
    grouped.get(number)!.rows.push(r);
  }
  return { items: [...grouped.values()], rest };
}
const missing = (text: string) =>
  ["À documenter", "À apprécier", "À fixer"].includes(text) || !text.trim();
const fact = (r: Row, label = r.label) =>
  n(
    "div",
    {
      class: `ar-fact${missing(r.value) ? " ar-missing" : ""}`,
      "data-pia-row": String(r.index),
    },
    n("dt", {}, label),
    n("dd", {}, r.value),
  );
const facts = (rows: Row[]) =>
  n("dl", { class: "ar-facts" }, ...rows.map((r) => fact(r)));
const card = (title: string, rows: Row[]) =>
  n("article", { class: "ar-card" }, n("h3", {}, title), facts(rows));

// Parse only the complete, generated ordinal-level sentence. Historical/custom
// text remains visible verbatim if it does not match, rather than guessed values.
function levels(r: Row): PiaReportNode {
  const match =
    /^Gravité initiale : (non appréciée|[1-4]) ; vraisemblance initiale : (non appréciée|[1-4]) ; gravité résiduelle : (non appréciée|[1-4]) ; vraisemblance résiduelle : (non appréciée|[1-4])\.$/.exec(
      r.value,
    );
  if (!match) return facts([r]);
  const scale = (label: string, value: string) =>
    n(
      "div",
      { class: "ar-scale" },
      n("dt", {}, label),
      n(
        "dd",
        {},
        n(
          "strong",
          {},
          value === "non appréciée"
            ? "Non appréciée"
            : `${value} / 4 · déclaré`,
        ),
        n(
          "span",
          { class: "ar-ticks", "aria-hidden": "true" },
          ...[1, 2, 3, 4].map((i) =>
            n("span", {
              class: `ar-tick${value !== "non appréciée" && i <= Number(value) ? " ar-filled" : ""}`,
            }),
          ),
        ),
      ),
    );
  return n(
    "div",
    { class: "ar-levels", "data-pia-row": String(r.index) },
    n("p", { class: "ar-eyebrow" }, r.label),
    n(
      "div",
      { class: "ar-comparison" },
      ...[0, 1].map((i) =>
        n(
          "div",
          { class: "ar-stage" },
          n("h4", {}, i ? "Appréciation résiduelle" : "Appréciation initiale"),
          n(
            "dl",
            {},
            scale("Gravité", match[1 + i * 2]!),
            scale("Vraisemblance", match[2 + i * 2]!),
          ),
        ),
      ),
    ),
    p(
      "Niveaux saisis par le rédacteur, selon sa méthode. Aucun niveau ni réduction du risque calculés.",
      "ar-quiet",
    ),
  );
}
export function createPiaReportBody(
  publication: PiaPublication,
  titles: Record<PiaShareSection, string>,
): PiaReportNode {
  const rows = publication.rows.map((r, index) => ({ ...r, index }));
  const names = [...new Set(rows.map((r) => r.section))];
  const sections = names.map((title, i) => ({
    title,
    id: `pia-section-${i}`,
    key: (Object.keys(titles) as PiaShareSection[]).find(
      (k) => titles[k] === title,
    ),
    rows: rows.filter((r) => r.section === title),
  }));
  const section = (key: PiaShareSection) => sections.find((s) => s.key === key);
  const riskGroups = groups(section("risks")?.rows ?? [], "Risque").items;
  const measureGroups = groups(section("measures")?.rows ?? [], "Mesure").items;
  const riskAnchors = new Map(
    riskGroups.map((g, i) => [`Risque ${g.number}`, `pia-risk-${i}`]),
  );
  const measureAnchors = new Map(
    measureGroups.map((g, i) => [`Mesure ${g.number}`, `pia-measure-${i}`]),
  );
  const references = (g: Group) =>
    g.rows
      .find((r) => r.label === `Mesure ${g.number} · Scénarios liés`)
      ?.value.split(", ") ?? [];
  const link = (text: string, id: string) =>
    n("a", { href: `#${id}`, class: "ar-chip" }, text);
  const read = (key: PiaShareSection, label: string) =>
    section(key)?.rows.find((r) => r.label === label)?.value;
  const chapter = (
    s: (typeof sections)[number],
    i: number,
    content: PiaReportNode,
  ) =>
    n(
      "section",
      {
        class: `ar-chapter ar-${s.key ?? "other"}`,
        id: s.id,
        "aria-labelledby": `${s.id}-title`,
      },
      n(
        "header",
        { class: "ar-section-head" },
        n(
          "span",
          { class: "ar-section-number", "aria-hidden": "true" },
          String(i + 1).padStart(2, "0"),
        ),
        n(
          "div",
          {},
          p("DANS CETTE RESTITUTION", "ar-eyebrow"),
          n("h2", { id: `${s.id}-title` }, s.title),
        ),
        n("span", { class: "ar-icon" }, icon(s.key ?? "context")),
      ),
      content,
    );
  const contents = sections.map((s, i) => {
    let content: PiaReportNode;
    if (s.key === "risks") {
      const g = groups(s.rows, "Risque");
      content = n(
        "div",
        {},
        facts(g.rest),
        ...g.items.map((group, index) => {
          const title = group.rows.find(
            (r) => r.label === `Risque ${group.number}`,
          );
          const levelRows = group.rows.filter(
            (r) => r.label === `Risque ${group.number} · Niveaux déclarés`,
          );
          const remaining = group.rows.filter(
            (r) => r !== title && !levelRows.includes(r),
          );
          const linked = measureGroups.filter((m) =>
            references(m).includes(`Risque ${group.number}`),
          );
          return n(
            "article",
            { class: "ar-risk", id: `pia-risk-${index}` },
            n(
              "header",
              { class: "ar-card-head" },
              icon("risks"),
              n(
                "div",
                {},
                p(`SCÉNARIO ${group.number}`, "ar-eyebrow"),
                n(
                  "h3",
                  title ? { "data-pia-row": String(title.index) } : {},
                  title?.value ?? `Risque ${group.number}`,
                ),
              ),
            ),
            n(
              "dl",
              { class: "ar-facts" },
              ...remaining.map((r) =>
                fact(r, r.label.replace(`Risque ${group.number} · `, "")),
              ),
            ),
            ...levelRows.map(levels),
            ...(section("measures")
              ? [
                  n(
                    "div",
                    { class: "ar-related" },
                    n("strong", {}, "Mesures reliées dans cet extrait"),
                    ...(linked.length
                      ? linked.map((m) =>
                          link(
                            `Mesure ${m.number}`,
                            measureAnchors.get(`Mesure ${m.number}`)!,
                          ),
                        )
                      : [
                          p(
                            "Aucun lien déclaré dans les mesures sélectionnées.",
                          ),
                        ]),
                  ),
                ]
              : []),
          );
        }),
      );
    } else if (s.key === "alternatives" || s.key === "measures") {
      const prefix = s.key === "alternatives" ? "Option" : "Mesure",
        g = groups(s.rows, prefix);
      content = n(
        "div",
        {},
        facts(g.rest),
        n(
          "div",
          { class: "ar-card-grid" },
          ...g.items.map((group, index) =>
            n(
              "article",
              {
                class: "ar-card",
                ...(s.key === "measures" ? { id: `pia-measure-${index}` } : {}),
              },
              n(
                "div",
                { class: "ar-card-head" },
                icon(s.key!),
                n("h3", {}, `${prefix} ${group.number}`),
              ),
              n(
                "dl",
                { class: "ar-facts" },
                ...group.rows.map((r) => {
                  if (
                    s.key === "measures" &&
                    r.label === `Mesure ${group.number} · Scénarios liés`
                  ) {
                    const refs = r.value.split(", ");
                    if (
                      refs.length &&
                      refs.every((ref) => riskAnchors.has(ref))
                    )
                      return n(
                        "div",
                        { class: "ar-fact", "data-pia-row": String(r.index) },
                        n("dt", {}, "Scénarios liés"),
                        n(
                          "dd",
                          { class: "ar-related" },
                          ...refs.map((ref) =>
                            link(ref, riskAnchors.get(ref)!),
                          ),
                        ),
                      );
                  }
                  return fact(
                    r,
                    s.key === "measures" && r.label === `${prefix} ${group.number}`
                      ? "Mesure déclarée"
                      : r.label.replace(`${prefix} ${group.number} · `, ""),
                  );
                }),
              ),
            ),
          ),
        ),
      );
    } else if (s.key === "principles" || s.key === "necessity") {
      const cards: PiaReportNode[] = [];
      for (let j = 0; j < s.rows.length; j++) {
        const r = s.rows[j]!,
          next = s.rows[j + 1];
        const paired = next?.label === `${r.label} : suites`;
        cards.push(
          n(
            "article",
            { class: "ar-card" },
            n("h3", {}, r.label),
            n(
              "dl",
              {},
              fact(r, "Appréciation déclarée"),
              ...(paired ? [fact(next!, "Suites documentées")] : []),
            ),
          ),
        );
        if (paired) j++;
      }
      content = n("div", { class: "ar-card-grid" }, ...cards);
    } else if (s.key === "context") {
      const salient = s.rows.filter((r) =>
        ["Personnes", "Données", "Destinataires"].includes(r.label),
      );
      content = n(
        "div",
        {},
        n(
          "div",
          { class: "ar-context-grid" },
          ...salient.map((r) => card(r.label, [r])),
        ),
        facts(s.rows.filter((r) => !salient.includes(r))),
      );
    } else content = facts(s.rows);
    return chapter(s, i, content);
  });
  const summary = (
    key: PiaShareSection,
    label: string,
    amount: number | undefined,
  ) =>
    n(
      "div",
      { class: "ar-stat" },
      icon(key),
      n("strong", {}, amount === undefined ? "Non inclus" : String(amount)),
      n("span", {}, label),
    );
  const decision = read("decision", "Position déclarée");
  return n(
    "body",
    {},
    n(
      "div",
      { class: "pia-report" },
      n(
        "header",
        { class: "ar-cover" },
        n(
          "div",
          { class: "ar-brand" },
          icon("risks"),
          p("RGPDESK / DOSSIER AIPD", "ar-eyebrow"),
        ),
        p("COMPRENDRE · EXAMINER · DÉCIDER", "ar-eyebrow"),
        n("h1", {}, "Analyse d’impact"),
        p(
          read("context", "Activité") ?? "Extrait des rubriques sélectionnées",
          "ar-subtitle",
        ),
        n(
          "dl",
          { class: "ar-cover-meta" },
          n(
            "div",
            {},
            n("dt", {}, "À l’attention de"),
            n("dd", {}, publication.recipient),
          ),
          n(
            "div",
            {},
            n("dt", {}, "Préparation déclarée"),
            n("dd", {}, publication.createdAt),
          ),
          n(
            "div",
            {},
            n("dt", {}, "Version examinée"),
            n("dd", {}, publication.sourceLabel),
          ),
        ),
      ),
      n(
        "main",
        {},
        n(
          "section",
          { class: "ar-intro", "aria-label": "Lecture du dossier AIPD" },
          p("LE DOSSIER, EN UN REGARD", "ar-eyebrow"),
          n("h2", {}, "Les enjeux. Les choix. Les suites."),
          n(
            "div",
            { class: "ar-stats" },
            summary("context", "Rubriques sélectionnées", sections.length),
            summary(
              "risks",
              "Scénarios sélectionnés",
              section("risks") ? riskGroups.length : undefined,
            ),
            summary(
              "measures",
              "Mesures sélectionnées",
              section("measures") ? measureGroups.length : undefined,
            ),
          ),
          p(
            "Ces repères décrivent le contenu communiqué, sans mesurer l’avancement ni la conformité de l’étude.",
            "ar-quiet",
          ),
          n(
            "div",
            { class: "ar-scope-grid" },
            n(
              "div",
              { class: "ar-scope" },
              n("h3", {}, "Périmètre de cette restitution"),
              p(publication.scope),
            ),
            n(
              "div",
              { class: "ar-reserve" },
              n("h3", {}, "Réserves communiquées"),
              p(
                publication.reservations ||
                  "Aucune réserve ajoutée par le rédacteur. Cela ne vaut pas validation.",
              ),
            ),
          ),
          ...(decision
            ? [
                n(
                  "div",
                  { class: "ar-position" },
                  icon("decision"),
                  n(
                    "div",
                    {},
                    p("POSITION COMMUNIQUÉE", "ar-eyebrow"),
                    n("strong", {}, decision),
                    link(
                      "Lire la revue et sa motivation",
                      section("decision")!.id,
                    ),
                  ),
                ),
              ]
            : []),
          p(
            "Extrait des rubriques choisies, non exhaustif. Déclarations et appréciations à examiner. Aucun auteur, avis juridique ou envoi n’est authentifié. Les preuves internes et les autres dossiers sont exclus. Ce document ne constitue pas une autorisation de traitement.",
            "ar-quiet",
          ),
        ),
        n(
          "nav",
          { class: "ar-toc", "aria-label": "Sommaire de l’AIPD" },
          ...sections.map((s, i) =>
            n(
              "a",
              { href: `#${s.id}` },
              n("span", { class: "ar-toc-icon" }, icon(s.key ?? "context")),
              n(
                "span",
                {},
                n(
                  "span",
                  { class: "ar-eyebrow" },
                  String(i + 1).padStart(2, "0"),
                ),
                n("strong", {}, s.title),
              ),
            ),
          ),
        ),
        ...contents,
      ),
      n(
        "footer",
        {},
        p(
          "Références de cadrage : RGPD, articles 35 et 36, et méthode CNIL. Export local HTML imprimable ; ce fichier n’est pas un paquet du vérificateur de registre.",
        ),
      ),
    ),
  );
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function serializePiaReport(node: PiaReportNode): string {
  if (typeof node === "string") return escape(node);
  return `<${node.tag}${Object.entries(node.attrs)
    .map(([key, value]) => ` ${key}="${escape(value)}"`)
    .join("")}>${node.children.map(serializePiaReport).join("")}</${node.tag}>`;
}
