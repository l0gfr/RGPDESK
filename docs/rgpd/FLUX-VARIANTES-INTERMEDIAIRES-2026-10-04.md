# Variantes, enchaînement et intermédiaires des flux

État : qualification locale de l’implémentation le 4 octobre 2026, avant publication. Ce compte rendu ne constitue pas une preuve de CI ou de déploiement.

## Parcours livré

- La troisième étape de la fiche s’appelle **Les flux**. Les catégories de données gardent leur propre intitulé.
- **Où se situe ce flux ?** décrit un départ sans précédent, une fin sans suite, une position inconnue, une suite à renseigner ou des liens vers plusieurs flux déjà décrits. Les liens sont réciproques et restent dans le même ensemble de traitement.
- **Plusieurs opérations, supports ou lieux ?** prépare des alternatives indépendantes. Le nombre de combinaisons est affiché avant création. Chaque variante conserve les groupes D1/D2 et les sous-finalités liés. Les étapes successives se décrivent dans un parcours ou par les liens précédent/suivant.
- **Y a-t-il un intermédiaire ?** crée deux flux liés : origine → intermédiaire, puis intermédiaire → destination. Dans un parcours, on choisit l’étape concernée. Les passages antérieurs et postérieurs sont conservés. Les éléments non connus du nouveau passage restent à renseigner ; aucune opération, habilitation ou règle juridique n’est inventée.
- Les liens sont visibles dans la carte et pris en compte dans le suivi des changements des analyses. Le partage conserve sa sélection explicite et sa projection par liste blanche, sans publier les identifiants internes.
- Retirer un flux remet ses liens devenus isolés en attente de description. La fiche doit ensuite être enregistrée.

Les préparations des deux volets rejoignent la fiche après **Créer** ou **Scinder**. Refermer le volet conserve sa préparation dans la rubrique courante ; créer les flux avant de changer de rubrique. L’enregistrement de la fiche conserve les flux dans le coffre.

## Stockage et sécurité

Le nouveau format maître est `rgpd-master-v12`, le nouveau brouillon `rgpd-draft-v5`. Les anciens schémas et validateurs sont conservés. La migration à l’ouverture est uniquement en mémoire : elle ne réécrit pas le coffre. Le prochain enregistrement passe par les contrôles existants de révision, de verrouillage et de transaction chiffrée.

Le chiffrement, les contextes AAD, les espaces de stockage et la CSP restent inchangés. Aucun service distant, dépendance fonctionnelle ou stockage métier en clair ajouté. La licence reste inchangée. La publication inclut la mise à jour de sécurité de la dépendance de construction décrite ci-dessous, avec son lockfile et ses notices. Le répertoire préexistant `deploy/rgpdesk/__pycache__/` est préservé.

Les entrées et liens sont bornés et validés. La limite existante de 20 flux/parcours par ensemble est conservée ; une création trop volumineuse échoue sans résultat partiel. Un partage dont le texte projeté dépasse la limite du format est refusé, sans troncature silencieuse.

## Validation exécutée

Runtime : Node 22.23.2, pnpm 10.34.5. Suites lourdes exécutées séparément, sans déclencher GitHub Actions.

| Commande | Résultat final |
| --- | --- |
| `pnpm check` | Réussi : lint, schémas, vecteurs, types ; Astro sans erreur ni avertissement, 12 hints préexistants ; Svelte sans erreur ni avertissement |
| `pnpm build` | Réussi : 54 pages |
| `pnpm --filter @rgpdesk/privacy-core exec vitest run --maxWorkers=1` | 244 tests réussis, 18 fichiers |
| `pnpm --filter @blackproof/web exec vitest run --maxWorkers=1` | 157 tests réussis, 25 fichiers |
| `pnpm --filter @rgpdesk/privacy-verifier test` | 15 tests réussis |
| `pnpm exec playwright test tests/e2e/privacy/flow-branches.spec.ts tests/e2e/privacy/flow-journeys.spec.ts --workers=1` | 5 tests réussis sur le build statique |
| `pnpm exec playwright test tests/e2e/privacy/data-groups.spec.ts tests/e2e/privacy/corrective-actions.spec.ts tests/e2e/privacy/lots23-storage.spec.ts tests/e2e/privacy/lots23-workflow.spec.ts tests/e2e/privacy/recovery-storage.spec.ts tests/e2e/privacy/review-trace.spec.ts tests/e2e/privacy/reusable-declarations.spec.ts --workers=1` | 31 tests de régression réussis sur le build statique |
| `node --test scripts/privacy-release.test.mjs scripts/public-wording.test.mjs scripts/bounded-file-read.test.mjs scripts/secret-scan.test.mjs` | 46 tests réussis |
| `pnpm security:audit` | Recherche de secrets et audit de sécurité réussis |
| `git diff --check` | Réussi |
| `pnpm test:privacy:deploy` | 7 tests réussis : activation, refus et retour arrière ; aucun lancement de sauvegarde |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4402 pnpm test:privacy:e2e` | 129 tests réussis sur le build statique, Chromium, 10 min 36 s |

Les tests Playwright utilisent Chromium automatisé et un serveur de prévisualisation géré sur une origine locale. Aucun Firefox utilisé. Ils couvrent notamment les variantes 2 × 2 × 3, la conservation de leur préparation après fermeture du volet, les liens réciproques, le retrait d’un flux, l’intermédiaire, la réouverture, le mobile à 390 px, les migrations anciennes, les sauvegardes et reprises chiffrées, les quotas, le partage et les restrictions CSP.

Les premiers essais ont identifié des sélecteurs de test incorrects sur une démo contenant déjà des flux, ainsi que deux défauts d’état corrigés : préparation effacée à la réouverture et sélecteur périmé après suppression du flux lié. Les résultats ci-dessus sont ceux des exécutions finales réussies. Une exécution web concurrente avait également expiré sous contention locale ; la suite complète exécutée seule passe sans modification de son délai.

La visite manuelle par le navigateur interne est **bloquée** : l’outil d’accès a expiré sur les commandes CDP. La prévisualisation de développement n’est pas qualifiée par ces essais. Les résultats interactifs ci-dessus concernent le build statique. Les autres navigateurs, la totalité des suites du dépôt, CI et la production ne sont pas qualifiés par cette tranche. La suite complète des 129 tests navigateur RGPD a ensuite réussi lors du précontrôle de publication.

## Précontrôle de publication du 4 octobre

`pnpm audit` a échoué sur l’alerte GHSA-ch52-4w7c-c8xp concernant `http-cache-semantics` 4.2.0, dépendance de construction Astro. Aucun workflow n’a été déclenché et aucun transfert Zen effectué avant résolution de ce blocage. Le mainteneur conteste l’alerte ; cette contestation ne remplace pas un contrôle réussi. La dépendance n’est pas utilisée par le serveur Apache statique ni par les parcours RGPD. La fonction de réutilisation de cache visée n’est pas appelée par l’intégration Astro inspectée.

La version officielle 4.3.0, publiée le 4 octobre, a été inspectée séparément : intégrité SHA-512 du tarball vérifiée, source identique au commit npm `b1d4bd682fbab0252985de45219f4e7497c0067c`, six contrôles défensifs du contrat consommé réussis. Elle ne doit pas être qualifiée de correctif démontré de cette alerte sur la seule foi de sa version. Le 4 octobre, après présentation de cette proposition, l’utilisateur a demandé de traiter l’alerte, corriger ce qui doit l’être et publier. La version officielle exacte 4.3.0 est épinglée ; l’exception de délai est limitée à `http-cache-semantics@4.3.0`. Le délai de 24 heures, les audits, les contrôles de scripts de construction et le refus des sous-dépendances exotiques restent actifs. Aucune alerte n’est ignorée.

Six tests permanents résolvent la bibliothèque depuis son consommateur Astro : politique `storable()` fausse pour privé/no-store, expiration immédiate dans le consommateur Astro et TTL public, chargement et revalidation d’images avec réponses synthétiques en mémoire, variantes du wildcard Vary et distinction entre en-têtes propres et hérités. Avant mise à jour : trois réussites et trois échecs attendus. Après mise à jour : six réussites. `node --test scripts/http-cache-semantics-security-regression.test.mjs scripts/astro-security-regression.test.mjs scripts/fast-uri-security-regression.test.mjs` : 30 tests réussis. Après mise à jour, `pnpm check` (12 hints Astro préexistants), `pnpm build` (54 pages), `pnpm audit`, `pnpm csp:render-apache-conf`, `pnpm open-source:check` et `pnpm security:audit` réussissent. Le diff du lockfile ne change aucune autre version ; les notices sont régénérées en conservant le texte de licence.

Le durcissement Vary est documenté par le mainteneur pour CVE-2026-93750. L’issue initiale GHSA-ch52-4w7c-c8xp reste distincte : absence du chemin visé dans RGPDESK, sans prétendre que 4.3.0 a modifié ce mécanisme. Aucun contrôle de cache, CSP, chiffrement, stockage ou export de l’application n’est affaibli.

Références : [correctif officiel Vary](https://github.com/kornelski/http-cache-semantics/commit/9fb520be70eff3ff502fe965d9c3265ca2c64e26), [avis GitHub](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), [contestation du mainteneur](https://github.com/kornelski/http-cache-semantics/issues/56), [demande de réexamen](https://github.com/github/advisory-database/issues/10139).

## Limites et suite

Les variantes sont les combinaisons des alternatives déclarées. Si un canal correspond à un seul lieu, décrire ces passages séparément plutôt que créer toutes les combinaisons. Les flux nouveaux restent à relire et à compléter. Aucun classement juridique ou ordre de traitement n’est déduit automatiquement.

La suite consiste à examiner ce parcours avec un cas DPO réel, puis à qualifier la prévisualisation dans le navigateur interne lorsque son accès fonctionne. Toute publication exige sa qualification habituelle et une instruction explicite.

## Fichiers modifiés ou ajoutés

La liste ci-dessous exclut le répertoire utilisateur préexistant non suivi. Les fichiers générés ajoutés sont exclusivement les validateurs correspondant aux deux nouveaux schémas.

- `apps/web/src/features/privacy/components/ActivityEditor.svelte`
- `apps/web/src/features/privacy/components/FlowBranchBuilder.svelte`
- `apps/web/src/features/privacy/components/FlowConnections.svelte`
- `apps/web/src/features/privacy/components/FlowEditor.svelte`
- `apps/web/src/features/privacy/components/FlowIntermediary.svelte`
- `apps/web/src/features/privacy/components/FlowMap.svelte`
- `apps/web/src/features/privacy/persistence/crypto.test.ts`
- `apps/web/src/features/privacy/persistence/recovery-writer.ts`
- `apps/web/src/features/privacy/persistence/recovery.test.ts`
- `apps/web/src/features/privacy/persistence/recovery.ts`
- `docs/rgpd/FLUX-VARIANTES-INTERMEDIAIRES-2026-10-04.md`
- `docs/rgpd/GUIDE-UTILISATEUR.md`
- `docs/rgpd/PUBLICATION.md`
- `packages/privacy-core/schemas/rgpd-draft-v5.schema.json`
- `packages/privacy-core/schemas/rgpd-master-v12.schema.json`
- `packages/privacy-core/src/commands.ts`
- `packages/privacy-core/src/flow-branches.ts`
- `packages/privacy-core/src/flow-connections.ts`
- `packages/privacy-core/src/flow-intermediaries.ts`
- `packages/privacy-core/src/flow-journeys.ts`
- `packages/privacy-core/src/generated/draft-v5-validator.d.ts`
- `packages/privacy-core/src/generated/draft-v5-validator.js`
- `packages/privacy-core/src/generated/master-v12-validator.d.ts`
- `packages/privacy-core/src/generated/master-v12-validator.js`
- `packages/privacy-core/src/index.ts`
- `packages/privacy-core/src/migration.ts`
- `packages/privacy-core/src/model.ts`
- `packages/privacy-core/src/review-diff.ts`
- `packages/privacy-core/src/share.ts`
- `packages/privacy-core/src/validation.ts`
- `packages/privacy-core/test/analysis.test.ts`
- `packages/privacy-core/test/corrective-actions.test.ts`
- `packages/privacy-core/test/data-groups.test.ts`
- `packages/privacy-core/test/document-filing.test.ts`
- `packages/privacy-core/test/dpo.test.ts`
- `packages/privacy-core/test/flow-branches.test.ts`
- `packages/privacy-core/test/flow-intermediaries.test.ts`
- `packages/privacy-core/test/flow-journeys.test.ts`
- `packages/privacy-core/test/linked-facts.test.ts`
- `packages/privacy-core/test/lots23.test.ts`
- `packages/privacy-core/test/pia.test.ts`
- `scripts/generate-privacy-validator.mjs`
- `scripts/http-cache-semantics-security-regression.test.mjs`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `THIRD_PARTY_NOTICES.md`
- `tests/e2e/privacy/corrective-actions.spec.ts`
- `tests/e2e/privacy/data-groups.spec.ts`
- `tests/e2e/privacy/flow-branches.spec.ts`
- `tests/e2e/privacy/flow-journeys.spec.ts`
- `tests/e2e/privacy/lots23-storage.spec.ts`
- `tests/e2e/privacy/recovery-storage.spec.ts`
