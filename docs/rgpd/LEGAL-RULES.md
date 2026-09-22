# Catalogue de règles — proposition à valider avant publication

Version 1.0, 22 septembre 2026. Ce document traduit des sources en exigences de conception ; il ne constitue pas une consultation juridique et ne couvre pas tous les régimes sectoriels. Références détaillées dans `SOURCES.md`.

## 1. Gouvernance du catalogue

Chaque règle possède : identifiant stable, version, finalité, faits nécessaires, résultat calculable, explication, source(s), article, juridiction, nature du texte, date de consultation, période d'application connue, statut éditorial et tests. Distinguer `binding-law`, `authority-guidance` et `product-practice`. Ne jamais assimiler une recommandation ou une bonne pratique à une obligation expressément prévue par un article.

Une date de consultation n'est pas une date d'entrée en vigueur. Une proposition législative n'est pas du droit applicable. Les travaux Digital Omnibus font précisément l'objet de propositions et de textes de compromis : vérifier le texte adopté et son applicabilité avant toute activation d'une modification. [J10]

Le catalogue est embarqué et livré avec l'application. Une mise à jour ne remplace pas les décisions historiques : elle crée une proposition de réévaluation et indique les règles modifiées. Le moteur n'actualise pas les dossiers par des appels web.

Un agent peut préparer les règles et leurs tests, mais ne peut pas inscrire fictivement le nom d'un validateur humain. La publication d'un catalogue présenté comme revu exige une revue réelle et traçable. Les règles non revues restent explicitement signalées en développement ; elles ne deviennent pas « officielles » par passage des tests unitaires.

## 2. États et conclusions

L'applicabilité vaut applicable, non applicable avec justification, ou indéterminée. L'absence de donnée ne vaut jamais exemption. Une règle exprime soit un manque documentaire démontrable, soit une question à examiner, soit une incohérence entre déclarations.

Le résultat « documenté » signifie que l'information attendue est renseignée selon le contrôle indiqué. Il ne signifie pas qu'elle est exacte, légale ou suffisante. L'auteur d'une décision, sa justification, son périmètre et la version de référence restent consultables.

## 3. Règles documentaires de la V1

### R-001 — Type de registre

Le type responsable/sous-traitant détermine les rubriques et la projection article 30. Les champs supplémentaires de pilotage sont étiquetés comme tels. Aucune conversion automatique du rôle parce qu'un intervenant se décrit comme « hébergeur ». [J01]

Test : deux activités du même organisme peuvent avoir des rôles différents ; le registre client d'un sous-traitant ne révèle pas les autres clients.

### R-002 — Finalité et base légale

Pour une activité responsable, signaler une finalité sans base documentée comme question de licéité à examiner, sans sélectionner le consentement par défaut. Une finalité complémentaire exige sa propre analyse ; le fournisseur logiciel n'est pas l'unité de choix de la base légale. [J02]

Test : facturation et prospection utilisant le même outil conservent deux analyses distinctes. Le moteur ne transforme pas l'absence de base en une prétendue violation de rubrique expressément énumérée à l'article 30.

### R-003 — Données particulières et pénales

Documenter séparément base de l'article 6, condition éventuelle de l'article 9 et régime de l'article 10. Le caractère « sensible » d'un document interne au sens sécurité ne suffit pas à classer toutes ses données dans l'article 9. [J02]

Test : une base contractuelle renseignée n'éteint pas une question relative aux données de santé ; un IBAN n'est pas automatiquement catégorisé article 9.

### R-004 — Conservation

Rechercher une durée ou un critère documenté, une portée et un événement de départ. Distinguer règle définie et mise en œuvre de l'effacement. Les durées sectorielles doivent être sourcées individuellement ; aucune durée universelle n'est fournie. [J02, J04]

Test : « jusqu'à la clôture du dossier puis examen selon la règle X » n'est pas arbitrairement transformé en nombre de jours ; la simple présence d'un champ durée ne prouve pas que la suppression a été exécutée.

### R-005 — Intervenants et contrats

Pour une relation déclarée de sous-traitance, l'absence de référence au contrat ou autre acte applicable produit « cadre contractuel à documenter », pas « fournisseur illégal ». La présence d'une référence produit « référence disponible », pas « toutes les exigences contractuelles remplies ». [J01]

Test : un document commercial intitulé « GDPR compliant » ne ferme pas automatiquement le contrôle contractuel.

### R-006 — Transferts

Distinguer non examiné, aucun transfert identifié après examen, et transfert identifié. Demander les accès et transferts ultérieurs ; le seul hébergement dans l'EEE ne clôt pas le contrôle. Le mécanisme invoqué est rattaché à l'entité, l'opération et sa portée, jamais à une appréciation générale d'une marque. [J09]

Test : stockage dans l'EEE et accès déclaré par un prestataire distinct situé dans un pays tiers génèrent un examen ; la nationalité d'une maison mère ne suffit pas à elle seule à conclure sur tous les flux.

### R-007 — Information des personnes

Relier une notice à une finalité, un public, un canal, une version et sa disponibilité. Distinguer collecte directe et indirecte. Une URL renseignée ne vaut ni contrôle de contenu ni preuve de remise ; aucun fetch automatique de cette URL. [J04]

Test : un changement de finalité marque la notice liée comme à réexaminer sans réécrire l'ancien snapshot.

### R-008 — Pièce manquante, périmée ou hors périmètre

Une référence absente, datée comme à renouveler ou liée à un autre périmètre crée un constat documentaire. Dédupliquer ce constat et l'action associée. La date de revue définie par l'organisation est une politique interne, sauf durée légale précisément identifiée.

Test : le recalcul ne crée pas une nouvelle tâche identique et une pièce concernant une filiale ne couvre pas silencieusement toutes les entités.

### R-009 — Exemptions, DPO et risques particuliers

Aucune règle d'exemption générale à partir du seul effectif. Aucune conclusion « pas de DPO nécessaire » à partir de la petite taille. La V1 conserve une décision motivée ou une question ouverte ; elle ne prétend pas qualifier automatiquement tous les cas des articles 30 et 37. [J01]

Test : un organisme de petite taille ne reçoit pas un état global favorable lorsque le contexte d'activité n'est pas renseigné.

### R-010 — Revue du dossier partagé

Une revue est liée à une révision et à un destinataire/profil. Un changement d'entrée invalide la revue en cours. Les réserves peuvent être volontairement communiquées. La revue de l'export signifie « contenu partagé examiné », pas « dossier conforme ».

Test : après ajout d'un commentaire interne, l'export reconstruit sa projection sans ce commentaire ; après changement d'une information partageable, l'ancienne confirmation ne suffit plus.

## 4. Règles du lot 4 : droits et violations

### R-011 — Délais des droits

Le calcul du profil général part de la réception et travaille en mois calendaires, pas en `30 * 24 h`. Séparer date nominale, éventuel ajustement applicable, prolongation motivée et information du demandeur. La prolongation possible est de deux mois supplémentaires dans les conditions de l'article 12, avec information dans le premier mois. [J04, J05]

Les cas de fin de mois, année bissextile, week-end/jour férié, fuseau et régime spécial doivent être documentés par des fixtures juridiques validées avant publication du calculateur. Ne pas inventer une règle de pause ou un redémarrage à chaque échange. Un régime spécial non implémenté produit une alerte et une échéance manuelle motivée, jamais un calcul présenté comme certain.

### R-012 — Identité, tiers et réponse

Pas de demande systématique de pièce d'identité. Enregistrer la méthode proportionnée et la raison d'une demande supplémentaire lorsqu'elle est nécessaire. Ne pas stocker le document justificatif par défaut. Préserver les droits des tiers dans le projet de réponse. [J05]

Test : « identité suffisamment établie » n'impose pas d'upload ; une exportation de catégories de données n'est pas présentée comme la copie des données demandées.

### R-013 — Horloge des violations

Séparer `occurredAt`, `detectedAt` et `awarenessAt`. Pour le responsable, la référence des 72 heures après prise de connaissance ne supprime pas l'exigence d'agir dans les meilleurs délais et dépend du risque. Pour le sous-traitant, l'information au responsable se fait dans les meilleurs délais : ne pas lui accorder automatiquement une fenêtre de 72 heures. [J06]

Test : l'horloge utilise des instants UTC, 72 heures écoulées même autour d'un changement d'heure, tout en affichant le fuseau local. Modifier la prise de connaissance exige une justification ; la chronologie antérieure n'est pas effacée silencieusement.

### R-014 — Décisions de notification

Documenter toutes les violations. Distinguer notification à l'autorité, information des personnes et exceptions éventuelles. Les seuils de risque et de risque élevé ne sont pas fusionnés. Prévoir notification initiale, compléments et raison d'un retard ; ne pas attendre une enquête entièrement terminée pour permettre la préparation d'un premier signalement. [J06]

Test : un incident non notifié reste au registre interne ; un dossier incomplet reste exportable pour préparer une notification urgente. Le logiciel ne revendique pas une notification effectuée à partir d'un simple téléchargement.

## 5. Règles du lot 5 : AIPD et analyses approfondies

### R-015 — Orientation AIPD

Le moteur documente les critères et leur incertitude, les listes pertinentes et une décision motivée. Le décompte de deux critères est un indicateur important, pas un substitut général à l'appréciation du risque : un seul critère peut justifier l'AIPD et les exceptions à une présomption doivent être étayées. Les listes imposant une AIPD ne peuvent pas être ignorées au profit d'un score faible. [J07, J11]

Test : neuf critères inconnus ne donnent pas zéro risque ; une correspondance avec une liste obligatoire n'est pas neutralisée par une case « pas nécessaire » sans traitement explicite de la contradiction.

### R-016 — AIPD complète et risque résiduel

Distinguer dépistage, analyse en cours, avis recueillis, mesures, risque résiduel et décision. La référence d'une AIPD ne constitue pas son approbation. Un risque résiduel élevé soulève notamment la question d'une consultation préalable de l'autorité. [J07]

Test : une mesure envisagée n'est pas traitée comme mise en œuvre ; une analyse ancienne reste liée à l'ancienne version du traitement.

## 6. Ce que les règles ne font pas

Aucun avis final sur la licéité d'un traitement complexe, aucun choix automatique de base légale, aucune garantie de validité d'une clause, aucune recommandation de ne pas notifier et aucune qualification définitive d'un transfert à partir d'un seul pays.

Les workflows n'effectuent pas les opérations sur les systèmes de l'organisation. « Action déclarée terminée » n'est pas « données effectivement effacées du CRM ». Les documents générés restent des projets à contrôler et compléter.
