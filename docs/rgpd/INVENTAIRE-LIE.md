# Inventaire lié, citations et restitution

Édition technique du 23 septembre 2026. Implémentation locale ; aucune revue juridique experte présumée.

## Formats et compatibilité

- `rgpd-master-v6` ajoute des références facultatives d’extrémités de flux, la reprise explicite des catégories de données, les citations structurées par question et le type de dossier `security`.
- La migration valide strictement v5, ajoute uniquement le nouveau marqueur de format en mémoire et préserve IDs, révision et historiques. Les écritures restent chiffrées et transactionnelles, gardées par révision/époque/session. Aucun effacement de base.
- Après un premier enregistrement en v6, une ancienne version de l’application limitée à v5 ne peut pas rouvrir ce coffre. Conserver une sauvegarde chiffrée avant mise à jour et utiliser la version actuelle pour restaurer un coffre v6 ; aucun retour automatique vers v5.
- Les v1 à v5 restent lisibles via leurs validateurs et migrations. Les anciennes appréciations et notes ne sont pas réécrites. Les nouvelles analyses de nécessité commencent sans appréciation héritée du carnet RGPD.
- `rgpd-share-v1` garde ses rendus canoniques antérieurs. Un partage sans compléments reste v1. `rgpd-share-v2` ajoute exclusivement les flux, positions et suites sélectionnés, avec de nouveaux identifiants. Le vérificateur v2 n’accepte aucun rendu alternatif hérité. Les vérificateurs anciens ne connaissent pas v2.

## Invariants

Les flux liés résolvent leurs libellés contre l’inventaire courant ou le contexte historique propre à la revue. Référence inexistante, copie contradictoire et citation hors périmètre sont refusées. Les citations sont bornées à huit par question ; passage et signification doivent être renseignés. Une version différente produit un point à réexaminer, sans changement de conclusion. Une revue favorable AIPD reste refusée tant que ses citations ont une version divergente.

La restitution est une projection positive : aucun objet maître ou document interne n’est sérialisé. Soixante flux et dix positions/suites maximum ; limites d’archive inchangées. Un extrait client n’accepte pas ces compléments. Tous les textes sont échappés, les formules CSV neutralisées, le HTML passif sous CSP à empreinte. Aucun moteur de graphes, script, ressource distante ou dépendance ajouté.

## Recette métier à mener

Les dix cas `cas-2026-09-23.1`, cinq PME et cinq associations, sont dans `reference-cases.ts`. Ils disposent de tests de structure, absence de choix juridique, résolution des liens, recherche, conservation de revue et exclusion des citations au partage. Ces tests ne valident pas leur pertinence juridique.

Faire relire chaque cas par Estelle : exactitude des questions, ambiguïtés, informations manquantes, charge de saisie, séparation des quatre lectures et intelligibilité de la restitution. Enregistrer date, personne, version et observations avant de déclarer un cas validé. La méthode SI est une trame qualitative RGPDESK, pas une étude EBIOS RM complète.
