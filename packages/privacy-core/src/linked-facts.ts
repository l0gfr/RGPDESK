import { knowledge, type Activity, type DataFlow, type EvidenceReference, type ReviewNote, type Workspace } from "./model";
import type { PiaContext } from "./pia-model";
import { PrivacyError } from "./validation";

type Inventory = Pick<Workspace, "parties" | "systems">;
/** Resolve only declared links, against the current inventory or a frozen review context. */
export function resolveFlow(flow: DataFlow, activity: Activity, inventory: Inventory): DataFlow {
  const resolve = (ref: DataFlow["sourceRef"], fallback: DataFlow["source"]) => {
    if (!ref) return fallback;
    if (ref === "subjects") return activity.dataSubjects;
    const [kind, id] = ref.split(":");
    const entity = (kind === "party" ? inventory.parties : inventory.systems).find((item) => item.id === id);
    return knowledge(entity?.name ?? "");
  };
  return { id: flow.id, source: resolve(flow.sourceRef, flow.source), destination: resolve(flow.destinationRef, flow.destination),
    operation: flow.operation, data: flow.dataFromActivity ? activity.dataCategories : flow.data,
    channel: flow.channel, location: flow.location, access: flow.access };
}
export const resolvedFlows = (activity: Activity, inventory: Inventory): DataFlow[] => activity.flows.map((flow) => resolveFlow(flow, activity, inventory));
export function citationChanges(notes: ReviewNote[], documents: EvidenceReference[]): string[] {
  return notes.flatMap((note) => (note.citations ?? []).flatMap((c) => {
    const doc = documents.find((d) => d.id === c.documentId);
    return !doc || c.version !== doc.version ? [note.questionId] : [];
  })).filter((id, index, list) => list.indexOf(id) === index);
}
/** Links are scoped, including in historical contexts; no fallback to current evidence. */
export function assertLinkedFacts(master: Workspace): void {
  const notes = (list: ReviewNote[], documents: EvidenceReference[]) => {
    for (const note of list) {
      const keys = new Set<string>();
      for (const c of note.citations ?? []) {
        const key = JSON.stringify([c.documentId, c.locator]);
        if (!documents.some((d) => d.id === c.documentId) || keys.has(key) || !c.locator.trim() || !c.meaning.trim()) throw new PrivacyError("INVALID");
        keys.add(key);
      }
    }
  };
  const activity = (a: Activity, inventory: Inventory, docs: EvidenceReference[]) => {
    notes(a.analysis.notes, docs);
    for (const f of a.flows) {
      for (const field of ["source", "destination"] as const) {
        const ref = f[`${field}Ref`];
        if (!ref) continue;
        if (f[field].state !== "unknown") throw new PrivacyError("INVALID");
        if (ref !== "subjects") {
          const [kind, id] = ref.split(":");
          if (!(kind === "party" ? inventory.parties : inventory.systems).some((e) => e.id === id)) throw new PrivacyError("INVALID");
        }
      }
      if (f.dataFromActivity && f.data.state !== "unknown") throw new PrivacyError("INVALID");
    }
  };
  const context = (c: PiaContext) => {
    activity(c.activity, c, c.documents);
    for (const d of c.documents) if (d.contractReview) notes(d.contractReview.notes, c.documents);
  };
  for (const a of master.activities) activity(a, master, master.documents.filter((d) => d.activityIds.includes(a.id)));
  // Contract citations refer to this reference only: it cannot smuggle another activity's evidence into a snapshot.
  for (const d of master.documents) if (d.contractReview) notes(d.contractReview.notes, [d]);
  for (const pia of master.impactAssessments) {
    const docs = master.documents.filter((d) => d.activityIds.includes(pia.activityId));
    notes([...pia.content.principles, ...pia.content.necessity.notes], docs);
    for (const r of pia.reviews) { context(r.context); notes([...r.content.principles, ...r.content.necessity.notes], r.context.documents); }
  }
  for (const dossier of master.dpoCases) {
    notes(dossier.content.notes, master.documents.filter((d) => d.activityIds.some((id) => dossier.activityIds.includes(id))));
    for (const r of dossier.reviews) { r.context.activities.forEach(context); notes(r.content.notes, r.context.activities.flatMap((c) => c.documents)); }
  }
}

export function evidenceUses(master: Workspace, documentId: string): {subject: string; question: number; version: string}[] {
  const found: {subject: string; question: number; version: string}[] = [];
  const collect = (subject: string, notes: ReviewNote[]) => notes.forEach((note, index) => {
    for (const c of note.citations ?? []) if (c.documentId === documentId) found.push({subject,question:index+1,version:c.version});
  });
  for (const a of master.activities) collect(`Analyse RGPD · ${a.title}`,a.analysis.notes);
  for (const p of master.impactAssessments) {
    const title = master.activities.find((a) => a.id === p.activityId)?.title ?? "Activité";
    collect(`AIPD · Principes · ${title}`,p.content.principles); collect(`AIPD · Nécessité · ${title}`,p.content.necessity.notes);
  }
  for (const c of master.dpoCases) collect(c.title,c.content.notes);
  for (const d of master.documents) if (d.contractReview) collect(`Contrat · ${d.title}`,d.contractReview.notes);
  return found;
}
