# Organisation des pièces et contrôle local des versions

23 septembre 2026. Classement facultatif, orienté mission DPO. Aucun logiciel de chiffrement tiers n’est intégré ni requis par ce parcours.

## Parcours

Dans Documents, le DPO peut garder sa GED ou télécharger un classement générique : six dossiers vides et un mode d’emploi. Le téléchargement ne reçoit aucun argument métier et ne contient ni document, ni nom de client, ni renseignement issu du coffre. Il ne chiffre pas les dossiers. Une référence documentaire unique peut être reliée à plusieurs activités et questions.

Dans une référence, un repère DOC est attribué sur demande. Il est propre au coffre, calculé après le plus grand repère déjà enregistré, puis conservé lors de l’enregistrement. Le domaine refuse sa réattribution ou sa suppression. Le titre et la localisation restent modifiables. La suggestion de nom est du texte : elle ne lit ni ne crée de chemin sur le disque. Elle réutilise le champ de localisation existant, sans l’écraser lorsqu’il est renseigné.

Le contrôle de version lit uniquement le fichier explicitement sélectionné, sans le parser ni l’afficher. Limite : 20 Mio avant lecture. Le SHA-256 utilise WebCrypto. La sélection ne conserve pas le nom du fichier. L’utilisateur doit adopter le résultat puis enregistrer la référence ; une comparaison seule ne modifie pas le coffre. Remplacer une empreinte enregistrée exige une version déclarée distincte et une confirmation. Une empreinte ancienne peut rester attachée à sa version déclarée, mais l’interface signale qu’elle ne correspond pas à la nouvelle version de la référence.

## Données et sécurité

Le format privé `rgpd-master-v7` ajoute deux propriétés facultatives : `documentCode` et `fingerprint`. Cette dernière est un objet fermé contenant seulement l’algorithme SHA-256, le condensat hexadécimal, la taille, la version déclarée et la date locale. Les entrées sont validées par un schéma compilé statiquement et des invariants métier. Aucun contenu binaire, nom de fichier, chemin automatique, objet File, handle de répertoire ou clé cryptographique n’est persisté par cette fonction.

Ces métadonnées restent dans le maître chiffré et ses sauvegardes. Les revues humaines les conservent dans leur contexte historique, sans réécriture des revues existantes. Les projections de partage existantes ne les incluent pas. Le repère est indexé uniquement dans la recherche volatile du coffre ouvert ; les empreintes ne sont pas indexées.

L’annulation, la fermeture de la référence et le démontage au verrouillage invalident le résultat asynchrone. La lecture de Blob et le digest WebCrypto ne sont pas physiquement interrompus, mais leur résultat est rejeté après annulation. Le buffer détenu par la fonction est remis à zéro au mieux ; JavaScript et WebCrypto ne garantissent pas l’effacement de toutes les copies en mémoire. CSP, enveloppe, coût PBKDF2, AAD, gardes de révision et transactions IndexedDB restent inchangés. Aucune dépendance ajoutée.

## Compatibilité et limites

Les formats v1 à v6 et leurs validateurs restent stricts et inchangés. Leur ouverture migre en mémoire vers v7, sans écriture avant une sauvegarde normale protégée. Une application ancienne ne peut pas lire le nouveau format : conserver une sauvegarde avant mise à jour. Les codes ne sont pas globalement uniques entre clients. Les empreintes ne démontrent ni identité, signature, date certaine ou validité juridique.

RGPDESK ne surveille pas le disque, ne classe pas automatiquement les pièces et ne configure pas les droits d’accès. La sauvegarde `.rgpdesk` ne contient pas les originaux. Le DPO doit conserver et sauvegarder les pièces utiles séparément, selon les règles applicables à sa mission.

## Sources des conseils généraux

- [CNIL : Sauvegarder](https://www.cnil.fr/fr/securite-sauvegarder).
- [CNIL : Gérer les habilitations](https://www.cnil.fr/fr/securite-gerer-les-habilitations).

Les six dossiers, les codes et les suggestions de noms sont des choix de produit sans portée normative.
