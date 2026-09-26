# Finitions visuelles du 26 septembre 2026

La palette bleue et les accents cuivrés restent les repères du bureau. Cette passe affine les contours des pictogrammes, les filets des cartes, les reliefs et les états actifs. Les ornements ne portent aucune information métier et n'interceptent pas les clics.

## Périmètre

- `iconography.css` : relief commun discret, filets de chapitre, repères cuivrés sur l'atlas, menu actif et contrôles de dépliage, liens et flèches de la visite.
- `Pictogram.svelte` : cercle gradué et arc cuivré dans le dessin existant, sans ressource distante.
- Aucun changement de modèle, de stockage, de chiffrement, de dépendance ou de contrat d'export. Les formats de rapports téléchargés restent inchangés.
- Les effets de survol sont réservés aux pointeurs précis. Les transitions ajoutées respectent la réduction des animations ; des adaptations sont prévues pour les couleurs forcées et le contraste renforcé.

## Vérifications locales

Node 22.23.2, pnpm 10.34.5, lockfile conservé.

- `pnpm check` : réussi, 0 erreur, 0 warning ; 12 hints Astro hérités.
- `pnpm build` : réussi, 54 pages. Fontconfig a signalé l'absence de cache inscriptible ; la commande a terminé avec le code 0.
- `pnpm security:audit` : scan de secrets et audit statique réussis.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4399 PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm exec playwright test tests/e2e/privacy/documentation.spec.ts tests/e2e/privacy/demo.spec.ts tests/e2e/privacy/navigation.spec.ts --project=chromium --workers=1` : 17 réussis, aucun ignoré. Couverture des contrastes au repos/survol/clavier, vues de 320 à 1440 px, navigation, protection des saisies et parcours de démo.
- Navigateur interne : inspection visuelle de l'accueil, du registre fictif, des cartes illustrées et des cartes de coffre à 390 px.
- `git diff --check` : réussi.

Firefox et Safari non exécutés. Les modes système de couleurs forcées et de contraste renforcé ont été relus dans les styles, sans vérification visuelle dédiée. La suite complète de publication est exécutée par la CI sur le commit à livrer.
