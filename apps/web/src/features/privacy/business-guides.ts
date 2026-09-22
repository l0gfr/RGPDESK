/** Human-readable interview support, never inputs to a legal decision or vault default. */
export const sourceConsultation = "22 septembre 2026";
export const businessSources = {
  recruitment: { title: "CNIL · Guide du recrutement", url: "https://www.cnil.fr/sites/default/files/atoms/files/guide_-_recrutement.pdf", nature: "Guide CNIL", edition: "30 janvier 2023" },
  staff: { title: "CNIL · Référentiel de gestion du personnel", url: "https://www.cnil.fr/sites/cnil/files/2023-09/referentiel_gestion_des_ressources_humaines.pdf", nature: "Référentiel CNIL", edition: "Modifié le 23 mai 2022" },
  staffRetention: { title: "CNIL · Conservation des données RH", url: "https://www.cnil.fr/sites/default/files/2026-04/referentiel_durees_de_conservation_gestion_des_ressources_humaines.pdf", nature: "Référentiel CNIL distinguant textes obligatoires et recommandations", edition: "Mis à jour le 20 mai 2026" },
  commercial: { title: "CNIL · Référentiel des activités commerciales", url: "https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_traitements-donnees-caractere-personnel_gestion-activites-commerciales.pdf", nature: "Référentiel CNIL", edition: "Document consulté le 22 septembre 2026" },
  communications: { title: "CNIL · Messages aux clients et prospects", url: "https://www.cnil.fr/fr/communication-electronique-quelles-regles", nature: "Explications de la CNIL", edition: "10 juin 2026" },
  association: { title: "CNIL · Guide pour les associations", url: "https://www.cnil.fr/sites/default/files/atoms/files/cnil-guide_association.pdf", nature: "Guide CNIL", edition: "Document consulté le 22 septembre 2026" },
  collection: { title: "CNIL · Formulaires de collecte", url: "https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel", nature: "Exemples CNIL à adapter", edition: "26 juillet 2019" },
  information: { title: "CNIL · Informer les personnes", url: "https://www.cnil.fr/fr/informer-les-personnes", nature: "Explications de la CNIL", edition: "27 janvier 2020" },
  processor: { title: "CNIL · Relations avec un sous-traitant", url: "https://www.cnil.fr/fr/responsable-de-traitement-et-sous-traitant-6-bonnes-pratiques-pour-respecter-les-donnees", nature: "Rappels et bonnes pratiques CNIL", edition: "8 juillet 2020" },
  subcontracting: { title: "CNIL · Sécurité de la sous-traitance", url: "https://www.cnil.fr/fr/securite-gerer-la-sous-traitance", nature: "Guide de sécurité CNIL", edition: "14 mars 2024" },
  access: { title: "CNIL · Gérer les habilitations", url: "https://www.cnil.fr/fr/securite-gerer-les-habilitations", nature: "Guide de sécurité CNIL", edition: "Page consultée le 22 septembre 2026" },
  retention: { title: "CNIL · Cycle de vie et conservation", url: "https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees", nature: "Explications de la CNIL", edition: "2 avril 2026" },
  principles: { title: "RGPD · Principes et licéité", url: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2", nature: "Texte du règlement, reproduit par la CNIL", edition: "Articles 5, 6, 9 et 10" },
  obligations: { title: "RGPD · Responsable et sous-traitant", url: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4", nature: "Texte du règlement, reproduit par la CNIL", edition: "Articles 28, 30 et 32" },
} as const;
export type BusinessSourceId = keyof typeof businessSources;
export interface InterviewQuestion {
  topic: string;
  ask: string;
  evidence: string;
  source: BusinessSourceId;
  location: string;
}
export interface BusinessGuide {
  scope: string;
  attention: string;
  attentionSource: BusinessSourceId;
  attentionLocation: string;
  questions: readonly InterviewQuestion[];
}
export const businessGuides = {
  recruitment: {
    scope: "Du dépôt d’une candidature à sa clôture. Faites préciser les recrutements concernés et l’existence éventuelle d’un vivier.",
    attention: "Le guide CNIL distingue l’examen d’une candidature, le vivier et la conservation à des fins probatoires. Ne leur attribuez pas une règle commune sans analyse.",
    attentionSource: "recruitment", attentionLocation: "Fiches 2, 4 et 9",
    questions: [
      { topic: "Poste ou vivier", ask: "Ces candidatures servent-elles à un poste ouvert, à de futures opportunités ou aux deux ?", evidence: "Description du processus et usages du vivier.", source: "recruitment", location: "Fiches 2 et 4" },
      { topic: "Informations demandées", ask: "Quels champs, pièces et commentaires sont recueillis, et à quoi chacun sert-il pour évaluer le candidat ?", evidence: "Formulaire vierge et grille d’entretien.", source: "recruitment", location: "Fiche 5" },
      { topic: "Accès aux candidatures", ask: "Qui consulte les dossiers dans l’outil, les boîtes mail et les cabinets externes ?", evidence: "Profils d’accès et intervenants.", source: "recruitment", location: "Fiche 6" },
      { topic: "Information du candidat", ask: "Que voit le candidat à la collecte ? Comment est-il informé d’un autre usage de son dossier ?", evidence: "Notice et emplacement de présentation.", source: "information", location: "Qui informer et quand le faire ?" },
      { topic: "Outils de sélection", ask: "Un logiciel classe-t-il ou écarte-t-il des candidatures ? Quelle intervention humaine est réellement prévue ?", evidence: "Fonctionnement de l’outil et procédure d’examen.", source: "recruitment", location: "Fiche 13" },
      { topic: "Après la décision", ask: "Que deviennent les dossiers retenus, refusés et gardés en vivier ? Quelle règle justifie chaque phase ?", evidence: "Règles, déclencheurs et procédure de suppression.", source: "staffRetention", location: "Recrutement, page 3" },
    ],
  },
  staff: {
    scope: "Cadrez une activité RH précise : administration, paie, temps de travail ou formation. Un même SIRH peut servir plusieurs objectifs.",
    attention: "Le référentiel RH courant ne couvre notamment pas le contrôle individuel de l’activité ni certains outils de profilage. Ces usages demandent un examen distinct.",
    attentionSource: "staff", attentionLocation: "Sections 1 et 2",
    questions: [
      { topic: "Périmètre RH", ask: "Quelles opérations et quelles populations couvre cet entretien : salariés, agents, stagiaires ou autres personnels ?", evidence: "Périmètre et processus concernés.", source: "staff", location: "Sections 1 et 3" },
      { topic: "Données et objectifs", ask: "À quel objectif répond chaque rubrique du dossier RH ? Quel fondement a été examiné pour cet objectif ?", evidence: "Dictionnaire des champs et analyse existante.", source: "staff", location: "Sections 3 à 5" },
      { topic: "Accès et départs", ask: "Quels accès distinguent RH, paie et managers ? Qui les revoit lors d’une mobilité ou d’un départ ?", evidence: "Matrice des habilitations et procédure de retrait.", source: "access", location: "Les précautions élémentaires" },
      { topic: "Régimes particuliers", ask: "Le traitement comprend-il des données de santé, syndicales ou pénales ? Quelle analyse distincte les encadre ?", evidence: "Catégories et justification du régime applicable, sans dossier individuel.", source: "principles", location: "Articles 9 et 10" },
      { topic: "Information du personnel", ask: "Où les personnes trouvent-elles les usages, destinataires, durées et moyens d’exercer leurs droits ?", evidence: "Notice et modalités de remise.", source: "information", location: "Quelles informations dois-je donner ?" },
      { topic: "Fin d’utilisation", ask: "Pour chaque catégorie de dossier, quelle ligne du référentiel correspond au cas réel et quel événement lance le délai ?", evidence: "Source, périmètre, base active et archivage retenus.", source: "staffRetention", location: "Légende et grille de lecture, page 2" },
    ],
  },
  customers: {
    scope: "Distinguez commande, service après-vente, fidélisation et prospection. Décrivez l’usage du CRM, pas seulement son nom.",
    attention: "Le référentiel commercial a un périmètre limité. Il exclut notamment certains secteurs réglementés, la lutte contre la fraude et certains profilages : vérifiez ses sections 1 à 3.",
    attentionSource: "commercial", attentionLocation: "Sections 1 à 3",
    questions: [
      { topic: "Objectifs du CRM", ask: "Utilisez-vous les contacts pour exécuter la commande, suivre une réclamation, fidéliser ou prospecter ?", evidence: "Processus et finalités distinctes.", source: "commercial", location: "Section 3" },
      { topic: "Origine et accès", ask: "D’où viennent les coordonnées et qui reçoit les données : équipes, prestataires, partenaires ?", evidence: "Circuits de collecte et destinataires.", source: "commercial", location: "Sections 5 et 6" },
      { topic: "Nature des messages", ask: "Quels messages sont promotionnels, transactionnels ou relationnels ? Quels publics et canaux sont concernés ?", evidence: "Exemplaires anonymisés des messages.", source: "communications", location: "Comprendre les différents types de communications" },
      { topic: "Choix des personnes", ask: "Comment l’accord ou l’opposition est-il recueilli, conservé et appliqué selon chaque usage ?", evidence: "Formulaires, preuve du choix et circuit de désinscription.", source: "communications", location: "Prospection commerciale par voie électronique" },
      { topic: "Informations données", ask: "La notice décrit-elle les usages et partenaires réellement concernés, y compris quand les coordonnées viennent d’un tiers ?", evidence: "Notice, provenance et modalités de présentation.", source: "information", location: "Qui informer et quand le faire ?" },
      { topic: "Après la relation", ask: "Quelles données restent utiles à la relation, à la prospection ou aux obligations d’archivage ?", evidence: "Règles distinctes et procédure de tri.", source: "retention", location: "Le cycle de vie de la donnée" },
    ],
  },
  members: {
    scope: "Partez du bulletin d’adhésion et suivez son usage par le secrétariat, la trésorerie et les responsables d’activités.",
    attention: "L’accès au fichier ne découle pas du seul statut de bénévole. Le guide CNIL rattache les accès aux missions qui les nécessitent.",
    attentionSource: "association", attentionLocation: "Confidentialité et sécurité, pages 12 à 13",
    questions: [
      { topic: "Usages de l’adhésion", ask: "Quelles données servent aux inscriptions, cotisations, activités et communications ? Les objectifs sont-ils distingués ?", evidence: "Bulletin vierge et circuit de gestion.", source: "association", location: "Recensez les fichiers, page 14" },
      { topic: "Informations nécessaires", ask: "À quoi sert chaque champ demandé ? Certaines pièces ou informations sont-elles collectées sans utilité établie ?", evidence: "Formulaire et justification des rubriques.", source: "association", location: "Faites le tri dans les données, page 15" },
      { topic: "Bénévoles et habilitations", ask: "Qui voit les cotisations, coordonnées ou autres informations ? Qui retire les accès à la fin d’une mission ?", evidence: "Rôles d’accès et procédure de départ.", source: "access", location: "Les précautions élémentaires" },
      { topic: "Transmission à un tiers", ask: "À qui le fichier ou un extrait est-il communiqué, pour quel objectif et sur quel fondement ?", evidence: "Demande, destinataire et périmètre transmis.", source: "association", location: "Confidentialité, page 13 ; FAQ, pages 19 et 22" },
      { topic: "Information et communications", ask: "Comment les adhérents sont-ils informés ? Comment expriment-ils leur opposition aux messages de vie associative ?", evidence: "Notice, messages et moyen d’opposition.", source: "association", location: "FAQ, pages 21 à 22" },
      { topic: "Anciennes adhésions", ask: "Quels usages cessent avec l’adhésion, lesquels continuent, et selon quelles règles documentées ?", evidence: "Tri entre gestion courante, relance et archivage justifié.", source: "retention", location: "Cycle de vie et identification de la durée" },
    ],
  },
  contact: {
    scope: "Suivez une demande fictive du formulaire à la réponse, en passant par la messagerie et l’éventuel outil de tickets.",
    attention: "Les mentions proposées par la CNIL sont des illustrations à adapter. Elles ne constituent pas une notice universelle à recopier.",
    attentionSource: "collection", attentionLocation: "Introduction des exemples",
    questions: [
      { topic: "Champs du formulaire", ask: "De quelles informations avez-vous besoin pour répondre ? Que se passe-t-il si un champ facultatif reste vide ?", evidence: "Formulaire vierge et distinction obligatoire/facultatif.", source: "collection", location: "Exemple 1" },
      { topic: "Au moment de l’envoi", ask: "La personne peut-elle lire les finalités, le fondement, les destinataires et les règles de conservation avant l’envoi ?", evidence: "Texte affiché et éventuel second niveau d’information.", source: "collection", location: "Exemples 1 et 2" },
      { topic: "Circuit de réponse", ask: "Quelles équipes accèdent au formulaire, à la boîte partagée, aux transferts de mails et aux tickets ?", evidence: "Circuit et profils d’accès.", source: "access", location: "Limiter les accès aux seules données nécessaires" },
      { topic: "Prestataires impliqués", ask: "Quels prestataires interviennent dans le formulaire, l’hébergement ou la messagerie, et avec quels accès ?", evidence: "Contrats, mesures et localisation des traitements.", source: "subcontracting", location: "Les précautions élémentaires" },
      { topic: "Réutilisation commerciale", ask: "Les coordonnées rejoignent-elles une liste de prospection après la réponse ? Comment cet usage est-il examiné ?", evidence: "Parcours d’inscription et information associée.", source: "communications", location: "Distinguer la nature des communications" },
      { topic: "Demande clôturée", ask: "Quelle règle s’applique aux demandes terminées et aux copies dans les boîtes mail ?", evidence: "Durée, déclencheur et procédure de suppression.", source: "retention", location: "Les bonnes questions à se poser" },
    ],
  },
  service: {
    scope: "Délimitez une prestation et son client. Examinez séparément les opérations sur instruction et les éventuels usages pour votre propre compte.",
    attention: "Le rôle dépend des opérations réelles. Un prestataire peut être sous-traitant pour une prestation et responsable pour un autre traitement.",
    attentionSource: "processor", attentionLocation: "Déterminer le statut des acteurs impliqués",
    questions: [
      { topic: "Périmètre confié", ask: "Quelles opérations réalisez-vous pour quel client, sur quelles données et selon quelles instructions écrites ?", evidence: "Contrat, annexe et instructions.", source: "processor", location: "Établir un contrat clair ; documenter l’activité" },
      { topic: "Autres prestataires", ask: "À qui confiez-vous des opérations et comment l’autorisation ainsi que l’information du client sont-elles organisées ?", evidence: "Liste, autorisations et modalités de changement.", source: "processor", location: "Recourir à un autre sous-traitant" },
      { topic: "Accès et pays", ask: "Où les données sont-elles traitées et accessibles, y compris pendant le support ?", evidence: "Implantations, accès et analyse des transferts.", source: "subcontracting", location: "Localisation et garanties des services cloud" },
      { topic: "Garanties effectives", ask: "Quelles mesures pouvez-vous expliquer et faire vérifier, au-delà d’une mention commerciale de sécurité ?", evidence: "Mesures, éléments de vérification et modalités d’audit.", source: "subcontracting", location: "Garanties et vérification de leur effectivité" },
      { topic: "Assistance au client", ask: "Qui traite une demande de droits ou alerte le client d’une violation, selon quelle procédure convenue ?", evidence: "Interlocuteurs et procédure d’assistance.", source: "obligations", location: "Article 28, paragraphe 3, e et f" },
      { topic: "Fin du service", ask: "Comment le client choisit-il entre restitution et suppression, et comment les copies sont-elles traitées ?", evidence: "Clause de sortie, procédure et éventuelle obligation de conservation.", source: "obligations", location: "Article 28, paragraphe 3, g" },
    ],
  },
} as const satisfies Record<string, BusinessGuide>;
