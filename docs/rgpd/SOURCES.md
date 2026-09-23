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


## Sources de l’atelier d’analyse et de la revue contractuelle

Consultées le 22 septembre 2026. Les formulations dans `review-methods.ts` sont des questions rédigées pour RGPDESK, et non la transcription d’un questionnaire d’autorité ou d’une grille d’auteur. Chaque question conserve un identifiant, un repère précis et la nature de sa source ; les notes conservent la version de la méthode.

| Référence | Source et version | Usage et portée |
| --- | --- | --- |
| A01 | [RGPD, texte officiel EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/fra) ; reproductions CNIL [I](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre1), [II](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2), [IV](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4), [V](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre5) | Articles 4 §2, 5, 6, 9, 10, 24, 25, 28 à 30, 32, 35, 36, 44 à 49. Texte initialement vérifié dans les reproductions CNIL ; accès EUR-Lex désormais vérifié le 22 septembre 2026 pour les articles 5, 6, 32 et 35. Les compléments d’analyse ne sont pas présentés comme tous exigés par l’article 30. |
| A02 | [CEPD, lignes directrices 07/2020](https://www.edpb.europa.eu/system/files/2023-10/EDPB_guidelines_202007_controllerprocessor_final_en.pdf), version 2.1, adoptées le 7 juillet 2021, corrections mineures du 20 septembre 2022 | §95 à 99 : garanties adaptées au contexte et suivi ; §111 à 115 : contenu concret de la relation contractuelle. Interprétation d’autorité, sans évaluation automatique d’un prestataire. |
| A03 | [EDPS, Quick Guide to Necessity and Proportionality](https://www.edps.europa.eu/sites/default/files/publication/20-01-28_edps_quickguide_en.pdf), 28 janvier 2020 | Étapes 1, 3, 4 et 5 pour cadrer objectif, efficacité et alternatives. Outil conçu pour les mesures législatives de l’UE ; contextualisé comme repère méthodologique pour les questions métier, pas comme formulaire universel d’AIPD. |
| A04 | [Estelle De Marco, support ESIEA 2025–2026, version 2.12](https://www.inthemis.fr/ressources/supports/Esiea_Ethique_202601_v2.12.pdf#page=75) | PDF de 451 pages : méthode p.74, vue d’ensemble de la grille p.75, inventaire pratique p.77, développements p.78 à 85. Lecture complémentaire, reliée au support original. Aucun tableur séparé identifié, aucune reproduction intégrale de la grille, aucun aval de son auteure attribué. |

La relecture humaine reste à réaliser. L’application n’adopte pas les appréciations reçues dans un retour utilisateur comme des conclusions juridiques : notamment, elle ne prétend ni que l’expression « base légale » serait interdite, ni qu’un outil PIA existant serait juridiquement invalide. Le libellé métier « fondement juridique » conserve le champ technique `legalBasis` et ses données historiques.

## Sources du parcours AIPD

Revue documentaire : 22 septembre 2026. Version de la trame : `aipd-2026-09-22.1`. Questions originales et références embarquées dans `pia-method.ts` ; aucune récupération distante lors de l’usage du coffre.

| Source | Nature, version, portée | Usage dans RGPDESK |
| --- | --- | --- |
| [RGPD, chapitre IV](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) | Texte applicable, articles 28, 35, 36, 38, 39 ; reproduction par la CNIL | Description, nécessité, risques, mesures, avis, consultation et réexamen ; responsabilité distincte du sous-traitant |
| [G29, WP248 rév.01](https://www.cnil.fr/sites/default/files/atoms/files/wp248_rev.01_fr.pdf) | Lignes directrices, révision du 4 octobre 2017 ; interprétation d’autorité | Partie III.B : neuf critères sans décision automatique ; droits et libertés au-delà de la seule sécurité des données ; annexe 2 : critères d’une analyse |
| [CNIL, PIA méthode](https://www.cnil.fr/sites/cnil/files/atoms/files/cnil-pia-1-fr-methode.pdf) | Guide méthodologique, février 2018 | Quatre phases et itérations ; articulation principes et risques ; annexe de correspondance avec WP248 |
| [CNIL, PIA modèles](https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-2-fr-modeles.pdf) | Modèles, février 2018 | Contexte, garanties, scénarios, gravité et vraisemblance, plan d’action, avis et validation ; pas de compatibilité de fichiers revendiquée |
| [CNIL, ce qu’il faut savoir sur l’AIPD](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd) | Explications et accès aux listes ; page consultée le 22 septembre 2026 | Point d’accès explicite pour l’examen du champ applicable, aucune liste importée automatiquement |
| [Estelle De Marco, support ESIEA 2025–2026, v2.12](https://www.inthemis.fr/ressources/supports/Esiea_Ethique_202601_v2.12.pdf) | Support pédagogique d’auteur, 451 pages ; éclairage méthodologique | Raisonnement p.74–90 ; risques et garanties p.171–208 ; gouvernance p.211–213. Questions rédigées pour le produit, sans reproduction intégrale ni aval attribué |

Le [projet de modèle AIPD du CEPD publié pour consultation en 2026](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2026/edpb-dpia-template_en) reste une référence de veille : la clôture de la consultation ne suffit pas à établir son adoption finale. Il n’est pas activé comme une obligation ou une méthode définitive.

Les contrôles de complétude, plafonds et règles de conservation des revues sont des choix produit documentés dans `AIPD.md`, non des prescriptions attribuées aux sources.

## Distinction analyse RGPD / AIPD et intérêt légitime (22 septembre 2026)

- [RGPD, Journal officiel, texte EUR-Lex en français](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr) : articles 5, 6, 12 à 25, 32 et 35. L’analyse générale ne présuppose pas une AIPD ; la question 06 examine les risques de sécurité et leurs effets pour les personnes, au titre de l’article 32. L’article 35 §7 b) reste associé à la grille AIPD. Le test de nécessité n’est pas exclusivement réservé à l’AIPD : articles 5 §1 c), e), 6 §1 b) à f).
- [CNIL, L’intérêt légitime, 29 novembre 2019](https://www.cnil.fr/fr/les-bases-legales/interet-legitime) : recommandation explicative pour l’examen des trois conditions, des attentes raisonnables et des garanties additionnelles. La première trame RGPDESK utilise les notes internes existantes ; elle ne sélectionne aucun fondement et ne reproduit pas une grille externe non fournie.
- Les guides CNIL, CEPD et EDPS restent des sources méthodologiques distinctes du règlement. Les supports De Marco ne sont pas présentés comme une validation du produit.

## Dossiers DPO et échéances (23 septembre 2026)

| Source et version | Usage et limites |
| --- | --- |
| [RGPD, texte officiel EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr), articles 5, 6, 12 à 23, 28, 32 à 36, 44 à 49 | Cadrage des questionnaires. Le logiciel ne détermine pas l’applicabilité ou la conclusion juridique. Le téléchargement EUR-Lex du 23 septembre a rencontré une protection JavaScript ; les passages ont été recoupés sur la reproduction CNIL des chapitres III et IV. |
| [CEPD 01/2022, version 2.1, 17 avril 2023](https://www.edpb.europa.eu/system/files/documents/2023-04/edpb_guidelines_202201_data_subject_rights_access_v2_en.pdf), §158 à 164 | Repères du droit d’accès : échéance calendaire et jours non ouvrés, motifs de prolongation. Les suspensions et régimes sectoriels ne sont pas déduits automatiquement. |
| [CNIL, intérêt légitime, 29 novembre 2019](https://www.cnil.fr/fr/les-bases-legales/interet-legitime) | Trois conditions, analyse contextuelle et réexamen. Questions originales RGPDESK ; aucune reproduction de la grille personnelle d’un expert. |
| [CNIL, guide AITD, janvier 2025](https://www.cnil.fr/sites/cnil/files/2025-02/guide_aitd_pdf.pdf) | Six étapes du guide : périmètre, mécanisme, droit/pratiques, mesures supplémentaires, mise en œuvre, réévaluation. Applicabilité à examiner, notamment dans le contexte des garanties article 46. |
| [CNIL, notifier une violation](https://www.cnil.fr/fr/services-en-ligne/notifier-une-violation-de-donnees-personnelles) | Démarche externe de notification ; aucune connexion, saisie ou transmission automatique depuis RGPDESK. |

Les plafonds, le suivi de changements, la conservation des revues et les règles de projection des rapports sont des choix produit. Ils ne sont pas présentés comme des obligations de la réglementation. Les questions ont une édition datée et une référence affichée ; aucun avis humain indépendant n’est présumé.


## Extension des entretiens PME / associations (23 septembre 2026)

Questions originales RGPDESK, sans reprise de durée ni de fondement par défaut. Les sources CNIL ci-dessous ont été consultées le 23 septembre 2026. Leur portée est méthodologique et dépend du contexte ; elles ne valident aucun traitement. Les nouvelles trames portent leur propre date de consultation dans `business-guides.ts`.

| Source et version | Usage dans les entretiens |
| --- | --- |
| [CNIL, prospection par courrier électronique, SMS-MMS et automate d’appel](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel), 10 juin 2026 | Public, origine des coordonnées, consentement ou exception à examiner, opposition. La nouvelle trame est limitée au courriel ; elle ne tranche pas les régimes des autres canaux ou traceurs. |
| [CNIL, accès aux locaux et horaires](https://www.cnil.fr/fr/acces-locaux-controle-des-horaires-au-travail), mise à jour du 17 juin 2026 | Distinction des finalités, habilitations, information et cycle de vie des accès. |
| [CNIL, vidéosurveillance au travail](https://www.cnil.fr/fr/la-videosurveillance-videoprotection-au-travail), page datée du 23 juillet 2018 | Objectif, cadrage, consultation, information, conservation et formalités selon le lieu. Aucun avis automatique de licéité. |
| [CNIL, tracer les opérations](https://www.cnil.fr/fr/securite-tracer-les-operations), 14 mars 2024 | Contenu et usages des traces, accès, information, exploitation et suppression. Aucune collecte de vrais journaux dans RGPDESK. |
| [CNIL, référentiel des activités commerciales](https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_traitements-donnees-caractere-personnel_gestion-activites-commerciales.pdf), sections 2, 3 et 5 à 8 | Assistance, réclamations et service après-vente. Trame volontairement distincte de la prospection. |
| [RGPD, source officielle EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr), articles 5, 6, 28 et 30 ; ressource CNIL « Informer les personnes » déjà référencée | Questions sur les données des contacts fournisseurs, les finalités, le périmètre, les destinataires et l’archivage. Le texte intégral EUR-Lex a de nouveau répondu par une protection JavaScript lors de cette consultation ; les références déjà documentées du dépôt ont été conservées et les extraits institutionnels indexés des articles 5 et 6 recoupés. |

Le choix « un coffre par client » et la recherche limitée au coffre ouvert sont des choix de cloisonnement du produit, pas des prescriptions attribuées au règlement. La recherche ne constitue ni un diagnostic de conformité ni une recherche dans les justificatifs originaux.


## FAQ métier (23 septembre 2026)

Portée : réponses d’orientation pour les DPO de PME et d’associations, sans qualification individuelle ni validation humaine présumée. Liens affichés dans chaque réponse ; les parcours produit sont vérifiés dans le guide utilisateur et les composants correspondants.

| Source consultée | Portée dans la FAQ |
| --- | --- |
| [RGPD, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr), articles 5 §1 e), 6 §1 f), 28, 30 §5, 32 et 35, considérant 47 | Texte applicable cité. EUR-Lex a renvoyé une protection JavaScript ; les articles 28, 30, 32 et 35 ont été recoupés avec leur [reproduction par la CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4). Aucun contournement de la protection. |
| [CNIL, registre](https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement), 13 avril 2018 | Construction du registre par activité et finalité ; portée de la dérogation pour les petites structures. |
| [CNIL, intérêt légitime](https://www.cnil.fr/fr/les-bases-legales/interet-legitime), 29 novembre 2019 | Intérêt poursuivi, nécessité, mise en balance et attentes raisonnables ; aucun fondement par défaut. |
| [CNIL, durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees), 2 avril 2026 | Finalité, textes applicables, distinction usage courant / archivage et texte obligatoire / recommandation. Aucune durée sectorielle ajoutée à la FAQ. |
| [CNIL, AIPD](https://www.cnil.fr/fr/RGPD-analyse-impact-protection-des-donnees-aipd), page d’orientation consultée le 23 septembre 2026 | Risque élevé et renvoi aux listes ; distinction registre et AIPD, sans décompte automatique de critères. |

## Quatre lectures de l’inventaire (consultation du 23 septembre 2026)

- [RGPD, texte officiel EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr) : articles 5, 24, 25, 28, 32 et 35 §7. Texte applicable ; ne détermine pas automatiquement la qualification d’un cas.
- [ANSSI, méthode EBIOS Risk Manager](https://cyber.gouv.fr/securisation/analyse-des-risques/methode-ebios-rm/) : repère méthodologique pour le périmètre, les événements redoutés, les impacts et les mesures. RGPDESK ne reproduit ni ne revendique la méthode complète ou son label.
- Les faits et références des dix cas de démonstration sont inventés et explicitement identifiés comme tels. Les sources normatives sont des repères à examiner, pas des réponses aux cas.
