# Architecture cible

Version 1.0, 22 septembre 2026. Les chemins indiqués comme cibles sont proposés, pas présents dans BLACKPROOF au moment de l'examen. Les constats du socle renvoient aux références B de `SOURCES.md`.

## 1. Décision d'ensemble

Partir d'un **fork dédié** avec son historique et sa licence, conserver la stack et ajouter un domaine RGPD. Ne pas ajouter le registre à la production BLACKPROOF dans le cadre de cette mission. Ne pas créer immédiatement une plateforme commune pour plusieurs produits.

Le fork facilite une première livraison isolée mais crée un coût de suivi des correctifs amont. Consigner l'origine de chaque primitive reprise, conserver une référence amont et prévoir une revue des correctifs de sécurité à chaque release. Extraire une bibliothèque partagée seulement lorsqu'une seconde utilisation stable justifie cette extraction.

Le manifeste web inspecté déclare Astro 7.2.8, Svelte 5, TypeScript 6, Dexie, des bibliothèques d'archives et de lecture de tableurs ; le README fixe un environnement Node/pnpm et un contrôle global `pnpm verify:all`. Réutiliser **les versions effectivement résolues par le lockfile disponible**, sans mise à jour générale opportuniste. [B01, B04]

## 2. Topologie

```text
Hébergement HTTPS statique
  pages publiques + bundles + schémas + catalogue versionné
                         |
                         v
                    Navigateur
  +--------------------------------------------------------+
  | UI Svelte / pages Astro                                |
  |        | commandes                         | requêtes   |
  |        v                                   v            |
  | Services applicatifs -------------------- projections  |
  |        |                                                |
  | privacy-core : types, invariants, règles, exports        |
  |        |                                                |
  | Adaptateur coffre -> WebCrypto -> Dexie/IndexedDB        |
  |                                                        |
  | Import local -> bornes -> parsing -> validation -> revue |
  |                                                        |
  | Export choisi -> DTO autorisé -> validation -> fichiers  |
  +--------------------------------------------------------+
                      | téléchargement explicite
                      v
     Sauvegarde chiffrée OU dossier partageable sélectionné
                      |
                      v
     Vérificateur local navigateur / CLI sans accès réseau
```

Aucune API métier, base serveur, bucket de pièces jointes, SaaS de télémétrie ou modèle distant. Les téléchargements initiaux des ressources de l'application ne sont pas une synchronisation. Les journaux du serveur public restent un traitement distinct à décrire et à minimiser : « métier local » ne signifie pas « aucun traitement de donnée de visite ».

## 3. Arborescence cible minimale

```text
apps/web/                         # application Astro conservée dans le fork
  src/features/privacy/
    components/                   # écrans petits et spécialisés
    application/                  # orchestration des commandes
    persistence/                  # coffre/adaptateur Dexie
    imports/                      # parcours CSV, puis XLSX optionnel
    exports/                      # orchestration UI et téléchargement
    i18n/                         # libellés FR, clés stables
  src/pages/app/privacy/          # routes statiques de la nouvelle interface
  src/pages/verify/privacy.astro  # vérificateur navigateur, lot 3
  src/lib/                       # primitives existantes à réutiliser/adapter
packages/
  core/                          # domaine cyber historique, maintenu inchangé
  privacy-core/                  # nouveau domaine, sans UI/DOM/IndexedDB
    src/model/
    src/commands/
    src/rules/
    src/projections/
    src/formats/
    src/migrations/
    src/generated/               # validateurs générés, pas écrits à la main
    catalogs/fr-eu/              # catalogue légal/documentaire versionné
    schemas/                     # schémas canoniques nouveaux
    test/
  privacy-verifier/              # ajouté au lot 3 seulement
    src/
    bin/
    test/
docs/rgpd/
tests/e2e/privacy/
tests/fixtures/privacy/          # exclusivement synthétiques
```

Conserver les routes cyber pendant les lots d'ajout pour faciliter les tests de non-régression ; décider explicitement au lot de publication lesquelles sont incluses dans le build du nouveau produit. Ne pas republier par inadvertance les pages, noms, mentions légales ou endpoints historiques de BLACKPROOF sous une nouvelle identité.

Le domaine exporte des fonctions pures autant que possible. Horloge, générateur d'identifiants et primitives de digest sont injectés. Aucune règle ne dépend implicitement de `Date.now()`, du fuseau du poste ou d'un appel web.

## 4. Ce qui est repris et ce qui est nouveau

`apps/web/src/lib/local-encryption.ts` expose déjà WebCrypto AES-GCM 256 et PBKDF2-SHA-256 ; sa cible d'itérations inspectée est 600 000. Il existe un format batch avec AAD. Réutiliser cette cryptographie via un adaptateur contrôlé, plutôt qu'en concevoir une nouvelle. Le contenu déchiffré doit ensuite être validé : les types génériques TypeScript ne suffisent pas. [B06]

`local-db.ts`, `local-backup.ts` et `sensitive-page-lock.ts` sont les points à examiner pour reprendre transactions, révisions, verrouillage et restauration. Ils peuvent être couplés au modèle cyber : la réutilisation n'est pas présumée être un simple branchement. La documentation décrit notamment des gardes d'écriture multi-onglets et une invalidation après effacement. [B03, B08]

Les composants `LocalCaseEditor.svelte` et les types `ProofQuestion` ne sont pas la base du domaine RGPD. La logique d'exports contrôlés et les tests hostile-input sont des modèles à reprendre, pas une autorisation de sérialiser le nouveau registre dans un ancien ProofPack. [B05]

Les schémas canoniques et leur génération de validateurs sont maintenus selon la convention existante. Les nouveaux formats ont leurs identifiants propres ; aucune modification silencieuse du sens d'un format BLACKPROOF existant.

## 5. Modèle métier

Un espace correspond à une organisation ou à une mission. Des références par identifiants forment un graphe logique dans un document JSON normalisé ; aucune base de graphes n'est nécessaire.

### Entités de la V1

**Workspace** : identifiant opaque, version de format, révision, organisation, périmètre, langue, juridiction, références de catalogue, dates de revue.

**Organization / Party** : entité, coordonnées utiles, représentant, DPO le cas échéant. Les rôles ne sont pas des propriétés universelles d'une société : une même entité peut être responsable pour un traitement et sous-traitante pour un autre.

**ProcessingActivity** : type discriminé `controller` ou `processor`, état brouillon/actif/archivé, catégories, systèmes, relations, mesures et documents. La responsabilité conjointe est représentée par une relation propre et son accord, pas confondue avec la sous-traitance.

**ControllerActivity** : finalités, catégories de personnes et de données, catégories de destinataires, transferts, règles de conservation et mesures générales. Les champs enrichis d'accountability sont distingués des rubriques de l'article 30.

**ProcessorActivity** : clients responsables identifiés, catégories d'opérations effectuées pour eux, instructions et contrats référencés, transferts et mesures. Ne pas obliger le sous-traitant à « choisir sa base légale » pour une opération qu'il réalise uniquement sur instruction. Les traitements qu'il décide pour ses propres finalités sont des activités responsables distinctes. [J01]

**Purpose** : objectif spécifique, base(s) de l'article 6 documentée(s) et justification de leur portée, référence normative quand nécessaire, éléments d'intérêt légitime ou de consentement selon le cas. Une liste de toutes les bases légales ne constitue pas une justification.

**DataUse** : lien entre finalité, catégories de données, catégories de personnes et conditions particulières. Les conditions de l'article 9 et les restrictions de l'article 10 sont distinctes de la base de l'article 6. Le modèle doit pouvoir relier la condition particulière au sous-ensemble de données concerné. [J02]

**System / Engagement / Recipient** : moyens utilisés, relation entre organisme et intervenant, rôle, périmètre contractuel, catégories de destinataires et documents. Un contrat article 28 et un mécanisme de transfert du chapitre V ne sont pas le même objet.

**Transfer** : exportateur/importateur, rôles, pays ou organisation internationale, opérations/accessibilité, catégories, finalités, transferts ultérieurs, mécanisme invoqué, portée, références et date d'examen. Valeur « aucun transfert identifié » distincte de « transferts non examinés ». [J09]

**RetentionRule** : finalité et catégories couvertes, événement de départ, durée ou critère, base/justification, archivage intermédiaire éventuel, sort final et preuve d'exécution attendue. Ne pas réduire cela à `retentionDays` sur toute l'organisation.

**EvidenceReference** : titre interne, catégorie, portée, version, auteur/émetteur déclaré, référence interne, état, dates de revue, réserves, sensibilité et champ de référence partageable distinct. Pas de contenu binaire.

**Finding / Decision / Action** : constat explicable lié à une règle et à des entités ; décision humaine et justification ; action affectée, échéance et preuve de clôture. Dédupliquer les constats sur la clé stable règle/entité/portée.

**ReviewSnapshot / DeliveryRecord** : révisions évaluées, version du catalogue, périmètre revu, fichiers effectivement exportés, dates déclarées et empreinte. Un nom saisi n'est pas une identité attestée.

### Entités futures

`RightsRequest`, `BreachIncident`, `DpiaScreening`, `DpiaAssessment` et `TransferAssessment` sont ajoutés avec leur lot, pas comme tables vides ni comme écrans factices. La V1 peut stocker une décision ou une référence externe relative à ces sujets sans prétendre exécuter leur workflow.

### Contrat d'évaluation proposé

```ts
type Applicability = "applicable" | "not-applicable" | "undetermined";
type DocumentationState = "missing" | "declared" | "referenced" | "reviewed";
type CheckOutcome = "satisfied" | "gap" | "needs-review" | "not-applicable";

interface RuleEvaluation {
  ruleId: string;
  ruleVersion: string;
  catalogVersion: string;
  subjectIds: string[];
  applicability: Applicability;
  outcome: CheckOutcome;        // un contrôle précis, jamais l'organisme entier
  rationale: string;
  missingInputs: string[];
  sourceIds: string[];
  inputRevision: number;
  evaluatedAt: string;          // horloge injectée ; pas d'horodatage de confiance
}
```

Ce contrat est une proposition d'interface, pas du code livré et testé. « Satisfied » porte sur un test explicitement défini, par exemple la présence d'une référence, jamais sur la conformité générale du traitement. L'UI traduit en langage documentaire.

## 6. Coffre local

Conserver une autorité de sauvegarde simple : le document métier d'un espace, chiffré en bloc pour la V1, et des snapshots chiffrés séparés. Les index métier sont reconstruits en mémoire après ouverture. Pas de table en clair contenant les noms de clients ou de traitements.

Utiliser une base/namespace propre au produit. Un format RGPD ne doit jamais être déchiffré puis interprété comme une ancienne affaire cyber. Le contexte authentifié lie au minimum produit, format d'enveloppe, identifiant d'espace et nature d'entrée ; les snapshots ajoutent leur identifiant. L'appelant compare l'AAD reçue au contexte **attendu depuis la clé de stockage**, et ne fait pas confiance à une AAD seulement fournie par le fichier.

Chaque commande porte la révision attendue et l'époque de stockage attendue. Une commande arrivée après un effacement ou une modification concurrente est rejetée. Les écritures liées sont transactionnelles. Une erreur de quota ou une interruption ne laisse pas une moitié de dossier persistée.

La reprise des paramètres cryptographiques, du sel, des IV et de la durée de vie du matériel de déchiffrement doit être revue dans le code effectif. Ne pas réduire le coût de dérivation pour accélérer l'autosave ; préférer le regroupement d'écritures et mesurer avant de refondre.

Reprendre les états de verrouillage documentés : manuel, inactivité et arrière-plan, puis vérifier leur fonctionnement sur le nouveau parcours. Nettoyer états UI, previews, URL d'objets, caches et tâches en cours au verrouillage. Ne pas prétendre effacer physiquement toute copie de mémoire en JavaScript. [B03]

Une sauvegarde chiffrée contient l'inventaire authentifié et toutes les entrées nécessaires. La restauration se fait dans une transaction après validation complète. En V1, une collision d'identifiant existant est refusée : aucune fusion ou substitution silencieuse. Les mécanismes de remplacement volontaire viendront avec leur propre sauvegarde préalable et leurs tests.

L'archivage d'un traitement n'est pas sa suppression. Prévoir un parcours de purge locale indiquant quelles références, historiques et snapshots seront affectés. L'utilisateur doit comprendre que les fichiers téléchargés, copies externes et sauvegardes du système ne sont pas effacés par cette action. Une restauration d'une ancienne sauvegarde peut réintroduire d'anciennes informations ; le prévenir explicitement. [B03]

## 7. Formats distincts

### `rgpd-master-v1`

Document interne complet, sous enveloppe chiffrée au repos. L'export en clair de ce master n'est pas disponible dans le parcours de partage. Le master contient notamment commentaires internes, provenances d'import et décisions non partageables.

### `rgpd-backup-v1`

Sauvegarde destinée à la reprise de l'espace, pas au client. Inventaire et contenu métier chiffrés ; manifestes techniques limités. La perte de phrase secrète n'est pas résolue magiquement par une sauvegarde chiffrée avec cette même phrase.

### `rgpd-delivery-v1`

Projection explicite selon un profil : `article30-controller`, `article30-processor`, `internal-review` ou `client-excerpt`. Le schéma et les champs autorisés sont définis pour chaque profil.

Le profil article 30 peut légitimement inclure certaines coordonnées : la minimisation ne signifie pas supprimer aveuglément toute donnée personnelle requise par le destinataire ou le profil. À l'inverse, le registre d'un client ne doit pas exposer les autres clients d'un sous-traitant. [J01]

Le paquet V1 contient :

```text
manifest.json              # inventaire versionné, taille et SHA-256 par fichier
register.json              # données de la projection, pas le master
register.csv               # vue tabulaire de cette même projection
report.html                # document imprimable, sans script ni ressource distante
README.txt                 # périmètre, réserves, mode de vérification et limites
```

Le rapport imprimable fournit une mise en page pour l'impression navigateur. Il n'y a pas de moteur PDF serveur dans la V1. Les empreintes portent sur les **octets des fichiers livrés**, pas sur des données internes exclues. Définir une canonicalisation versionnée pour l'empreinte du manifeste, en excluant son propre champ d'empreinte afin d'éviter une dépendance circulaire.

Renouveler les identifiants publics pour chaque livraison et remapper les liens. Garder la correspondance dans le coffre uniquement. Tous les formats dérivent du même DTO pour éviter qu'un HTML expurgé soit accompagné d'un JSON complet.

Une modification du master après validation invalide la revue en cours de l'export. Les anciens dossiers restent des snapshots historiques, sans prétention à indiquer l'état juridique actuel. Une réserve publique est conservée ; l'absence de certaines pièces n'est pas maquillée pour obtenir un export « vert ».

### Vérification

Le navigateur et la CLI consomment le même validateur de format. Vérifier version, schéma, tailles, noms, absence d'entrée supplémentaire, unicité, liens internes, invariants et empreintes. Refuser une version inconnue au lieu de la traiter comme une ancienne.

Ne pas afficher « document authentique » après simple comparaison de hashes. Une personne peut modifier le contenu et recalculer les hashes : la vérification technique ne démontre ni l'identité, ni la vérité, ni une date certifiée. Les signatures détachées restent hors V1 ; leur éventuel ajout exigera une politique de confiance distincte. [B02, B05]

## 8. Imports et limites

CSV en V1 ; XLSX seulement après passage par les contrôles ZIP, les parsers et les workers du socle, et après tests spécifiques. Un fichier CNIL n'est reconnu comme modèle précis que si sa structure a été effectivement inspectée ; sinon l'interface propose un mapping générique. Aucun accès distant à une URL de document pendant le parsing.

Traiter tout fichier comme hostile : tailles compressées/décompressées, nombre d'entrées, noms, encodages, doublons, profondeur JSON, longueur de texte et cardinalité des relations. Interdire traversal, liens externes exécutés, formules et HTML actif. Ne pas convertir un champ vide importé en un état favorable.

Budgets de départ proposés pour le nouveau domaine : 200 activités, 2 MiB de master JSON UTF-8 et 2 MiB d'entrée CSV. Ce sont des plafonds produit initiaux, à mesurer et ajuster explicitement ; ils ne remplacent pas les protections des archives héritées. Le contrôle du nombre de lignes et du temps de parsing complète celui des octets. Refuser proprement avant saturation et ne jamais perdre silencieusement les lignes restantes.

Préserver les données sources nécessaires à une reprise de mapping uniquement dans une zone chiffrée, bornée et purgeable. Une colonne non comprise n'est ni ignorée en silence, ni activée comme règle. La provenance comprend fichier local, empreinte interne, ligne et choix de correspondance, sans les publier par défaut.

## 9. Sécurité du navigateur et de la distribution

Reprendre les contrôles CSP du build, avec des hashes précis pour les scripts/styles inline nécessaires, sans `unsafe-inline` ni `unsafe-eval`. L'application métier vise `connect-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'none'` et aucune ressource tierce. Charger localement les schémas et le catalogue ; un `schemaUrl` documentaire ne déclenche jamais de fetch. [B02]

Les sources publiques sont ouvertes uniquement sur clic explicite, sans paramètre métier, sans référent sensible et sans préchargement. Ne pas encoder des données dans les URL, titres de pages ou noms de téléchargements par défaut. Une politique CSP n'est pas à elle seule une preuve d'absence d'exfiltration : compléter par une revue du code et des tests réseau.

Tester le build de production en autorisant d'abord ses seules ressources statiques attendues, puis en coupant le réseau pour exercer création, édition, sauvegarde, restauration, import et export. Contrôler également que les actions sensibles n'émettent aucune tentative de requête, même bloquée. Les contrôles de dépendances nécessitant Internet sont des étapes de CI, pas des appels de l'application.

Le chiffrement local ne protège pas contre un poste compromis, une extension intrusive ou une version malveillante de l'application une fois le coffre ouvert. Publier des versions identifiables, le source correspondant, un inventaire de dépendances et des artefacts de build vérifiables ; maintenir les protections de la chaîne de livraison.

Pas de MCP dans la V1 RGPD. Si une intégration est envisagée plus tard, concevoir une vue strictement minimisée et un consentement spécifique : un serveur MCP local ne rend pas confidentiel le transfert réalisé ensuite par un hôte utilisant un modèle distant. [B01]

## 10. Déploiement et exploitation

Le déploiement cible reste un répertoire statique sous HTTPS, avec les en-têtes de sécurité et une page source/licence. Pas de tâches cron métier. Les rappels affichés sont calculés à l'ouverture de l'application et ne sont pas des notifications garanties en arrière-plan.

Conserver une documentation de sauvegarde, de restauration, de changement de domaine et de changement de profil navigateur. Publier une notice de confidentialité propre au nouveau site : ne pas copier aveuglément celle de BLACKPROOF.

La sortie du build, les schémas, la version du catalogue et la référence Git sont reliés dans les métadonnées de release. Ne jamais recalculer un ancien snapshot avec le catalogue du jour sans créer une nouvelle évaluation identifiable.


## Cible métier précisée le 23 septembre 2026 : un inventaire, quatre analyses

Orientation demandée par l’utilisateur, à construire progressivement. Un même inventaire augmenté décrit les activités, finalités, personnes, données, acteurs, systèmes, accès, opérations et flux. Le registre réglementaire et les restitutions sont des vues de cet inventaire.

Quatre angles d’analyse s’appuient sur ces faits :

1. Examen des exigences RGPD.
2. Nécessité et proportionnalité du traitement.
3. Risques pour le système d’information.
4. Risques pour les droits et libertés des personnes.

Chaque analyse garde sa méthode, son périmètre, ses hypothèses, ses arguments, ses mesures et ses revues humaines. Un risque pour le SI ne détermine pas automatiquement une atteinte aux droits et libertés ; une mesure technique ne justifie pas automatiquement la proportionnalité. Les éléments pertinents peuvent être reliés, jamais assimilés par un score commun.

### Saisie et dépendances

- Saisir les faits une fois dans l’inventaire, puis les lire par référence dans les vues ; ne pas recréer des formulaires d’organisation ou de cartographie dans chaque analyse.
- Demander dans les analyses uniquement les éléments spécifiques manquants. Préserver la distinction entre fait inconnu, fait déclaré et appréciation humaine.
- Signaler un changement de faits à réexaminer ; ne pas réécrire les arguments ni les revues historiques. Conserver le contexte figé de chaque revue.
- Générer les synthèses et schémas depuis ces liens, sans formulaire de présentation supplémentaire. Pour un partage, conserver la sélection explicite, la liste blanche et la relecture du contenu.
- Privilégier HTML/CSS et petits SVG statiques ; aucun moteur de graphe, rendu distant ou inférence de flux non décrits.

### État de l’implémentation

L’analyse RGPD et l’AIPD disposent déjà de leurs parcours. L’AIPD rassemble actuellement nécessité/proportionnalité et risques pour les personnes. L’analyse de risque SI autonome et la navigation unifiée entre quatre analyses restent à concevoir et à qualifier. Aucun import de domaine cyber ni changement du format de coffre n’est introduit par la refonte de lecture du 23 septembre.

## Inventaire lié (23 septembre 2026)

Le maître courant est v6 et les partages graphiques facultatifs v2. Voir [INVENTAIRE-LIE.md](INVENTAIRE-LIE.md) pour la migration, les références, les invariants et la compatibilité. Les descriptions de lots précédents restent des états historiques.

### Parcours de travail et reprise locale (23 septembre 2026)

- `Activity.interviewQuestions` facultatif, 12 questions de 500 caractères maximum. L’entretien écrit directement dans les mêmes rubriques, flux et liens documentaires que la fiche.
- `Workspace.workCheckpoint` facultatif, discriminant et identifiant existant validés. Le repère est inclus dans l’écriture chiffrée explicitement demandée, sans révision ni stockage supplémentaires à chaque clic. Aucun état de dossier dans les URL, localStorage ou sessionStorage.
- `Workspace.citationReviews` facultatif, au plus 300 traces, ajout seul via les commandes. Le réexamen capture version précédente et actuelle, passage, argument, appréciations avant/après, auteur, motif et révision. Seules les citations actuelles dont la version déclarée diffère sont proposées. Les contextes historiques ne sont jamais modifiés.
- Les vues transversales sont des projections de liens explicites. Un document d’une activité liée est étiqueté comme tel, sans prétendre à une relation contractuelle directe avec un système.
- `inspectBackup` réutilise `decodeArchive`, sans accès à PrivacyVault ou IndexedDB, contrôle la taille avant lecture et le signal d’annulation avant/après les opérations asynchrones. Il ne renvoie qu’un résumé. Le composant efface phrase et résultat à la fermeture.
- `rgpd-share-v2.executive` facultatif, deux textes explicites limités à 800 caractères. Projection par liste blanche, rendu passif échappé, CSV neutralisé, relecture obligatoire. Sans cette option, les octets canoniques des anciens rapports v1 et v2 restent inchangés.

Ces propriétés complètent le format v6 local déjà en développement. Aucun format historique 1 à 5 ni aucune primitive cryptographique ne change. La lecture d’un ancien coffre ne déclenche toujours aucune migration écrite automatique.
