# Préparation de l’évolution méthodologique AIPD

État du 25 septembre 2026. Cette note distingue les aides intégrées de la refonte encore à instruire avec l’autrice. Aucune validation d’Estelle De Marco n’est présumée.

## Parcours intégré

1. **Principes généraux** : lecture des faits issus du registre, des sous-finalités, fondements déclarés et conservations. Les groupes D1/D2 et leurs flux restent reliés aux mêmes données. Les justifications et appréciations sont distinctes des faits : une fiche remplie ne produit pas une conclusion favorable.
2. **Nécessité** : aide complémentaire repliable en quatre parties, adaptée des CC1 à CC4 du guide N&P. Elle utilise les notes, alternatives et mesures existantes, sans deuxième inventaire. Le questionnaire historique et les notes déjà enregistrées ne sont pas réinterprétés.
3. **Risques humains**, également disponible dans **Risques & mesures** sans ouverture d’AIPD : catalogue local de 12 pistes CEDH. L’utilisateur choisit un droit, puis crée explicitement un scénario. Seuls le titre, le droit à examiner et sa référence sont repris. Les faits, conséquences, niveaux et conclusion restent inconnus. Un scénario libre reste possible.

La création d’un scénario utilise le schéma existant et le plafond de 30 scénarios. Aucune nouvelle base persistante, migration, dépendance ou connexion métier. La recherche parcourt uniquement le catalogue embarqué. Ouvrir une source externe demeure une action volontaire.

## Séparation des examens

| Examen | Faits réutilisés | Raisonnement propre |
| --- | --- | --- |
| Principes généraux du RGPD | Finalités, catégories, flux, supports, destinataires, durées et garanties déclarées | Applicabilité, licéité, minimisation, exactitude, information, droits, responsabilités et transferts |
| Nécessité et proportionnalité approfondies | Même ensemble de traitements, opérations et usages | Besoin, efficacité démontrée, limitations de droits, alternatives, bilan et effectivité des garanties |
| Risques pour les droits et libertés | Mêmes personnes, opérations, usages et mesures | Conséquences du fonctionnement prévu, détournements et incidents ; vraisemblance et gravité motivées |
| Risques SI et sécurité du traitement | Supports, accès, données et mesures | Événements affectant notamment confidentialité, intégrité et disponibilité, avec leurs conséquences pour les personnes |

Cette organisation est un choix de produit, pas l’affirmation de quatre procédures légalement obligatoires pour tout organisme. Les modèles CNIL de février 2018 permettent d’organiser faits et justifications ; leur remplissage ne permet pas de déduire automatiquement le respect d’un principe. Le document CNIL « bases de connaissances », §1.4, fournit aussi des exemples d’impacts sur les personnes, à contextualiser.

L’article 35 §7 b) prévoit une évaluation de nécessité et de proportionnalité dans l’AIPD. Le caractère facultatif de l’aide approfondie ne doit jamais désactiver cet examen ni la règle de décision actuelle. La portée de l’article 32, celle des articles 24/25 et celle de l’article 35 restent distinctes.

## Lecture du guide N&P fourni

Source : Estelle De Marco, *Guide d’analyse de nécessité et de proportionnalité*, v1.2 du 20 septembre 2026, CC BY 4.0. Lecture des colonnes de méthode A à C uniquement dans l’onglet « Analyse N & P » ; aucun résultat d’exemple repris. Les références sont consultées dans « Références analyse N & P ».

| Bloc | Plage de méthode | Adaptation intégrée et portée |
| --- | --- | --- |
| CC1 | A8:C75 | Besoin précis, usages ultérieurs, motif admis pour limiter un droit dans le cadre applicable, gravité, immédiateté, urgence, efficacité, existant et apport supplémentaire |
| CC2 | A76:C156 | Attentes, caractéristiques des personnes, comportements affectés, étendue des limitations et alternatives praticables |
| CC3 | A157:C172 | Bénéfices démontrés et bilan. L’aide reste une synthèse des intitulés et de l’explication de méthode lus en A:C |
| CC4 | A173:C211 | Portée des engagements, clarté, précision, accessibilité, stabilité, réalisation et contrôle des correctifs |

L’aide est une synthèse de lecture et non une transcription exhaustive du classeur. Les notions élaborées pour l’action publique ne sont pas des obligations universelles à plaquer sur les PME. L’examen du champ applicable reste nécessaire.

La bibliographie du classeur référence notamment les outils EDPS de nécessité (2017) et proportionnalité (2019), WP211 et des arrêts CEDH. Les deux PDF EDPS français n’ont pas pu être lus par l’outil web lors de cette passe ; leurs passages ne sont pas présentés comme vérifiés indépendamment. La synthèse intégrée est attribuée au guide fourni, pas à ces documents non relus.

## Catalogue des droits et libertés

Sources officielles, versions et paragraphes sont intégrés dans `apps/web/src/features/privacy/rights-catalogue.ts`. Les guides article 8 et article 11 anglais du 28 février 2026 ont été préférés aux traductions françaises plus anciennes servies au moment de la lecture. Les autres fiches précisent leur édition française.

Les questions sont reformulées par RGPDESK. Le catalogue est partiel, n’établit pas l’applicabilité d’un droit et ne présume pas de violation. Les guides du greffe ne lient pas la Cour. La Convention engage les États, avec des obligations de protection pouvant concerner les relations privées : la transposition à un traitement d’entreprise reste à justifier.

Le droit est le point de départ de la saisie, avant l’événement et les conséquences. C’est une première aide à l’analyse centrée sur les personnes, **pas une implémentation complète d’EBIOS RM ni un modèle autonome de biens premiers**.

## Suite à instruire avant une refonte de la trame enregistrée

- Faire relire la correspondance des questions par l’autrice, notamment les critères non condensables, les conditions d’application des garanties et l’articulation entre fondement juridique et justification d’une limitation.
- Versionner toute nouvelle méthode de saisie, ses libellés et la restitution, pour conserver le sens des décisions historiques. Ne pas renommer silencieusement les anciennes réponses au fondement juridique en analyse de limitation d’un droit.
- Définir une correspondance explicite avec chaque tableau des modèles CNIL, en séparant reprise factuelle et appréciation humaine. Aucune compatibilité de fichiers avec le logiciel CNIL n’est actuellement annoncée.
- Examiner les liens structurés droit → scénario → flux/opération → garantie, et les risques pesant sur les garanties elles-mêmes, sans créer de saisies redondantes.
- Garder l’analyse des mesures hors traitement de données comme un futur domaine distinct. Le « PIA bis » pour une législation ou une autre restriction de liberté n’est pas implémenté et ne doit pas être présenté comme une AIPD RGPD.

## Sources publiques de cadrage

- [RGPD, publication officielle, articles 24, 25, 32 et 35](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R0679), consulté le 25 septembre 2026.
- [CNIL, PIA modèles, février 2018](https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-2-fr-modeles.pdf), contexte et principes fondamentaux.
- [CNIL, PIA bases de connaissances, février 2018](https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-3-fr-basesdeconnaissances.pdf), §1.4, conséquences et appréciation contextualisée.
- [Cour européenne des droits de l’homme, guides de jurisprudence](https://ks.echr.coe.int/fr/web/echr-ks/all-case-law-guides), références précises dans le catalogue.
