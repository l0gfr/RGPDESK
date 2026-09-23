/** Human-readable interview support, never inputs to a legal decision or vault default. */
export const sourceConsultation = "22 septembre 2026";
export const businessSources = {
  prospecting: {
  "title": "CNIL · Prospection par voie électronique",
  "url": "https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel",
  "nature": "Explications de la CNIL",
  "edition": "10 juin 2026"
},
  premises: {
  "title": "CNIL · Accès aux locaux et horaires",
  "url": "https://www.cnil.fr/fr/acces-locaux-controle-des-horaires-au-travail",
  "nature": "Explications de la CNIL",
  "edition": "Mise à jour du 17 juin 2026"
},
  video: {
  "title": "CNIL · Vidéosurveillance au travail",
  "url": "https://www.cnil.fr/fr/la-videosurveillance-videoprotection-au-travail",
  "nature": "Explications de la CNIL",
  "edition": "Page datée du 23 juillet 2018, consultée le 23 septembre 2026"
},
  logging: {
  "title": "CNIL · Tracer les opérations",
  "url": "https://www.cnil.fr/fr/securite-tracer-les-operations",
  "nature": "Guide de sécurité CNIL",
  "edition": "14 mars 2024"
},

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
  principles: { title: "RGPD · Principes et licéité", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr", nature: "Texte applicable, Journal officiel de l’Union européenne", edition: "Articles 5, 6, 9 et 10" },
  obligations: { title: "RGPD · Responsable et sous-traitant", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr", nature: "Texte applicable, Journal officiel de l’Union européenne", edition: "Articles 28, 30 et 32" },
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
  consultedAt?: string;
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
  prospecting: {
  "scope": "Envois commerciaux par courriel. Examiner séparément les autres canaux et les traceurs éventuels.",
  "attention": "Les règles dépendent du public et du contexte. Une relation commerciale ne dispense pas automatiquement d’examiner les conditions de prospection.",
  "attentionSource": "prospecting",
  "attentionLocation": "Particuliers, professionnels et exceptions",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Public visé",
      "ask": "S’adresse-t-on à des particuliers ou à des professionnels, et pour quel objet ?",
      "evidence": "Ciblage et message type.",
      "source": "prospecting",
      "location": "Pour les particuliers / pour les professionnels"
    },
    {
      "topic": "Origine",
      "ask": "Comment les adresses ont-elles été obtenues et les personnes informées ?",
      "evidence": "Parcours de collecte.",
      "source": "prospecting",
      "location": "Information des personnes"
    },
    {
      "topic": "Choix des personnes",
      "ask": "Comment démontrez-vous le choix exprimé ou les conditions de l’exception invoquée ?",
      "evidence": "Version du formulaire et preuve.",
      "source": "prospecting",
      "location": "Consentement et exceptions"
    },
    {
      "topic": "Arrêt des envois",
      "ask": "Comment une opposition devient-elle effective dans toutes les listes concernées ?",
      "evidence": "Test de désinscription.",
      "source": "prospecting",
      "location": "Opposition simple et gratuite"
    },
    {
      "topic": "Prestataire d’envoi",
      "ask": "Quelles opérations et quels accès sont confiés au routeur ?",
      "evidence": "Contrat et schéma des échanges.",
      "source": "obligations",
      "location": "Articles 28 et 30"
    },
    {
      "topic": "Fin d’usage",
      "ask": "Quelle règle distingue liste active et informations nécessaires au respect des oppositions ?",
      "evidence": "Règle justifiée et procédure.",
      "source": "retention",
      "location": "Cycle de vie et limitation de la conservation"
    }
  ]
},
  suppliers: {
  "scope": "Contacts fournisseurs, entrepreneurs individuels et personnes intervenant dans le circuit d’achat.",
  "attention": "Une entreprise fournisseur n’est pas automatiquement sous-traitante au sens du RGPD. Examinez les opérations réellement confiées.",
  "attentionSource": "obligations",
  "attentionLocation": "Article 28",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Finalités",
      "ask": "Quels usages distinguez-vous : sélection, commande, paiement, suivi du contrat ?",
      "evidence": "Circuit d’achat.",
      "source": "principles",
      "location": "Article 5, paragraphe 1, b"
    },
    {
      "topic": "Informations",
      "ask": "Quelles données de personnes sont nécessaires à chaque usage ?",
      "evidence": "Fiche fournisseur vierge.",
      "source": "principles",
      "location": "Article 5, paragraphe 1, c"
    },
    {
      "topic": "Fondement",
      "ask": "Quelle analyse justifie le fondement de chacun de ces usages ?",
      "evidence": "Référence de l’analyse.",
      "source": "principles",
      "location": "Article 6"
    },
    {
      "topic": "Destinataires",
      "ask": "Quels services et organismes reçoivent ces informations ?",
      "evidence": "Circuit de validation et transmissions.",
      "source": "obligations",
      "location": "Article 30, paragraphe 1, d"
    },
    {
      "topic": "Conservation",
      "ask": "Quelles pièces restent actives, puis archivées, selon quelle règle applicable ?",
      "evidence": "Source et procédure d’archivage.",
      "source": "principles",
      "location": "Article 5, paragraphe 1, e"
    },
    {
      "topic": "Information",
      "ask": "Comment les contacts obtiennent-ils l’information sur leurs données et leurs droits ?",
      "evidence": "Notice et canal de remise.",
      "source": "information",
      "location": "Information en cas de collecte directe ou indirecte"
    }
  ]
},
  support: {
  "scope": "Assistance, réclamations et service après-vente. Les contentieux et nouveaux usages demandent leur propre examen.",
  "attention": "Le référentiel commercial inclut les réclamations et le service après-vente ; son champ n’englobe pas tous les traitements d’une entreprise.",
  "attentionSource": "commercial",
  "attentionLocation": "Sections 2 et 3",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Circuit du ticket",
      "ask": "Comment une demande arrive-t-elle jusqu’à sa résolution ?",
      "evidence": "Parcours d’un ticket fictif.",
      "source": "commercial",
      "location": "Section 3 : finalités"
    },
    {
      "topic": "Contenu utile",
      "ask": "Quels champs et pièces sont nécessaires, et quelles informations faut-il éviter ?",
      "evidence": "Formulaire et consigne aux équipes.",
      "source": "commercial",
      "location": "Section 5 : données concernées"
    },
    {
      "topic": "Accès",
      "ask": "Qui consulte les échanges, y compris lors d’une escalade ?",
      "evidence": "Profils d’accès.",
      "source": "commercial",
      "location": "Section 6 : destinataires"
    },
    {
      "topic": "Information",
      "ask": "Comment informe-t-on la personne lorsqu’elle contacte le support ?",
      "evidence": "Notice du support.",
      "source": "commercial",
      "location": "Section 8 : information"
    },
    {
      "topic": "Clôture",
      "ask": "Quelle règle gouverne la conservation après résolution ou contentieux ?",
      "evidence": "Règle et événement de départ.",
      "source": "commercial",
      "location": "Section 7 : durées de conservation"
    },
    {
      "topic": "Réutilisations",
      "ask": "Les échanges servent-ils à des statistiques, à la formation ou à une autre finalité ?",
      "evidence": "Usages et analyse distincte.",
      "source": "commercial",
      "location": "Section 3 : finalités et réutilisation"
    }
  ]
},
  premises: {
  "scope": "Attribution et suivi des accès physiques, pour les employés et visiteurs.",
  "attention": "Contrôler l’accès aux locaux et contrôler les horaires sont des objectifs distincts. La trame ne qualifie pas leur licéité.",
  "attentionSource": "premises",
  "attentionLocation": "Dans quel but ?",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Périmètre",
      "ask": "Quels espaces et quelles personnes sont concernés ?",
      "evidence": "Plan des accès.",
      "source": "premises",
      "location": "Pour l’accès aux locaux"
    },
    {
      "topic": "Choix du dispositif",
      "ask": "Quelles informations le dispositif collecte-t-il, avec ou sans biométrie ?",
      "evidence": "Description du dispositif.",
      "source": "premises",
      "location": "Quels dispositifs mettre en œuvre ?"
    },
    {
      "topic": "Usages réels",
      "ask": "Les relevés sont-ils réutilisés pour contrôler horaires ou déplacements ?",
      "evidence": "Procédure et usages déclarés.",
      "source": "premises",
      "location": "Quelles garanties pour la vie privée ?"
    },
    {
      "topic": "Habilitations",
      "ask": "Qui attribue les badges et consulte les historiques ?",
      "evidence": "Matrice d’habilitation.",
      "source": "premises",
      "location": "Qui peut accéder aux données ?"
    },
    {
      "topic": "Information",
      "ask": "Comment salariés et visiteurs sont-ils informés ?",
      "evidence": "Notice, affichage et procédure.",
      "source": "premises",
      "location": "L’information des salariés"
    },
    {
      "topic": "Cycle de vie",
      "ask": "Que devient l’habilitation au départ et quelle purge s’applique aux traces ?",
      "evidence": "Règles et contrôles.",
      "source": "premises",
      "location": "Quelles durées de conservation ?"
    }
  ]
},
  video: {
  "scope": "Caméras sur un lieu de travail. Examiner séparément les espaces ouverts au public et les dispositifs particuliers.",
  "attention": "L’objectif et le cadrage de chaque caméra doivent être examinés. Une capacité de stockage ne justifie pas la conservation des images.",
  "attentionSource": "video",
  "attentionLocation": "Précautions et conservation",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Objectif",
      "ask": "Quel objectif précis justifie chaque caméra ?",
      "evidence": "Plan et justification.",
      "source": "video",
      "location": "À retenir"
    },
    {
      "topic": "Cadrage",
      "ask": "Quelles zones et quelles personnes entrent dans le champ ?",
      "evidence": "Angles de vue.",
      "source": "video",
      "location": "Précautions d’installation"
    },
    {
      "topic": "Consultation",
      "ask": "Qui visionne, extrait ou consulte à distance les images ?",
      "evidence": "Habilitations et procédure.",
      "source": "video",
      "location": "Qui peut consulter les images ?"
    },
    {
      "topic": "Information",
      "ask": "Quels panneaux et quelles notices sont présentés aux personnes ?",
      "evidence": "Supports d’information.",
      "source": "video",
      "location": "Quelle information ?"
    },
    {
      "topic": "Conservation",
      "ask": "Quelle règle distingue effacement habituel et extraction pour une procédure ?",
      "evidence": "Règles et registre d’extractions.",
      "source": "video",
      "location": "Pendant combien de temps conserver les images ?"
    },
    {
      "topic": "Cadre applicable",
      "ask": "Le lieu est-il ouvert au public et quelles démarches ont été examinées ?",
      "evidence": "Qualification du lieu et analyse.",
      "source": "video",
      "location": "Quelles formalités ?"
    }
  ]
},
  logging: {
  "scope": "Traces applicatives et techniques utilisées pour la sécurité du système d’information.",
  "attention": "Les journaux peuvent eux-mêmes contenir des données personnelles. Examiner leur contenu, leurs accès et leur utilisation.",
  "attentionSource": "logging",
  "attentionLocation": "Précautions élémentaires et ce qu’il ne faut pas faire",
  "consultedAt": "23 septembre 2026",
  "questions": [
    {
      "topic": "Événements",
      "ask": "Quels événements doit-on pouvoir expliquer avec les traces ?",
      "evidence": "Liste d’événements.",
      "source": "logging",
      "location": "Les précautions élémentaires"
    },
    {
      "topic": "Contenu",
      "ask": "Quelles catégories de données sont enregistrées sans recopier de secrets ?",
      "evidence": "Structure vierge du journal.",
      "source": "logging",
      "location": "Ce qu’il ne faut pas faire"
    },
    {
      "topic": "Accès",
      "ask": "Qui consulte les traces et comment protège-t-on leur intégrité ?",
      "evidence": "Habilitations et contrôles.",
      "source": "logging",
      "location": "Les précautions élémentaires"
    },
    {
      "topic": "Information",
      "ask": "Comment les utilisateurs sont-ils informés de cette journalisation ?",
      "evidence": "Notice ou charte.",
      "source": "logging",
      "location": "Les précautions élémentaires"
    },
    {
      "topic": "Usages",
      "ask": "Comment évite-t-on de réutiliser les traces pour surveiller le temps travaillé ?",
      "evidence": "Finalités et règles d’usage.",
      "source": "logging",
      "location": "Ce qu’il ne faut pas faire"
    },
    {
      "topic": "Exploitation",
      "ask": "Quelles règles encadrent analyse, conservation et suppression des traces ?",
      "evidence": "Procédure et justification.",
      "source": "logging",
      "location": "Les précautions élémentaires"
    }
  ]
},
} as const satisfies Record<string, BusinessGuide>;
