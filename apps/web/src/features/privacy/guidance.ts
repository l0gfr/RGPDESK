/** Editorial prompts only. These examples never become legal or retention defaults. */
export const startingPoints = [
  { id: "recruitment", title: "Gestion des candidatures", icon: "parties", team: "Ressources humaines, personnes qui recrutent", question: "Que devient une candidature, de sa réception à la décision ?", prepare: "Formulaire de candidature, notice aux candidats, accès à l’outil de recrutement.", prompt: "Distinguez le recrutement pour un poste de la constitution d’un vivier. Qui reçoit les candidatures et qui peut les consulter ?" },
  { id: "staff", title: "Administration du personnel", icon: "organization", team: "Ressources humaines, paie, direction", question: "Quelles informations sont utilisées pour gérer la relation de travail ?", prepare: "Liste des outils RH, procédure de paie, notice aux salariés, contrats des prestataires.", prompt: "Délimitez l’activité décrite : gestion administrative, paie ou suivi du temps. Plusieurs objectifs peuvent demander des fiches distinctes." },
  { id: "customers", title: "Gestion de la relation client", icon: "folder", team: "Équipe commerciale, service client", question: "Comment suit-on un client, de sa demande à la fin de la relation ?", prepare: "Formulaires, champs du CRM, notice client, liste des personnes et prestataires qui y accèdent.", prompt: "Séparez le suivi de la relation client d’une éventuelle prospection. Décrivez les catégories de données réellement utilisées." },
  { id: "members", title: "Gestion des adhésions", icon: "register", team: "Secrétariat, trésorerie, responsables de l’association", question: "Comment sont gérées les inscriptions et les renouvellements ?", prepare: "Bulletin d’adhésion, notice aux adhérents, outils utilisés et règles d’accès.", prompt: "Décrivez les informations demandées aux adhérents et les destinataires. Ne recopiez pas le fichier nominatif des membres." },
  { id: "contact", title: "Gestion des demandes de contact", icon: "delivery", team: "Accueil, communication, équipe qui répond", question: "Qui reçoit les demandes et comment leur réponse est-elle suivie ?", prepare: "Formulaire en ligne, boîte de réception, notice affichée et prestataire du site.", prompt: "Suivez une demande fictive jusqu’à sa clôture. Une inscription à une lettre d’information constitue un autre usage à examiner." },
  { id: "service", title: "Prestation pour un client", icon: "systems", team: "Responsable de la prestation, équipe technique, interlocuteur client", question: "Quelles opérations réalisez-vous sur les données confiées par votre client ?", prepare: "Contrat, instructions du client, liste des outils et des autres prestataires.", prompt: "Précisez le périmètre du service et les clients concernés. Le choix du rôle dépend des opérations réelles, pas du nom de la prestation." },
] as const;
export type StartingPoint = typeof startingPoints[number];

export const fieldHints = {
  purpose: "Quel résultat concret cherchez-vous ? Exemple de formulation : traiter les demandes reçues et y répondre. Adaptez-le à votre activité.",
  legal: "Indiquez le fondement retenu, pourquoi il convient à cette finalité et la référence de votre analyse. Si l’analyse manque, laissez ce champ à examiner.",
  retention: "Quelle règle s’applique à ces données ? Précisez sa source, son périmètre et les éventuelles phases d’archivage. Aucune durée type n’est proposée.",
  trigger: "À partir de quel événement comptez-vous cette durée ? Décrivez le déclencheur prévu dans votre règle, sans inventer une date.",
  subjects: "Nommez des groupes : candidats, salariés, adhérents, contacts clients… Aucune liste nominative.",
  data: "Décrivez les types d’informations : coordonnées, parcours professionnel, historique des échanges… Retenez uniquement ce qui est réellement traité.",
  recipients: "Qui peut recevoir ou consulter ces informations ? Distinguez les services internes des organismes extérieurs.",
  transfers: "Où les données sont-elles traitées et depuis quels pays sont-elles accessibles ? Demandez aussi les conditions d’assistance et les accès des prestataires.",
  security: "Décrivez les mesures en place : accès attribués, retrait des habilitations, sauvegardes, protection des échanges, procédures. Évitez les secrets techniques.",
} as const;

export const questionPlaybook: Record<string, { ask: string; who: string; find: string }> = {
  "R-001": { ask: "Pouvez-vous décrire le déroulement réel de l’activité, les personnes concernées et les accès aux informations ?", who: "Responsable de l’activité et interlocuteur de la mission", find: "Formulaire utilisé, liste des rubriques et circuit de traitement." },
  "R-002": { ask: "Quel fondement a été retenu pour cet objectif et sur quels éléments repose ce choix ?", who: "DPO, responsable du traitement et conseil compétent si nécessaire", find: "Analyse de la base légale, référence applicable et justification adaptée au contexte." },
  "R-003": { ask: "L’activité utilise-t-elle des données relevant des articles 9 ou 10 ? Comment leur traitement a-t-il été examiné ?", who: "Responsable métier et DPO", find: "Catégories réellement traitées et analyse distincte de leur régime." },
  "R-004": { ask: "Quand cesse-t-on d’utiliser ces informations, qu’archive-t-on et comment la suppression est-elle organisée ?", who: "Responsable métier, archives et équipe technique", find: "Règle de conservation, source, événement de départ et procédure appliquée." },
  "R-005": { ask: "Quel document encadre les opérations confiées au prestataire ou les instructions reçues du client ?", who: "Achats, juridique et responsable de la prestation", find: "Contrat ou acte applicable, annexes et périmètre de la prestation." },
  "R-006": { ask: "Depuis quels pays les données peuvent-elles être consultées, y compris pour l’assistance et les prestations confiées à d’autres acteurs ?", who: "Équipe technique, prestataire et DPO", find: "Implantations, conditions d’accès, acteurs concernés et analyse des garanties invoquées." },
  "R-007": { ask: "Comment les personnes sont-elles informées de cet usage de leurs données ?", who: "Équipe en contact avec les personnes et DPO", find: "Notice actuelle, public concerné, moment et canal de présentation." },
  "R-008": { ask: "Le document décrit-il toujours l’activité et les engagements actuels ?", who: "Personne qui tient le document et responsable de l’activité", find: "Version en vigueur, périmètre couvert, réserves et prochaine revue." },
  "R-009": { ask: "Quel périmètre accompagnez-vous et qui doit examiner les questions de désignation du DPO ou d’exemption ?", who: "Direction et DPO ou conseil compétent", find: "Périmètre de mission, faits utiles et décision motivée lorsqu’elle a été prise." },
};
