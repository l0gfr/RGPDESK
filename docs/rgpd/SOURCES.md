# Sources et limites de l'examen

Consultation : **22 septembre 2026**. Liens en clair pour faciliter le travail dans Codex. Les pages peuvent évoluer ; vérifier leur contenu à la date de l'implémentation et de la publication. Ce document ne désigne pas un catalogue juridique comme professionnellement validé.

## BLACKPROOF

**B00 — Site et périmètre annoncé**
https://blackproof.fr/
Constats : revues cyber locales, dossiers exportables, qualification d'usage de l'application centrée sur Chrome/Edge desktop. Le site public ne prouve pas à lui seul le comportement de tout le code.

**B01 — README et licence annoncée**
https://github.com/l0gfr/BLACKPROOF-AGPL
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/README.md
Constats : local-first, AGPL-3.0-only, monorepo web/core/verifier/mcp, commandes de développement et contrôle global. Le README distingue la vérification technique d'une certification. Le paquet MCP local a un périmètre minimisé et ne garantit pas la confidentialité d'un hôte utilisant un modèle distant.

**B02 — Modèle de sécurité**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/docs/SECURITY_MODEL.md
Constats documentaires : absence d'envoi métier, exports par liste blanche, validation des formats, CSP, sécurité des imports, limite des hashes et des signatures. Ces engagements n'ont pas été validés par exécution dans le présent travail.

**B03 — Stockage local**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/docs/LOCAL_FIRST_STORAGE.md
Constats documentaires : IndexedDB/Dexie, chiffrement obligatoire, sauvegardes, verrouillage, révisions et invalidation multi-onglets. Pas de pièces justificatives binaires. Limites de l'effacement local et dépendance à l'origine/profil navigateur.

**B04 — Manifeste de l'application**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/apps/web/package.json
Constats : Astro 7.2.8 ; dépendances Svelte 5, TypeScript 6, Dexie et bibliothèques de fichiers. Les plages déclarées dans le manifeste ne remplacent pas l'examen du lockfile pour établir chaque version résolue.

**B05 — Types du domaine cyber**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/packages/core/src/types.ts
Constats dans le code : ProofCase, ProofQuestion, EvidenceItem, ProofDebt, master ProofPack et livraison distincte. Le profil de vérification dit explicitement ce qu'il ne vérifie pas : identité, vérité, validité juridique et horodatage de confiance.

**B06 — Cryptographie locale**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/apps/web/src/lib/local-encryption.ts
Constats dans le code : WebCrypto AES-GCM 256, PBKDF2-SHA-256, cible de 600 000 itérations, sel aléatoire de 16 octets, IV de 12 octets, enveloppes simples et batch avec AAD. La bonne intégration dépend aussi des appelants, non audités exhaustivement ici.

**B07 — Règles de noms et marques**
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/TRADEMARKS.md
Constats : licence du logiciel distincte de toute apparence d'aval, certification ou partenariat ; conservation des notices et distinction d'une version modifiée. Aucun conseil de clearance de marque n'est fourni.

**B08 — Arborescence et consignes d'agent**
https://github.com/l0gfr/BLACKPROOF-AGPL/tree/211166d19543335ff3c1285a963782bdb28985a1
https://github.com/l0gfr/BLACKPROOF-AGPL/blob/211166d19543335ff3c1285a963782bdb28985a1/apps/web/AGENTS.md
Constats : emplacement des composants, adaptateurs, tests, schémas et scripts. L'existence d'un fichier de test ne prouve ni sa réussite, ni une couverture exhaustive. Les modules cités comme points d'intégration n'ont pas tous été lus intégralement.

## RGPD et guides des autorités

**J01 — Texte du RGPD, chapitre IV, publié par la CNIL**
https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4
Articles pertinents : 24–30, 32–39. Base pour distinguer les rôles, les deux registres, la sous-traitance, les mesures et les processus d'évaluation. Pour une publication, contrôler le texte officiel applicable, ses éventuelles modifications et les régimes nationaux pertinents.

**J02 — Texte du RGPD, chapitre II, publié par la CNIL**
https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2
Articles pertinents : 5–10. Principes, bases légales, consentement, catégories particulières et données pénales. Utilisé pour la séparation du modèle, sans sélection automatique d'une base ni d'une condition.

**J03 — CNIL : le registre des activités de traitement**
https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement
Guide sur la structure du registre et son utilisation. Ne constitue pas la vérification d'un format de fichier CNIL particulier ni une garantie de compatibilité d'import.

**J04 — Texte du RGPD, chapitre III, publié par la CNIL**
https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3
Articles pertinents : 12–22. Délais généraux, information, droits et limitations. Le calculateur doit disposer de profils et de cas d'essai tenant compte des règles applicables ; le seul article 12 ne résout pas tous les cas calendaires ou sectoriels.

**J05 — CNIL : répondre à une demande d'accès**
https://www.cnil.fr/fr/repondre-une-demande-de-droit-dacces
Guide sur les démarches, vérifications d'identité proportionnées, droits des tiers, délais et modalités de réponse. La page identifie notamment des délais spécifiques aux données de santé : le profil général ne les remplace pas.

**J06 — CNIL : violations de données**
https://www.cnil.fr/fr/violations-de-donnees-personnelles-les-regles-suivre
https://www.cnil.fr/fr/services-en-ligne/notifier-une-violation-de-donnees-personnelles
Documentation interne, rôles, prise de connaissance, risques, notifications et compléments. Ces pages ne constituent pas la documentation d'une API autorisant l'application à notifier directement.

**J07 — CNIL : ce qu'il faut savoir sur l'AIPD**
https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd
Repérage des traitements à risque, contenu de l'analyse et consultation. Vérifier les listes applicables et leur version avant d'implémenter un moteur de correspondance.

**J08 — CNIL : logiciel PIA**
https://www.cnil.fr/fr/outil-pia-telechargez-et-installez-le-logiciel-de-la-cnil
Page datée du 7 avril 2026 lors de la consultation ; décrit le logiciel open source PIA. Aucun schéma d'interopérabilité PIA n'a été examiné ici. Toute passerelle reste une étape de recherche et de tests, pas une fonctionnalité acquise.

**J09 — CNIL : identifier et traiter les transferts hors UE**
https://www.cnil.fr/fr/responsables-de-traitement-comment-identifier-et-traiter-des-transferts-de-donnees-hors-ue
https://www.cnil.fr/fr/transferts-de-donnees-hors-ue-le-cadre-general-prevu-par-le-rgpd
Périmètre des flux, accès distants et outils d'encadrement. Aucun pays, prestataire ni dispositif d'adéquation n'est déclaré définitivement valable par ce brief.

**J10 — Travaux Digital Omnibus**
https://www.edpb.europa.eu/news/digital-omnibus-edpb-and-edps-support-simplification-and-competitiveness-while-raising-key_en
https://www.consilium.europa.eu/en/meetings/mpo/2026/9/antici-sub-gr-on-simplification-%28369634%29/
Avis EDPB/EDPS du 11 février 2026 et page du Conseil relative à la réunion du 11 septembre 2026 mentionnant un texte de compromis de la présidence. Utilisés pour justifier une gouvernance des versions et la distinction proposition/droit applicable, pas pour affirmer qu'une réforme est entrée en vigueur.

**J11 — CNIL : nuance sur les critères AIPD**
https://www.cnil.fr/fr/realiser-une-analyse-dimpact-si-necessaire
La page traite de l'IA et explicite la présomption associée aux critères et la nécessité de contextualiser le risque. Ne pas extrapoler ses exemples IA comme une liste exhaustive applicable à tout secteur.

## Codex

**O01 — Documentation officielle des AGENTS.md**
https://developers.openai.com/fr-FR/docs/agent-configuration/agents-md
La documentation décrit la découverte des instructions et leur priorité. Le fichier fourni `AGENTS-RGPD.md` est une proposition à fusionner, pas un moyen d'écraser automatiquement les consignes du dépôt.

## Ce qui reste à vérifier avant développement ou publication

Le HEAD disponible dans Codex, l'exécution des tests, le découplage réel des modules de stockage, les versions de schémas à réutiliser, les fichiers d'import CNIL/PIA réellement visés, la sécurité des adaptations, les règles calendaires et sectorielles, la revue du catalogue légal et la qualification des navigateurs.

Aucun test du dépôt n'a été exécuté pendant cet examen. Aucune modification, branche, pull request, publication ou opération de déploiement n'a été effectuée sur BLACKPROOF.

## Sources des trames métier

Consultées le 22 septembre 2026. Les questions de préparation sont des propositions de travail RGPDESK, pas des questions officielles de la CNIL. Chaque question dans `business-guides.ts` possède sa référence et son repère de lecture. Aucun contenu n’est récupéré à distance à l’ouverture d’un coffre.

| Référence | Document | Nature | Édition affichée dans la source |
| --- | --- | --- | --- |
| M-recruitment | [CNIL · Guide du recrutement](https://www.cnil.fr/sites/default/files/atoms/files/guide_-_recrutement.pdf) | Guide CNIL | 30 janvier 2023 |
| M-staff | [CNIL · Référentiel de gestion du personnel](https://www.cnil.fr/sites/cnil/files/2023-09/referentiel_gestion_des_ressources_humaines.pdf) | Référentiel CNIL | Modifié le 23 mai 2022 |
| M-staffRetention | [CNIL · Conservation des données RH](https://www.cnil.fr/sites/default/files/2026-04/referentiel_durees_de_conservation_gestion_des_ressources_humaines.pdf) | Référentiel CNIL distinguant textes obligatoires et recommandations | Mis à jour le 20 mai 2026 |
| M-commercial | [CNIL · Référentiel des activités commerciales](https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_traitements-donnees-caractere-personnel_gestion-activites-commerciales.pdf) | Référentiel CNIL | Document consulté le 22 septembre 2026 |
| M-communications | [CNIL · Messages aux clients et prospects](https://www.cnil.fr/fr/communication-electronique-quelles-regles) | Explications de la CNIL | 10 juin 2026 |
| M-association | [CNIL · Guide pour les associations](https://www.cnil.fr/sites/default/files/atoms/files/cnil-guide_association.pdf) | Guide CNIL | Document consulté le 22 septembre 2026 |
| M-collection | [CNIL · Formulaires de collecte](https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel) | Exemples CNIL à adapter | 26 juillet 2019 |
| M-information | [CNIL · Informer les personnes](https://www.cnil.fr/fr/informer-les-personnes) | Explications de la CNIL | 27 janvier 2020 |
| M-processor | [CNIL · Relations avec un sous-traitant](https://www.cnil.fr/fr/responsable-de-traitement-et-sous-traitant-6-bonnes-pratiques-pour-respecter-les-donnees) | Rappels et bonnes pratiques CNIL | 8 juillet 2020 |
| M-subcontracting | [CNIL · Sécurité de la sous-traitance](https://www.cnil.fr/fr/securite-gerer-la-sous-traitance) | Guide de sécurité CNIL | 14 mars 2024 |
| M-access | [CNIL · Gérer les habilitations](https://www.cnil.fr/fr/securite-gerer-les-habilitations) | Guide de sécurité CNIL | Page consultée le 22 septembre 2026 |
| M-retention | [CNIL · Cycle de vie et conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees) | Explications de la CNIL | 2 avril 2026 |
| M-principles | [RGPD · Principes et licéité](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2) | Texte du règlement, reproduit par la CNIL | Articles 5, 6, 9 et 10 |
| M-obligations | [RGPD · Responsable et sous-traitant](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) | Texte du règlement, reproduit par la CNIL | Articles 28, 30 et 32 |

Les référentiels ne remplacent pas l’examen des textes applicables et de leur champ. Le référentiel RH de conservation du 20 mai 2026 distingue explicitement les durées obligatoires et recommandées ; aucune valeur n’en est préremplie. Aucune revue juridique humaine n’est attribuée. Les exemples fictifs restent distingués des prescriptions.
