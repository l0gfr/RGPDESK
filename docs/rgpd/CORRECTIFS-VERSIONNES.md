# Correctifs appliqués aux faits du registre

## Parcours

Dans **Actions & décisions**, **Préparer un correctif** cible un ensemble existant. La priorité est choisie par le DPO (à traiter d’abord, ensuite, plus tard), avec motif, responsable, échéance facultative et dépendances éventuelles. Aucun ordre juridique n’est déduit.

Les changements sélectionnent des champs existants du catalogue fermé : descriptions générales, sous-finalités, groupes D1/D2 (données, personnes, conservation, minimisation, garanties), opérations et accès des flux, étapes de parcours, liens vers les supports et intervenants. Un correctif peut regrouper douze changements. Il ne crée ni ne supprime automatiquement de groupe, parcours, support ou acteur.

La préparation conserve l’avant/après attendu et le contexte utile, sans modifier les faits. **C’est fait, voilà la preuve** permet de relire les changements et la description qui en résultera, de choisir une à huit références documentaires déjà liées à l’ensemble, de préciser leur version, le passage examiné et ce qu’il démontre, puis de consigner l’auteur et le constat de réalisation. La confirmation de relecture est exigée à nouveau ; elle ne fait pas partie du brouillon récupérable.

Une seule révision du coffre applique les changements et conserve la clôture, les justificatifs et deux descriptions figées. Le registre courant, les tableaux de données et les flux réutilisent les faits corrigés. Le DPO peut ensuite **Préparer l’export du registre**, choisir le destinataire et relire sa sélection. Aucun export n’est produit ou envoyé automatiquement. Les anciens exports et revues restent inchangés.

Les repères v1, v2… comptent les états successifs autour des correctifs appliqués à cet ensemble. Ils ne prétendent pas historiser toutes les modifications manuelles de la fiche. L’historique indique précisément l’état immédiatement avant et après chaque correctif ; la lecture courante peut comporter des changements ultérieurs.

L’application documente une réalisation déclarée. Elle n’inspecte pas les systèmes externes et ne vaut ni validation juridique ni constat indépendant de l’authenticité d’une pièce. Les analyses concernées sont proposées à la relecture, sans validation automatique.

## Intégrité et limites

- Catalogue de champs explicite : aucun chemin fourni par une saisie n’est utilisé pour affecter arbitrairement des propriétés.
- Le contexte et la valeur de départ sont comparés avant toute application. Si les faits ont changé, reprendre le correctif, relire puis adopter explicitement le nouvel état de départ.
- Une preuve sans version, une version remplacée, un document d’un autre ensemble, un repère ou constat vide bloque l’application.
- Les dépendances doivent avoir été appliquées auparavant. Une action abandonnée ne lève pas une dépendance ; les cycles sont refusés.
- Un correctif clôturé et ses instantanés sont immuables dans les commandes de l’application. Les anciens exports ne sont pas régénérés.
- Les descriptions figées résolvent leurs références dans leur propre inventaire historique. Renommer une pièce ou un acteur courant ne réécrit pas le passé.
- L’écriture utilise la transaction chiffrée existante du coffre, avec contrôle de révision, de session et d’époque. Un échec conserve l’état antérieur entier.
- Le coffre conserve uniquement les références documentaires, jamais les pièces originales. Les justificatifs internes et les instantanés ne rejoignent pas automatiquement la liste blanche de partage.
- Les limites globales de taille restent en vigueur (2 Mio pour le master, 1 Mio pour un brouillon, 500 actions). Les instantanés consomment une partie de cette capacité ; une opération dépassant ces limites est refusée sans application partielle.

## Compatibilité

Le master v11 ajoute une branche facultative `corrective` aux actions. Les schémas historiques v1 à v10 restent inchangés. Un master v10 valide est adapté en mémoire sans nouvelle révision ni écriture lors de son ouverture. La première modification enregistrée utilise v11. Une version ancienne de l’application ne doit pas réécrire un coffre v11 ; conserver une sauvegarde chiffrée et utiliser une version compatible.

Le brouillon v4 ajoute le formulaire de correctif ; les brouillons v1 à v3 restent lisibles. Les formats de chiffrement, les paramètres cryptographiques, l’AAD, le verrouillage, les tables IndexedDB et les formats publics de partage ne changent pas.

## Vérifications

Les tests couvrent préparation sans mutation, aperçu, application atomique, versions successives, réexamen des revues, liste blanche d’export, références historiques, conflits, dépendances, pièces hors périmètre, entrées malformées, altérations d’historique et vues réactives. Le parcours navigateur utilise des données fictives ; le test de stockage utilise WebCrypto et IndexedDB, une panne de quota, une révision concurrente, une sauvegarde et un brouillon réellement chiffrés.

Les résultats d’exécution du rapport de livraison font foi. Ces tests ne constituent pas un audit indépendant.
