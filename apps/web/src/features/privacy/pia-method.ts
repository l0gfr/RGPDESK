import { RGPD_OFFICIAL, type ReviewQuestion } from "./review-methods";
export const PIA_SOURCES = {
  law: RGPD_OFFICIAL,
  criteria: "https://www.cnil.fr/sites/default/files/atoms/files/wp248_rev.01_fr.pdf",
  method: "https://www.cnil.fr/sites/cnil/files/atoms/files/cnil-pia-1-fr-methode.pdf",
  models: "https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-2-fr-modeles.pdf",
  lists: "https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd",
  course: "https://www.inthemis.fr/ressources/supports/Esiea_Ethique_202601_v2.12.pdf",
} as const;
export const SCREENING_LABELS: Record<string, string> = {
  evaluation: "Évaluation ou notation des personnes, dont le profilage",
  automated: "Décision automatisée produisant un effet juridique ou similaire significatif",
  monitoring: "Surveillance systématique",
  sensitive: "Données sensibles ou hautement personnelles",
  scale: "Traitement à grande échelle",
  matching: "Croisement ou combinaison d’ensembles de données",
  vulnerable: "Personnes vulnérables",
  innovation: "Usage innovant ou nouvelle solution technologique ou organisationnelle",
  exclusion: "Obstacle à l’exercice d’un droit, à un service ou à un contrat",
};
const question = (id: string, title: string, prompt: string, evidence: string, reference: string): ReviewQuestion => ({ id, title, question: prompt, evidence, reference, source: RGPD_OFFICIAL, nature: "Texte du RGPD ; questions rédigées par RGPDESK · portée UE/France" });
export const PIA_PRINCIPLE_QUESTIONS: readonly ReviewQuestion[] = [
  question("scope", "Délimiter l’étude", "Quelles opérations, finalités, personnes, données et zones géographiques cette AIPD couvre-t-elle ? Décrivez les usages exclus, les étapes du cycle de vie et les codes de conduite approuvés éventuellement applicables.", "Fiche du registre, flux, inventaire des supports, périmètre et version du projet.", "RGPD · article 35 §7 a) et §8"),
  question("governance", "Organiser l’examen", "Qui porte le traitement, qui contribue à l’étude et qui décidera ? Comment le DPO dispose-t-il de l’information, des moyens et de l’indépendance nécessaires ?", "Mandat de l’étude, rôles, ressources et circuit de décision.", "RGPD · articles 35 §2, 38 et 39"),
  question("lawfulness", "Examiner la licéité par finalité", "Quel fondement juridique et quelles conditions justifient chaque finalité ? Si le consentement est retenu, comment ses conditions et son retrait sont-ils assurés ? Examinez séparément les données des articles 9 et 10 et les usages ultérieurs.", "Analyse juridique motivée, textes, instructions, examen des conditions réellement réunies.", "RGPD · articles 5 à 10"),
  question("transparency", "Rendre le traitement compréhensible", "Que comprennent réellement les personnes de la collecte, des usages, des destinataires et des conséquences ? Vérifiez le moment, le canal et l’accessibilité de l’information ; motivez toute exception invoquée.", "Mentions versionnées, parcours d’information et résultats de tests de compréhension disponibles.", "RGPD · articles 12 à 14"),
  question("rights", "Rendre les droits exerçables", "Comment une personne exerce-t-elle les droits applicables, conteste-t-elle un résultat ou obtient-elle une intervention humaine lorsque requise ? Examinez aussi les obstacles pratiques et les exceptions motivées.", "Procédures d’accès, rectification, effacement, limitation, portabilité, opposition et examen des décisions automatisées.", "RGPD · articles 15 à 22"),
  question("processors", "Examiner les prestataires et les accès", "Le contrat et les garanties réelles encadrent-ils les opérations, les accès, les sous-traitants ultérieurs et l’assistance à l’AIPD ? Reliez votre revue des clauses aux vérifications réalisées.", "Revue article 28, habilitations, résultats de contrôles, réserves et actions contractuelles.", "RGPD · articles 28, 29 et 32"),
  question("transfers", "Examiner les transferts", "Quels transferts ou accès depuis un pays tiers existent ? Pour chacun, documentez le régime applicable, le mécanisme examiné, ses conditions et les mesures complémentaires nécessaires, sans déduire la licéité du seul contrat.", "Carte des flux, pays, destinataires, analyse du transfert et références vérifiables.", "RGPD · articles 44 à 49"),
  question("accuracy", "Maîtriser la qualité et la conservation", "Comment l’exactitude, la mise à jour et la suppression sont-elles assurées en pratique ? Justifiez les durées et leurs déclencheurs par finalité, y compris les copies, traces et archives.", "Règles documentées, tests de correction et de purge, traitement des exceptions.", "RGPD · article 5 §1 d), e) et §2"),
];
export const PIA_STEPS = ["Déclenchement", "Contexte & droits", "Nécessité", "Risques humains", "Mesures", "Avis & décision", "Dossier & historique"];
export const PIA_OUTCOMES = { rework: "Réexaminer le projet", stop: "Renoncer au projet", "refer-authority": "Préparer une consultation préalable", proceed: "Poursuite décidée par le responsable" } as const;
export const PIA_LEVELS = { unknown: "Non apprécié", "1": "1 · Négligeable", "2": "2 · Limité", "3": "3 · Important", "4": "4 · Maximal" } as const;
export const PIA_RISK_FIELDS = {
  event: "Événement redouté", people: "Personnes exposées et vulnérabilités", rights: "Droits et libertés affectés", impacts: "Conséquences concrètes pour les personnes",
  threats: "Sources de risque et scénario", supports: "Supports, opérations et faiblesses", existingMeasures: "Mesures déjà en place", initialReason: "Justification de l’appréciation initiale", residualReason: "Justification de l’appréciation résiduelle",
} as const;
export const PIA_ALTERNATIVE_FIELDS = { purpose: "Finalité et opérations concernées", description: "Option étudiée", effectiveness: "Efficacité attendue et incertitudes", impacts: "Effets sur les droits et libertés", evidence: "Éléments de comparaison", choice: "Choix motivé et objections" } as const;
export const PIA_MEASURE_FIELDS = { description: "Garantie et effet attendu", owner: "Responsable de la mesure", evidence: "Preuve de mise en œuvre", effectiveness: "Résultat de la vérification", failure: "Défaillance possible et suivi" } as const;
