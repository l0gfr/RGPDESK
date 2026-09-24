import { dataGroupRows, activityFacts, purposeRetention } from "./data-groups";
import { createPiaReportBody, serializePiaReport } from "./pia-report";
import { PIA_REPORT_CSS } from "./pia-report-style";
export type { PiaReportNode } from "./pia-report";
import { type Knowledge, type Workspace } from "./model";
import type { PiaPublication } from "./dpo-model";
import { piaContext } from "./pia";
import { assertWorkspace, PrivacyError } from "./validation";
import { reviseWorkspace } from "./commands";

export const PIA_SHARE_SECTIONS = { context: "Traitement et périmètre", inventory: "Groupes de données, flux et minimisation", principles: "Examen des principes RGPD", necessity: "Appréciations de nécessité", alternatives: "Alternatives examinées", risks: "Scénarios et niveaux déclarés", measures: "Mesures et suivi", opinions: "Avis et consultations", decision: "Revue humaine conservée" } as const;
export type PiaShareSection = keyof typeof PIA_SHARE_SECTIONS;
export interface PiaShareOptions { piaId: string; reviewId: string | null; sections: PiaShareSection[]; recipient: string; scope: string; reservations: string }
const value = (k: Knowledge) => k.state === "documented" ? k.value : "À documenter";
const necessityLabels: Record<string, string> = { objective: "Résultat recherché", lawfulness: "Fondement juridique", effectiveness: "Utilité réelle", alternatives: "Autres moyens", minimisation: "Étendue du traitement", rights: "Effets sur les personnes", safeguards: "Garanties", conclusion: "Position et suites" };
const principleLabels: Record<string, string> = { scope: "Périmètre", governance: "Gouvernance", lawfulness: "Licéité", transparency: "Information", rights: "Droits", processors: "Sous-traitants", transfers: "Transferts", accuracy: "Exactitude" };
// Explicit projection only. Never serialize the workspace, context or review object.
export function projectPiaPublication(master: Workspace, options: PiaShareOptions, id: string, now: string): PiaPublication {
  assertWorkspace(master);
  const pia = master.impactAssessments.find((p) => p.id === options.piaId);
  if (!pia || pia.scope === "risks" || !options.recipient.trim() || !options.scope.trim() || !options.sections.length || new Set(options.sections).size !== options.sections.length
    || options.sections.some((s) => !Object.hasOwn(PIA_SHARE_SECTIONS, s))) throw new PrivacyError("INVALID");
  if (options.sections.includes("measures") && !options.sections.includes("risks")) throw new PrivacyError("INVALID");
  const review = options.reviewId ? pia.reviews.find((r) => r.id === options.reviewId) : null;
  if ((options.reviewId && !review) || (options.sections.includes("decision") && !review)) throw new PrivacyError("INVALID");
  const content = review?.content ?? pia.content, context = review?.context ?? piaContext(master, pia.activityId);
  const rows: PiaPublication["rows"] = [];
  const row = (section: PiaShareSection, label: string, text: string | Knowledge) => rows.push({ section: PIA_SHARE_SECTIONS[section], label, value: typeof text === "string" ? text : value(text) });
  for (const section of options.sections) {
    if (section === "context") {
      row(section, "Organisation", context.organization.name); row(section, "Activité", context.activity.title);
      row(section, "Rôle déclaré", context.activity.role === "controller" ? "Responsable de traitement" : "Sous-traitant contributeur");
      row(section, "Personnes", activityFacts(context.activity, context).dataSubjects); row(section, "Données", activityFacts(context.activity, context).dataCategories); row(section, "Destinataires", activityFacts(context.activity, context).recipients);
      row(section, "Opérations", content.necessity.operations); row(section, "Accès", content.necessity.access);
      row(section, "Champ examiné", content.applicability); row(section, "Motif de réalisation", content.screeningReason);
      if (context.activity.role === "controller") for (const [i, p] of context.activity.purposes.entries()) {
        row(section, `Finalité ${i + 1}`, p.description); row(section, `Fondement ${i + 1}`, p.legalBasis); row(section, `Conservation ${i + 1}`, purposeRetention(context.activity, p).period); row(section, `Déclencheur ${i + 1}`, purposeRetention(context.activity, p).trigger);
      }
    }
    if (section === "inventory") for (const group of dataGroupRows(context.activity, context)) for (const field of group.rows) row(section, `${group.group} · ${field.label}`, field.value);
    if (section === "necessity" || section === "principles") (section === "necessity" ? content.necessity.notes : content.principles).forEach((n) => { const label = (section === "necessity" ? necessityLabels : principleLabels)[n.questionId]!; row(section, label, n.assessment); row(section, `${label} : suites`, n.followUp); });
    if (section === "alternatives") for (const [i, a] of content.alternatives.entries()) {
      for (const [key, label] of [["purpose", "Finalité"], ["description", "Option"], ["effectiveness", "Efficacité et limites"], ["impacts", "Effets"], ["choice", "Choix motivé"]] as const) row(section, `Option ${i + 1} · ${label}`, a[key]);
    }
    if (section === "risks") {
      row(section, "Méthode d’appréciation", content.evaluationMethod);
      for (const [i, r] of content.risks.entries()) {
        row(section, `Risque ${i + 1}`, r.title);
        row(section, `Risque ${i + 1} · Risque résiduel élevé déclaré`, { unknown: "À apprécier", yes: "Oui", no: "Non" }[r.residualHigh]);
        for (const [key, label] of [["event", "Événement"], ["people", "Personnes"], ["rights", "Droits"], ["impacts", "Conséquences"], ["initialReason", "Appréciation initiale"], ["residualReason", "Appréciation résiduelle"]] as const) row(section, `Risque ${i + 1} · ${label}`, r[key]);
        row(section, `Risque ${i + 1} · Niveaux déclarés`, `Gravité initiale : ${r.initialSeverity === "unknown" ? "non appréciée" : r.initialSeverity} ; vraisemblance initiale : ${r.initialLikelihood === "unknown" ? "non appréciée" : r.initialLikelihood} ; gravité résiduelle : ${r.residualSeverity === "unknown" ? "non appréciée" : r.residualSeverity} ; vraisemblance résiduelle : ${r.residualLikelihood === "unknown" ? "non appréciée" : r.residualLikelihood}.`);
      }
    }
    if (section === "measures") for (const [i, m] of content.measures.entries()) {
      row(section, `Mesure ${i + 1}`, m.description); row(section, `Mesure ${i + 1} · Responsable`, m.owner);
      row(section, `Mesure ${i + 1} · État déclaré`, { planned: "Prévue", implemented: "Mise en œuvre déclarée", verified: "Vérification déclarée" }[m.status]);
      row(section, `Mesure ${i + 1} · En cas de défaillance`, m.failure);
      row(section, `Mesure ${i + 1} · Échéance`, m.due ?? "À fixer"); row(section, `Mesure ${i + 1} · Efficacité`, m.effectiveness);
      row(section, `Mesure ${i + 1} · Scénarios liés`, m.riskIds.map((id) => `Risque ${content.risks.findIndex((r) => r.id === id) + 1}`).join(", ") || "À documenter");
    }
    if (section === "opinions") { row(section, "Avis du DPO", content.dpoAdvice); row(section, "Consultation des personnes", content.peopleConsultation); row(section, "Consultation préalable de l’autorité", content.authorityConsultation); row(section, "Suivi", content.monitoring); row(section, "Réexamen", content.reviewDue ?? "À fixer"); }
    if (section === "decision" && review) { row(section, "Auteur déclaré", review.author); row(section, "Date déclarée", review.at); row(section, "Position déclarée", { proceed: "Poursuivre selon la décision déclarée", rework: "Réexaminer", stop: "Arrêter", "refer-authority": "Saisir l’autorité" }[review.outcome]); row(section, "Motivation", review.reason); }
    if (!rows.some((r) => r.section === PIA_SHARE_SECTIONS[section])) row(section, "Contenu", "À documenter");
  }
  const p: PiaPublication = { id, workspaceId: master.id, piaId: pia.id, revision: master.revision, createdAt: now, recipient: options.recipient.trim(), scope: options.scope.trim(), reservations: options.reservations.trim(), sourceLabel: review ? `Revue conservée du ${review.at}` : "Étude de travail non figée par une revue", rows };
  // Validate the projection, all bounds and relationships before any preview or persistence.
  assertWorkspace({ ...master, revision: master.revision + 1, updatedAt: now, piaPublications: [...master.piaPublications, p] });
  return p;
}
export function recordPiaPublication(master: Workspace, p: PiaPublication, expectedRevision: number, now: string): Workspace {
  if (p.workspaceId !== master.id || p.revision !== expectedRevision || p.createdAt > now) throw new PrivacyError("CONFLICT");
  return reviseWorkspace(master, expectedRevision, now, { piaPublications: [...master.piaPublications, p] });
}
// Frozen publications retain their selected values. The presentation is rebuilt
// when downloaded; no workspace lookup or additional field enters this renderer.
export function piaReportBody(publication: PiaPublication) {
  return createPiaReportBody(publication, PIA_SHARE_SECTIONS);
}
export async function renderPiaPublication(publication: PiaPublication): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(PIA_REPORT_CSS)));
  const hash = btoa(String.fromCharCode(...digest));
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><meta name="rgpdesk-renderer" content="rgpdesk-pia-folio-1"><title>Dossier AIPD · RGPDESK</title><style>${PIA_REPORT_CSS}</style></head>${serializePiaReport(piaReportBody(publication))}</html>`;
}
