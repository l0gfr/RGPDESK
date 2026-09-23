import { assertDpoHistory } from "./dpo";
import { assertPiaHistory } from "./pia";
import { unknown, createActivityReview, createActivityAnalysis, type Activity, type Party, type Purpose, type System, type Workspace } from "./model";
import { assertWorkspace, PrivacyError } from "./validation";

export function createWorkspace(id: string, name: string, now: string): Workspace {
  const master: Workspace = {
    format: "rgpd-master-v5", impactAssessments: [], dpoCases: [], piaPublications: [], id, revision: 1, createdAt: now, updatedAt: now,
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

export function reviseWorkspace(master: Workspace, expectedRevision: number, now: string, changes: Partial<Pick<Workspace, "dpoCases" | "piaPublications" | "impactAssessments" | "organization" | "scope" | "jurisdiction" | "parties" | "systems" | "activities" | "documents" | "decisions" | "actions" | "imports" | "deliveries">>): Workspace {
  assertWorkspace(master);
  const allowed = new Set(["dpoCases", "piaPublications", "impactAssessments", "organization", "scope", "jurisdiction", "parties", "systems", "activities", "documents", "decisions", "actions", "imports", "deliveries"]);
  if (Object.keys(changes).some((key) => !allowed.has(key))) throw new PrivacyError("INVALID");
  if (master.revision !== expectedRevision) throw new PrivacyError("CONFLICT");
  if (now < master.updatedAt) throw new PrivacyError("INVALID");
  // Historical records are append-only; a closed action cannot be rewritten.
  for (const field of ["decisions", "imports", "deliveries", "piaPublications"] as const) {
    const incoming = changes[field];
    if (incoming && master[field].some((item, index) => JSON.stringify(item) !== JSON.stringify(incoming[index]))) throw new PrivacyError("INVALID");
  }
  if (changes.actions && master.actions.some((item) => {
    const next = changes.actions!.find((a) => a.id === item.id);
    return !next || (item.closure !== null && JSON.stringify(item) !== JSON.stringify(next))
      || (item.findingKey !== next.findingKey || item.createdAt !== next.createdAt);
  })) throw new PrivacyError("INVALID");
  if (changes.impactAssessments) assertPiaHistory(master, changes.impactAssessments, now);
  if (changes.dpoCases) assertDpoHistory(master, changes.dpoCases, now);
  const next = { ...master, ...changes, revision: master.revision + 1, updatedAt: now };
  assertWorkspace(next);
  return next;
}

export function putActivity(master: Workspace, activity: Activity, expectedRevision: number, now: string): Workspace {
  const previous = master.activities.find((item) => item.id === activity.id);
  if (previous && previous.role !== activity.role) throw new PrivacyError("INVALID");
  const activities = previous ? master.activities.map((item) => item.id === activity.id ? activity : item) : [...master.activities, activity];
  return reviseWorkspace(master, expectedRevision, now, { activities });
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
