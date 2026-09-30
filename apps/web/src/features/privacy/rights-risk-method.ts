/** Editorial aids. No automatic applicability, consequence, severity or risk calculation. */
export type RightsRiskAngle = "availability" | "integrity" | "confidentiality";

export const RIGHTS_RISK_METHOD = {
  source: "https://www.inthemis.fr/ressources/supports/Esiea_Ethique_202601_v2.12.pdf#page=199",
  reference: "Estelle De Marco, support ESIEA, janvier 2026, v2.12, p. 199–201",
};

export const RIGHTS_RISK_ANGLES: readonly { id: RightsRiskAngle; title: string; criterion: string; question: string }[] = [
  { id: "availability", title: "Exercice empêché", criterion: "Disponibilité de l’exercice de la liberté", question: "La personne pourrait-elle ne plus pouvoir exercer cette liberté ou renoncer à l’exercer ?" },
  { id: "integrity", title: "Exercice réduit ou altéré", criterion: "Intégrité de l’exercice de la liberté", question: "La personne pourrait-elle exercer cette liberté dans des conditions dégradées ou modifier son comportement sous la contrainte ?" },
  { id: "confidentiality", title: "Exercice révélé", criterion: "Confidentialité de l’exercice de la liberté", question: "L’exercice de cette liberté pourrait-il être révélé alors qu’il devrait rester confidentiel, y compris par un accès prévu ?" },
];

export const CNIL_CONSEQUENCES_SOURCE = {
  source: "https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-3-fr-basesdeconnaissances.pdf#page=8",
  reference: "CNIL, PIA : bases de connaissances, février 2018, §1.4, p. 3–4 (PDF p. 8–9)",
};

export const CONSEQUENCE_PROMPTS = [
  { title: "Corporelles", question: "Quels dommages physiques la personne pourrait-elle subir ? Quelles difficultés aurait-elle à y faire face ?", icon: "impact" },
  { title: "Matérielles", question: "Quelles pertes financières ou difficultés d’accès à un emploi, un logement ou un service pourrait-elle subir ?", icon: "briefcase" },
  { title: "Morales", question: "Quelles conséquences sur sa réputation, ses relations ou son état psychologique pourrait-elle subir ?", icon: "parties" },
] as const;
