# Analyse, contrats et flux déclarés

Tranche demandée le 22 septembre 2026 après les lots 0 à 3. Elle ajoute des notes de travail et une représentation des flux ; elle ne livre pas un moteur de conclusion juridique, une AIPD complète, une découverte réseau ou un graphe exhaustif de l’organisme.

## Modèle et compatibilité

Le document interne devient `rgpd-master-v3`. Les schémas v1 et v2 restent inchangés. La migration valide d’abord le format historique, conserve identifiants, révision, champs existants et livraisons, puis ajoute des champs inconnus et des listes vides. Elle se fait en mémoire à l’ouverture ; seule une sauvegarde explicite écrit le nouveau contenu chiffré. Une limite dépassée refuse l’opération sans supprimer le document d’origine.

Chaque activité conserve les opérations détaillées, les habilitations et huit notes d’analyse (`necessity-2026-09-22.1`). Chaque note a cinq connaissances distinctes : faits, références, objections, appréciation et suites. Un contrat peut recevoir onze notes (`article28-2026-09-22.1`) sur initiative explicite. La présence de texte n’équivaut jamais à une validation juridique. Les dates et auteurs d’une décision restent ceux déclarés dans Actions & décisions.

Les flux sont des déclarations internes à une activité, limités à 20, identifiés par UUID unique : origine, destination, opération, données, canal, lieux et accès. Ils ne créent pas de lien présumé avec les intervenants ou systèmes du coffre ; leur libellé est déclaré. Aucune donnée n’est inférée d’un nom d’outil ou d’un lien documentaire. La carte affiche les rubriques inconnues et échappe tous les textes.

Les limites de lecture (octets, profondeur et nombre de nœuds JSON) s’appliquent également avant enregistrement, pour éviter d’écrire un coffre qui ne pourrait plus être rouvert. Le plafond global de 2 Mio reste inchangé.

## Sécurité et partage

Le stockage, les enveloppes, les contextes AAD, PBKDF2, AES-GCM, les époques, les contrôles de révision et les transactions n’ont pas changé. Les champs nouveaux sont dans le même document chiffré. Ils entrent dans la sauvegarde chiffrée et sont effacés de l’interface au verrouillage. Aucun appel réseau métier, binaire de contrat ou fichier tiers n’est ajouté.

Les profils `rgpd-share-v1` gardent leur liste blanche. Les analyses, flux, habilitations détaillées et notes contractuelles sont exclus de tous les profils, y compris Revue documentaire. Les identifiants de flux rejoignent les identifiants internes interdits de réutilisation dans une livraison.

Le catalogue documentaire devient `fr-eu-2026-09-22.draft-2` car R-005 rappelle l’examen des clauses et garanties même quand une simple référence de contrat existe. Le validateur de partage accepte les deux versions explicitement connues du catalogue et refuse une version inconnue. Les anciens instantanés restent inchangés. Le statut d’un contrôle documentaire exprime une présence ou absence d’information, jamais une conformité.

Une application antérieure ne reconnaît pas le master v3. Un retour arrière du site ne doit pas conduire à effacer le stockage navigateur. Conserver les sauvegardes et utiliser une version compatible pour lire les nouveaux coffres ; voir PUBLICATION.md.

## Sources et revue humaine

Les questions et leurs repères sont dans `apps/web/src/features/privacy/review-methods.ts`, reliés à SOURCES.md. Le support publié d’Estelle De Marco est référencé en lecture complémentaire. Sa grille n’est pas transcrite ni présentée comme validant RGPDESK. La relecture annoncée par l’utilisateur reste à réaliser.

Points à soumettre : découpage des opérations et finalités ; articulation article 6 / articles 9 et 10 ; précision des huit questions ; portée des garanties contractuelles ; degré de granularité des flux ; frontière entre notes préparatoires et AIPD complète ; présentation du statut purement documentaire.

## Validation prévue

Tests métier : états inconnus, migrations, clés de questions et versions, bornes des flux et du parseur, références, absence des notes dans les quatre profils et compatibilité du catalogue historique.

Tests navigateur avec WebCrypto et IndexedDB réels : ouverture v2 sans réécriture, sauvegarde v3 et restauration, persistance hors réseau, verrouillage, chaînes hostiles, canaris de fuite, parcours des contrats et cartes, responsive 320/390/768/1440. La suite générale couvre aussi le domaine cyber conservé.

Les rapports d’exécution font foi pour les résultats. L’existence d’un scénario ne prouve pas son exécution ni un audit indépendant.
