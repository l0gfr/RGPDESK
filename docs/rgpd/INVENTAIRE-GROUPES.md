# Inventaire par groupes et risques réutilisables

Édition du 24 septembre 2026.

## Contrat de données

`rgpd-master-v9` ajoute des groupes optionnels aux activités, des références de groupes aux flux et une portée optionnelle `risks`/`aipd` à l’étude. Les schémas v1 à v8 ne changent pas. La migration v8 valide strictement sa source puis change uniquement le discriminant en mémoire ; aucun groupe, lien, fondement ou délai n’est inventé. Le coffre n’est réécrit qu’à la sauvegarde explicite. Les anciennes revues et leurs contextes restent figés.

Chaque groupe possède un UUID, un repère Dn dans son activité, des catégories, des sous-finalités liées, une règle de conservation, cinq examens de minimisation et les garanties déclarées. Une règle différente appelle un groupe distinct. Les flux référencent les groupes ; ils ne peuvent simultanément recopier leurs données. Références inter-activités, identifiants dupliqués, repères dupliqués et propriétés inconnues sont refusés. Les liens sont également validés dans les contextes historiques.

20 groupes et 20 flux maximum par activité. Les repères d’un groupe existant ne sont pas renumérotés. Les champs restent bornés. Les projections restent soumises aux plafonds de leurs formats ; aucun contenu n’est tronqué silencieusement pour produire un export. Les descriptions générales antérieures sont conservées, sans conversion automatique. Une synthèse dont une composante nécessaire est inconnue reste inconnue ; le détail des groupes permet de lire les faits déjà documentés.

Les groupes sont inclus dans le brouillon chiffré `rgpd-draft-v2` ; les brouillons v1 restent lisibles. Le chiffrement, les clés, l’AAD, les transactions et les époques ne changent pas. Aucune nouvelle base, aucun trafic ni stockage clair.

## Réutilisation et publication

Cartographie, lecture du registre, dossier DPO lié et contexte AIPD projettent les mêmes faits. L’analyse des risques possède une entrée autonome ; elle réutilise le modèle de scénarios et de mesures existant. Une portée `risks` ne peut ni enregistrer une revue AIPD ni produire sa restitution. L’ouverture explicite d’une AIPD conserve les scénarios et identifiants ; une étude AIPD ne peut être rétrogradée silencieusement. Les changements de groupe sont détectés par les revues existantes.

La restitution AIPD possède une rubrique facultative explicite « Groupes de données, flux et minimisation ». Seules ses lignes de présentation sélectionnées sont projetées ; UUID, localisations de preuves et notes privées restent exclus. HTML échappé, PDF passif, formats de partage historiques préservés. L’extrait article 30 reprend les catégories et conservations déclarées ; il ne publie pas automatiquement les examens de minimisation ni les garanties de groupe.

## Portée

L’ordre objectifs → données et parcours → protection → fondement est ergonomique. Il ne définit pas une chronologie autorisée pour commencer un traitement. Les obligations et appréciations restent humaines. Les tableaux sont une adaptation descriptive partielle des modèles CNIL, pas une transposition exhaustive des grilles ni un export natif CNIL. L’entrée Risques & mesures traite les conséquences pour les personnes ; le dossier Sécurité SI existant reste distinct.

Sources et portée juridique : SOURCES.md et METHODE-GRILLES.md. Les exemples de démonstration sont fictifs, indépendants des classeurs privés.

## Régressions ciblées

Tests de migration stricte, sauvegarde/restauration avec WebCrypto et IndexedDB réels, brouillons v1/v2, liens et historique, projections par liste blanche, échappement, repères stables et promotion risques → AIPD. Parcours navigateur : décrire un groupe avant le fondement, conserver les champs ouverts pendant la saisie et restituer uniquement la rubrique sélectionnée.

## Suggestions locales de déclarations

Le volet de réutilisation projette les champs explicitement autorisés du coffre ouvert et de l’activité en cours. Le brouillon remplace sa version enregistrée dans la projection. Une activité d’un autre espace, un coffre verrouillé ou une activité archivée ne fournit aucun candidat. Pas de cache global, de persistance supplémentaire, de réseau ou de nouveau schéma.

Les valeurs identiques sont dédupliquées par texte (NFC, sans fusion de valeurs de casse différente) ; la provenance et le nombre d’occurrences sont affichés. Douze résultats au maximum sont rendus, les autres restent recherchables. La recherche est littérale et bornée ; le rendu est du texte Svelte échappé. Aucune décision juridique, note privée ou revue historique n’alimente les suggestions. Les noms d’entités déjà liées ne deviennent pas des copies libres.

Une sélection remplit uniquement le champ choisi. Un contenu existant demande confirmation avant remplacement. Les durées ne sont jamais préremplies, leur déclencheur reste distinct. Les régressions vérifient réutilisation en cours de saisie et entre fiches, maintien des identifiants et liens, isolation des clients, verrouillage et absence de contenu métier clair dans IndexedDB, les stockages Web et les URL.


## Parcours ordonnés, version 10

`rgpd-master-v10` ajoute un catalogue optionnel `flowSupports` à chaque ensemble et une branche optionnelle `journey` aux flux. Une branche contient un repère (1a, 1b…), des références de sous-finalités et des étapes ordonnées : opération, supports référencés, origine/destination liées (y compris aux supports) ou libres, canal, accès, condition et lieux. Les groupes restent la source des catégories et conservations. La synthèse des sous-finalités du groupe réunit ses liens antérieurs et ceux de ses parcours, sans enregistrer de copie.

La migration v9 valide la source puis change seulement le discriminant en mémoire. Aucun parcours n’est inféré à partir d’un texte. Les champs du flux parent restent inconnus lorsqu’il possède des étapes : deux versions concurrentes des mêmes faits sont refusées. Les identifiants de supports/étapes, références, doublons et bornes sont contrôlés dans les états courants et figés. Un support ou un parcours déjà enregistré conserve son repère. Une suppression ne réserve pas le repère indéfiniment ; l’identité est portée par l’UUID.

Les schémas historiques restent inchangés. Les nouvelles saisies récupérables utilisent `rgpd-draft-v3` ; les brouillons v1/v2 restent lus avec leurs validateurs propres. Aucun changement cryptographique, de base de données ou de politique réseau. Limites : 20 supports/ensemble, 20 flux ou parcours/ensemble, 8 étapes/parcours. Les liens restent dans le même ensemble ; aucun rapprochement automatique entre clients.

Les parcours alimentent la carte de l’application, les faits du registre, les dossiers liés et le contexte figé des revues. Les formats de partage existants sont conservés : projection textuelle ordonnée sur liste blanche, pas d’identifiants de supports/étapes ni de notes privées. Les plafonds d’export restent bloquants ; aucune troncature silencieuse. La frise détaillée est une vue de l’application, pas un nouveau format de publication.

## Description, analyse et état cible

La cartographie est une représentation calculée des éléments et liens déclarés. Elle ne découvre pas les flux. La description peut précéder l’analyse ou être enrichie pendant celle-ci. Une description corrigée n’atteste pas la mise en œuvre d’une garantie.

Deux suites produit sont identifiées : pour l’existant, relier les correctifs aux éléments concernés et préparer un plan d’action priorisé ; pour un projet, construire une description cible en conservant l’état de référence. Cette livraison ajoute les parcours structurés. Elle ne crée pas encore de comparaison initial/cible, de nouvel examen par étape ni de génération automatique du plan d’action. La minimisation reste au niveau du groupe, les actions dans leur module existant. Les revues figées existantes restent intactes.
