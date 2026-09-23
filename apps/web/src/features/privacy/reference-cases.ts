import { assertWorkspace, createWorkspace, createActivity, createPurpose, createDataFlow, createDpoCase, createImpactAssessment, knowledge as k, unknown, type Workspace, type DpoKind } from "@rgpdesk/privacy-core";
export const REFERENCE_EDITION = "cas-2026-09-23.1";
export const REFERENCE_SOURCE = "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr";
/** Fictitious facts and reviewer prompts, not legal answers or expert-approved cases. */
export const REFERENCE_CASES = [
  {
    "id": "recrutement",
    "sector": "PME",
    "title": "Recrutement et candidatures",
    "people": "Candidats fictifs",
    "data": "CV, expériences et échanges",
    "purpose": "Organiser les entretiens pour un poste défini.",
    "facts": "Les recruteurs consultent les candidatures. Le devenir des candidatures non retenues est encore inconnu.",
    "party": "RH",
    "system": "Outil de candidatures",
    "kind": "rights",
    "caseTitle": "Demande d’accès à un dossier de candidature",
    "review": "Vérifier quels outils et prestataires doivent être interrogés sans recopier le CV.",
    "sourceLabel": "art. 5, 12 et 15"
  },
  {
    "id": "prospection",
    "sector": "PME",
    "title": "Prospection professionnelle",
    "people": "Interlocuteurs professionnels fictifs",
    "data": "Fonction, adresse professionnelle et opposition",
    "purpose": "Présenter un service à des interlocuteurs professionnels ciblés.",
    "facts": "L’équipe décrit une liste achetée ; les attentes et l’information des personnes restent à examiner.",
    "party": "Équipe commerciale",
    "system": "Outil de campagnes",
    "kind": "interest",
    "caseTitle": "Examen de l’intérêt invoqué pour la prospection",
    "review": "Comparer les moyens et examiner les attentes ; ne pas préremplir le fondement.",
    "sourceLabel": "art. 6 §1 f), 14 et 21"
  },
  {
    "id": "paie",
    "sector": "PME",
    "title": "Paie confiée à un prestataire",
    "people": "Salariés fictifs",
    "data": "Éléments de paie et coordonnées de paiement",
    "purpose": "Établir les bulletins et organiser le paiement.",
    "facts": "Le prestataire prépare les bulletins. Son annexe de sécurité change entre deux revues.",
    "party": "Prestataire de paie",
    "system": "Portail de paie",
    "kind": "security",
    "caseTitle": "Indisponibilité du portail en fin de mois",
    "review": "Relier la clause citée et son changement de version à la position à réexaminer.",
    "sourceLabel": "art. 28 et 32"
  },
  {
    "id": "support",
    "sector": "PME",
    "title": "Support avec accès distant",
    "people": "Clients et salariés fictifs",
    "data": "Identifiants professionnels et tickets",
    "purpose": "Traiter les incidents signalés au support.",
    "facts": "Un prestataire annonce un accès distant depuis un nouveau pays, sans préciser les intervenants.",
    "party": "Prestataire de support",
    "system": "Gestion des tickets",
    "kind": "transfer",
    "caseTitle": "Examen des accès distants du support",
    "review": "Faire apparaître le changement de pays sans conclure automatiquement au mécanisme de transfert.",
    "sourceLabel": "art. 28 et 44 à 49"
  },
  {
    "id": "badges",
    "sector": "PME",
    "title": "Badges et contrôle des accès",
    "people": "Salariés et visiteurs fictifs",
    "data": "Identifiant de badge, lieu et heure de passage",
    "purpose": "Limiter l’accès à des locaux déterminés.",
    "facts": "Le métier propose de réutiliser les traces pour suivre les horaires. Cette nouvelle finalité n’est pas arbitrée.",
    "party": "Accueil",
    "system": "Gestion des badges",
    "kind": "security",
    "caseTitle": "Altération des droits d’accès aux locaux",
    "review": "Séparer les conséquences SI des effets de surveillance sur les personnes ; comparer des options moins intrusives.",
    "sourceLabel": "art. 5 §1 b), 25, 32 et 35"
  },
  {
    "id": "adhesions",
    "sector": "Association",
    "title": "Adhésions et vie associative",
    "people": "Adhérents fictifs",
    "data": "Coordonnées, adhésion et cotisation",
    "purpose": "Gérer les adhésions et les échanges associatifs.",
    "facts": "La personne chargée du suivi souhaite réutiliser la liste pour un partenaire. La destination est à examiner.",
    "party": "Secrétariat associatif",
    "system": "Suivi des adhésions",
    "kind": "rights",
    "caseTitle": "Opposition à une réutilisation de coordonnées",
    "review": "Distinguer la finalité initiale et la réutilisation proposée, sans dupliquer la fiche.",
    "sourceLabel": "art. 5, 6 et 21"
  },
  {
    "id": "dons",
    "sector": "Association",
    "title": "Dons et relations donateurs",
    "people": "Donateurs fictifs",
    "data": "Coordonnées, montants et historique des échanges",
    "purpose": "Suivre les dons et répondre aux donateurs.",
    "facts": "Un accès à l’export des dons est partagé avec plusieurs bénévoles ; les habilitations sont à clarifier.",
    "party": "Trésorerie associative",
    "system": "Suivi des dons",
    "kind": "breach",
    "caseTitle": "Envoi d’un export au mauvais destinataire",
    "review": "Conserver la chronologie et motiver séparément les décisions de notification.",
    "sourceLabel": "art. 32 à 34"
  },
  {
    "id": "benevoles",
    "sector": "Association",
    "title": "Organisation des bénévoles",
    "people": "Bénévoles fictifs",
    "data": "Disponibilités, missions et coordonnées",
    "purpose": "Affecter des personnes aux permanences.",
    "facts": "Le planning est partagé dans un groupe dont les membres ne sont pas régulièrement revus.",
    "party": "Coordination des bénévoles",
    "system": "Planning partagé",
    "kind": "security",
    "caseTitle": "Consultation du planning par un ancien intervenant",
    "review": "Décrire le flux d’accès et demander la preuve d’une revue des habilitations.",
    "sourceLabel": "art. 5 §1 c), 25 et 32"
  },
  {
    "id": "accompagnement",
    "sector": "Association",
    "title": "Accompagnement de bénéficiaires",
    "people": "Bénéficiaires fictifs",
    "data": "Demandes d’aide et éléments de situation déclarés",
    "purpose": "Organiser un accompagnement individuel.",
    "facts": "La qualification de certaines informations sensibles et les destinataires restent à vérifier avec les intervenants.",
    "party": "Équipe d’accompagnement",
    "system": "Dossiers d’accompagnement",
    "kind": "rights",
    "caseTitle": "Accès à un dossier avec des informations de tiers",
    "review": "Examiner les effets humains et les droits des tiers sans déduire une exception applicable.",
    "sourceLabel": "art. 9, 15 §4 et 35"
  },
  {
    "id": "sport",
    "sector": "Association",
    "title": "Inscriptions aux activités de mineurs",
    "people": "Participants mineurs et responsables légaux fictifs",
    "data": "Inscription, contact et informations de participation",
    "purpose": "Organiser les séances d’une activité sportive.",
    "facts": "Une publication de photos est envisagée en plus des inscriptions ; périmètre et conditions sont à examiner séparément.",
    "party": "Équipe d’encadrement",
    "system": "Gestion des inscriptions",
    "kind": "interest",
    "caseTitle": "Intérêt invoqué pour une communication distincte",
    "review": "Éprouver la balance des intérêts en présence de mineurs, sans confondre inscription et communication.",
    "sourceLabel": "art. 5, 6 et considérant 38"
  }
] as const;
export function createReferenceWorkspace(caseId: string, id: () => string, at: string): Workspace {
  const c = REFERENCE_CASES.find((item) => item.id === caseId);
  if (!c) throw new Error("INVALID_CASE");
  const w = createWorkspace(id(), `${c.sector} · ${c.title} · fictif`, at);
  w.scope = k(`EXERCICE FICTIF ${REFERENCE_EDITION}. ${c.facts}`);
  w.jurisdiction = k("Scénario pédagogique situé en France. Applicabilité à examiner.");
  const a = createActivity(w.id, id(), "controller");
  if (a.role !== "controller") throw new Error("INVALID_CASE");
  a.title = c.title + " · exemple fictif"; a.dataSubjects = k(c.people); a.dataCategories = k(c.data);
  const purpose = createPurpose(id()); purpose.description = k(c.purpose); a.purposes = [purpose];
  a.analysis.operations = k(c.facts); a.analysis.notes[0]!.facts = k(c.facts);
  const party = {id:id(),workspaceId:w.id,name:c.party,contact:unknown()};
  const system = {id:id(),workspaceId:w.id,name:c.system,description:k("Outil fictif pour l’exercice.")};
  w.parties = [party]; w.systems = [system]; a.participantIds = [party.id]; a.systemIds = [system.id];
  const collection = createDataFlow(id()); collection.sourceRef = "subjects"; collection.destinationRef = `system:${system.id}`; collection.dataFromActivity = true; collection.operation = k("Collecte déclarée pour cet exercice.");
  const access = createDataFlow(id()); access.sourceRef = `system:${system.id}`; access.destinationRef = `party:${party.id}`; access.dataFromActivity = true; access.operation = k("Consultation déclarée pour cet exercice.");
  a.flows = [collection, access]; w.activities = [a];
  const doc = {id:id(),workspaceId:w.id,title:"Compte rendu fictif de l’entretien",category:"other" as const,activityIds:[a.id],purposeIds:[purpose.id],partyIds:[party.id],scope:"Faits fictifs de cet exercice",version:"EXERCICE-v1",declaredAuthor:"Interlocuteur fictif",internalRef:"Exercice intégré, aucun fichier original",publicReference:"",reservations:"Référence inventée, aucune valeur probante.",sensitivity:"internal" as const,status:"declared" as const,reviewedRevision:null,reviewedAt:null,reviewDue:null,audience:"",channel:"",availability:unknown(),contractReview:null};
  w.documents = [doc];
  a.analysis.notes[0]!.citations = [{documentId:doc.id,version:doc.version,locator:"Point 1 de l’entretien fictif",meaning:"Déclaration du métier dans cet exercice ; elle ne prouve pas la réalité des contrôles."}];
  const dossier = createDpoCase(w.id,id(),c.kind as DpoKind); dossier.title = c.caseTitle; dossier.activityIds = [a.id]; dossier.purposeId = c.kind === "interest" ? purpose.id : null; dossier.content.notes[0]!.facts = k(c.facts); dossier.content.notes[0]!.citations = structuredClone(a.analysis.notes[0]!.citations);
  w.dpoCases = [dossier];
  w.impactAssessments = [createImpactAssessment(w.id,a,id())];
  assertWorkspace(w); return w;
}
