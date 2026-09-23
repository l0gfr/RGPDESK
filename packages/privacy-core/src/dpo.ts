import { type Workspace } from "./model";
import { createDpoCase, DPO_QUESTIONS, type DpoCase, type DpoContext, type DpoEvent, type DpoReview } from "./dpo-model";
import { canonicalJson } from "./share-format.js";
import { CHANGE_AREAS, compareReviewContexts, compareReviewContent, type ReviewChange } from "./review-diff";
import { piaContext } from "./pia";
import { reviseWorkspace } from "./commands";
import { assertWorkspace, PrivacyError } from "./validation";
import { validInstant, rightsDeadline } from "./deadlines";

export function dpoContext(master: Workspace, item: DpoCase): DpoContext {
  return { organization: master.organization, activities: item.activityIds.map((id) => piaContext(master, id)) };
}
export function dpoChangeDetails(master: Workspace, item: DpoCase): ReviewChange[] {
  const review = item.reviews.at(-1);
  if (!review) return [];
  const current = dpoContext(master, item);
  return [...compareReviewContexts(review.context.activities, current.activities, review.context.organization, current.organization), ...compareReviewContent(review.content, item.content)];
}
export function dpoChanges(master: Workspace, item: DpoCase): string[] {
  if (!item.reviews.length) return ["Première revue à préparer"];
  return [...new Set(dpoChangeDetails(master, item).map((c) => CHANGE_AREAS[c.area].label))].map((label) => `${label} : changement à examiner`);
}
export function putDpoCase(master: Workspace, item: DpoCase, revision: number, now: string): Workspace {
  const old = master.dpoCases.find((c) => c.id === item.id);
  if (canonicalJson(old?.reviews ?? []) !== canonicalJson(item.reviews) || canonicalJson(old?.events ?? []) !== canonicalJson(item.events)) throw new PrivacyError("INVALID");
  return reviseWorkspace(master, revision, now, { dpoCases: old ? master.dpoCases.map((c) => c.id === item.id ? item : c) : [...master.dpoCases, item] });
}
export function recordDpoReview(master: Workspace, caseId: string, decision: Pick<DpoReview, "id" | "author" | "outcome" | "reason">, revision: number, now: string): Workspace {
  assertWorkspace(master);
  const item = master.dpoCases.find((c) => c.id === caseId);
  if (!item || !decision.author.trim() || !decision.reason.trim()) throw new PrivacyError("INVALID");
  const review: DpoReview = { ...decision, at: now, revision: master.revision + 1, content: structuredClone(item.content), context: structuredClone(dpoContext(master, item)) };
  return reviseWorkspace(master, revision, now, { dpoCases: master.dpoCases.map((c) => c.id === caseId ? { ...c, reviews: [...c.reviews, review] } : c) });
}
export function appendDpoEvent(master: Workspace, caseId: string, event: DpoEvent, revision: number, now: string): Workspace {
  if (!master.dpoCases.some((c) => c.id === caseId)) throw new PrivacyError("INVALID");
  return reviseWorkspace(master, revision, now, { dpoCases: master.dpoCases.map((c) => c.id === caseId ? { ...c, events: [...c.events, event] } : c) });
}
export function assertDpoHistory(master: Workspace, incoming: DpoCase[], now: string) {
  for (const item of incoming) {
    const old = master.dpoCases.find((c) => c.id === item.id);
    if (!old && (item.reviews.length || item.events.length)) throw new PrivacyError("INVALID");
  }
  for (const old of master.dpoCases) {
    const next = incoming.find((c) => c.id === old.id);
    if (!next || old.kind !== next.kind || old.purposeId !== next.purposeId
      || old.reviews.some((r, i) => canonicalJson(r) !== canonicalJson(next.reviews[i]))
      || old.events.some((e, i) => canonicalJson(e) !== canonicalJson(next.events[i]))) throw new PrivacyError("INVALID");
    const reviews = next.reviews.slice(old.reviews.length), events = next.events.slice(old.events.length);
    if (reviews.length > 1 || events.length > 1 || (reviews.length && events.length)) throw new PrivacyError("INVALID");
    if ((reviews.length || events.length) && (canonicalJson(next.content) !== canonicalJson(old.content)
      || canonicalJson(next.activityIds) !== canonicalJson(old.activityIds) || next.title !== old.title || next.owner !== old.owner)) throw new PrivacyError("INVALID");
    for (const review of reviews) if (review.at !== now || review.revision !== master.revision + 1
      || canonicalJson(review.content) !== canonicalJson(old.content) || canonicalJson(review.context) !== canonicalJson(dpoContext(master, old))) throw new PrivacyError("INVALID");
  }
}
export function assertDpoWorkspace(master: Workspace, register: (id: string) => void) {
  const interests = new Set<string>();
  const notes = (item: DpoCase, content: DpoCase["content"]) => {
    const expected = DPO_QUESTIONS[item.kind];
    if (content.notes.length !== expected.length || new Set(content.notes.map((n) => n.questionId)).size !== expected.length
      || expected.some((id) => !content.notes.some((n) => n.questionId === id))) throw new PrivacyError("INVALID");
    const empty = createDpoCase(master.id, item.id, item.kind).content;
    if (item.kind !== "rights" && canonicalJson(content.rights) !== canonicalJson(empty.rights)) throw new PrivacyError("INVALID");
    if (item.kind !== "breach" && canonicalJson(content.breach) !== canonicalJson(empty.breach)) throw new PrivacyError("INVALID");
    if (content.rights.manualDue && content.rights.manualReason.state !== "documented") throw new PrivacyError("INVALID");
    if (item.kind === "rights") rightsDeadline(content.rights);
    for (const instant of [content.breach.awarenessAt, content.breach.detectedAt]) if (instant && !validInstant(instant)) throw new PrivacyError("INVALID");
    if (content.breach.awarenessAt && content.breach.detectedAt && content.breach.awarenessAt < content.breach.detectedAt) throw new PrivacyError("INVALID");
  };
  for (const item of master.dpoCases) {
    register(item.id);
    if (item.workspaceId !== master.id || item.activityIds.some((id) => !master.activities.some((a) => a.id === id))) throw new PrivacyError("INVALID");
    if (item.kind === "interest") {
      const a = master.activities.find((a) => a.id === item.activityIds[0]);
      if (item.activityIds.length !== 1 || !a || a.role !== "controller" || !a.purposes.some((p) => p.id === item.purposeId) || interests.has(item.purposeId!)) throw new PrivacyError("INVALID");
      interests.add(item.purposeId!);
    } else if (item.purposeId !== null) throw new PrivacyError("INVALID");
    notes(item, item.content);
    for (const event of item.events) { register(event.id); if (event.at > master.updatedAt) throw new PrivacyError("INVALID"); }
    let last = 0;
    for (const r of item.reviews) {
      register(r.id); notes(item, r.content);
      if (r.revision <= last || r.revision > master.revision || r.at > master.updatedAt || r.at < master.createdAt) throw new PrivacyError("INVALID");
      last = r.revision;
      for (const ctx of r.context.activities) if (ctx.activity.workspaceId !== master.id || [...ctx.parties, ...ctx.systems, ...ctx.documents].some((e) => e.workspaceId !== master.id)) throw new PrivacyError("INVALID");
    }
  }
  for (const p of master.piaPublications) {
    register(p.id);
    if (p.workspaceId !== master.id || !master.impactAssessments.some((a) => a.id === p.piaId) || p.revision >= master.revision || p.createdAt > master.updatedAt) throw new PrivacyError("INVALID");
    if (new TextEncoder().encode(JSON.stringify(p)).byteLength > 512 * 1024) throw new PrivacyError("LIMIT");
  }
}
