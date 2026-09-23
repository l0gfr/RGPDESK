import { resolvedFlows, knowledgeText, type Knowledge, type ReviewNote, type Workspace } from "@rgpdesk/privacy-core";
import { DPO_TITLES } from "./dpo-methods";

export type SearchKind = "activity" | "document" | "dpo" | "pia";
export const SEARCH_LABELS = { activity: "Registre & flux", document: "Documents", dpo: "Dossiers DPO", pia: "AIPD" } as const;
export interface SearchResult { kind: SearchKind; id: string; title: string; detail: string; excerpt: string }
export const SEARCH_LIMIT = 20;
export const normalizeSearch = (text: string): string => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/œ/g, "oe").trim();
const notes = (items: ReviewNote[]): string[] => items.flatMap((n) => [n.facts, n.evidence, n.objections, n.assessment, n.followUp].map(knowledgeText).concat((n.citations ?? []).flatMap((c) => [c.version, c.locator, c.meaning])));
const text = (...items: Knowledge[]): string[] => items.map(knowledgeText);

/** Reads a validated, unlocked master. No cache, persistent index, history or I/O.
 * Only current saved content is searched; historical snapshots and identifiers are excluded.
 */
export function searchWorkspace(workspace: Workspace | null, query: string, kind?: SearchKind): { results: SearchResult[]; total: number } {
  const normalized = normalizeSearch(query.slice(0, 160));
  if (!workspace || normalized.length < 2) return { results: [], total: 0 };
  const words = normalized.split(/\s+/u);
  const matches: (SearchResult & { rank: number })[] = [];
  function add(type: SearchKind, id: string, title: string, detail: string, fields: string[]) {
    if (kind && kind !== type) return;
    const searchable = [title, detail, ...fields].filter(Boolean);
    const folded = searchable.map(normalizeSearch);
    if (!words.every((word) => folded.some((field) => field.includes(word)))) return;
    const best = fields.find((field) => words.some((word) => normalizeSearch(field).includes(word))) || detail;
    // Plain text only: never interpreted as HTML, a regular expression or a URL.
    const excerpt = best.length > 220 ? `${best.slice(0, 220)}…` : best;
    const titleText = normalizeSearch(title);
    const rank = titleText === normalized ? 0 : words.every((word) => titleText.includes(word)) ? 1 : 2;
    matches.push({ kind: type, id, title, detail, excerpt, rank });
  }
  for (const a of workspace.activities) {
    const parties = workspace.parties.filter((p) => a.participantIds.includes(p.id) || a.review.subcontractorIds.includes(p.id) || (a.role === "processor" && a.controllerIds.includes(p.id))).map((p) => p.name);
    const systems = workspace.systems.filter((s) => a.systemIds.includes(s.id)).map((s) => s.name);
    add("activity", a.id, a.title, a.role === "controller" ? "Activité responsable" : "Activité sous-traitante", [
      ...text(a.dataCategories, a.dataSubjects, a.recipients, a.transfers, a.securityMeasures, a.analysis.operations, a.analysis.access),
      a.internalNotes, ...parties, ...systems, ...notes(a.analysis.notes),
      ...resolvedFlows(a, workspace).flatMap((f) => text(f.source, f.destination, f.operation, f.data, f.channel, f.location, f.access)),
      ...(a.role === "controller" ? a.purposes.flatMap((p) => text(p.description, p.legalBasis, p.retention.period, p.retention.trigger)) : text(a.operations, a.instructions)),
    ]);
  }
  for (const d of workspace.documents) add("document", d.id, d.title, "Référence documentaire", [d.scope, d.version, d.declaredAuthor, d.internalRef, d.publicReference, d.reservations, d.audience, d.channel, ...text(d.availability), ...notes(d.contractReview?.notes ?? [])]);
  for (const d of workspace.dpoCases) add("dpo", d.id, d.title, DPO_TITLES[d.kind], [d.owner, ...notes(d.content.notes), ...d.events.flatMap((e) => [e.description, e.author, knowledgeText(e.evidence)])]);
  for (const p of workspace.impactAssessments) {
    const a = workspace.activities.find((v) => v.id === p.activityId);
    if (!a) continue;
    const c = p.content;
    add("pia", p.id, `AIPD · ${a.title}`, "Analyse d’impact", [
      ...notes(c.principles), ...notes(c.necessity.notes),
      ...text(c.applicability, c.screeningReason, c.evaluationMethod, c.dpoAdvice, c.peopleConsultation, c.authorityConsultation, c.monitoring),
      ...c.alternatives.flatMap((v) => text(v.description, v.purpose, v.effectiveness, v.impacts, v.evidence, v.choice)),
      ...c.risks.flatMap((v) => [v.title, ...text(v.event, v.people, v.rights, v.impacts, v.threats, v.supports, v.existingMeasures, v.initialReason, v.residualReason)]),
      ...c.measures.flatMap((v) => text(v.description, v.owner, v.evidence, v.effectiveness, v.failure)),
    ]);
  }
  matches.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "fr") || a.kind.localeCompare(b.kind));
  return { total: matches.length, results: matches.slice(0, SEARCH_LIMIT).map(({ rank: _rank, ...result }) => result) };
}
