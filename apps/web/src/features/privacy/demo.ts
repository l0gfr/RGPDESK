import { createWorkspace, createActivity, createPurpose, createDataFlow, createContractReview, createImpactAssessment, createPiaAlternative, createPiaRisk, createPiaMeasure, createAction, evaluateWorkspace, putImpactAssessment, recordPiaReview, reviseWorkspace, assertWorkspace, knowledge as k, type Activity, type EvidenceReference, type ReviewNote, type Workspace } from "@rgpdesk/privacy-core";

// Editorial fiction only. No real people, client data, legal defaults or credential.
// Every opening gets independent opaque IDs; nothing in this module writes to storage.
export function createDemoWorkspace(id: () => string, at: string): Workspace {
  let w = createWorkspace(id(), "Maison Sillage · organisme fictif", at);
  const wid = w.id;
  const rh = { id: id(), workspaceId: wid, name: "Équipe RH · fictive", contact: k("Fonction de contact du scénario, sans coordonnées personnelles.") };
  const host = { id: id(), workspaceId: wid, name: "Hébergeur du scénario · fictif", contact: k("Interlocuteur contractuel à identifier dans l’exercice.") };
  const client = { id: id(), workspaceId: wid, name: "Client des ateliers · fictif", contact: k("Direction formation du client fictif.") };
  const badgeSupplier = { id: id(), workspaceId: wid, name: "Prestataire de badges · fictif", contact: k("Équipe support du scénario.") };
  const systems = [
    { id: id(), workspaceId: wid, name: "Espace candidatures · fictif", description: k("Dossiers reçus, grille d’entretien et accès par habilitation.") },
    { id: id(), workspaceId: wid, name: "Suivi commercial · fictif", description: k("Contacts professionnels et historique des échanges.") },
    { id: id(), workspaceId: wid, name: "Portail ateliers · fictif", description: k("Inscriptions et suivi de présence pour le compte d’un client.") },
    { id: id(), workspaceId: wid, name: "Gestion des badges · fictive", description: k("Association badge / détenteur et journaux d’accès. Projet à examiner.") },
  ];
  const activity = (title: string, role: Activity["role"], system: number, purpose: string): Activity => {
    const a = createActivity(wid, id(), role);
    a.title = title; a.systemIds = [systems[system]!.id];
    a.internalNotes = "NOTE INTERNE DE DÉMONSTRATION : scénario inventé, exclu du dossier partagé.";
    if (a.role === "controller") a.purposes = [{ ...createPurpose(id()), description: k(purpose) }];
    return a;
  };
  const recruitment = activity("Recrutement · exemple fictif", "controller", 0, "Examiner les candidatures reçues pour un poste et organiser les entretiens.");
  recruitment.dataSubjects = k("Candidats aux postes du scénario.");
  recruitment.dataCategories = k("Coordonnées professionnelles, parcours, compétences et compte rendu d’entretien. Aucun dossier individuel dans cette démonstration.");
  recruitment.recipients = k("Équipe RH et responsable du poste, selon leur besoin d’en connaître.");
  recruitment.participantIds = [rh.id]; recruitment.review.subcontractorIds = [host.id]; recruitment.review.collection = "direct";
  recruitment.securityMeasures = k("Hypothèses de l’exercice : comptes nominatifs, accès restreint au poste, revue des habilitations.");
  recruitment.analysis.operations = k("Réception, classement par poste, entretien, décision, puis examen de l’archivage ou de la suppression.");
  recruitment.analysis.access = k("RH : dossiers du recrutement. Responsable du poste : candidatures retenues pour l’entretien.");
  const customers = activity("Relations clients · exemple fictif", "controller", 1, "Répondre aux demandes des clients et suivre les prestations commandées.");
  customers.dataSubjects = k("Interlocuteurs professionnels des clients fictifs.");
  customers.dataCategories = k("Nom professionnel, fonction, coordonnées professionnelles et échanges relatifs à la prestation.");
  customers.recipients = k("Équipe chargée de la relation client et de la prestation.");
  customers.review.collection = "direct"; customers.review.subcontractorIds = [host.id];
  customers.analysis.operations = k("Réception d’une demande, qualification du besoin, suivi de la prestation, archivage à définir.");
  const workshops = activity("Ateliers pour un client · exemple fictif", "processor", 2, "");
  if (workshops.role === "processor") {
    workshops.controllerIds = [client.id];
    workshops.operations = k("Sur instruction du client fictif : gérer les inscriptions, préparer les listes de session et restituer la présence.");
    workshops.instructions = k("Exercice : le client fixe le périmètre des sessions. L’instruction de suppression reste à obtenir.");
  }
  workshops.dataSubjects = k("Participants inscrits par le client fictif.");
  workshops.dataCategories = k("Coordonnées professionnelles, session choisie et présence. Aucun nom de participant n’est saisi ici.");
  workshops.recipients = k("Intervenant de la session et interlocuteur autorisé du client.");
  const badges = activity("Accès aux locaux par badge · projet fictif", "controller", 3, "Limiter l’accès aux locaux aux personnes habilitées, sans mesurer leur temps de travail.");
  badges.dataSubjects = k("Personnel et intervenants habilités dans le scénario.");
  badges.dataCategories = k("Identifiant du badge, détenteur, zone autorisée, date et heure des passages.");
  badges.recipients = k("Gestionnaire des accès pour les habilitations ; équipe sécurité pour un incident documenté.");
  badges.securityMeasures = k("Mesures envisagées, non vérifiées : séparation des rôles, traçabilité des consultations, révocation des badges.");
  badges.review.collection = "direct"; badges.review.subcontractorIds = [badgeSupplier.id];
  badges.analysis.operations = k("Attribuer le badge, vérifier l’habilitation à la porte, consigner les événements utiles et révoquer les accès. La journalisation reste à justifier.");
  badges.analysis.access = k("Gestionnaire : habilitations. Sécurité : incidents. RH : aucun accès aux horaires dans le scénario envisagé.");
  const note = (n: ReviewNote, facts: string, assessment: string, followUp: string): ReviewNote => ({ ...n,
    facts: k(facts), evidence: k("Hypothèse pédagogique à confronter aux pièces : entretien, plan des locaux et procédure d’accès. Aucune pièce réelle n’est fournie."),
    objections: k("Le scénario ne suffit pas à démontrer la nécessité du dispositif."), assessment: k(assessment), followUp: k(followUp) });
  const argumentsByQuestion: Record<string, [string, string, string]> = {
    objective: ["Un local contient du matériel à accès restreint.", "Distinguer la prévention des intrusions du suivi des salariés.", "Décrire les zones et les événements que l’organisme veut prévenir."],
    lawfulness: ["Le fondement juridique n’a pas été arrêté dans cet exercice.", "L’utilité du badge ne démontre pas la licéité du traitement.", "Faire examiner le fondement, les règles du travail et l’information des personnes."],
    effectiveness: ["Un badge autorise ou refuse l’ouverture d’une porte.", "Il ne prouve pas à lui seul qui franchit la porte ; le prêt d’un badge reste possible.", "Tester le dispositif et documenter ses limites."],
    alternatives: ["Deux variantes sont comparées dans l’AIPD : badge sans journal nominatif, accueil humain.", "Comparer les effets sur les personnes, l’objectif et les contraintes de chaque variante.", "Recueillir les éléments permettant de justifier le choix."],
    minimisation: ["Des horaires précis peuvent reconstituer les habitudes de présence.", "Questionner chaque événement conservé et les accès au journal.", "Tester une ouverture sans historique nominatif systématique."],
    rights: ["La notice et le circuit de réponse aux demandes restent à préparer.", "Les personnes doivent pouvoir comprendre le dispositif envisagé.", "Tester le parcours d’information et de demande avec les représentants concernés."],
    safeguards: ["La séparation entre gestion des accès et RH est envisagée.", "Une restriction écrite doit aussi être appliquée dans l’outil.", "Vérifier les habilitations et les traces de consultation avant déploiement."],
    conclusion: ["Des éléments d’appréciation manquent encore.", "Dans le scénario, le dossier est renvoyé pour approfondissement. Aucune autorisation de mise en œuvre.", "Comparer les alternatives et réexaminer les risques résiduels."],
  };
  badges.analysis.notes = badges.analysis.notes.map((n) => note(n, ...argumentsByQuestion[n.questionId]!));
  const flow = (a: Activity, source: string, destination: string, operation: string, data: string, access: string) => {
    a.flows.push({ ...createDataFlow(id()), source: k(source), destination: k(destination), operation: k(operation), data: k(data),
      channel: k("Canal décrit dans l’exercice ; configuration réelle à vérifier."), location: k("Localisation et accès distants à confirmer auprès des intervenants."), access: k(access) });
  };
  flow(recruitment, "Candidat fictif", "Espace candidatures", "Recevoir une candidature", "Parcours et coordonnées professionnelles", "RH du poste concerné");
  flow(recruitment, "Espace candidatures", "Responsable du poste", "Préparer l’entretien", "Candidature sélectionnée", "Accès limité au recrutement concerné");
  flow(customers, "Interlocuteur du client", "Suivi commercial", "Traiter une demande", "Coordonnées et objet de la demande", "Équipe en charge de la prestation");
  flow(workshops, "Client fictif", "Portail ateliers", "Inscrire à une session", "Coordonnées et session", "Équipe chargée de la session");
  flow(workshops, "Portail ateliers", "Client fictif", "Restituer la présence", "Présence à la session", "Interlocuteur autorisé du client");
  flow(badges, "Lecteur de badge", "Gestion des badges", "Vérifier une habilitation", "Identifiant et zone demandée", "Gestionnaire des accès");
  flow(badges, "Gestion des badges", "Équipe sécurité", "Examiner un incident", "Événements d’accès du périmètre de l’incident", "Accès ponctuel à justifier et tracer");
  const doc = (title: string, category: EvidenceReference["category"], a: Activity, parties: string[] = []): EvidenceReference => ({
    id: id(), workspaceId: wid, title, category, activityIds: [a.id], purposeIds: a.role === "controller" ? a.purposes.map((p) => p.id) : [], partyIds: parties,
    scope: "Scénario fictif Maison Sillage", version: "Exercice v1", declaredAuthor: "Équipe fictive de démonstration", internalRef: "EXERCICE / référence inventée, aucun fichier joint",
    publicReference: "", reservations: "Exemple pédagogique : ni document réel ni preuve de conformité.", sensitivity: "internal", status: "declared", reviewedRevision: null,
    reviewedAt: null, reviewDue: null, audience: "Personnes concernées du scénario", channel: "À préciser dans l’exercice", availability: k("Document à demander dans le scénario, non fourni."), contractReview: category === "contract" ? createContractReview() : null,
  });
  const contract = doc("Contrat du prestataire de badges · fictif", "contract", badges, [badgeSupplier.id]);
  contract.contractReview!.notes[0] = note(contract.contractReview!.notes[0]!, "Le prestataire administre les habilitations sur instruction.", "Le périmètre, les catégories de données et la durée de la prestation doivent être explicités dans le contrat à examiner.", "Obtenir le projet de contrat et ses annexes ; aucun contrat n’est présenté comme signé.");
  contract.contractReview!.notes[3] = note(contract.contractReview!.notes[3]!, "Une matrice d’habilitations est envisagée.", "La présence d’une clause ne démontre pas sa mise en œuvre.", "Demander les éléments de vérification des accès et de l’assistance à distance.");
  const notice = doc("Notice candidats · exemple de référence", "notice", recruitment);
  notice.publicReference = "Notice candidats · référence fictive, contenu non fourni";
  w = reviseWorkspace(w, w.revision, at, { jurisdiction: k("Scénario pédagogique situé en France ; applicabilité à examiner."), scope: k("DÉMONSTRATION FICTIVE. Atelier de services : recrutement, relation client, ateliers pour un client et projet de badges."),
    organization: { ...w.organization, contact: k("Organisme inventé pour découvrir RGPDESK. Aucune adresse réelle."), dpo: k("Fonction DPO du scénario, sans personne désignée.") },
    parties: [rh, host, client, badgeSupplier], systems, activities: [recruitment, customers, workshops, badges],
    documents: [notice, contract, doc("Instructions du client ateliers · fictives", "contract", workshops, [client.id]), doc("Analyse des variantes de badges · fictive", "analysis", badges)] });
  const pia = createImpactAssessment(wid, badges, id());
  pia.content.applicability = k("Exercice de cadrage : examiner le dispositif envisagé, les listes applicables et les critères. La démonstration ne tranche pas l’obligation de réaliser une AIPD.");
  pia.content.screeningReason = k("La collecte d’horaires et le contexte professionnel appellent un examen documenté. Le déclenchement reste à décider par le responsable.");
  for (const criterion of pia.content.screening) {
    if (criterion.criterionId === "monitoring") { criterion.answer = "yes"; criterion.reason = k("Hypothèse du scénario : journal nominatif des passages permettant un suivi des présences."); }
    if (criterion.criterionId === "vulnerable") { criterion.answer = "yes"; criterion.reason = k("Hypothèse examinée : relation de dépendance dans le contexte de l’emploi. Qualification humaine à confirmer."); }
  }
  pia.content.principles = pia.content.principles.map((n) => n.questionId === "governance" ? note(n, "Gestion des accès, sécurité et RH ont des besoins différents.", "Définir les rôles et les décisions avant de choisir l’outil.", "Désigner les fonctions responsables de chaque contrôle.") : n);
  pia.content.alternatives = [
    { ...createPiaAlternative(id()), description: k("Badge avec vérification d’habilitation, sans journal nominatif systématique"), purpose: badges.role === "controller" ? badges.purposes[0]!.description : k(""), effectiveness: k("Permet d’ouvrir les portes autorisées ; capacité d’enquête après incident à examiner."), impacts: k("Moins d’historique individuel de présence ; gestion des habilitations toujours nécessaire."), evidence: k("Test et comparaison à produire dans l’exercice."), choice: k("Variante à approfondir, aucun choix arrêté.") },
    { ...createPiaAlternative(id()), description: k("Accueil humain et accès accompagné aux zones sensibles"), purpose: k("Limiter les entrées non autorisées."), effectiveness: k("Dépend des horaires d’ouverture et de la disponibilité d’un accueil."), impacts: k("Évite un journal automatisé systématique ; examiner les éventuels registres manuels."), evidence: k("Observation des flux et étude des contraintes à demander."), choice: k("Comparer la faisabilité avant toute décision.") },
  ];
  const risk = (title: string, event: string, impacts: string) => ({ ...createPiaRisk(id()), title, event: k(event), people: badges.dataSubjects,
    rights: k("Vie privée et protection des données ; effets dans la relation de travail à examiner."), impacts: k(impacts), threats: k("Usage détourné, accès excessifs ou erreur d’habilitation selon le scénario."), supports: k("Journaux de badges et console d’administration."), existingMeasures: k("Mesures proposées dans cet exercice ; efficacité non vérifiée."), initialReason: k("Gravité et vraisemblance à motiver à partir du contexte réel."), residualReason: k("Appréciation laissée ouverte tant que les garanties ne sont pas vérifiées.") });
  pia.content.risks = [risk("Utilisation des horaires à une autre fin", "Les journaux d’accès servent à évaluer la présence au travail.", "Surveillance des habitudes, pression sur les personnes et décisions défavorables."), risk("Accès indu aux habitudes de présence", "Un compte support consulte un historique au-delà d’un incident autorisé.", "Divulgation des horaires et des déplacements au sein des locaux."), risk("Refus d’accès injustifié", "Une erreur ou un badge non révoqué produit une attribution incorrecte.", "Empêchement d’accéder au lieu de travail ou imputation erronée d’un passage.")];
  pia.content.measures = pia.content.risks.map((r, i) => ({ ...createPiaMeasure(id()), riskIds: [r.id], description: k(["Limiter les usages et séparer techniquement les accès RH et sécurité.", "Restreindre le support et examiner les traces de consultation.", "Prévoir un accès de secours et une procédure de correction des habilitations."][i]!), owner: k("Fonction à désigner dans le scénario"), evidence: k("Test à réaliser, aucune vérification réelle déclarée."), effectiveness: k("À apprécier après le test et à relier au risque concerné."), failure: k("Documenter la conduite à tenir si la mesure ne fonctionne pas.") }));
  pia.content.dpoAdvice = k("Exemple d’avis préparatoire : approfondir les alternatives et les restrictions d’usage. Ce texte est fictif, pas un avis juridique.");
  pia.content.monitoring = k("Revoir le dossier si les finalités, les accès ou la journalisation changent ; organiser les tests avant une nouvelle revue.");
  w = putImpactAssessment(w, pia, w.revision, at);
  w = recordPiaReview(w, pia.id, { id: id(), author: "Responsable du scénario · fictif", outcome: "rework", reason: "DÉMONSTRATION : comparer les alternatives, qualifier les risques et obtenir les pièces avant toute décision. Aucune mise en œuvre autorisée." }, w.revision, at);
  for (const [rule, activityId, owner] of [["R-004", recruitment.id, "Équipe RH · fictive"], ["R-005", badges.id, "Équipe achats · fictive"], ["R-006", workshops.id, "Référent client · fictif"]]) {
    const finding = evaluateWorkspace(w, at.slice(0, 10)).find((f) => f.ruleId === rule && f.activityId === activityId);
    if (finding) w = createAction(w, finding, { id: id(), owner: owner!, due: null }, at);
  }
  assertWorkspace(w);
  return w;
}
