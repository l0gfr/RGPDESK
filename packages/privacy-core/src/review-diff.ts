import type { Knowledge, ReviewNote } from "./model";
import type { PiaContent, PiaContext } from "./pia-model";
import type { DpoContent } from "./dpo-model";
import { canonicalJson } from "./share-format.js";

export const CHANGE_AREAS = {
  context: { label: "Cadre de la mission", question: "Le périmètre et les responsabilités sur lesquels reposait la position sont-ils toujours les mêmes ?" },
  purpose: { label: "Finalités et conservation", question: "Le besoin, le fondement retenu et la conservation restent-ils justifiés au regard de ces faits ?" },
  people: { label: "Personnes et données", question: "Ces changements modifient-ils les besoins de données, l’information ou les effets sur les personnes ?" },
  flow: { label: "Opérations et circulation", question: "Les accès, destinataires, lieux et garanties correspondent-ils encore à la circulation décrite ?" },
  security: { label: "Garanties et risques", question: "Les garanties et l’appréciation des risques restent-elles étayées dans ce contexte ?" },
  evidence: { label: "Justificatifs", question: "Les versions et le périmètre des références étayent-ils toujours les arguments et réserves de la revue ?" },
  analysis: { label: "Arguments et suivi", question: "Ces nouveaux arguments ou échéances appellent-ils une autre position ou de nouvelles suites ?" },
} as const;
export type ChangeArea = keyof typeof CHANGE_AREAS;
export interface ReviewChange { key: string; subject: string; label: string; area: ChangeArea; before: string; after: string; kind: "added" | "removed" | "changed" }
interface Fact { key: string; subject: string; label: string; area: ChangeArea; value: unknown; text: string }
type Value = string | number | boolean | null | Knowledge | string[];
const statusLabels: Readonly<Record<string, string>> = {
  unknown: "À documenter", controller: "Responsable du traitement", processor: "Sous-traitant", draft: "Brouillon", active: "En cours", archived: "Archivé",
  direct: "Directe", indirect: "Indirecte", both: "Directe et indirecte", "none-reviewed": "Aucun après examen", identified: "Identifiés",
  declared: "Déclarée", reviewed: "Revue déclarée", internal: "Interne", restricted: "Restreinte", contract: "Contrat", notice: "Notice", policy: "Politique", analysis: "Analyse", other: "Autre",
  planned: "Prévue", implemented: "Mise en œuvre déclarée", verified: "Vérification déclarée", yes: "Oui", no: "Non", required: "Jugée requise", voluntary: "Volontaire", "not-required": "Jugée non requise",
  general: "Général", special: "Spécial",
};
function display(value: Value): string {
  if (value === null || value === "") return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.join(" · ") || "Aucun lien";
  if (typeof value === "object") return value.state === "documented" ? value.value : "À documenter";
  return String(value);
}
function facts() {
  const rows: Fact[] = [];
  const add = (key: string, subject: string, label: string, area: ChangeArea, value: Value, text = display(value)) => rows.push({ key, subject, label, area, value, text });
  const choice = (key: string, subject: string, label: string, area: ChangeArea, value: string) => add(key, subject, label, area, value, statusLabels[value] ?? value);
  const links = (key: string, subject: string, label: string, area: ChangeArea, ids: string[], names: Map<string, string>) => add(key, subject, label, area, [...ids].sort(), ids.map((id) => names.get(id) ?? "Lien hors de cette fiche").sort().join(" · ") || "Aucun lien");
  const notes = (key: string, subject: string, list: ReviewNote[], area: ChangeArea = "analysis") => {
    for (const [index, note] of list.entries()) for (const [field, label] of Object.entries({ facts: "Faits", evidence: "Éléments de preuve", objections: "Objections", assessment: "Appréciation", followUp: "Suites" }) as [keyof Omit<ReviewNote, "questionId">, string][]) {
      add(`${key}/${note.questionId}/${field}`, subject, `Question ${index + 1} · ${label}`, field === "evidence" ? "evidence" : area, note[field]);
    }
  };
  return { rows, add, choice, links, notes };
}
function contextFacts(contexts: PiaContext[], organization: PiaContext["organization"]): Fact[] {
  const f = facts();
  for (const [key, label] of Object.entries({ name: "Organisme", contact: "Contact", dpo: "DPO", representatives: "Représentants" }) as [keyof typeof organization, string][]) f.add(`organization/${key}`, "Organisation", label, "context", organization[key]);
  for (const c of contexts) {
    const a = c.activity, base = `activity/${a.id}`, subject = a.title;
    f.add(base, subject, "Fiche liée", "context", a.title);
    f.add(`${base}/scope`, subject, "Périmètre", "context", c.scope);
    f.add(`${base}/jurisdiction`, subject, "Juridiction examinée", "context", c.jurisdiction);
    f.choice(`${base}/role`, subject, "Rôle", "context", a.role);
    f.choice(`${base}/status`, subject, "État de la fiche", "context", a.status);
    f.add(`${base}/dataSubjects`, subject, "Personnes concernées", "people", a.dataSubjects);
    f.add(`${base}/dataCategories`, subject, "Catégories de données", "people", a.dataCategories);
    f.add(`${base}/recipients`, subject, "Destinataires", "flow", a.recipients);
    f.add(`${base}/transfers`, subject, "Transferts", "flow", a.transfers);
    f.add(`${base}/securityMeasures`, subject, "Mesures de sécurité", "security", a.securityMeasures);
    f.add(`${base}/internalNotes`, subject, "Notes internes", "analysis", a.internalNotes);
    f.add(`${base}/operations`, subject, "Opérations détaillées", "flow", a.analysis.operations);
    f.add(`${base}/access`, subject, "Accès", "flow", a.analysis.access);
    f.add(`${base}/analysisMethod`, subject, "Version de la trame RGPD", "analysis", a.analysis.methodVersion);
    f.notes(`${base}/notes`, `${subject} · Analyse RGPD`, a.analysis.notes);
    f.add(`${base}/article9`, subject, "Examen des données sensibles", "people", a.review.article9);
    f.add(`${base}/article10`, subject, "Examen des données pénales", "people", a.review.article10);
    f.choice(`${base}/collection`, subject, "Collecte", "flow", a.review.collection);
    f.choice(`${base}/transferStatus`, subject, "Examen des transferts", "flow", a.review.transferStatus);
    const parties = new Map(c.parties.map((p) => [p.id, p.name])), systems = new Map(c.systems.map((s) => [s.id, s.name]));
    f.links(`${base}/participantIds`, subject, "Intervenants liés", "flow", a.participantIds, parties);
    f.links(`${base}/subcontractorIds`, subject, "Sous-traitants liés", "flow", a.review.subcontractorIds, parties);
    f.links(`${base}/systemIds`, subject, "Systèmes liés", "flow", a.systemIds, systems);
    if (a.role === "controller") for (const p of a.purposes) {
      const key = `${base}/purpose/${p.id}`, title = `${subject} · Finalité`;
      f.add(`${key}/description`, title, "Objectif poursuivi", "purpose", p.description);
      f.add(`${key}/legalBasis`, title, "Fondement juridique", "purpose", p.legalBasis);
      f.add(`${key}/period`, title, "Durée de conservation", "purpose", p.retention.period);
      f.add(`${key}/trigger`, title, "Point de départ de la durée", "purpose", p.retention.trigger);
    } else {
      f.links(`${base}/controllerIds`, subject, "Responsables liés", "context", a.controllerIds, parties);
      f.add(`${base}/processorOperations`, subject, "Catégories d’opérations", "flow", a.operations);
      f.add(`${base}/instructions`, subject, "Instructions", "context", a.instructions);
    }
    for (const [i, flow] of a.flows.entries()) for (const [field, label] of Object.entries({ source: "Origine", destination: "Destination", operation: "Opération", data: "Données", channel: "Canal", location: "Lieu", access: "Accès" }) as [keyof Omit<typeof flow, "id">, string][]) f.add(`${base}/flow/${flow.id}/${field}`, `${subject} · Flux ${i + 1}`, label, "flow", flow[field]);
    for (const p of c.parties) { f.add(`${base}/party/${p.id}`, p.name, "Intervenant", "flow", p.name); f.add(`${base}/party/${p.id}/contact`, p.name, "Contact de l’intervenant", "flow", p.contact); }
    for (const s of c.systems) { f.add(`${base}/system/${s.id}`, s.name, "Système", "flow", s.name); f.add(`${base}/system/${s.id}/description`, s.name, "Description du système", "flow", s.description); }
    for (const d of c.documents) {
      const key = `${base}/document/${d.id}`;
      for (const [field, label] of Object.entries({ title: "Titre", scope: "Périmètre couvert", version: "Version", declaredAuthor: "Auteur déclaré", internalRef: "Où retrouver le document", publicReference: "Référence partageable", reservations: "Réserves", reviewedRevision: "Révision examinée", reviewedAt: "Date de revue", reviewDue: "Prochain examen", audience: "Public", channel: "Canal", availability: "Disponibilité" }) as [keyof Pick<typeof d, "title" | "scope" | "version" | "declaredAuthor" | "internalRef" | "publicReference" | "reservations" | "reviewedRevision" | "reviewedAt" | "reviewDue" | "audience" | "channel" | "availability">, string][]) f.add(`${key}/${field}`, d.title, label, "evidence", d[field]);
      for (const field of ["category", "sensitivity", "status"] as const) f.choice(`${key}/${field}`, d.title, { category: "Catégorie", sensitivity: "Sensibilité", status: "État déclaré" }[field], "evidence", d[field]);
      f.links(`${key}/partyIds`, d.title, "Intervenants couverts", "evidence", d.partyIds, parties);
      f.links(`${key}/activityIds`, d.title, "Activités couvertes", "evidence", d.activityIds, new Map([[a.id, a.title]]));
      f.links(`${key}/purposeIds`, d.title, "Finalités couvertes", "evidence", d.purposeIds, new Map(a.role === "controller" ? a.purposes.map((p) => [p.id, display(p.description)]) : []));
      f.add(`${key}/contract`, d.title, "Revue contractuelle", "evidence", d.contractReview?.methodVersion ?? null);
      if (d.contractReview) f.notes(`${key}/contractNotes`, `${d.title} · Contrat`, d.contractReview.notes, "evidence");
    }
  }
  return f.rows;
}
function compare(before: Fact[], after: Fact[]): ReviewChange[] {
  const left = new Map(before.map((f) => [f.key, f])), right = new Map(after.map((f) => [f.key, f]));
  const changes: ReviewChange[] = [];
  for (const key of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(key), b = right.get(key);
    if (a && b && canonicalJson(a.value) === canonicalJson(b.value)) continue;
    const fact = b ?? a!;
    // A link's identity may change while its human-readable label is identical.
    const afterText = a && b && a.text === b.text ? `${b.text} (${Array.isArray(a.value) && Array.isArray(b.value) ? "composition des liens modifiée" : "état de renseignement modifié"})` : b?.text ?? "Retiré du périmètre";
    changes.push({ key, subject: fact.subject, label: fact.label, area: fact.area, before: a?.text ?? "Absent de la revue", after: afterText, kind: !a ? "added" : !b ? "removed" : "changed" });
  }
  return changes;
}
export function compareReviewContexts(before: PiaContext[], after: PiaContext[], oldOrganization: PiaContext["organization"], organization: PiaContext["organization"]): ReviewChange[] {
  // A shared reference can appear in several activity snapshots. Show an identical
  // modification once, but retain additions/removals and differing historical values.
  const seen = new Set<string>();
  return compare(contextFacts(before, oldOrganization), contextFacts(after, organization)).filter((change) => {
    if (change.kind !== "changed" || !/^activity\/[^/]+\/(document|party|system)\//.test(change.key)) return true;
    const sharedKey = change.key.replace(/^activity\/[^/]+\//, "");
    const signature = canonicalJson([sharedKey, change.subject, change.label, change.before, change.after]);
    if (seen.has(signature)) return false;
    seen.add(signature); return true;
  });
}
// Review arguments are compared separately from shared inventory facts. No synchronization or legal decision is performed.
export function compareReviewContent(before: PiaContent | DpoContent, after: PiaContent | DpoContent): ReviewChange[] {
  const rows = (content: PiaContent | DpoContent) => {
    const f = facts();
    const riskNames = new Map("risks" in content ? content.risks.map((r) => [r.id, r.title]) : []);
    const walk = (value: unknown, key: string, subject: string, label: string) => {
      if (value === null || typeof value !== "object") {
        const primitive = value as string | number | boolean | null;
        const field = key.split("/").at(-1)!;
        const enumField = ["role", "regime", "answer", "screeningDecision", "status", "residualHigh"].includes(field);
        f.add(key, subject, label, "analysis", primitive, enumField && typeof primitive === "string" ? statusLabels[primitive] ?? primitive : display(primitive)); return;
      }
      if ("state" in value) { f.add(key, subject, label, "analysis", value as Knowledge); return; }
      if (Array.isArray(value)) {
        // Empty collections of records have no facts. Only these primitive lists
        // carry an explicit empty value, such as a measure with no risk links.
        if (!value.length && !key.endsWith("/riskIds") && !key.endsWith("/holidays")) return;
        if (value.every((v) => typeof v === "string")) {
          if (key.endsWith("/riskIds")) f.links(key, subject, label, "security", value, riskNames);
          else f.add(key, subject, label, "analysis", [...value].sort());
          return;
        }
        for (const [i, item] of value.entries()) {
          const identity = item.id ?? item.questionId ?? item.criterionId;
          walk(item, `${key}/${identity}`, `${subject} · ${label} ${i + 1}`, label);
        }
        return;
      }
      for (const [field, item] of Object.entries(value)) {
        if (["id", "questionId", "criterionId"].includes(field)) continue;
        walk(item, `${key}/${field}`, ["necessity", "breach", "rights"].includes(field) && item && typeof item === "object" && !("state" in item) ? `${subject} · ${CONTENT_LABELS[field] ?? field}` : subject, CONTENT_LABELS[field] ?? "Information de l’analyse");
      }
    };
    walk(content, "content", "Analyse et suivi", "Analyse");
    return f.rows;
  };
  return compare(rows(before), rows(after));
}
const CONTENT_LABELS: Readonly<Record<string, string>> = {
  necessity: "Nécessité et proportionnalité", breach: "Incident", facts: "Faits", evidence: "Éléments de preuve", objections: "Objections", assessment: "Appréciation", followUp: "Suites", notes: "Question", reviewDue: "Prochain réexamen",
  receivedOn: "Réception de la demande", regime: "Régime du délai", calendarConfirmed: "Calendrier confirmé", holidays: "Jours exclus", extensionMonths: "Mois de prolongation", extensionReason: "Motif de prolongation", extensionNotifiedOn: "Information sur la prolongation", manualDue: "Échéance choisie", manualReason: "Motif du délai choisi",
  detectedAt: "Détection", awarenessAt: "Prise de connaissance", role: "Rôle", screening: "Critère", answer: "Appréciation du critère", reason: "Motivation", applicability: "Champ applicable", screeningDecision: "Réalisation de l’AIPD", screeningReason: "Motif de réalisation", principles: "Principe", operations: "Opérations examinées", access: "Accès examinés", methodVersion: "Version de la trame",
  alternatives: "Alternative", description: "Description", purpose: "Finalité", effectiveness: "Efficacité", impacts: "Effets sur les personnes", choice: "Choix motivé", evaluationMethod: "Méthode d’appréciation", risks: "Scénario", title: "Intitulé", event: "Événement", people: "Personnes", rights: "Droits concernés", threats: "Sources de risque", supports: "Supports", existingMeasures: "Mesures existantes", initialSeverity: "Gravité initiale", initialLikelihood: "Vraisemblance initiale", initialReason: "Justification initiale", residualSeverity: "Gravité résiduelle", residualLikelihood: "Vraisemblance résiduelle", residualReason: "Justification résiduelle", residualHigh: "Risque résiduel élevé", measures: "Mesure", riskIds: "Scénarios liés", owner: "Responsable", due: "Échéance", status: "État de la mesure", failure: "Défaillance de la garantie", dpoAdvice: "Avis du DPO", peopleConsultation: "Consultation des personnes", authorityConsultation: "Consultation préalable", monitoring: "Suivi",
};
