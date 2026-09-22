# Spécification produit — RGPD Local

Version 1.0, 22 septembre 2026. Les identifiants entre crochets renvoient à `SOURCES.md`. Les objectifs chiffrés et les choix d'architecture sont des propositions, pas des performances mesurées.

## 1. Proposition de valeur

**Savoir quelles données une organisation traite, pourquoi, avec qui, pendant combien de temps, sur quels documents elle s'appuie et ce qu'elle doit encore examiner.** Pouvoir transmettre la partie utile de ce dossier sans exposer tout le reste.

L'outil ne sera ni un générateur de politique de confidentialité présenté comme suffisant, ni un scanner de cookies, ni un « DPO automatique ». La cible initiale proposée est le référent RGPD d'une petite organisation et le consultant qui travaille sur plusieurs missions séparées. Il s'agit d'une hypothèse produit à tester, pas d'un marché chiffré établi.

Le registre constitue un bon point d'entrée : la CNIL le présente comme une vue structurée des traitements, utile au pilotage, et distingue les informations relatives aux responsables et aux sous-traitants. [J01, J03]

## 2. Ce qui vient de BLACKPROOF

Réutiliser le principe d'un dossier local chiffré, les références documentaires, les réserves, les exports relus, les sauvegardes, la vérification locale et les protections contre les imports malveillants. Le README et le modèle de sécurité décrivent ces mécanismes. [B01, B02, B03]

Le domaine actuel est en revanche organisé autour de `ProofCase`, `ProofQuestion`, `EvidenceItem`, `ProofDebt` et `ProofPack`. Un champ `framework: "RGPD"` ne remplace pas une modélisation des traitements et des finalités. La nouvelle application a donc son propre modèle et ses propres formats. [B05]

## 3. Périmètre de la première version publiable

La V1 correspond aux lots 0 à 3 du backlog. Elle couvre la création d'espaces chiffrés, les registres responsable et sous-traitant, les fiches de traitement, les organisations et intervenants, les références documentaires, les manques explicables, les décisions, le plan d'action, l'import CSV borné, les exports relus et la restauration.

Elle permet de consigner qu'une AIPD ou une analyse de transfert doit être examinée et de référencer un travail externe. Elle ne prétend pas encore conduire intégralement ces analyses. Elle ne gère pas encore les demandes de droits ni les violations comme des workflows spécialisés.

Les usages hors profil France/UE sont signalés comme à examiner. Ne pas conclure automatiquement que le RGPD ne s'applique pas à une organisation hors UE ; les questions de champ territorial et les régimes nationaux demandent un examen dédié. Les traitements Police-Justice et les procédures sectorielles ne sont pas assimilés au profil général.

## 4. Parcours principal

### Entrer dans l'application

La page publique présente la promesse, les limites et un dossier de démonstration fictif. Aucune création de compte. L'utilisateur crée un espace pour une organisation ou une mission et choisit une phrase secrète. Le titre métier et les coordonnées restent dans le contenu chiffré. Il est averti de l'absence de récupération de sa phrase secrète.

L'espace affiche immédiatement son état de sauvegarde et un accès explicite au verrouillage. Plusieurs missions sont possibles, mais pas une collaboration simultanée entre plusieurs personnes. Les intitulés de personnes affectées aux actions sont des déclarations, pas des comptes authentifiés.

### Constituer le registre

Deux voies : créer une fiche ou importer un registre CSV. L'import présente les colonnes, propose une correspondance et demande confirmation. Les lignes rejetées et les colonnes ignorées sont visibles. Il n'y a ni écrasement silencieux, ni fusion automatique sur un nom d'activité.

Des modèles de départ peuvent couvrir la gestion des salariés, le recrutement, la facturation, la relation client, les formulaires de contact ou une prestation SaaS. Ils contiennent des questions et des exemples, pas des bases légales présélectionnées ou des durées réputées universelles.

### Décrire une activité

La fiche s'ouvre par le but concret : « Gestion des candidatures » plutôt que le nom d'un logiciel. Le logiciel utilisé, les données et les prestataires viennent ensuite.

Le formulaire expose progressivement le rôle de l'organisation, les finalités, les catégories de personnes et de données, les sources, destinataires, systèmes, règles de conservation, transferts, mesures et documents. « Je ne sais pas » est une réponse explicite. Une fiche incomplète est sauvegardable.

Les champs prévus par l'article 30 et les champs supplémentaires utiles à la documentation sont visuellement distingués. Les bases légales et notices peuvent être indispensables à l'analyse RGPD sans être chacune une rubrique expressément énumérée dans l'article 30. [J01, J02, J04]

### Documenter et décider

Une référence documentaire peut être un contrat, une notice, une procédure d'exercice des droits, une politique de conservation, un compte rendu ou une mesure technique. Elle possède un périmètre, une version et un état : attendue, déclarée, référence disponible, revue, périmée ou non partageable.

Une référence disponible n'est pas considérée comme un document lu ou juridiquement suffisant. « Revue » enregistre qui déclare avoir effectué la revue, quand, sur quel périmètre et avec quelles réserves ; ce n'est pas une identité certifiée.

Une pièce manquante crée une proposition d'action. L'utilisateur peut l'affecter, la dater, la relier à plusieurs traitements et expliquer sa clôture. Recalculer les règles ne doit pas recréer indéfiniment les mêmes tâches.

### Préparer un dossier

L'utilisateur choisit la finalité de l'export : registre article 30, revue interne ou extrait destiné à un client. Il voit exactement les champs et fichiers qui sortiront. Les champs internes sont absents de la projection, pas masqués par CSS.

Les exports sont explicitement marqués selon leur portée : complet pour le profil documentaire vérifié, incomplet, ou extrait. Le logiciel ne convertit aucun de ces états en « conformité ». Un dossier présentant des lacunes peut être partagé avec ses réserves ; un manque d'information ne doit pas empêcher une communication urgente.

## 5. Écrans

Navigation principale proposée : **Vue d'ensemble / Registre / Intervenants / Documents / Actions / Dossiers**. Le coffre et ses sauvegardes restent accessibles dans un menu stable. Les modules « Droits », « Violations » et « Analyses d'impact » n'apparaissent pas comme fonctionnels avant leur implémentation.

La vue d'ensemble doit répondre à des questions concrètes : quels traitements ne sont pas revus, quelles informations sont manquantes, quels documents doivent être renouvelés, quelles décisions restent à prendre et quelles actions arrivent à échéance.

Éviter une jauge globale. Préférer des comptes vérifiables, par exemple « 4 fiches sans durée ou critère documenté » et « 3 analyses à examiner ». Chaque chiffre ouvre la liste qui le compose et expose son périmètre. Un éventuel indicateur de complétude dit quelles rubriques il compte, jamais « score RGPD ».

Utiliser des libellés accessibles, une vraie navigation clavier, des erreurs associées au champ et des états non fondés sur la seule couleur. Réutiliser les composants et conventions visuelles pertinents de BLACKPROOF sans dupliquer son grand éditeur cyber. Les graphiques ne sont pas prioritaires ; une liste exploitable passe avant un graphe décoratif.

## 6. Documents et minimisation

Ne pas transformer l'outil RGPD en nouveau dépôt de données personnelles. Les fichiers clients, listes de salariés, copies de pièces d'identité et exports de bases métier n'ont pas leur place dans le coffre de la V1.

Les références de documents restent internes par défaut. Le nom du fichier, son chemin, son URI et son éventuelle empreinte sont sensibles tant que leur publication n'est pas explicitement décidée. Une référence partageable est un champ distinct, écrit pour le destinataire.

L'import d'un registre CSV est permis parce que c'est l'objet métier de l'application ; il ne vaut pas autorisation d'ingérer toute pièce jointe. Une éventuelle fonction de calcul local d'empreinte de document est ultérieure, bornée, sans stockage du binaire ni promesse de lecture de son contenu.

Les champs de texte libre autorisés à l'export sont prévisualisés. Une politique de champs ne peut pas garantir qu'un utilisateur n'a pas collé le nom d'un salarié dans une réserve partageable. La revue humaine et la minimisation restent nécessaires.

## 7. Modules suivants

### Demandes de droits — lot 4

Suivre un identifiant local de demande, sa réception, le droit invoqué, les traitements concernés, l'identité vérifiée de façon proportionnée, les actions, les échéances, la réponse et sa preuve d'envoi. Ne pas stocker de copie d'identité par défaut.

Le délai général de l'article 12 est exprimé en mois, pas en jours fixes ; les prolongations sont motivées et leur information suivie séparément. Les régimes sectoriels sont détectés comme hors calcul général. Le refus, la limitation et les droits des tiers nécessitent une décision documentée, pas une réponse juridique automatique. [J04, J05]

Le logiciel prépare un projet de réponse et une liste de vérifications. Il n'extrait pas les données des SI, ne les supprime pas à distance et n'envoie pas le courrier. Un export de registre ne constitue pas à lui seul une réponse à une demande de copie de données. [J05]

### Violations — lot 4

Distinguer survenance, détection et prise de connaissance ; conserver la chronologie et les raisons des décisions. Séparer le rôle de responsable de celui de sous-traitant et les décisions relatives à l'autorité et aux personnes concernées. Enregistrer aussi les violations non notifiées. [J06]

Le module prépare une trame et un suivi des compléments, sans prétendre notifier la CNIL. L'application fermée n'assure aucun rappel. Un export calendrier éventuel utilise un titre neutre et prévient que l'événement sera traité par le service de calendrier choisi.

### AIPD et transferts — lot 5

Ajouter d'abord un questionnaire d'orientation sourcé : contexte, critères, listes applicables, justification et décision humaine. Une alerte de dépistage n'est pas une AIPD terminée. L'analyse complète examine notamment nécessité, proportionnalité, risques pour les personnes, mesures et risques résiduels. [J07]

La CNIL fournit déjà un logiciel PIA open source. Évaluer une passerelle de fichiers après examen du schéma réel d'une version précise ; ne pas inventer une compatibilité. Le simple référencement d'une AIPD externe est possible avant toute passerelle. [J08]

Pour les transferts, suivre les intervenants et les accès, pas uniquement le pays du datacenter. Les mécanismes invoqués, entités couvertes, dates et analyses restent contextualisés. [J09]

## 8. Limites volontairement acceptées

Aucune synchronisation, aucune collaboration temps réel, aucun portail destinataire, aucune vérification en ligne de certificat ou de statut de fournisseur. Pas de moteur de workflow distribué, blockchain, recherche vectorielle ni agent IA dans la V1.

La première qualification navigateur reprend Chrome/Edge desktop, comme le périmètre annoncé par BLACKPROOF. Safari et Firefox doivent faire l'objet de tests propres avant toute promesse de support ; l'ouverture de la page publique ne constitue pas une qualification du coffre. [B00]

Le fonctionnement métier doit continuer sans réseau après chargement de ses ressources nécessaires. Un rechargement intégral hors ligne n'est pas garanti sans stratégie de distribution/cache testée. Ne pas introduire un service worker comme simple raccourci marketing.

## 9. Validation produit et lancement

Tester le parcours sur trois organisations entièrement fictives : une petite association, une entreprise avec salariés et un prestataire SaaS agissant pour ses clients. Puis proposer des essais utilisateurs encadrés avec données fictives ou minimisées, sans collecte automatique des dossiers.

Critère qualitatif : l'utilisateur doit pouvoir expliquer ce que l'outil sait, ce qu'il ignore, ce qu'il a personnellement déclaré et ce qui sera partagé. La valeur attendue est le dossier maîtrisé et maintenable, pas le nombre de cases cochées.

Reporter compte, paiement et offres commerciales après validation de cet usage. Des services de migration, formation et accompagnement sont des pistes à tester ; aucune hypothèse de revenu n'est intégrée à l'architecture.
