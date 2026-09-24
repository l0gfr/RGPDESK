// Presence of declared facts only. No legal conclusion, weighting, inferred fact or private lookup.
export const PROGRESS_STATES = {
  documented: { label: "Renseigné", plural: "Rubriques renseignées", symbol: "✓" },
  partial: { label: "Partiel", plural: "Rubriques partielles", symbol: "◐" },
  missing: { label: "À renseigner", plural: "Rubriques à renseigner", symbol: "○" },
};
export const PROGRESS_NOTE = "Six repères de saisie par activité. Renseigné signifie qu’un texte a été saisi, sans vérification de son contenu. Les fondements juridiques, analyses, flux et justificatifs ne sont pas évalués ici. Aucun score de conformité.";
function checkpoint(label, icon, fields, step) {
  const total = Math.max(1, fields.length), documented = fields.filter(Boolean).length;
  return { label, icon, step, documented, total, state: documented === total ? "documented" : documented ? "partial" : "missing" };
}
const has = value => value?.state === "documented" && value.value.trim().length > 0;
export function activityProgress(activity) {
  return [
    checkpoint(activity.role === "controller" ? "Finalités" : "Opérations", "target", activity.role === "controller" ? activity.purposes.map(p => has(p.description)) : [has(activity.operations)], 1),
    checkpoint("Personnes", "parties", [has(activity.dataSubjects)], 2),
    checkpoint("Données", "documents", [has(activity.dataCategories)], 2),
    checkpoint("Destinataires", "transfer", [has(activity.recipients)], 2),
    checkpoint(activity.role === "controller" ? "Conservation" : "Clients responsables", "clock", activity.role === "controller" ? activity.purposes.flatMap(p => [has(p.retention.period), has(p.retention.trigger)]) : [activity.controllerIds.length > 0], 1),
    checkpoint("Protections", "shield", [has(activity.securityMeasures), has(activity.transfers)], 3),
  ];
}
export function registerProgress(activities) {
  const rows = activities.map(activity => ({ title: activity.title, checkpoints: activityProgress(activity) }));
  const counts = { documented: 0, partial: 0, missing: 0 };
  for (const row of rows) for (const point of row.checkpoints) counts[point.state]++;
  return { rows, counts, total: rows.length * 6 };
}
