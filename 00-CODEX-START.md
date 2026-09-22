# Prompt de départ à envoyer à Codex

Le texte suivant suppose que les fichiers du présent dossier sont accessibles à la racine d'un fork dédié de BLACKPROOF. Dans un nouveau dépôt vide, importer d'abord la base sous licence avec son historique et ses notices ; ne pas créer un dépôt distant ni modifier la production sans autorisation.

```text
Tu travailles sur un nouveau produit de documentation RGPD local-first, nom de travail « RGPD Local », dérivé du dépôt https://github.com/l0gfr/BLACKPROOF-AGPL.

Le produit doit permettre de décrire des activités de traitement, relier des références documentaires, identifier des informations manquantes, suivre des actions et préparer des exports minimisés vérifiables localement. Il ne doit jamais prétendre certifier la conformité d'un organisme.

Lis d'abord les AGENTS.md applicables, README.md, docs/SECURITY_MODEL.md et docs/LOCAL_FIRST_STORAGE.md du dépôt. Puis lis les documents de conception :
- docs/rgpd/SPEC.md
- docs/rgpd/ARCHITECTURE.md
- docs/rgpd/LEGAL-RULES.md
- docs/rgpd/BACKLOG-ACCEPTANCE.md
- docs/rgpd/SOURCES.md
- AGENTS-RGPD.md, à fusionner sans écraser les consignes existantes.

La référence inspectée lors de la préparation est 211166d19543335ff3c1285a963782bdb28985a1. Vérifie le HEAD réellement disponible et consigne les différences qui affectent le travail. Les faits du dépôt priment sur les chemins proposés dans l'architecture. Ne prétends pas que le socle a été audité ou que des tests ont déjà été exécutés.

Travaille dans une branche ou copie dédiée, jamais directement sur la production. N'écrase aucune modification de l'utilisateur. Conserve la licence AGPL-3.0-only, les notices et les attributions applicables. N'effectue aucun remplacement global de marque, d'URL ou de format de fichier.

Ta mission initiale est d'exécuter le LOT 0 puis le LOT 1, et seulement ces lots. N'implémente pas tout le backlog en une passe. Ne te limite pas à produire un plan : réalise la première tranche fonctionnelle.

LOT 0 : cartographier les modules réellement réutilisables, relever les couplages au domaine cyber, exécuter la baseline disponible, ajouter un rapport docs/rgpd/BASELINE.md, installer les consignes et les décisions d'architecture. Vérifier les noms de scripts avant de les lancer. Conserver le lockfile ; pas de migration de framework ni de mise à jour générale des dépendances.

LOT 1 : ajouter packages/privacy-core et une interface RGPD dans apps/web/src/features/privacy. Fournir la création d'un espace chiffré, un registre avec types responsable/sous-traitant distincts, des fiches de traitement, des états inconnus explicites, une sauvegarde chiffrée et sa restauration sans écrasement silencieux. Utiliser les primitives existantes via un adaptateur, mais ne pas enregistrer le nouveau domaine sous le schéma cyber. Ajouter les tests unitaires, stockage et E2E du lot.

Contraintes impératives :
1. Aucune donnée métier sur le réseau : pas d'API applicative, analytics, CDN, police distante, modèle distant, upload, synchronisation ou lien contenant un identifiant métier. Tous les schémas nécessaires sont embarqués.
2. Ne pas réinventer la cryptographie. Préserver les primitives et protections existantes ; contrôler explicitement le contexte attendu de toute donnée authentifiée AAD. Toute donnée déchiffrée ou importée reste non fiable jusqu'à validation de schéma et d'invariants.
3. Séparer domaine métier, interface, persistance et exports. Le domaine ne dépend ni de Svelte, ni d'IndexedDB, ni du DOM.
4. Pas de score de conformité, aucune base légale ou durée inventée, aucun « conforme » automatique. Ne pas transformer une proposition législative en règle applicable. Ne jamais inventer une validation humaine d'un catalogue juridique.
5. Pas de pièces justificatives binaires dans le coffre : références documentaires et métadonnées minimisées uniquement. Des fichiers de registre peuvent être importés plus tard, dans un parcours distinct et borné.
6. Pas d'export public du master. Les exports partageables seront une projection par liste blanche dans le LOT 3. Le LOT 1 livre uniquement une sauvegarde chiffrée, clairement nommée.
7. Aucun contrôle de sécurité assoupli pour faire passer les tests : pas de unsafe-inline, unsafe-eval, désactivation de CSP, validation fictive ou test neutralisé.
8. Employer uniquement des données de démonstration fictives. Ne jamais inclure de données réelles ou de secret dans des fixtures, captures, logs ou réponses.

Avant de conclure, exécute les contrôles réellement disponibles, dont pnpm verify:all si le script existe toujours. Une restriction de l'environnement doit être signalée précisément, jamais présentée comme un test passé.

Le compte rendu final doit contenir : fichiers modifiés, parcours implémenté, décisions prises, tests exécutés et résultats, tests bloqués et cause, limites restantes, commande de démarrage vérifiée et prochain lot recommandé. N'annonce aucune fonctionnalité non implémentée. Ne pousse pas de commit ni ne déploie sans autorisation explicite.
```

## Prompt de continuation

```text
Lis les AGENTS.md applicables, docs/rgpd/BASELINE.md, les documents de conception et les résultats du dernier lot. Vérifie l'état réel du dépôt. Exécute seulement le prochain lot non terminé de docs/rgpd/BACKLOG-ACCEPTANCE.md. Conserve les invariants de sécurité, les formats historiques et les fichiers de l'utilisateur. Ajoute les tests de recette propres au lot et exécute les régressions. Documente les écarts plutôt que de simuler leur résolution. Termine par les preuves de fonctionnement et les limites restantes. Aucun déploiement ni push sans autorisation.
```

## Pourquoi des lots séparés

La séparation évite de produire simultanément un registre, un moteur juridique, une gestion de crise et un nouveau système cryptographique. Chaque lot possède une sortie utilisable et une recette indépendante. La première version publiable correspond à l'achèvement des lots 0 à 3, pas au seul premier lot.
