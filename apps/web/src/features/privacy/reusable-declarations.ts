import { flowSteps, knowledge, knowledgeText, type Activity, type Knowledge, type Workspace } from "@rgpdesk/privacy-core";

export type DeclarationKind = "data" | "people" | "purpose" | "recipients" | "period" | "trigger" | "deletion" | "endpoint" | "operation" | "channel" | "location" | "access" | "support";
export interface ReusableDeclaration { text: string; sources: string[]; occurrences: number }
export type DeclarationSource = (kind: DeclarationKind) => ReusableDeclaration[];
// Only a context key is shared. Decrypted content belongs to one mounted editor.
export const DECLARATIONS_CONTEXT = Symbol("rgpdesk-declarations");
export const DECLARATION_LIMIT = 12;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/œ/g, "oe").trim();

/** Projection of a validated open workspace and its current draft. No I/O or cache.
 * Historical reviews, archived activities and legal opinions are not candidates.
 * A copied value never imports a purpose ID, a review or another field's answer.
 */
export function reusableDeclarations(workspace: Workspace | null, draft: Activity | null, kind: DeclarationKind): ReusableDeclaration[] {
  if (!workspace || (draft && draft.workspaceId !== workspace.id)) return [];
  const entries = new Map<string, ReusableDeclaration>();
  function add(value: Knowledge, source: string) {
    const text = knowledgeText(value).trim();
    if (!text || text.length > 4000) return;
    const key = text.normalize("NFC");
    const found = entries.get(key);
    if (found) {
      found.occurrences++;
      if (found.sources.length < 3 && !found.sources.includes(source)) found.sources.push(source);
    } else entries.set(key, { text, sources: [source], occurrences: 1 });
  }
  const activities = draft ? [draft, ...workspace.activities.filter(a => a.id !== draft.id)] : workspace.activities;
  for (const a of activities) {
    if (a.workspaceId !== workspace.id || a.status === "archived") continue;
    const source = `${a.title || "Ensemble à nommer"}${a.id === draft?.id ? " · saisie en cours" : ""}`;
    if (kind === "support") for (const support of a.flowSupports ?? []) add(knowledge(support.name), `${source} · Support ${support.code}`);
    if (kind === "data") add(a.dataCategories, source + " · description générale");
    if (kind === "people") add(a.dataSubjects, source + " · description générale");
    if (kind === "recipients") add(a.recipients, source + " · destinataires");
    for (const g of a.dataGroups ?? []) {
      const ref = `${source} · D${g.code}`;
      if (kind === "data") add(g.data, ref);
      if (kind === "people") add(g.people, ref);
      if (kind === "period") add(g.retention.period, `${ref} · Départ : ${knowledgeText(g.retention.trigger) || "à préciser"}`);
      if (kind === "trigger") add(g.retention.trigger, ref);
      if (kind === "deletion") add(g.retention.deletion, ref);
    }
    if (a.role === "controller") for (const [i, p] of a.purposes.entries()) {
      const ref = `${source} · Sous-finalité ${i + 1}`;
      if (kind === "purpose") add(p.description, ref);
      if (kind === "period") add(p.retention.period, `${ref} · Départ : ${knowledgeText(p.retention.trigger) || "à préciser"}`);
      if (kind === "trigger") add(p.retention.trigger, ref);
    }
    for (const [i, f] of a.flows.flatMap(flowSteps).entries()) {
      const ref = `${source} · Flux ${i + 1}`;
      if (kind === "endpoint") {
        if (!f.sourceRef) add(f.source, ref + " · origine");
        if (!f.destinationRef) add(f.destination, ref + " · destination");
      }
      if (kind === "data" && "data" in f && !f.dataFromActivity && !f.dataGroupIds?.length) add(f.data, ref);
      if (kind === "operation") add(f.operation, ref);
      if (kind === "channel") add(f.channel, ref);
      if (kind === "location") add(f.location, ref);
      if (kind === "access") add(f.access, ref);
    }
  }
  return [...entries.values()];
}

export function filterDeclarations(entries: ReusableDeclaration[], query: string, current: string) {
  const words = normalize(query.slice(0, 160)).split(/\s+/u).filter(Boolean);
  const matches = entries.filter(item => item.text !== current.trim() && words.every(word => normalize([item.text, ...item.sources].join(" ")).includes(word)));
  return { total: matches.length, items: matches.slice(0, DECLARATION_LIMIT) };
}

/** Join explicitly chosen declarations without replacing the user's text or
 * splitting a declaration into inferred roles, locations or permissions. */
export function appendDeclarations(current: string, selected: readonly string[]): string | null {
  let result = current;
  for (const value of selected) {
    const text = value.trim();
    if (!text || containsDeclaration(result, text)) continue;
    result += `${result && !result.endsWith("\n") ? "\n" : ""}${text}`;
    if (result.length > 4000) return null;
  }
  return result.length <= 4000 ? result : null;
}

export function containsDeclaration(current: string, text: string): boolean {
  return `\n${current.trim()}\n`.includes(`\n${text.trim()}\n`);
}
