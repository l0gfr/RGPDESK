import { CATALOG_VERSION } from "./catalog";
import { unknown, type Knowledge, type ShareProfile, type Workspace, type Purpose } from "./model";
import { assertWorkspace, PrivacyError } from "./validation";
import { assertShare, shareCoverage } from "./share-format.js";
export * from "./share-format.js";
interface SharedBase { id: string; title: string; dataCategories: Knowledge; dataSubjects: Knowledge; recipients: Knowledge; transfers: Knowledge; securityMeasures: Knowledge }
export type SharedActivity = SharedBase & ({ role: "controller"; purposes: Purpose[] } | { role: "processor"; controllerIds: string[]; operations: Knowledge });
export interface SharedRegister {
  format: "rgpd-share-v1"; id: string; createdAt: string; profile: ShareProfile; catalogVersion: string;
  recipient: string; scope: string; reservations: string[]; coverage: "excerpt" | "incomplete" | "documented-profile";
  organization: Workspace["organization"]; parties: { id: string; name: string; contact: Knowledge }[];
  activities: SharedActivity[]; references: { id: string; activityIds: string[]; text: string }[];
}
export interface ShareOptions { profile: ShareProfile; recipient: string; scope: string; reservations: string[]; activityIds: string[]; documentIds: string[]; clientId: string | null }
const k = (value: Knowledge): Knowledge => value.state === "documented" ? { state: "documented", value: value.value } : unknown();
export function projectShare(master: Workspace, options: ShareOptions, id: () => string, now: string): SharedRegister {
  assertWorkspace(master);
  if (!options.recipient.trim() || !options.scope.trim() || !options.activityIds.length || new Set(options.activityIds).size !== options.activityIds.length || new Set(options.documentIds).size !== options.documentIds.length) throw new PrivacyError("INVALID");
  const selected = options.activityIds.map((aid) => master.activities.find((a) => a.id === aid));
  if (selected.some((a) => !a)) throw new PrivacyError("INVALID");
  const activities = selected.filter((a) => a !== undefined);
  if (activities.some((a) => options.profile === "article30-controller" ? a.role !== "controller" : ["article30-processor", "client-excerpt"].includes(options.profile) && a.role !== "processor")) throw new PrivacyError("INVALID");
  if (options.profile === "client-excerpt" && (!options.clientId || activities.some((a) => a.role !== "processor" || a.controllerIds.length !== 1 || a.controllerIds[0] !== options.clientId))) throw new PrivacyError("INVALID");
  const partyIds = new Set(activities.flatMap((a) => a.role === "processor" ? a.controllerIds : []));
  const partyMap = new Map([...partyIds].map((pid) => [pid, id()]));
  const activityMap = new Map(activities.map((a) => [a.id, id()]));
  const dto: SharedRegister = {
    format: "rgpd-share-v1", id: id(), createdAt: now, profile: options.profile, catalogVersion: CATALOG_VERSION,
    recipient: options.recipient.trim(), scope: options.scope.trim(), reservations: options.reservations.map((r) => r.trim()).filter(Boolean), coverage: "incomplete",
    organization: { name: master.organization.name, contact: k(master.organization.contact), dpo: k(master.organization.dpo), representatives: k(master.organization.representatives) },
    parties: master.parties.filter((p) => partyIds.has(p.id)).map((p) => ({ id: partyMap.get(p.id)!, name: p.name, contact: k(p.contact) })),
    activities: activities.map((a) => {
      const base: SharedBase = { id: activityMap.get(a.id)!, title: a.title, dataCategories: k(a.dataCategories), dataSubjects: k(a.dataSubjects), recipients: k(a.recipients), transfers: k(a.transfers), securityMeasures: k(a.securityMeasures) };
      return a.role === "controller" ? { ...base, role: "controller", purposes: a.purposes.map((p) => ({ id: id(), description: k(p.description), legalBasis: options.profile === "internal-review" ? k(p.legalBasis) : unknown(), retention: { period: k(p.retention.period), trigger: k(p.retention.trigger) } })) }
        : { ...base, role: "processor", controllerIds: a.controllerIds.map((pid) => partyMap.get(pid)!), operations: k(a.operations) };
    }),
    references: options.documentIds.map((did) => {
      const doc = master.documents.find((d) => d.id === did);
      // Never share a reference covering another activity/client, even when selected.
      if (!doc || !doc.publicReference.trim() || !doc.activityIds.length || doc.activityIds.some((aid) => !activityMap.has(aid))
        || (options.profile === "client-excerpt" && doc.partyIds.some((pid) => pid !== options.clientId))) throw new PrivacyError("INVALID");
      return { id: id(), activityIds: doc.activityIds.map((aid) => activityMap.get(aid)!), text: doc.publicReference };
    }),
  };
  dto.coverage = shareCoverage(dto);
  assertShare(dto);
  // Injected IDs must never reuse a stable internal ID.
  const internalIds = new Set([master.id, ...master.dpoCases.flatMap((c) => [c.id, ...c.events.map((e) => e.id), ...c.reviews.map((r) => r.id)]), ...master.piaPublications.map((p) => p.id), ...master.impactAssessments.flatMap((p) => [p.id, ...p.reviews.flatMap((r) => [r.id, r.context.activity.id, ...r.context.activity.flows.map((f) => f.id), ...(r.context.activity.role === "controller" ? r.context.activity.purposes.map((purpose) => purpose.id) : []), ...r.context.parties.map((item) => item.id), ...r.context.systems.map((item) => item.id), ...r.context.documents.map((item) => item.id), ...r.content.risks.map((item) => item.id), ...r.content.measures.map((item) => item.id), ...r.content.alternatives.map((item) => item.id)]), ...p.content.risks.map((r) => r.id), ...p.content.measures.map((m) => m.id), ...p.content.alternatives.map((a) => a.id)]), ...master.activities.flatMap((a) => a.flows.map((f) => f.id)), ...master.activities.map((a) => a.id), ...master.parties.map((p) => p.id), ...master.documents.map((d) => d.id), ...master.systems.map((s) => s.id), ...master.activities.flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : [])]);
  const publicIds = [dto.id, ...dto.activities.map((a) => a.id), ...dto.parties.map((p) => p.id), ...dto.references.map((r) => r.id), ...dto.activities.flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : [])];
  if (publicIds.some((pid) => internalIds.has(pid))) throw new PrivacyError("INVALID");
  return dto;
}
