# RGPDESK : livraison des lots 0 et 1

Date : 22 septembre 2026. Statut : implémenté et validé localement. Aucune publication de code ni mise en production.

## Dépôts et parcours

- Dépôt public créé : https://github.com/l0gfr/RGPDESK. Vérifié public, non archivé, taille 0, aucune branche distante. Aucun push.
- Répertoire local : `/Users/bluetouff/Desktop/DEV/RGPDESK`.
- Base : BLACKPROOF-AGPL `211166d19543335ff3c1285a963782bdb28985a1`, avec historique. Travail présent dans l’arbre local, non commité. Source BLACKPROOF-AGPL toujours propre ; modifications de BLACKPROOF historique préservées.
- Entrée : `/app/privacy/`. Aperçu local du build validé : http://127.0.0.1:4328/app/privacy/.

Le parcours testé crée un organisme fictif avec phrase secrète confirmée, ajoute un intervenant et un système, crée une activité responsable avec finalité et une activité sous-traitante liée à un client responsable, puis conserve des informations explicitement inconnues. Les fiches peuvent être modifiées, enregistrées comme brouillon ou archivées. L’organisation, son périmètre et ses coordonnées sont éditables.

L’utilisateur peut verrouiller, recharger puis rouvrir son coffre après saisie de la phrase. Il peut télécharger une sauvegarde chiffrée complète et la restaurer dans un profil vierge. Une mauvaise phrase, un fichier tronqué, un contexte AAD incohérent ou une collision d’espace sont refusés. Les tests comparent les octets existants avant et après les échecs.

L’effacement local est explicite, exige `EFFACER`, invalide les autres onglets et ne prétend pas effacer les sauvegardes téléchargées ou les copies externes. Aucun export partageable n’est présent dans le domaine RGPD.

## Sécurité appliquée

- Namespace IndexedDB RGPD distinct, sans index métier en clair.
- Primitives WebCrypto du socle inchangées, AES-GCM 256 et PBKDF2 SHA-256 à 600 000 itérations.
- AAD attendue liée au produit, au format, à l’UUID, à la nature master/sauvegarde et à la révision.
- Schémas fermés, validateurs Ajv générés, limites de taille/profondeur et invariants des liens vérifiés après déchiffrement.
- Écriture atomique avec contrôle de révision et d’époque ; rejet des vues obsolètes et des restaurations concurrentes.
- Annulation des résultats et transactions au verrouillage. Verrouillage manuel, après 15 minutes d’inactivité, 1 minute en arrière-plan et lors du départ de la page.
- Aucun contenu métier dans les URL, titres de page, noms de téléchargement, console ou métadonnées persistées en clair.
- Rendu textuel des entrées hostiles, aucune insertion HTML dynamique. Libellés et descriptions de formulaire séparés pour l’accessibilité.
- CSP de build conservée, aucun assouplissement `unsafe-inline` / `unsafe-eval`, aucun trafic métier. Le test hors ligne surveille aussi les appels réseau et violations CSP, y compris les tentatives bloquées.
- Aucune nouvelle dépendance externe. Le lockfile ne change que pour les deux liens du workspace RGPD. Les résolutions externes ont été comparées intégralement et sont identiques.

Les fichiers de licence/notices, primitives de chiffrement, stockage/backup cyber, verrouillage et configuration CSP ont été comparés au HEAD amont : identiques octet par octet. Aucun contrôle historique supprimé.

## Commandes et résultats

Exécutées avec Node 22.23.2 et pnpm 10.34.5.

| Commande | Résultat |
| --- | --- |
| `pnpm install --frozen-lockfile` | Baseline installée avec succès |
| `pnpm install --lockfile-only --offline`, puis `pnpm install --frozen-lockfile --offline` | Liens workspace ajoutés ; aucune version externe modifiée |
| `pnpm schema:generate` puis `pnpm schema:check` | Schémas RGPD générés et contrôlés ; schémas historiques inchangés |
| `pnpm test:privacy` | 12 tests métier + 8 tests cryptographiques réussis |
| `pnpm test:privacy:e2e` | 16 tests réussis après correction des libellés ; 3 cas supplémentaires ensuite intégrés au contrôle global final |
| `pnpm verify:all` final | **Code de sortie 0** : lint, schémas, vecteurs, types, 350 tests unitaires/scripts/artefacts réussis, build statique, CSP, audits, puis **144 E2E Chromium réussis, 3 ignorés** |
| `git diff --check` | Réussi |
| `pnpm dev --background --host 127.0.0.1 --port 4328` puis `pnpm --filter @blackproof/web exec astro dev status` | Démarrage et statut vérifiés ; serveur de développement ensuite arrêté volontairement |
| `pnpm preview --host 127.0.0.1 --port 4328` | Aperçu du build statique démarré pour la livraison locale |

Détail des 350 tests hors navigateur : cyber 159, privacy-core 12, web 83 dont 8 RGPD, vérificateur 14, MCP historique 9, scripts 58, sécurité des artefacts 15. Les 144 E2E regroupent 125 régressions historiques et 19 nouveaux tests RGPD. Aucun test RGPD ignoré.

Couverture négative RGPD exécutée : champs/versions inconnus, connaissances ambiguës, liens inter-espace ou pendants, confusion responsable/sous-traitant, IDs dupliqués, limites UTF-8/cardinalité/profondeur, caractères de contrôle et bidi, texte HTML hostile rendu inerte, paramètres cryptographiques affaiblis/excessifs, altération de ciphertext, substitution AAD, plaintext authentifié invalide, inventaire de sauvegarde incohérent, interruption de transaction, échec quota, verrouillage pendant écriture/déchiffrement/restauration, mutation du document appelant pendant chiffrement, course d’écriture/sauvegarde/restauration et ancien onglet après effacement.

Les tests de quota injectent une `QuotaExceededError` à la frontière native d’écriture IndexedDB ; ils ne remplissent pas physiquement le disque. Les tests de verrouillage utilisent le vrai WebCrypto, avec des barrières de planification contrôlées pour rendre les courses reproductibles. Le harnais de stockage est construit par Playwright et servi sur une route interceptée uniquement pendant le test ; il n’est pas livré dans le build.

Une première vérification a détecté un type de message trop étroit et des avertissements de réactivité Svelte, corrigés. La première recette E2E a détecté des noms accessibles comprenant les textes d’aide, corrigés dans l’interface. Ces exécutions initiales étaient en échec ; seule l’exécution finale ci-dessus est qualifiée de réussie.

## Non exécuté, avertissements et limites

- **Trois E2E hérités ignorés** : les trois scénarios Knowledge Vault de `tests/e2e/knowledge-base.spec.ts`, conditionnés par des profils de build distincts et inactifs ici. Aucun succès revendiqué pour ces scénarios.
- Astro conserve 11 hints hérités ; Astro et Svelte indiquent 0 erreur et 0 warning. Le warning Fontconfig hérité apparaît lors de la génération d’images cyber ; les étapes concernées et les tests passent.
- Le parcours est testé avec Chromium. Edge Desktop, Safari, Firefox et navigateurs mobiles ne sont pas qualifiés. La mise en page a été testée à 1280, 390 et 320 pixels et contrôlée visuellement sur desktop et à 390 pixels ; cela ne constitue pas une qualification mobile.
- Aucun audit de sécurité indépendant, revue juridique humaine, test de production ou déploiement effectué. Les tests ne certifient pas le produit.
- Les champs juridiques restent déclaratifs. Le lot 1 ne prétend pas fournir un registre juridiquement complet ni un moteur de conformité. Responsabilité conjointe structurée, conditions articles 9/10, documentation des contrats et analyses détaillées restent à développer selon le backlog.
- Les sauvegardes utilisent la phrase du coffre. Pas de récupération de phrase, de changement de phrase, de remplacement d’espace ou de fusion automatique dans ce lot.
- Archivage d’activité et effacement global du coffre sont disponibles ; purge sélective d’une activité et gestion de ses futurs documents/snapshots non implémentées.
- Une modification non enregistrée est perdue au verrouillage ; le chiffrement ne protège pas une session ouverte d’un poste compromis. Aucune garantie d’effacement physique de la mémoire JavaScript.
- Le stockage dépend du domaine et du profil navigateur, et peut être effacé. La persistance renforcée du navigateur n’est pas demandée par cette nouvelle interface ; sauvegarder reste nécessaire. Le rechargement intégral hors réseau n’est pas garanti.
- Les routes et outils cyber restent conservés pour les régressions. Ce build mixte ne doit pas être déployé tel quel sur RGPDESK.fr. Le choix des routes publiques, la notice de confidentialité propre au domaine et la publication du source relèvent du jalon de publication après les lots 2 et 3.

## Démarrage

Depuis le dépôt local, après activation de **Node 22.23.2** et **pnpm 10.34.5** :

```sh
cd /Users/bluetouff/Desktop/DEV/RGPDESK
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1 --port 4328
```

Ouvrir http://127.0.0.1:4328/app/privacy/. Le serveur actuellement démarré sert le build statique ; il n’est accessible que localement. Pour travailler sur le code, la commande de développement vérifiée est `pnpm dev --background --host 127.0.0.1 --port 4328`, après arrêt de l’aperçu qui utilise ce port. Le serveur de développement utilise les mécanismes locaux de rechargement d’Astro ; les preuves de CSP et d’absence de trafic métier portent sur le build statique.

## Prochain lot

**Lot 2 seulement, sur nouvelle instruction** : import CSV local borné avec mapping et aperçu, références documentaires sans binaires, décisions, actions dédupliquées et contrôles documentaires sourcés. Les exports partageables par liste blanche et leur vérificateur restent au **lot 3**.

## Fichiers modifiés et ajoutés

La liste exhaustive est fournie dans le rapport de livraison joint. Les familles de changements sont : domaine/schémas dans `packages/privacy-core`, interface/adaptateurs dans `apps/web/src/features/privacy`, route `apps/web/src/pages/app/privacy/index.astro`, tests dans `tests/e2e/privacy` et `tests/fixtures/privacy`, documentation `docs/rgpd` et instructions racine. Les six fichiers historiques modifiés sont `README.md`, `package.json`, `apps/web/package.json`, `apps/web/vitest.config.ts`, `pnpm-lock.yaml` et `scripts/security-audit.mjs`.
