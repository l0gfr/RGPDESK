# Démonstration finale, liens et lisibilité

## Dossier public fictif

`/app/privacy/demo/` propose trois rapports passifs : registre responsable, registre sous-traitant et AIPD. Leur balisage Astro statique est produit par `node scripts/generate-privacy-demo.mjs`, uniquement depuis `createDemoWorkspace`, par les véritables projections par liste blanche et renderers d’export. `buildDemoReports` ne prend aucun argument et n’accède à aucun coffre. Les tests comparent chaque page au contenu complet du renderer. Aucun mécanisme d’insertion HTML ni exception à l’audit statique n’est ajouté. Les exemples privés des classeurs transmis ne sont pas utilisés.

Les pages présentent un dossier pédagogique fixe. Les réserves et la revue AIPD à approfondir sont conservées. Elles ne reflètent pas les essais en mémoire de la démo. Les sélections et confirmations restent nécessaires pour exporter son propre travail. Le registre et l’AIPD sont des restitutions distinctes, consultables sans JavaScript et imprimables.

Les feuilles `assets/demo-report-register.css` et `assets/demo-report-pia.css` reproduisent exactement les styles des renderers ; un test empêche leur divergence. Une feuille de lecture séparée agrandit les petits textes des aperçus publics et leur impression. Les exports téléchargeables et leur vérification restent inchangés. Les feuilles sont chargées comme assets locaux versionnés, sans assouplir la CSP. Les listes de routes de packaging, de vérification et l’exemple Apache n’admettent que les quatre nouvelles pages prévues.

## Navigation par rubrique

`navigation.ts` autorise quinze slugs de rubrique, avec le préfixe optionnel `demo/`. Aucun nom de client, identifiant, recherche ou contenu de formulaire n’est placé dans une URL. Un lien privé attend une ouverture explicite du coffre ; il ne sélectionne ni ne crée un coffre. Un lien de démo ouvre un exercice fictif neuf.

La navigation du menu met à jour le fragment. Retour/Avancer et un changement direct de fragment passent par les gardes de saisie existantes. Une saisie modifiée demande confirmation ; l’annulation conserve texte et rubrique. L’historique n’est pas un mécanisme de restauration des brouillons. Les liens désignent une rubrique, pas une fiche individuelle.

## Tailles de lecture

Le texte secondaire à l’écran est porté à au moins 0,875 rem (14 px avec la taille navigateur usuelle), les champs à 1 rem (16 px), les labels à 0,9375 rem. Les tailles supérieures restent hiérarchisées. Les styles restent dans le domaine RGPD, sans modification de la typographie cyber. Les tableaux des aperçus publics sont également agrandis à l’écran et à l’impression ; le format canonique des fichiers exportés reste inchangé.

Les tests contrôlent les tailles calculées des textes visibles, les champs et l’absence de débordement global à 320 et 1440 px, sur les pages publiques, les rubriques de démonstration et les rapports. Les nouvelles restitutions sont aussi contrôlées sans JavaScript et aux largeurs 390 et 768 px. Cela ne constitue pas un audit complet d’accessibilité.
