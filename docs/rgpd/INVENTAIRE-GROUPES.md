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
