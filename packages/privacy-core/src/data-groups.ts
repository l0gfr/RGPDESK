import { knowledge, knowledgeText, unknown, type Activity, type DataGroup, type DataFlow, type Knowledge, type Purpose, type Workspace } from "./model";
import { groupPurposeIds, flowSteps, resolveJourney, stepSupportIds } from "./flow-journeys";
import { PrivacyError } from "./validation";

export const MINIMISATION_LABELS = {
  data: "Données : lesquelles sont indispensables ?",
  supports: "Supports : lesquels peut-on supprimer ou restreindre ?",
  channels: "Canaux : quels échanges peut-on éviter ?",
  recipients: "Destinataires : qui a réellement besoin de cet accès ?",
  retention: "Conservation : pourquoi cette durée, peut-on la réduire ?",
} as const;
export function createDataGroup(id: string, code: number): DataGroup {
  return { id, code, data: unknown(), people: unknown(), purposeIds: [],
    retention: { period: unknown(), trigger: unknown(), deletion: unknown() },
    minimisation: { data: unknown(), supports: unknown(), channels: unknown(), recipients: unknown(), retention: unknown() }, guarantees: unknown() };
}
const join = (parts: string[]) => knowledge([...new Set(parts.filter(Boolean))].join("\n"));
/** A flow follows only its selected groups; unrelated groups must not become its origin. */
export function flowSubjects(a: Activity, f: DataFlow): Knowledge {
  const groups = (a.dataGroups ?? []).filter(g => !f.dataGroupIds?.length || f.dataGroupIds.includes(g.id));
  if (!groups.length) return f.dataGroupIds?.length ? unknown() : a.dataSubjects;
  if (groups.some(g => g.people.state === "unknown")) return unknown();
  return join([...(f.dataGroupIds?.length ? [] : [knowledgeText(a.dataSubjects)]), ...groups.map(g => `D${g.code} : ${knowledgeText(g.people)}`)]);
}
/** Display projection only. Legacy declarations are preserved, never rewritten or split by inference. */
export function activityFacts(a: Activity, inventory?: Pick<Workspace, "parties" | "systems">) {
  const groups = a.dataGroups ?? [];
  if (!groups.length) return { dataCategories: a.dataCategories, dataSubjects: a.dataSubjects, recipients: a.recipients };
  const category = (field: "data" | "people", legacy: Knowledge) => groups.some(g => g[field].state === "unknown") ? unknown() : join([knowledgeText(legacy), ...groups.map(g => `D${g.code} : ${knowledgeText(g[field]) || "À documenter"}`)]);
  const recipients = a.flows.filter(f => f.dataGroupIds?.length).flatMap(f => flowSteps(f).map(step => {
    const ref = step.destinationRef;
    const name = ref === "subjects" ? knowledgeText(flowSubjects(a, f)) : ref ? inventory && (ref.startsWith("party:") ? inventory.parties : inventory.systems).find(e => e.id === ref.slice(ref.indexOf(":") + 1))?.name : knowledgeText(step.destination);
    // A tool destination alone is not a recipient. The declared access identifies who can consult.
    return [ref && (ref.startsWith("system:") || ref.startsWith("support:")) ? "" : name, knowledgeText(step.access)].filter(Boolean).join(" · ");
  }));
  return { dataCategories: category("data", a.dataCategories), dataSubjects: category("people", a.dataSubjects), recipients: groups.some(g => !a.flows.some(f => f.dataGroupIds?.includes(g.id)) || a.flows.some(f => f.dataGroupIds?.includes(g.id) && flowSteps(f).some(s=>s.access.state === "unknown"))) ? unknown() : join([knowledgeText(a.recipients), ...recipients]) };
}
export function purposeRetention(a: Activity, p: Purpose): Purpose["retention"] {
  const groups = (a.dataGroups ?? []).filter(g => groupPurposeIds(a,g).includes(p.id));
  const collect = (key: "period" | "trigger") => groups.some(g => g.retention[key].state === "unknown") ? unknown() : join([knowledgeText(p.retention[key]), ...groups.map(g => `D${g.code} : ${knowledgeText(g.retention[key]) || "À documenter"}`)]);
  return groups.length ? { period: collect("period"), trigger: collect("trigger") } : p.retention;
}
export function dataGroupIssues(a: Activity, g: DataGroup): { key: string; message: string }[] {
  const result: { key: string; message: string }[] = [];
  const add = (key: string, message: string) => result.push({ key, message });
  if (a.role === "controller" && !groupPurposeIds(a,g).length) add("purposes", "Relier une sous-finalité.");
  if (g.data.state === "unknown" || g.people.state === "unknown") add("categories", "Décrire les données et les personnes.");
  const flows = a.flows.filter(f => f.dataGroupIds?.includes(g.id));
  if (!flows.length) add("flows", "Décrire le parcours de ce groupe.");
  if (a.role === "controller" && flows.some(f => f.journey && !f.journey.purposeIds.length)) add("journey-purposes", "Relier les sous-finalités de chaque parcours.");
  if (flows.some(f => f.journey?.steps.some(s => s.operation.state === "unknown" || !stepSupportIds(s).length))) add("journey-steps", "Décrire les opérations et choisir leurs supports.");
  if (flows.flatMap(flowSteps).some(f => (!f.sourceRef && f.source.state === "unknown") || (!f.destinationRef && f.destination.state === "unknown") || f.channel.state === "unknown" || f.access.state === "unknown")) add("flow-details", "Préciser l’origine, la destination, les supports, canaux et accès.");
  if (Object.values(g.retention).some(k => k.state === "unknown")) add("retention", "Décrire la conservation et l’effacement.");
  if (Object.values(g.minimisation).some(k => k.state === "unknown")) add("minimisation", "Examiner la minimisation des données, supports, canaux, destinataires et durées.");
  if (g.guarantees.state === "unknown") add("guarantees", "Documenter les garanties et leur vérification.");
  return result;
}
export function dataGroupOpenPoints(a: Activity, g: DataGroup): string[] { return dataGroupIssues(a, g).map(issue => issue.message); }
/** Works equally against a current activity and its frozen historical context. */
export function assertDataGroups(a: Activity): void {
  const groups = a.dataGroups ?? [], ids = new Set(groups.map(g => g.id)), codes = new Set(groups.map(g => g.code));
  const purposes = new Set(a.role === "controller" ? a.purposes.map(p => p.id) : []);
  const otherIds = new Set([a.id, a.workspaceId, ...a.flows.map(f => f.id), ...purposes]);
  if (groups.some(g => otherIds.has(g.id))) throw new PrivacyError("INVALID");
  if (ids.size !== groups.length || codes.size !== groups.length) throw new PrivacyError("INVALID");
  for (const g of groups) if (g.purposeIds.some(id => !purposes.has(id))) throw new PrivacyError("INVALID");
  for (const f of a.flows) if (f.dataGroupIds?.length && (f.dataGroupIds.some(id => !ids.has(id)) || f.data.state !== "unknown" || f.dataFromActivity)) throw new PrivacyError("INVALID");
}
/** The table reads facts once, without importing the internal analysis notes or evidence locators. */
export function dataGroupRows(a: Activity, inventory: Pick<Workspace, "parties" | "systems">): { group: string; rows: { label: string; value: string }[] }[] {
  const text = (k: Knowledge | undefined) => k ? knowledgeText(k) || "À documenter" : "À documenter";
  const endpoint = (ref: string | undefined, fallback: Knowledge, flow: DataFlow) => ref === "subjects" ? text(flowSubjects(a, flow)) : ref ? (ref.startsWith("party:") ? inventory.parties : inventory.systems).find(e => e.id === ref.slice(ref.indexOf(":") + 1))?.name || "À documenter" : text(fallback);
  return (a.dataGroups ?? []).map(g => ({ group: `D${g.code}`, rows: [
    { label: "Données", value: text(g.data) }, { label: "Personnes", value: text(g.people) },
    { label: "Sous-finalités", value: a.role === "controller" ? groupPurposeIds(a,g).map(id => text(a.purposes.find(p => p.id === id)?.description)).join(" ; ") || "À relier" : "Opérations du client : " + text(a.operations) },
    ...a.flows.filter(f => f.dataGroupIds?.includes(g.id)).map(f=>f.journey ? resolveJourney(a,f,inventory) : f).flatMap((f, i) => [
      { label: `Flux ${i + 1} · Parcours`, value: `${endpoint(f.sourceRef, f.source, f)} → ${endpoint(f.destinationRef, f.destination, f)}` },
      { label: `Flux ${i + 1} · Opération`, value: text(f.operation) },
      { label: `Flux ${i + 1} · Canal et support`, value: text(f.channel) },
      { label: `Flux ${i + 1} · Accès et destinataires`, value: text(f.access) },
      { label: `Flux ${i + 1} · Lieux`, value: text(f.location) },
    ]),
    { label: "Durée ou critère", value: text(g.retention.period) }, { label: "Événement de départ", value: text(g.retention.trigger) }, { label: "Effacement", value: text(g.retention.deletion) },
    ...Object.entries(MINIMISATION_LABELS).map(([key, label]) => ({ label, value: text(g.minimisation[key as keyof typeof MINIMISATION_LABELS]) })),
    { label: "Garanties et vérification", value: text(g.guarantees) },
  ] }));
}
