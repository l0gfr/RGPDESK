# Baseline RGPDESK, lot 0

Établie le 22 septembre 2026, avant modification du code RGPD.

## Origine et isolation

- Socle : `https://github.com/l0gfr/BLACKPROOF-AGPL`, branche `main`, HEAD `211166d19543335ff3c1285a963782bdb28985a1`.
- Ce HEAD correspond exactement à celui du brief. Le checkout source était propre. Le dépôt historique `BLACKPROOF` contient de nombreuses modifications utilisateur et n’a pas été modifié.
- Copie Git indépendante, avec historique et sans hardlinks : `/Users/bluetouff/Desktop/DEV/RGPDESK`. Aucun reset, nettoyage ni renommage global.
- `upstream` conserve la référence BLACKPROOF-AGPL ; `origin` désigne `https://github.com/l0gfr/RGPDESK`. Le dépôt distant public a été créé sur demande explicite, sans push. Aucun déploiement.
- Le chemin saisi sans séparateur entre le nom utilisateur et Desktop a été interprété comme le répertoire de développement existant `Desktop/DEV`.
- `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, `TRADEMARKS.md`, les auteurs et l’historique restent conservés. Le README distingue la dérivation RGPDESK et conserve le README amont.
- Les huit documents du ZIP sont conservés ; son README est placé dans `docs/rgpd/BRIEF-README.md` pour ne pas écraser celui du socle.

## Instructions et documentation lues

Instructions utilisateur, `apps/web/AGENTS.md`, `SECURITY.md`, `README.md`, `docs/SECURITY_MODEL.md`, `docs/LOCAL_FIRST_STORAGE.md`, puis `00-CODEX-START.md`, `AGENTS-RGPD.md`, SPEC, ARCHITECTURE, LEGAL-RULES, BACKLOG-ACCEPTANCE et SOURCES.

Le nouvel `AGENTS.md` adopte les consignes RGPD sans remplacer celles d’Astro. Les instructions embarquées dans le brief sont appliquées dans la portée de la demande utilisateur : lots 0 et 1 uniquement. Leur ancienne interdiction de créer un dépôt distant n’annule pas la demande explicite de créer le dépôt public vide.

## Environnement effectivement utilisé

- Node **22.23.2**, exigé par `.nvmrc` et les manifests. Le Node 26 par défaut n’a pas été utilisé pour qualifier le code.
- pnpm **10.34.5**, exigé par `packageManager`.
- Installation de la baseline : `pnpm install --frozen-lockfile`, réussie.
- Versions résolues du socle : Astro 7.2.8, Svelte 5.56.8, TypeScript 6.0.3, Dexie 4.4.4, Vitest 4.1.11, Playwright 1.62.1. Aucune migration de framework.
- Le runtime Node a été téléchargé depuis nodejs.org dans un dossier de travail et son SHA-256 comparé au fichier officiel SHASUMS256. Aucune installation globale modifiée.
- L’accès réseau initial de `gh` était indisponible en sandbox. Les opérations GitHub et le contrôle complet ont ensuite été exécutés avec l’accès autorisé. Ce premier échec réseau n’est pas un test passé.

## Baseline exécutée

Commande réelle : `pnpm verify:all`. **Code de sortie 0.**

| Étape | Résultat avant modification |
| --- | --- |
| Lint, schémas historiques, vecteurs et types | Réussis ; 0 erreur et 0 warning Astro/Svelte, 11 hints Astro hérités |
| Domaine cyber | 159 tests réussis |
| Bibliothèques web historiques | 75 tests réussis |
| Vérificateur | 14 tests réussis |
| MCP historique | 9 tests réussis |
| Scripts de régression | 58 tests réussis |
| Build statique, CSP Apache, open-source check | Réussis |
| Sécurité des artefacts | 15 tests réussis |
| `pnpm audit` | Aucune vulnérabilité connue signalée lors de cette exécution |
| `pnpm security:audit` | Scan de secrets et audit statique réussis |
| Playwright Chromium | 125 réussis, **3 ignorés** |

Les trois tests ignorés concernent le Knowledge Vault cyber et requièrent des profils de build distincts (`disabled-during-controlled-pilot` ou `enabled-after-product-convergence`). Ils n’ont pas été activés artificiellement. Ils ne constituent pas une qualification passée du Knowledge Vault. Aucun test RGPD n’existait dans la baseline.

## Cartographie et décisions

| Module | Décision et couplage |
| --- | --- |
| `apps/web/src/lib/local-encryption.ts` | Réutilisé sans modification : WebCrypto AES-GCM 256, PBKDF2 SHA-256 à 600 000 itérations, sel 16 octets, IV 12 octets. L’adaptateur RGPD contrôle le contexte attendu avant de déchiffrer et valide le résultat. |
| `sensitive-page-lock.ts` | Réutilisé sans modification : 15 minutes d’inactivité et 1 minute en arrière-plan, temps écoulé incluant la veille. |
| `local-db.ts` | Fortement lié aux dossiers cyber, snapshots et migrations. Non utilisé pour persister du RGPD. Nouveau namespace Dexie avec transactions, révisions, époques et annulation. |
| `local-backup.ts` | Couplé au master et aux snapshots cyber. Non réutilisé comme format RGPD. Une sauvegarde JSON bornée contient un inventaire et un master chiffrés ensemble ; aucun ZIP à décompresser au lot 1. |
| `packages/core`, `packages/verifier`, `packages/mcp` | Conservés pour les régressions. Aucun import métier cyber ni MCP dans le domaine RGPD. |
| Génération Ajv standalone | Convention reprise dans un générateur distinct ; schémas embarqués, aucun chargement distant ni génération dynamique en navigateur. |
| Build Astro / CSP / sécurité statique | Conservés. L’audit statique couvre aussi `packages/privacy-core/src`. |
| Lockfile | Conservé ; seuls les liens du nouveau workspace sont ajoutés. Aucun changement de résolution externe. |

Voir `ADR-001.md` pour le contrat de stockage et les limites. Le compte rendu final du lot 1 figure dans `LOT-1.md`.

## Limites de la baseline

Le succès des contrôles ne constitue ni un audit de sécurité indépendant ni une certification. Les routes et outils de publication cyber sont conservés pour les régressions, et ne constituent pas un déploiement RGPDESK prêt à publier. La distribution publique séparée, sa notice de confidentialité et ses métadonnées de release restent à traiter au jalon de publication après les lots 2 et 3.
