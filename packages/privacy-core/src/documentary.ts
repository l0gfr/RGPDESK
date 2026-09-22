import { CATALOG_VERSION } from "./catalog";
import { reviseWorkspace } from "./commands";
import { assertWorkspace, PrivacyError } from "./validation";
import { knowledgeText, type DocumentaryAction, type EvidenceReference, type Workspace } from "./model";
export interface Finding { key: string; ruleId: string; activityId: string | null; scope: string; message: string }
export function evaluateWorkspace(master: Workspace, today: string): Finding[] {
  assertWorkspace(master);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new PrivacyError("INVALID");
  const findings: Finding[] = [];
  const add = (ruleId: string, activityId: string | null, scope: string, message: string) => findings.push({ key: `${ruleId}:${activityId ?? master.id}:${scope}`, ruleId, activityId, scope, message });
  if (master.organization.contact.state === "unknown" || master.organization.representatives.state === "unknown" || master.organization.dpo.state === "unknown") add("R-001", null, "organisation", "Coordonnées, représentant ou situation du DPO à documenter, y compris une non-applicabilité motivée.");
  if (!master.decisions.some((d) => d.ruleId === "R-009" && d.revision === master.revision && d.catalogVersion === CATALOG_VERSION)) add("R-009", null, "organisation", "Périmètre, exemptions éventuelles et DPO : analyse à documenter ou à réexaminer.");
  for (const a of master.activities) {
    const docs = master.documents.filter((d) => d.activityIds.includes(a.id));
    const fields = a.role === "controller" ? [a.dataCategories, a.dataSubjects, a.recipients, a.securityMeasures] : [a.operations, a.securityMeasures];
    if (fields.some((k) => k.state === "unknown") || (a.role === "controller" && !a.purposes.length) || (a.role === "processor" && (!a.controllerIds.length || a.controllerIds.some((id) => master.parties.find((p) => p.id === id)?.contact.state === "unknown")))) add("R-001", a.id, "rubriques", "Rubriques du registre non renseignées.");
    if (a.role === "controller") {
      for (const p of a.purposes) {
        if (p.description.state === "unknown") add("R-001", a.id, p.id, "Finalité à décrire.");
        if (p.legalBasis.state === "unknown") add("R-002", a.id, p.id, "Base légale et justification à examiner pour cette finalité.");
        if (p.retention.period.state === "unknown" || p.retention.trigger.state === "unknown") add("R-004", a.id, p.id, "Durée ou critère et événement de départ à documenter pour cette finalité.");
      }
      if (a.review.article9.state === "unknown" || a.review.article10.state === "unknown") add("R-003", a.id, "qualification", "Conditions éventuelles des articles 9 et 10 à examiner séparément de l’article 6.");
      if (a.review.collection === "unknown" || !a.purposes.length || a.purposes.some((p) => !docs.some((d) => d.category === "notice" && d.purposeIds.includes(p.id) && d.audience && d.channel && d.version && d.availability.state === "documented"))) add("R-007", a.id, "information", "Mode de collecte ou notice par finalité à documenter : public, canal, version, disponibilité.");
    }
    const relations = [...a.review.subcontractorIds, ...(a.role === "processor" ? a.controllerIds : [])];
    for (const partyId of new Set(relations)) {
      const contracts = docs.filter((d) => d.category === "contract" && d.partyIds.includes(partyId));
      if (!contracts.length) add("R-005", a.id, partyId, "Cadre contractuel de la relation déclarée à documenter.");
      else if (!contracts.some((d) => d.contractReview?.notes.every((note) => note.assessment.state === "documented" && note.evidence.state === "documented"))) {
        add("R-005", a.id, partyId, "Référence de contrat présente. Clauses, garanties et éléments de vérification à examiner.");
      }
    }
    if (a.review.transferStatus === "unknown" || a.transfers.state === "unknown") add("R-006", a.id, "transferts", "Transferts et accès à examiner, ou absence de transfert à motiver après examen.");
  }
  for (const d of master.documents) {
    const outdated = d.status !== "reviewed" || d.reviewedRevision !== master.revision || (d.reviewDue !== null && d.reviewDue <= today) || !d.activityIds.length;
    if (outdated) add("R-008", d.activityIds[0] ?? null, d.id, "Référence déclarée, échéance atteinte, périmètre absent ou dossier modifié : revue à effectuer.");
  }
  return findings;
}
export function putDocument(master: Workspace, doc: EvidenceReference, now: string): Workspace {
  return reviseWorkspace(master, master.revision, now, { documents: master.documents.some((d) => d.id === doc.id) ? master.documents.map((d) => d.id === doc.id ? doc : d) : [...master.documents, doc] });
}
export function addDecision(master: Workspace, input: { id: string; ruleId: string; activityId: string | null; author: string; justification: string; conclusion: string }, now: string): Workspace {
  return reviseWorkspace(master, master.revision, now, { decisions: [...master.decisions, { ...input, workspaceId: master.id, createdAt: now, revision: master.revision + 1, catalogVersion: CATALOG_VERSION }] });
}
export function createAction(master: Workspace, finding: Finding, input: { id: string; owner: string; due: string | null }, now: string): Workspace {
  const current = evaluateWorkspace(master, now.slice(0, 10)).find((f) => f.key === finding.key);
  if (!current) throw new PrivacyError("INVALID");
  if (master.actions.some((a) => a.findingKey === current.key)) throw new PrivacyError("COLLISION");
  const activity = master.activities.find((a) => a.id === current.activityId);
  const action: DocumentaryAction = { ...input, workspaceId: master.id, findingKey: current.key, ruleId: current.ruleId,
    activityId: current.activityId, scope: activity?.title ?? (knowledgeText(master.scope) || "Organisation").slice(0, 160),
    createdAt: now, catalogVersion: CATALOG_VERSION, reviewedRevision: master.revision + 1, closure: null };
  return reviseWorkspace(master, master.revision, now, { actions: [...master.actions, action] });
}
export function closeAction(master: Workspace, id: string, author: string, justification: string, now: string): Workspace {
  const action = master.actions.find((a) => a.id === id);
  if (!action || action.closure) throw new PrivacyError("INVALID");
  return reviseWorkspace(master, master.revision, now, { actions: master.actions.map((a) => a.id === id ? { ...a, closure: { at: now, author, justification } } : a) });
}
export function reviewNeeded(record: { catalogVersion: string; revision?: number; reviewedRevision?: number }, master: Workspace, version = CATALOG_VERSION): boolean {
  return record.catalogVersion !== version || (record.revision ?? record.reviewedRevision) !== master.revision;
}
