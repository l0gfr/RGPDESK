export const CATALOG_VERSION = "fr-eu-2026-09-22.draft-1";
export const CATALOG_STATUS = "Proposition de contrôles documentaires, sans revue juridique humaine";
const chapter = (n: number) => `https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre${n}`;
export interface DocumentaryRule {
  id: string; version: number; title: string; explanation: string; facts: string;
  result: "documentary-question"; jurisdiction: "UE / France"; nature: "product-practice";
  status: "unreviewed"; consultedAt: string; reviewedAt: null;
  applicability: string; source: string; article: string;
}
const entries = [
  ["R-001", "Rubriques du registre", "Vérifier les rubriques déclarées selon le rôle de la fiche. Aucun rôle n’est déduit d’un fournisseur.", "rôle, coordonnées, finalités, catégories, opérations, sécurité", chapter(4), "30"],
  ["R-002", "Base légale à examiner", "Une base non renseignée ouvre une question de licéité. Ce complément n’est pas une rubrique explicitement énumérée à l’article 30.", "finalité, base déclarée", chapter(2), "6"],
  ["R-003", "Données particulières et pénales", "Examiner séparément les conditions éventuelles des articles 9 et 10. Aucun classement n’est déduit des mots présents dans la fiche.", "examen article 9, examen article 10", chapter(2), "6, 9, 10"],
  ["R-004", "Conservation à documenter", "Rechercher une durée ou un critère et son événement de départ pour chaque finalité. Cela ne vérifie pas l’effacement effectif.", "finalité, durée ou critère, événement", chapter(2), "5(1)(e)"],
  ["R-005", "Cadre contractuel à documenter", "Une relation de sous-traitance déclarée appelle une référence de contrat ou d’acte. Sa présence ne valide pas ses clauses.", "relation déclarée, contrat, périmètre", chapter(4), "28"],
  ["R-006", "Transferts à examiner", "Examiner les destinations, accès et garanties, y compris les transferts ultérieurs. Aucun pays ni logo ne clôt cette question.", "état d’examen, transferts déclarés", "https://www.cnil.fr/fr/responsables-de-traitement-comment-identifier-et-traiter-des-transferts-de-donnees-hors-ue", "44–49"],
  ["R-007", "Information des personnes", "Relier une notice aux finalités, au public, au canal et au mode de collecte. Une référence ne prouve ni le contenu ni la remise.", "collecte, finalités, notice, public, canal, version, disponibilité", chapter(3), "13, 14"],
  ["R-008", "Références à réexaminer", "Une revue dépassée, une fiche modifiée ou un périmètre absent laisse une question ouverte. L’échéance est une politique interne déclarée.", "référence, périmètre, date et révision de revue", chapter(4), "24 (contrôle produit)"],
  ["R-009", "Organisation et exemptions", "Conserver une analyse motivée des questions de DPO et de périmètre. Aucun effectif ne vaut exemption automatique.", "décision motivée, périmètre, catalogue", chapter(4), "30(5), 37"],
  ["R-010", "Revue du partage", "La confirmation porte sur une projection, une révision et un destinataire précis. Toute modification impose une nouvelle préparation.", "révision, profil, destinataire, projection", chapter(4), "5(2), 24 (pratique produit)"],
] as const;
export const CATALOG: readonly DocumentaryRule[] = entries.map(([id, title, explanation, facts, source, article]) => ({
  id, title, explanation, facts, source, article, version: 1, result: "documentary-question", jurisdiction: "UE / France",
  nature: "product-practice", status: "unreviewed", consultedAt: "2026-09-22", reviewedAt: null,
  applicability: "Question documentaire générale ; régimes sectoriels et applicabilité juridique à examiner humainement.",
}));
