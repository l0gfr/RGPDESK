import { assertCollectionHistory } from "./collections";
import { assertDocumentHistory } from "./document-filing";
import { assertDpoHistory } from "./dpo";
import { assertPiaHistory } from "./pia";
import { unknown, createActivityReview, createActivityAnalysis, type Activity, type Party, type Purpose, type System, type Workspace } from "./model";
import { assertWorkspace, PrivacyError } from "./validation";

export function createWorkspace(id: string, name: string, now: string): Workspace {
  const master: Workspace = {
    format: "rgpd-master-v9", impactAssessments: [], dpoCases: [], piaPublications: [], id, revision: 1, createdAt: now, updatedAt: now,
    language: "fr", jurisdiction: unknown(), scope: unknown(),
    organization: { name: name.trim(), contact: unknown(), dpo: unknown(), representatives: unknown() },
    parties: [], systems: [], activities: [], documents: [], decisions: [], actions: [], imports: [], deliveries: [],
  };
  assertWorkspace(master);
  return master;
}

export const createPurpose = (id: string): Purpose => ({
  id, description: unknown(), legalBasis: unknown(), retention: { period: unknown(), trigger: unknown() },
});

export function createActivity(workspaceId: string, id: string, role: Activity["role"]): Activity {
  const base = {
    review: createActivityReview(), analysis: createActivityAnalysis(), flows: [],
    id, workspaceId, title: "Nouvelle activité", status: "draft" as const,
    systemIds: [], participantIds: [], dataCategories: unknown(), dataSubjects: unknown(),
    recipients: unknown(), transfers: unknown(), securityMeasures: unknown(), internalNotes: "",
  };
  return role === "controller" ? { ...base, role, purposes: [] }
    : { ...base, role, controllerIds: [], operations: unknown(), instructions: unknown() };
}

export function reviseWorkspace(master: Workspace, expectedRevision: number, now: string, changes: Partial<Pick<Workspace, "collections" | "workCheckpoint" | "citationReviews" | "dpoCases" | "piaPublications" | "impactAssessments" | "organization" | "scope" | "jurisdiction" | "parties" | "systems" | "activities" | "documents" | "decisions" | "actions" | "imports" | "deliveries">>): Workspace {
  assertWorkspace(master);
  const allowed = new Set(["collections", "workCheckpoint", "citationReviews", "dpoCases", "piaPublications", "impactAssessments", "organization", "scope", "jurisdiction", "parties", "systems", "activities", "documents", "decisions", "actions", "imports", "deliveries"]);
  if (Object.keys(changes).some((key) => !allowed.has(key))) throw new PrivacyError("INVALID");
  if (master.revision !== expectedRevision) throw new PrivacyError("CONFLICT");
  if (now < master.updatedAt) throw new PrivacyError("INVALID");
  // Historical records are append-only; a closed action cannot be rewritten.
  for (const field of ["decisions", "imports", "deliveries", "piaPublications"] as const) {
    const incoming = changes[field];
    if (incoming && master[field].some((item, index) => JSON.stringify(item) !== JSON.stringify(incoming[index]))) throw new PrivacyError("INVALID");
  }
  if ("citationReviews" in changes && (!Array.isArray(changes.citationReviews) || (master.citationReviews ?? []).some((r,i)=>JSON.stringify(r)!==JSON.stringify(changes.citationReviews![i])))) throw new PrivacyError("INVALID");
  if (changes.actions && master.actions.some((item) => {
    const next = changes.actions!.find((a) => a.id === item.id);
    return !next || (item.closure !== null && JSON.stringify(item) !== JSON.stringify(next))
      || (item.findingKey !== next.findingKey || item.createdAt !== next.createdAt);
  })) throw new PrivacyError("INVALID");
  if ("collections" in changes) assertCollectionHistory(master.collections ?? [], changes.collections ?? []);
  if (changes.documents) assertDocumentHistory(master.documents, changes.documents);
  for (const a of changes.activities ?? []) {
    const old = master.activities.find(item => item.id === a.id);
    for (const g of a.dataGroups ?? []) {
      const previous = old?.dataGroups?.find(item => item.id === g.id);
      if (previous && previous.code !== g.code) throw new PrivacyError("INVALID");
    }
  }
  if (changes.impactAssessments) assertPiaHistory(master, changes.impactAssessments, now);
  if (changes.dpoCases) assertDpoHistory(master, changes.dpoCases, now);
  const next = { ...master, ...changes, revision: master.revision + 1, updatedAt: now };
  assertWorkspace(next);
  return next;
}

export function putActivity(master: Workspace, activity: Activity, expectedRevision: number, now: string, documentIds?: string[]): Workspace {
  const previous = master.activities.find((item) => item.id === activity.id);
  if (previous && previous.role !== activity.role) throw new PrivacyError("INVALID");
  const activities = previous ? master.activities.map((item) => item.id === activity.id ? activity : item) : [...master.activities, activity];
  if (documentIds === undefined) return reviseWorkspace(master, expectedRevision, now, { activities });
  const selected = new Set(documentIds);
  if (selected.size !== documentIds.length || documentIds.some((id) => !master.documents.some((doc) => doc.id === id))) throw new PrivacyError("INVALID");
  const previousPurposes = new Set(previous?.role === "controller" ? previous.purposes.map((p) => p.id) : []);
  const documents = master.documents.map((doc) => {
    const linked = doc.activityIds.includes(activity.id), wanted = selected.has(doc.id);
    if (linked === wanted) return doc;
    return { ...doc, activityIds: wanted ? [...doc.activityIds, activity.id] : doc.activityIds.filter((id) => id !== activity.id),
      purposeIds: wanted ? doc.purposeIds : doc.purposeIds.filter((id) => !previousPurposes.has(id)),
      status: "declared" as const, reviewedAt: null, reviewedRevision: null };
  });
  // Inventory and reference links form one revision and one encrypted storage write.
  return reviseWorkspace(master, expectedRevision, now, { activities, documents });
}

export function putParty(master: Workspace, party: Party, expectedRevision: number, now: string): Workspace {
  const parties = master.parties.some((item) => item.id === party.id)
    ? master.parties.map((item) => item.id === party.id ? party : item) : [...master.parties, party];
  return reviseWorkspace(master, expectedRevision, now, { parties });
}

export function putSystem(master: Workspace, system: System, expectedRevision: number, now: string): Workspace {
  const systems = master.systems.some((item) => item.id === system.id)
    ? master.systems.map((item) => item.id === system.id ? system : item) : [...master.systems, system];
  return reviseWorkspace(master, expectedRevision, now, { systems });
}
