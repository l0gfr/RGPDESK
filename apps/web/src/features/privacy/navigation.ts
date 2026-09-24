// Generic sections only. Never encode client names, object IDs, searches or form values.
export const PRIVACY_ROUTES = {
  overview: ["bureau", "Ma mission"], register: ["registre", "Registre"], flows: ["cartographie", "Cartographie"],
  risks: ["risques", "Risques & mesures"], analysis: ["analyse", "Analyse RGPD"], pia: ["aipd", "AIPD / PIA"], dpo: ["dossiers-dpo", "Dossiers DPO"],
  organization: ["organisation", "Organisation"], parties: ["intervenants", "Intervenants"], systems: ["systemes", "Systèmes"],
  documents: ["documents", "Documents"], actions: ["actions", "Actions & décisions"], delivery: ["partager", "Partager un dossier"],
  "pia-sharing": ["restitution-aipd", "Restitution AIPD"], backup: ["sauvegarde", "Sauvegarde"], import: ["importer-csv", "Importer un CSV"],
} as const;
export type PrivacyPanel = keyof typeof PRIVACY_ROUTES;
export function privacyAnchor(panel: PrivacyPanel, demo: boolean): string {
  return `#${demo ? "demo/" : ""}${PRIVACY_ROUTES[panel][0]}`;
}
export function parsePrivacyAnchor(hash: string): { panel: PrivacyPanel; demo: boolean } | null {
  const match = /^#(demo\/)?([a-z-]+)$/.exec(hash);
  if (!match) return null;
  const panel = (Object.keys(PRIVACY_ROUTES) as PrivacyPanel[]).find(p => PRIVACY_ROUTES[p][0] === match[2]);
  return panel ? { panel, demo: !!match[1] } : null;
}
