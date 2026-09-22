# Atelier AIPD, tranche du 22 septembre 2026

## Parcours et portée

Un dossier par activité du registre : déclenchement, contexte et droits, nécessité et alternatives, risques pour les personnes, garanties, avis et décision, lecture et revues conservées. La méthode est `aipd-2026-09-22.1`. Le guide public explique le parcours et les limites sans jargon de développement.

Le responsable de traitement reste décideur, le DPO conseiller et le sous-traitant contributeur. L’outil ne choisit ni obligation de réaliser l’AIPD, ni fondement, durée, niveau de risque, seuil ou conclusion. Les neuf critères du G29 ne forment pas un score. Les matrices montrent uniquement les niveaux explicitement choisis ; les inconnus restent hors matrice. Aucune conformité ni qualité de preuve n’est déduite de la présence d’un texte.

Les quatre phases CNIL sont couvertes, avec un examen amont du déclenchement et un suivi aval des consultations et changements. Les questions de nécessité sont enrichies par des alternatives distinctes et les scénarios incluent les effets sur les libertés du fonctionnement prévu, en plus des atteintes aux données. Le support ESIEA de De Marco éclaire ce raisonnement sans être reproduit ni présenté comme une validation du produit. SOURCES.md donne les versions et repères.

## Modèle, invariants et compatibilité

`rgpd-master-v4` ajoute `impactAssessments`. Les schémas v1 à v3 restent intacts et sont validés avant migration. v3 vers v4 ajoute une liste vide ; aucune note, révision, date ou identification n’est remplacée. La migration a lieu en mémoire à l’ouverture. Seule une écriture explicite validée persiste v4. Le namespace `rgpdesk-vault-v1`, la version IndexedDB, les enveloppes, AAD, PBKDF2 600000, AES-GCM, époques et gardes de révision restent inchangés.

Un dossier comporte des connaissances structurées, alternatives, risques, mesures et revues. Les notes d’analyse de l’activité sont copiées lors de la création, puis évoluent séparément. Le contexte courant provient du registre. Une revue contient une copie de l’étude et du contexte (activité, organisme, acteurs, systèmes, références liés). Modifier une référence ou une activité ne réécrit jamais l’historique ; une comparaison du contenu signale qu’un réexamen est à instruire. Ce constat n’est pas une validation de la substance ou une preuve d’identité.

Les commandes empêchent suppression/réécriture des revues, association à une autre activité, ajout falsifié d’un instantané ou ajout de plusieurs revues à la fois. L’ensemble et chaque historique sont validés : schéma strict, IDs, relations, unicité, version, bornes, chronologie de révisions. Une revue de poursuite sous-traitante est refusée, y compris à l’import du document déchiffré. Le coffre n’est pas un journal signé ou une preuve contre son propriétaire capable de réécrire un contenu avant chiffrement.

Limites : 40 dossiers, 20 alternatives, 30 risques, 50 mesures, 8 revues par dossier, 4000 caractères par connaissance. Le budget global de 2 Mio, 30000 nœuds et profondeur 24 reste appliqué avant toute écriture : des revues volumineuses peuvent atteindre cette limite plus tôt. Aucun historique n’est tronqué pour sauver une nouvelle version.

Une version du site antérieure à v4 ne peut pas ouvrir un coffre réenregistré en v4. Un rollback ne doit jamais effacer son stockage. Conserver les sauvegardes et rouvrir avec une version compatible. Les exports partagés historiques et leurs instantanés restent inchangés.

## Contrôles de décision, choix produit

Une poursuite ne peut être consignée si l’examen de déclenchement, les appréciations et références, les alternatives, les risques, les avis ou le suivi restent incomplets ; ni avec risque résiduel inconnu/élevé. Une baisse de niveau exige une mesure liée, déclarée vérifiée, avec preuve et efficacité documentées. Les mesures saisies non vérifiées restent des points ouverts. Ces contrôles documentaires sont des garde-fous produit, pas des obligations juridiques attribuées à une source ni une lecture automatique des pièces.

Une position de réexamen, renoncement ou préparation de consultation peut conserver un dossier incomplet avec des raisons. L’utilisateur doit enregistrer le brouillon, saisir l’auteur déclaré et les motifs puis confirmer sa relecture. La décision n’est pas un envoi à une autorité, une signature ou une certification.

## Confidentialité

Aucun trafic métier, nouvelle dépendance, upload ou télémétrie. Tous les champs restent dans le document chiffré ; la sauvegarde chiffrée les conserve. Les composants rendent du texte échappé, sans HTML utilisateur. Les erreurs n’incluent pas le texte des parseurs. Verrouillage et changement d’époque évacuent le brouillon. Les textes, IDs et revues AIPD sont exclus des projections de registre par liste blanche, y compris les anciens IDs d’un contexte historique.

## Lecture du cours et travaux à poursuivre

| Enseignement examiné | Application et limite |
| --- | --- |
| Objectif, efficacité, alternatives, restrictions proportionnées, p.74–90 | Huit carnets et comparaison structurée ; aucune réponse préremplie |
| Droits et libertés, risques et garanties, p.171–208 | Conséquences pour les personnes, mesures existantes, risques initiaux/résiduels, efficacité et défaillance des garanties |
| Gouvernance et réexamen, p.211–213 | Avis, responsabilités déclarées, suivi et contexte conservé avec chaque revue |
| Autres champs du cours : gouvernance générale, secteurs et enjeux numériques | Pas de transformation de 451 pages en obligations universelles ; validation juridique et extensions métier séparées |

À soumettre à la relectrice : articulation finalité/opération/fondement ; suffisance des comparaisons et des échelles ; droits non réductibles à la sécurité ; preuves des garanties ; décision du responsable et consultation article 36 ; rôle du sous-traitant ; limites des contrôles documentaires. Aucune revue externe n’est déclarée accomplie.

La lecture du dossier est interne. Export AIPD par liste blanche avec revue, interopérabilité CNIL, gestion des demandes de droits, violations et analyses spécialisées de transferts restent à construire. Ne pas présenter cette tranche comme la couverture de tous les besoins du DPO.

## Recette

Tests métier : migrations sans mutation, inconnus, bornes/relations, historique conservé, modification de contexte, poursuite sous-traitante refusée, réduction non étayée, conflits, canaris de fuite dans le partage. Adaptateur : WebCrypto réel, ouverture d’une enveloppe v3 intacte, sauvegarde/restauration v4 et revue exacte. Navigateur : saisie hors réseau, sauvegarde, décision, ancien contexte après modification, réouverture, texte hostile échappé, aucun contenu métier dans les requêtes ou logs. Les résultats d’exécution sont consignés dans le compte rendu de livraison ; l’existence des tests n’atteste pas leur réussite.
