# Aides de lecture des grilles, 23 septembre 2026

La comparaison des deux guides d’Estelle De Marco a conduit à 16 aides contextuelles dans les notes existantes : huit pour l’examen RGPD et huit pour la nécessité/proportionnalité. Elles couvrent les points à approfondir sans nouveau champ, état d’avancement, score ou choix automatique. La correspondance détaillée destinée à la relecture est conservée hors du dépôt public, sans exemples de l’analyse fournie.

`method-hints.ts` est un catalogue éditorial statique. `MethodHints.svelte` le rend comme texte échappé dans un élément `details`. Le choix du catalogue est explicite dans ActivityEditor et PiaPanel, jamais déduit des valeurs du coffre. Aucune donnée n’est envoyée, copiée dans les notes, dans un historique ou dans un export. Les identifiants des questions et les schémas ne changent pas. Les aides ont leur édition éditoriale propre ; elles ne font pas passer une ancienne revue pour une revue de la nouvelle grille.

Sources A05/A06 dans SOURCES.md. Les attributions sont visibles dans chaque aide et dans le guide public, avec le titre, la version, les repères, la mention d’adaptation, l’exclusion des exemples et le lien CC BY 4.0. Aucun classeur original, résultat rempli, nom de client ou exemple anonymisé n’est intégré au code, aux fixtures ou à la démonstration.

La correction PC en lieu de PS dans le guide RGPD est prise en compte dans la comparaison, sans modifier le classeur source. Le champ territorial n’est pas réduit au lieu de résidence : les conditions des articles 2 et 3 et celles d’une règle nationale doivent rester distinctes.

Les articles 24, 25 et 32 prennent en compte les risques pour les personnes hors de l’obligation d’AIPD. L’article 35 §7 précise le contenu de l’AIPD. L’application ne transforme pas cette articulation en obligation de deux matrices particulières. Depuis le 24 septembre 2026, l’entrée Risques & mesures permet cet examen sans ouvrir une AIPD. Une ouverture ultérieure reprend les mêmes scénarios et mesures. L’AIPD conserve son analyse des risques, conformément à l’article 35 §7.

Les groupes D1/D2 relient désormais sous-finalités, catégories, parcours, conservation, minimisation et garanties. Les tableaux descriptifs peuvent être repris explicitement dans la restitution AIPD. Écarts restant à instruire : revue détaillée de chaque critère ; bilan bénéfices/atteintes ; reprise référencée de tous les examens déjà conduits ; correspondance exhaustive des modèles CNIL. Le rapport AIPD par liste blanche n’est pas un export importable dans le logiciel CNIL.

Les aides sont une adaptation partielle. La pertinence juridique et la transposition des raisonnements CEDH/Charte au contexte de chaque organisme restent à relire. Les titres et conclusions historiques ne sont pas silencieusement renommés.

La refonte iconographique reste dans le domaine privacy : pictogrammes SVG locaux, emblèmes décoratifs masqués aux technologies d’assistance, mêmes libellés et actions. Aucun paquet, image distante, script externe, changement de CSP ou de persistance. Les styles sont préfixés par `.rgpdesk`.

Recette : `pnpm check`, `pnpm test`, `pnpm build`, contrôles CSP / artefact / dépendances / secrets, E2E Chromium du dépôt et parcours manuel du navigateur interne. Les aides sont testées au clavier, hors ligne, sans changement de valeurs du brouillon et à 320, 390, 768 et 1440 px. Les résultats exacts sont consignés dans le compte rendu de livraison.
