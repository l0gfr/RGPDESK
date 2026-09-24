import { flowReferences } from "./flow-journeys";
import { citationChanges } from "./linked-facts";
import { ANALYSIS_QUESTIONS, type Knowledge, type ReviewNote, type Workspace } from "./model";
import { PIA_CRITERIA, PIA_PRINCIPLES, type ImpactAssessment, type PiaContent, type PiaContext, type PiaReview } from "./pia-model";
import { compareReviewContexts, compareReviewContent, type ReviewChange } from "./review-diff";
import { canonicalJson } from "./share-format.js";
import { reviseWorkspace } from "./commands";
import { assertWorkspace, PrivacyError } from "./validation";

export function piaContext(master: Workspace, activityId: string): PiaContext {
  const activity = master.activities.find((item) => item.id === activityId);
  if (!activity) throw new PrivacyError("INVALID");
  const parties = new Set([...activity.participantIds, ...activity.review.subcontractorIds, ...(activity.role === "processor" ? activity.controllerIds : [])]);
  const documents = master.documents.filter((d) => d.activityIds.includes(activityId));
  for (const d of documents) for (const id of d.partyIds) parties.add(id);
  const systems = new Set(activity.systemIds);
  for (const flow of activity.flows) for (const ref of flowReferences(flow)) {
    if (ref?.startsWith("party:")) parties.add(ref.slice(6));
    if (ref?.startsWith("system:")) systems.add(ref.slice(7));
  }
  return { activity, organization: master.organization, scope: master.scope, jurisdiction: master.jurisdiction,
    parties: master.parties.filter((p) => parties.has(p.id)), systems: master.systems.filter((s) => systems.has(s.id)), documents };
}
export function piaReviewState(master: Workspace, pia: ImpactAssessment): "unreviewed" | "unchanged" | "changed" {
  const last = pia.reviews.at(-1);
  if (!last) return "unreviewed";
  return piaChanges(master, pia).length ? "changed" : "unchanged";
}
export function piaChanges(master: Workspace, pia: ImpactAssessment): ReviewChange[] {
  const last = pia.reviews.at(-1);
  if (!last) return [];
  const current = piaContext(master, pia.activityId);
  return [...compareReviewContexts([last.context], [current], last.context.organization, current.organization), ...compareReviewContent(last.content, pia.content)];
}
const documented = (k: Knowledge) => k.state === "documented";
// Editorial checks only: never a score, legal opinion or automatic authorization.
export function piaOpenPoints(content: PiaContent, documents?: Workspace["documents"]): string[] {
  const points: string[] = [];
  if (documents && citationChanges([...content.principles, ...content.necessity.notes], documents).length) points.push("Réexaminer les citations dont la version a changé.");
  if (content.screeningDecision === "unknown" || !documented(content.applicability) || !documented(content.screeningReason)
    || content.screening.some((c) => c.answer === "unknown" || !documented(c.reason))) points.push("Motiver le déclenchement et les critères de l’AIPD.");
  if (content.principles.some((n) => !documented(n.assessment) || (!documented(n.evidence) && !n.citations?.length))) points.push("Documenter les principes, les droits et leurs références.");
  if (content.necessity.notes.some((n) => !documented(n.assessment) || (!documented(n.evidence) && !n.citations?.length))) points.push("Argumenter la nécessité et la proportionnalité.");
  if (!content.alternatives.length || content.alternatives.some((a) => [a.description, a.purpose, a.effectiveness, a.impacts, a.evidence, a.choice].some((k) => !documented(k)))) points.push("Comparer les alternatives et justifier le choix.");
  if (!documented(content.evaluationMethod)) points.push("Définir les échelles et la méthode d’appréciation des risques.");
  if (!content.risks.length || content.risks.some((r) => [r.event, r.people, r.rights, r.impacts, r.threats, r.supports, r.existingMeasures, r.initialReason, r.residualReason].some((k) => !documented(k))
    || [r.initialSeverity, r.initialLikelihood, r.residualSeverity, r.residualLikelihood, r.residualHigh].includes("unknown"))) points.push("Décrire et apprécier les risques initiaux et résiduels pour les personnes.");
  if (content.risks.some((r) => r.residualHigh === "yes")) points.push("Traiter le risque résiduel élevé et examiner la consultation préalable (article 36).");
  if (content.measures.some((m) => m.status !== "verified" || [m.description, m.owner, m.evidence, m.effectiveness, m.failure].some((k) => !documented(k)) || !m.due)) points.push("Vérifier les garanties, leurs preuves, leurs responsables et leur suivi.");
  if (content.risks.some((r) => (Number(r.residualSeverity) < Number(r.initialSeverity) || Number(r.residualLikelihood) < Number(r.initialLikelihood))
    && !content.measures.some((m) => m.riskIds.includes(r.id) && m.status === "verified" && documented(m.evidence) && documented(m.effectiveness)))) points.push("Étayer chaque réduction de risque par une garantie vérifiée reliée au scénario.");
  if ([content.dpoAdvice, content.peopleConsultation, content.authorityConsultation, content.monitoring].some((k) => !documented(k)) || !content.reviewDue) points.push("Consigner les avis, l’examen de la consultation préalable et le prochain réexamen.");
  return points;
}
export function putImpactAssessment(master: Workspace, pia: ImpactAssessment, expectedRevision: number, now: string): Workspace {
  const previous = master.impactAssessments.find((p) => p.id === pia.id);
  // Reviews can only be added through recordPiaReview, never through draft editing.
  if (canonicalJson(previous?.reviews ?? []) !== canonicalJson(pia.reviews)) throw new PrivacyError("INVALID");
  return reviseWorkspace(master, expectedRevision, now, { impactAssessments: previous ? master.impactAssessments.map((p) => p.id === pia.id ? pia : p) : [...master.impactAssessments, pia] });
}
export function recordPiaReview(master: Workspace, piaId: string, decision: Pick<PiaReview, "id" | "author" | "outcome" | "reason">, expectedRevision: number, now: string): Workspace {
  assertWorkspace(master);
  const pia = master.impactAssessments.find((p) => p.id === piaId);
  if (!pia || pia.scope === "risks" || !decision.author.trim() || !decision.reason.trim()) throw new PrivacyError("INVALID");
  if (decision.outcome === "proceed" && (piaOpenPoints(pia.content, piaContext(master, pia.activityId).documents).length || master.activities.find((a) => a.id === pia.activityId)?.role !== "controller")) throw new PrivacyError("INVALID");
  const review: PiaReview = { ...decision, author: decision.author.trim(), reason: decision.reason.trim(), at: now, revision: master.revision + 1, context: structuredClone(piaContext(master, pia.activityId)), content: structuredClone(pia.content) };
  return reviseWorkspace(master, expectedRevision, now, { impactAssessments: master.impactAssessments.map((p) => p.id === piaId ? { ...p, reviews: [...p.reviews, review] } : p) });
}
export function assertPiaWorkspace(master: Workspace, registerId: (id: string) => void) {
  const activityIds = new Set<string>();
  const notes = (value: ReviewNote[], expected: readonly string[]) => {
    const ids = new Set(value.map((n) => n.questionId));
    if (ids.size !== expected.length || value.length !== expected.length || expected.some((id) => !ids.has(id))) throw new PrivacyError("INVALID");
  };
  const content = (value: PiaContent, addId: (id: string) => void) => {
    if (new Set(value.screening.map((c) => c.criterionId)).size !== PIA_CRITERIA.length) throw new PrivacyError("INVALID");
    notes(value.principles, PIA_PRINCIPLES); notes(value.necessity.notes, ANALYSIS_QUESTIONS);
    const riskIds = new Set(value.risks.map((r) => r.id));
    for (const item of [...value.risks, ...value.measures, ...value.alternatives]) addId(item.id);
    for (const m of value.measures) if (m.riskIds.some((id) => !riskIds.has(id))) throw new PrivacyError("INVALID");
  };
  for (const pia of master.impactAssessments) {
    if (pia.scope === "risks" && pia.reviews.length) throw new PrivacyError("INVALID");
    registerId(pia.id);
    const activity = master.activities.find((a) => a.id === pia.activityId);
    if (pia.workspaceId !== master.id || !activity || activityIds.has(pia.activityId)) throw new PrivacyError("INVALID");
    activityIds.add(pia.activityId); content(pia.content, registerId);
    let lastRevision = 0;
    for (const review of pia.reviews) {
      registerId(review.id);
      if (review.at > master.updatedAt || review.at < master.createdAt || review.revision > master.revision || review.revision <= lastRevision || review.context.activity.id !== pia.activityId || review.context.activity.workspaceId !== master.id) throw new PrivacyError("INVALID");
      lastRevision = review.revision;
      const ids = new Set<string>();
      content(review.content, (id) => { if (ids.has(id)) throw new PrivacyError("INVALID"); ids.add(id); });
      notes(review.context.activity.analysis.notes, ANALYSIS_QUESTIONS);
      for (const doc of review.context.documents) if (doc.workspaceId !== master.id) throw new PrivacyError("INVALID");
      for (const entity of [...review.context.parties, ...review.context.systems]) if (entity.workspaceId !== master.id) throw new PrivacyError("INVALID");
      if (review.outcome === "proceed" && (piaOpenPoints(review.content, review.context.documents).length || review.context.activity.role !== "controller")) throw new PrivacyError("INVALID");
    }
  }
}
// An existing decision is immutable even when another command edits the workspace.
export function assertPiaHistory(previous: Workspace, incoming: ImpactAssessment[], now: string) {
  for (const item of incoming) if (!previous.impactAssessments.some((p) => p.id === item.id) && item.reviews.length) throw new PrivacyError("INVALID");
  for (const old of previous.impactAssessments) {
    const next = incoming.find((p) => p.id === old.id);
    if (old.scope !== "risks" && next?.scope === "risks") throw new PrivacyError("INVALID");
    if (next && next.reviews.length > old.reviews.length) {
      const added = next.reviews.slice(old.reviews.length);
      if (added.length !== 1 || canonicalJson(next.content) !== canonicalJson(old.content)) throw new PrivacyError("INVALID");
      const review = added[0]!;
      if (review.revision !== previous.revision + 1 || review.at !== now || canonicalJson(review.content) !== canonicalJson(old.content)
        || canonicalJson(review.context) !== canonicalJson(piaContext(previous, old.activityId))) throw new PrivacyError("INVALID");
    }
    if (!next || next.activityId !== old.activityId || old.reviews.some((review, i) => canonicalJson(review) !== canonicalJson(next.reviews[i]))) throw new PrivacyError("INVALID");
  }
}
