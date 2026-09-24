# Export PDF des restitutions

## Parcours

Pendant la relecture, « Accéder à l’export » reste visible et amène au choix du format et à la confirmation. Après sélection, prévisualisation et confirmation, « Conserver et exporter en PDF » conserve le même instantané que le téléchargement existant. Une vue dédiée contient uniquement ce rapport. « Enregistrer au format PDF » ouvre la boîte d’impression native : choisir la destination PDF et le format A4, vérifier les pages puis enregistrer. La démo finale propose aussi un bouton PDF pour chacun de ses trois rapports.

Les versions de registre et AIPD conservées proposent « Exporter en PDF ». Le contenu historique ne se recalcule pas à partir du dossier actuel. La présentation utilise les feuilles locales actuelles ; les octets d’un PDF ne sont pas archivés dans le coffre. Les téléchargements ZIP et HTML existants restent disponibles.

La fermeture ou l’annulation de l’impression n’annule pas la conservation de l’instantané. Le navigateur ne fournit pas de confirmation fiable de l’enregistrement d’un PDF : l’interface ne prétend donc pas qu’un fichier a été enregistré ou transmis. Un PDF est une copie en clair, pas une sauvegarde chiffrée ni un paquet du vérificateur.

## Confidentialité et protections

- Les seuls objets reçus par la vue PDF sont le registre projeté (`SharedRegister`) ou la publication AIPD projetée (`PiaPublication`). Aucun coffre maître n’entre dans le composant.
- Les adaptateurs DOM existants construisent les éléments et leurs textes sans parser de HTML. Les schémas et les projections par liste blanche restent inchangés.
- Les contrôles de session, révision et époque restent sur la conservation et la relecture. Le bouton d’impression recontrôle la révision du coffre.
- Les feuilles locales doivent toutes être chargées avant activation du bouton ; leur échec bloque celui-ci. Elles sont préchargées pour l’utilisation hors ligne après ouverture de l’application.
- Le rapport est isolé par Shadow DOM. Le reste de la page est inerte pendant la lecture et masqué à l’impression. Aucun champ de saisie, note interne ou menu n’est imprimé.
- La fermeture et le verrouillage retirent le contenu du DOM et restaurent le titre et la navigation. Une copie déjà enregistrée ou prise en charge par le système d’impression reste sous le contrôle du système et de l’utilisateur.
- Aucun iframe, serveur PDF, popup, service distant ou nouvelle dépendance. La CSP et les interdits du dépôt restent appliqués. Le bouton de la démonstration utilise un script statique local ; les rapports HTML téléchargés restent passifs.

## Présentation

Les textes restent sélectionnables et les schémas vectoriels. La feuille de lecture corrige les petits caractères et compacte l’ouverture des registres pour A4. Les annexes du registre sont imprimées en 10,5 points. Les chapitres et cartes AIPD réutilisent la nouvelle présentation commune à l’aperçu et au rapport HTML.

Les coupures dépendent du contenu et des paramètres du navigateur. Désactiver ses en-têtes/pieds de page évite d’imprimer l’URL et la date ; activer les arrière-plans conserve les aplats. Le PDF natif ne garantit pas un document PDF/A, une signature, une conformité PDF/UA ou une pagination identique entre moteurs.

## Recette

`tests/e2e/privacy/pdf-export.spec.ts` couvre la confirmation obligatoire, le parcours hors ligne, l’identité aperçu/export, les trois démonstrations publiques, l’historique figé, le clavier, les largeurs de 320 à 1440 px, le refus d’une feuille indisponible, le verrouillage automatique, le stockage chiffré et la révision concurrente.

Les PDF fictifs produits par Chromium ont été extraits et rendus en images pour contrôler l’absence des marqueurs privés, la présence des textes et la pagination. Le dialogue système final d’enregistrement n’est pas automatisé ; les tests interceptent son invocation et utilisent le moteur PDF de Chromium pour inspecter le résultat. Aucun lancement de Firefox ni de Safari dans cette recette.
