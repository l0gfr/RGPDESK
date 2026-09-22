# RGPDESK : lots 2 et 3, identité visuelle

22 septembre 2026. Suite autorisée des lots 0 et 1, avec identité distincte demandée par l’utilisateur. Travail local, aucun push ni déploiement. Le rapport du lot 1 reste un relevé historique, pas une description du nouveau périmètre.

## Parcours

- `/app/privacy/` : identité ivoire, encre bleue et sauge, titres serif, navigation latérale, icônes SVG locales et illustration vectorielle du dossier. Formulaires sémantiques, focus clavier, dispositions 1440/768/390/320 px. Aucun téléchargement de police, image ou icône tiers.
- Import CSV : choix d’encodage UTF-8 strict ou Windows-1252, séparateur virgule/point-virgule/tabulation ; mapping explicite, aperçu, lignes rejetées, colonnes ignorées et cellules incompatibles avec le rôle. Confirmation avant ajout ; aucune fusion par nom. Modèle fictif association et service ; les champs légaux restent inconnus. Annuler ne modifie rien.
- Références sans binaires : contrat, notice, politique, analyse, autre ; activité/finalité/intervenant/périmètre, version/auteur déclarés, référence interne, réserves, sensibilité et prochaine revue. Le texte public est séparé et sélectionnable explicitement lors d’un partage. Aucune URI ouverte automatiquement.
- Contrôles documentaires R-001 à R-009 et contrôle de partage R-010, sources embarquées, articles, faits nécessaires, explication, nature produit, date de consultation, statut non revu. Aucun validateur humain inventé. Questions, décisions motivées et tâches dédupliquées. Clôtures avec auteur et justification conservées. Filtres par lacune, activité, responsable et échéance. Un changement de révision ou de catalogue signale une revue à refaire de façon conservatrice ; il ne réécrit pas le passé.
- Partage : profils article 30 responsable, article 30 sous-traitant, revue documentaire, extrait client. Sélection explicite des activités et références publiques ; destinataire, périmètre et réserves. Prévisualisation de toutes les valeurs du DTO ; confirmation liée à la révision. Les inconnues restent visibles et n’interdisent pas une livraison portant ses limites.
- Livraison : cinq fichiers fixes dans un ZIP, inventaire et SHA-256, historique chiffré enregistré avant proposition du téléchargement. Retélécharger un instantané ne le recalcule pas. Vérificateur navigateur distinct et CLI locale avec contrat commun.

## Isolation et intégrité

`rgpd-master-v2` ajoute les données documentaires. Le schéma v1 est inchangé. Une migration v1 vers v2 est explicite, validée et uniquement en mémoire à l’ouverture ; identifiants/révision et ancien chiffré restent inchangés jusqu’à une sauvegarde transactionnelle. Les valeurs nouvelles restent inconnues, sans exemption automatique.

La base `rgpdesk-vault-v1` passe au schéma IndexedDB 2 avec une table d’instantanés chiffrés séparée. En clair : UUID d’espace et de livraison, révision, paramètres cryptographiques. Aucun index métier. Le contexte authentifié d’un instantané inclut son UUID en plus de l’espace et de la révision. Chaque chiffré produit est relu avant transaction. Reçu et instantané sont écrits atomiquement sous contrôle de révision, d’époque et d’annulation ; un quota ou verrouillage ne laisse pas de demi-livraison.

`rgpd-backup-v2` transporte le master et tous les instantanés, avec inventaire authentifié. Les sauvegardes v1 restent lisibles. Toute omission, entrée inconnue ou collision est refusée. La restauration rechiffre et écrit toutes les entrées en une transaction. La sauvegarde est une restauration complète privée, distincte du ZIP en clair.

La projection de partage ne sérialise pas le master. Notes, références internes, systèmes, provenances, décisions/actions, correspondances d’UUID et autres clients sont exclus par construction. Les UUID publics sont régénérés pour chaque livraison. L’extrait client refuse les activités communes à plusieurs clients et les références couvrant un autre périmètre. Un texte libre autorisé peut contenir une information mal placée ; l’examen humain du DTO reste nécessaire.

Rapport HTML sans script ni ressource externe, texte échappé et CSS constant autorisé par son empreinte CSP. CSV cité et neutralisé contre les préfixes de formule après normalisation NFKC et suppression des caractères directionnels invisibles. Le JSON conserve les déclarations textuelles validées. Le vérificateur refuse aussi un HTML actif ou un CSV divergent dont les empreintes auraient été recalculées. Cela n’empêche pas une falsification cohérente de tout le paquet : aucune authenticité n’est revendiquée.

## Limites et suite

- Catalogue `fr-eu-2026-09-22.draft-1` : contrôles proposés, consultation CNIL des chapitres II, III, IV et guide des transferts le 22 septembre 2026. Pas de revue juridique humaine. Les rubriques renseignées ne prouvent ni exactitude ni respect exhaustif de l’article 30. Pas de réforme législative proposée activée.
- CSV 2 Mio, 200 enregistrements, 50 colonnes, 4 000 caractères/cellule. 20 lots de provenance, sans nom de fichier ni contenu brut. XLSX non implémenté.
- Master 2 Mio / 200 activités ; 200 références, 500 actions, 500 décisions. Au maximum 8 instantanés de 512 Kio et sauvegarde 12 Mio, contenu clair déchiffré borné à 8 Mio. Le budget effectif d’un export peut être atteint avant 200 activités.
- Revue conservatrice après toute modification du dossier ; pas de calcul différentiel de la pertinence de chaque changement. Aucune tâche ou conclusion juridique créée silencieusement. Les déclarations de clôture ne réalisent pas l’effacement dans un système tiers.
- Les propriétés de sécurité générales, la perte de phrase, l’origine/profil navigateur, le quota, la session ouverte et l’effacement des seules copies locales restent les limites du lot 1. Travail hors ligne après chargement ; rechargement hors ligne non garanti.
- Qualification automatisée Chromium. Firefox, Safari et revue d’accessibilité humaine exhaustive non exécutés. Les contrôles automatisés ne constituent pas un audit de sécurité indépendant.
- La publication demande encore revue humaine du catalogue, audit ciblé indépendant, qualification des navigateurs et séparation des routes publiques cyber héritées. Ne pas publier le build mixte tel quel.
- Prochain lot fonctionnel : **lot 4, demandes de droits et violations**, hors de cette livraison. Aucun compte, backend, upload, analytics, CDN, IA distante, synchronisation ou score de conformité ajouté.

Les commandes et résultats exécutés sont consignés dans le rapport de recette final joint à cette tâche.

## Résultats exécutés

Runtime : Node 22.23.2 et pnpm 10.34.5, versions du dépôt, sans mise à jour majeure.

- `pnpm verify:all` : terminé avec code 0 ; lint, schémas, vecteurs, types, composants, 375 tests unitaires/scripts/artefacts, build de 47 pages, CSP Apache, garde AGPL/open-source, audit des dépendances, scan de secrets et audit statique de sécurité ; 153 tests E2E réussis, 3 ignorés.
- Les 3 cas hérités `knowledge-base.spec.ts` sont conditionnels : un attend le profil controlled-pilot, deux un artefact qualifiant explicitement le Knowledge Vault. Aucun de ces profils n’est celui du build courant. Ils ne sont pas déclarés réussis.
- Après cette suite, seule une phrase de prévisualisation a été simplifiée pour retirer le terme technique « DTO ». `pnpm check`, `pnpm build` et `pnpm test:privacy:e2e` ont ensuite été réexécutés sur l’artefact final : code 0, 28/28 tests RGPD réussis.
- `pnpm test:privacy` : 28 tests de domaine et 8 de chiffrement réel réussis. `pnpm --filter @rgpdesk/privacy-verifier test` : 9/9 réussis, dont CLI, ZIP hostiles et canoniques.
- `pnpm audit` : aucune vulnérabilité connue signalée à l’exécution ; ce résultat ne prouve pas l’absence de vulnérabilité inconnue. `pnpm security:audit` : garde réseau/HTML/stockage et scan de secrets réussis. `git diff --check` : code 0.
- Astro : 0 erreur, 0 avertissement, 11 hints préexistants ; Svelte : 0 erreur, 0 avertissement. Avertissements d’environnement NO_COLOR/FORCE_COLOR et Fontconfig hérités non bloquants.
- Échecs intermédiaires corrigés : ordre canonique JSON/CSV/HTML ; noms accessibles des listes déroulantes ; typage des motifs de rejet CSV. Premier lancement E2E bloqué par le serveur d’aperçu existant, puis relancé après arrêt de ce serveur. Aucun test final RGPD bloqué.
- Vérification d’intégrité des fichiers du socle : LICENSE, NOTICE, THIRD_PARTY_NOTICES.md, TRADEMARKS.md, primitives chiffrement/stockage/sauvegarde/verrouillage et configuration Astro identiques à HEAD. Les sections packages/snapshots du lockfile externe sont identiques ; seuls des importers et liens locaux ont été ajoutés. BLACKPROOF-AGPL source reste propre.
