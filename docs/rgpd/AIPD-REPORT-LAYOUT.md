# Restitution graphique AIPD

Le rapport AIPD reprend la direction graphique des registres : couverture bleu ardoise, sommaire illustré, rubriques numérotées, cartes pour les appréciations et les alternatives, scénarios de risques reliés aux mesures sélectionnées. La démonstration publique utilise le même moteur de rendu que le téléchargement.

## Parcours

Dans « Restitution AIPD », choisir l'étude, la version, les rubriques, le destinataire et le périmètre. La préparation affiche maintenant le rapport mis en page. Le sommaire et les liens risque/mesure restent dans l'aperçu ; ils ne changent pas la rubrique de l'application. « Lire toutes les valeurs sélectionnées » conserve l'accès au tableau détaillé. La confirmation de relecture reste indispensable avant la conservation et le téléchargement.

La démonstration complète est visible à `/app/privacy/demo/aipd/`. Le fichier téléchargé reste un HTML autonome et passif, imprimable depuis le navigateur. Sa feuille de style comprend une présentation papier, des précautions de coupure et une pagination lorsque le navigateur prend en charge les boîtes de marge CSS.

## Fidélité et confidentialité

- Le moteur reçoit uniquement une `PiaPublication` déjà projetée par la liste blanche existante. Il ne reçoit pas le coffre ou l'étude complète.
- Chaque ligne sélectionnée est rendue une fois dans les rubriques détaillées. La synthèse peut reprendre un titre ou une position déjà sélectionnés, sans ajouter de données.
- Les compteurs décrivent uniquement les rubriques, scénarios et mesures présents dans l'extrait. Ils ne mesurent ni la conformité ni l'avancement global de l'étude.
- Les quatre niveaux de risque sont présentés indépendamment, sur l'échelle déclarée de 1 à 4. Une appréciation inconnue reste « Non appréciée », sans niveau rempli. Aucun score, produit gravité/vraisemblance ou réduction du risque n'est calculé.
- Les liens ne relient que les références de scénarios et mesures présentes dans la sélection. Les références non résolues restent du texte. Les ancres sont numériques et n'exposent aucun identifiant du coffre.
- Les libellés historiques inconnus et les phrases de niveaux non reconnues restent affichés en texte. Aucune migration du coffre n'est requise.

## Implémentation

`packages/privacy-core/src/pia-report.ts` construit un arbre de présentation à balises contrôlées. Les valeurs de publication deviennent du texte ; les chemins SVG, classes et cibles de liens sont produits par le programme. La sérialisation HTML échappe les textes. `pia-report-style.ts` contient la feuille de style locale, dont l'empreinte exacte est incluse dans la CSP du fichier : `default-src 'none'`, style par SHA-256, `base-uri 'none'`, `form-action 'none'`.

L'adaptateur `apps/web/src/features/privacy/pia-preview.ts` construit le même arbre avec `createElement`, `createElementNS` et `createTextNode`. Il ne parse pas de HTML fourni par une publication. Le composant `PiaReportPreview.svelte` l'isole dans un Shadow DOM et intercepte seulement la navigation interne au rapport. La feuille locale est préchargée à l'entrée de l'application pour permettre sa lecture après déconnexion réseau.

`node scripts/generate-privacy-demo.mjs` régénère la page fictive et sa feuille CSS depuis le moteur réel. Les tests comparent la démonstration à cette génération, ainsi que le corps DOM de l'aperçu au corps HTML téléchargé.

## Publications conservées

Les restitutions AIPD conservent les valeurs projetées, pas les octets d'un ancien fichier HTML. Le téléchargement d'une publication conservée applique donc la présentation actuelle à ses valeurs figées. Les fichiers déjà téléchargés restent inchangés. Le format des paquets de registre et leur vérificateur ne changent pas ; l'AIPD demeure un rapport distinct de ce vérificateur.

## Contrôles de recette

- Tests unitaires de couverture de toutes les lignes, valeurs inconnues, rubriques omises, références historiques, CSP et échappement.
- Parcours hors ligne : sélection explicite, aperçu réellement stylé, relecture, conservation et téléchargement identique.
- Rapport public sans JavaScript : huit rubriques, liens réciproques risque/mesure, absence de débordement de 320 à 1440 px, texte courant d'au moins 14 px.
- Impression Chromium : toutes les lignes restent visibles ; contrôle visuel des 11 pages de l'exemple fictif en A4 avec marges de 12 mm. La pagination dépend du contenu, des paramètres d'impression et du navigateur. Aucun autre moteur d'impression n'a été qualifié dans cette modification.
