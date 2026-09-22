# Plan d'exécution et recette

Version 1.0, 22 septembre 2026. Aucun calendrier ni effort chiffré n'est présumé. Une version publiable demande les lots 0 à 3 et les revues de publication. Les lots suivants enrichissent un produit déjà utilisable.

## LOT 0 — Baseline et isolation

**But :** connaître le socle réel et protéger le produit existant.

Créer une branche/copie dédiée sans toucher aux modifications de l'utilisateur. Lire les AGENTS.md, relever HEAD et versions, inspecter couplages du stockage/exports, localiser les tests pertinents. Conserver lockfile, notices et formats. Ne pas lancer une migration de framework.

Produire `docs/rgpd/BASELINE.md` : référence Git, commandes disponibles, résultats, tests bloqués, modules repris tels quels, adaptateurs nécessaires et risques. Ajouter les décisions d'architecture et fusionner les instructions d'agent. Vérifier notamment la présence effective de `pnpm verify:all`.

**Recette :** état de départ reproductible ou blocages précisément documentés ; aucune donnée ni ressource de production modifiée ; aucun test déclaré passé sans exécution.

## LOT 1 — Une vraie fiche dans un coffre

**But :** créer, conserver, fermer puis retrouver un registre.

Ajouter `privacy-core`, les types responsables/sous-traitants, les schémas du master, les invariants de liens et les fonctions de commande. Implémenter espace chiffré, liste et édition de traitements, distinction finalités/systèmes/intervenants et informations inconnues. Le formulaire peut sauvegarder un brouillon incomplet.

Créer un adaptateur de persistance au namespace propre. Réutiliser et tester chiffrement, contexte authentifié, révisions, verrouillage et protections multi-onglets. Ajouter la sauvegarde chiffrée et la restauration complète sans collision silencieuse. Pas d'export partageable en clair dans ce lot.

**Recette :** créer un organisme fictif, une activité responsable et une activité sous-traitante ; fermer/réouvrir ; retrouver les données après phrase secrète ; restaurer dans un profil vierge. La mauvaise phrase, le fichier tronqué et la collision sont refusés sans altérer l'existant. Aucune donnée métier lisible dans les stores, URL ou logs.

**Tests essentiels :** schéma et invariants, séparation des rôles, relation inter-espace rejetée, WebCrypto réel, altération d'enveloppe, substitution de contexte AAD, verrouillage pendant opération, quota dépassé, deux onglets et ancien onglet après effacement.

## LOT 2 — Import, documents, décisions et actions

**But :** passer de la fiche statique au dossier maintenable.

Ajouter import CSV avec mapping et aperçu, provenances internes bornées, références documentaires sans binaires, décisions et tâches dédupliquées. Implémenter les contrôles documentaires de la V1, leur explication et les sources du catalogue. Les règles proposées non revues ne sont pas présentées comme des conclusions officielles.

Fournir des modèles fictifs et des filtres par information manquante, responsable d'action, périmètre et échéance. Une clôture d'action et sa justification sont conservées. Les revues à refaire sont visibles sans réécrire le passé.

**Recette :** importer un CSV hétérogène, voir chaque ligne/colonne non reprise, rattacher un contrat de référence, constater un manque de conservation, créer puis clôturer une action. Aucun défaut de mapping ne transforme une inconnue en réponse favorable.

**Tests essentiels :** encodage, colonnes doublonnées, limites, texte hostile, formule CSV, valeurs inconnues, import annulé, absence de fusion silencieuse, stabilité des constats, absence de duplication d'actions et catalogue modifié.

XLSX est une extension optionnelle du lot : ne le déclarer disponible qu'après inspection des parseurs/précontrôles existants et validation de leurs cas hostiles. Ne pas retarder le parcours CSV pour annoncer une compatibilité générale avec tous les formats CNIL.

## LOT 3 — Dossier partageable et vérificateur

**But :** produire un livrable utile sans fuite du coffre.

Implémenter profils article 30 responsable/sous-traitant, revue interne et extrait client. Construire un DTO par liste blanche ; générer JSON, CSV et rapport HTML à partir de ce même objet. Ajouter prévisualisation, confirmation liée à la révision, réserves, manifests et snapshots chiffrés de livraison.

Créer le vérificateur navigateur et la CLI minimale utilisant le même contrat de format. Vérifier schéma, liens, inventaire, tailles et empreintes, sans accès réseau. Prévoir texte d'explication de ce qui n'est pas vérifié. Aucune signature, API publique ou registre de statut nécessaire.

**Recette :** un registre complet pour le profil documentaire est lisible ; un extrait se déclare comme extrait ; un dossier incomplet communique ses limites. Le destinataire peut vérifier localement le paquet. Aucune référence interne, donnée d'un autre client ou correspondance d'identifiants n'est incluse par défaut.

**Tests essentiels :** canaris de fuite placés dans tous les champs internes puis recherche récursive dans chaque fichier du ZIP ; neutralisation CSV ; HTML sans script ; byte altéré ; hash faux ; entry supplémentaire/manquante ; chemins traversants ; doublons ; version inconnue ; lien cassé ; CLI/browser cohérents ; changement après revue ; ancien snapshot inchangé.

Un test de hash invalide ne prétend pas empêcher un attaquant de recalculer toutes les empreintes. Le libellé de résultat doit exprimer la limite d'authenticité.

## Publication de la V1 — contrôle transversal

Relecture réelle du catalogue et des libellés, documentation des limites et qualification navigateur. Audit ciblé des adaptations du coffre et des exports ; ne pas assimiler le passage des tests à un audit complet. Contrôler le build de production, CSP, absence de trafic métier, notices et dépendances.

Retirer les écrans factices et les liens cyber non destinés à la nouvelle distribution. Rendre visibles source, licence, version du logiciel et version du catalogue. Publier une démonstration synthétique, le guide de sauvegarde/restauration et les procédures de signalement de sécurité.

**Recette globale :** sur build de production, charger les seules ressources statiques attendues, couper le réseau, puis réaliser création, édition, import, sauvegarde, restauration, préparation et vérification d'export. Vérifier également l'absence de tentatives d'envoi pendant les actions. Tester les cas de données perdues/quota/phrase oubliée sans message de récupération fictif.

## LOT 4 — Droits et violations

**But :** documenter des processus sensibles, pas automatiser leur exécution externe.

Ajouter demandes de droits, échéances du profil général, cas hors périmètre, décisions, projets de réponse et références de preuve d'envoi. Ajouter incidents, chronologie, qualification du risque, décisions d'information/notification et compléments. Enregistrer également les violations non notifiées.

**Recette :** un utilisateur sait qui doit faire quoi et selon quelle échéance calculée ou déclarée ; les calculs spéciaux sont explicitement hors périmètre lorsqu'ils ne sont pas implémentés. Aucune pièce d'identité n'est exigée par défaut. La fermeture du navigateur n'est pas présentée comme compatible avec des rappels garantis.

**Tests essentiels :** mois calendaires, fins de mois, années bissextiles, conditions de prolongation, cas de jours non ouvrés documentés, régimes spéciaux, absence de pause inventée, prise de connaissance distincte de détection, changement d'heure sur une durée de 72 heures, sous-traitant sans faux délai standard, notification partielle et preuves d'envoi uniquement déclarées.

## LOT 5 — AIPD et transferts approfondis

**But :** compléter l'analyse sans créer un automate de décision juridique.

Ajouter dépistage AIPD avec inconnues, sources versionnées, listes/critères et décisions motivées. Ajouter analyses et avis, risques pour les personnes, mesures et risque résiduel. Évaluer une passerelle PIA uniquement contre une version et des fichiers réels inspectés, avec fixtures synthétiques. À défaut, garder la référence externe.

Compléter les analyses de transferts : entités, pays, accès, mécanismes, garanties, documents et revue. Aucun statut favorable automatique fondé sur un logo, un pays ou un contrat simplement téléversé.

**Recette :** risque inconnu ne signifie pas faible ; une analyse externe garde sa provenance et sa version ; une nouvelle finalité ou un nouveau prestataire déclenche une revue, sans réécrire les anciens dossiers.

## Matrice de tests négatifs transversaux

1. **Perte/confusion :** phrase incorrecte, mauvais espace, ancien onglet, stockage effacé, quota, interruption, sauvegarde partielle, restauration sur identifiant existant.
2. **Entrées hostiles :** JSON profond, champs inconnus, chaînes trop longues, contrôle bidirectionnel, URI dangereuse, HTML/SVG actif, formule CSV, ZIP bomb, nom d'entrée ambigu ou traversant.
3. **Fuite :** texte interne, autre client, chemin de fichier, trace d'import, identifiant stable, hash interne, titre de téléchargement, URL, logs et erreur du parser.
4. **Fausse assurance :** document référencé considéré comme validé, base légale par défaut, inconnue considérée comme exemption, score global, ancien catalogue présenté comme actuel, hash présenté comme certification.

## Données de recette

Uniquement fictives. Association avec bénévoles et infolettre ; entreprise avec paie/recrutement/facturation ; fournisseur SaaS responsable de sa prospection et sous-traitant de plusieurs clients. Ajouter volontairement une durée inconnue, une notice ancienne, un contrat seulement déclaré, une analyse externe et une question de transfert.

Les marqueurs de fuite doivent être uniques, par exemple `NEVER_EXPORT_INTERNAL_NOTE_7D31`, pour permettre une vérification de tous les octets décodés des fichiers livrés. Un test textuel ne remplace pas la vérification structurelle de la liste blanche : les deux sont exigés.

## Définition de terminé

Un lot est terminé lorsqu'il dispose d'un parcours réel utilisable, de tests exécutés, d'une documentation mise à jour et d'une liste honnête de limites. Un mock de chiffrement, une capture d'un écran vide ou des cases vertes construites depuis des fixtures ne constituent pas une preuve de fonctionnement.

Le rapport d'agent sépare systématiquement implémenté/testé, implémenté/non testé, prévu/non implémenté et revue humaine encore nécessaire.
