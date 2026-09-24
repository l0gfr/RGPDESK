# Demandes, références, changements et comparaison

Extension du 24 septembre 2026. Aucun service externe, dépendance ou format de partage supplémentaire.

## Modèle et conservation

Le master v8 ajoute `collections`, facultatif, borné à 40 demandes. Destinataire, échéance choisie, questions figées, réponses successives et relectures sont chiffrés avec le coffre. 30 questions/demande, 8 réponses/question, 4 000 caractères/réponse, 20 références/réponse ; le master reste borné à 2 Mio. L’objet est fermé et validé par Ajv standalone et invariants croisés. Les UUID sont uniques dans le coffre, toutes les références sont locales, les dates et révisions sont cohérentes. Questions et réponses sont immuables après consignation ; application et clôture sont historisées sans réécriture. Les noms saisis sont déclaratifs.

La migration v7 vers v8 valide d’abord le schéma historique, préserve les champs et reste en mémoire. Les fichiers des schémas historiques ne sont pas modifiés. Les sauvegardes chiffrées incluent les demandes enregistrées, pas les brouillons séparés. Les projections de partage n’incluent aucune demande ou réponse.

## Commandes

- `createCollection`, `addCollectionReply`, `closeCollection` appliquent la révision attendue via `reviseWorkspace`.
- `applyCollectionReply` ne permet que cinq champs factuels explicitement choisis : personnes, données, destinataires, mesures, transferts. Comparaison avant/après et auteur sont conservés. Une réponse ne peut être appliquée qu’une fois ; une valeur antérieure ou révision obsolète est refusée. Aucun fondement, durée, avis, décision ou clôture automatique.
- `citeEvidence` ajoute le même passage explicitement choisi à 20 questions courantes au plus, avec liens documentaires vers leurs activités. Refus des doublons et des contrats d’autres références. Les citations restent soumises à leurs limites et portées existantes ; les appréciations et contextes historiques sont préservés.
- `matchingReferences` compare SHA-256 et taille dans les références du coffre ouvert uniquement. Aucun fichier, nom de fichier ou handle n’est stocké.

## Interface et confidentialité

Les nouvelles saisies participent à la garde de navigation et aux brouillons chiffrés. Les confirmations sont toujours remises à faux après reprise. Les références et réponses ne deviennent jamais du HTML. L’ouverture d’un élément lié pendant une modification utilise la même garde d’abandon que le reste de l’application. Le détail des dépendances repose uniquement sur des identifiants liés, sans rapprochement de texte libre.

`DeliveryComparison` reçoit deux DTO de partage vérifiés, lus depuis les instantanés historiques après contrôle de session, époque et révision. La destruction du composant ou une nouvelle sélection invalide les résultats asynchrones. Aucun accès au master courant pour compléter des champs absents. Les UUID de livraison ne sont pas utilisés comme identité ; seules les activités de même intitulé/rôle unique sont rapprochées. Homonymes et changements de périmètre restent explicites ; aucune absence n’est interprétée comme clôture ou suppression. Les différences ne couvrent pas les publications AIPD distinctes.
