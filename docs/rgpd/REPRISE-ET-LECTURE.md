# Lecture, demandes, regroupement, aperçu et récupération

Extension ergonomique du 24 septembre 2026, sans backend ni dépendance nouvelle.

- ActivityReader lit le master enregistré et ouvre les sections existantes. Le moteur ne change pas.
- request-brief projette explicitement des questions/action ouvertes vers un texte relu, sans chemin, pièce, citation ou note interne. Les champs libres restent soumis à la revue humaine. Aucun envoi.
- ReexaminationQueue groupe les mêmes lignes par UUID documentaire. Chaque commande de revue reste individuelle, historisée et gardée par révision.
- ReportPreview reçoit exclusivement la projection publique validée et construit un arbre passif avec createElement et des nœuds texte, dans un Shadow DOM. Aucun parseur HTML n’est utilisé. Les données de l’annexe viennent de shareRows ; la concordance du contenu visuel avec le rapport téléchargé est testée pour les quatre profils et la présentation v2. Les feuilles statiques locales réutilisent le style du rapport ; aucune exception CSP, iframe, insertion HTML dynamique ou ressource tierce. Les confirmations et octets exportés restent inchangés.

## Copies de récupération

IndexedDB `rgpdesk-vault-v1` version 3 ajoute `drafts`, clé composée `[workspaceId+id]`. Records et snapshots historiques ne sont pas réécrits. Une ancienne application ouvrant explicitement la version 2 ne peut pas accéder à la base mise à niveau : conserver une version compatible en cas de retour arrière applicatif, sans effacer la base.

Seuls UUID, révision de base, compteur de copie et enveloppe cryptographique sont stockés en clair. Aucun nom, date de saisie ni champ métier hors chiffrement. `rgpd-draft-v1` est un schéma fermé et borné séparé du master, vérifié par Ajv standalone généré. Il tolère des champs incomplets mais refuse propriétés étrangères, contrôles dangereux et tailles excessives. Maximum 1 Mio par copie, dix copies par coffre. La récupération ne constitue pas un master valide et doit repasser par les commandes de domaine avant enregistrement.

Les primitives existantes PBKDF2-SHA-256 (600 000 itérations) et AES-GCM sont réutilisées, avec sel/nonce frais et contexte authentifié distinct : espace, révision, type `draft`, UUID et séquence. Les enveloppes produites sont relues avant écriture. Aucun assouplissement cryptographique.

Les écritures sont sérialisées par session. L’époque, la révision du master et le compteur attendu du brouillon sont vérifiés dans la transaction. La reprise réclame la copie par incrément atomique du compteur, empêchant deux onglets de l’écraser. L’enregistrement explicite du dossier consomme seulement la copie possédée par cette session dans la même transaction ; un quota conserve les deux états antérieurs. Les autres copies restent disponibles, marquées anciennes après changement de révision.

La protection suit les états des composants, sans lire ni journaliser le DOM, les phrases secrètes, les fichiers ou les cases de confirmation. Pause 900 ms, délai maximal de planification 5 s pendant la saisie ; ce délai n’est pas une garantie de fin de chiffrement. Le verrouillage reste immédiat, annule les écritures et retire le clair de l’interface. WebCrypto et JavaScript ne garantissent pas l’effacement physique des copies mémoire. Seule une écriture terminée est récupérable. La démo n’écrit aucun brouillon.

Les sauvegardes et exports conservent leur format et n’incluent pas ces copies non enregistrées. La restauration d’un coffre reste sans écrasement. `wipe` supprime aussi les brouillons dans la transaction d’époque. Les confirmations documentaires/AIPD sont toujours remises à faux. Les décisions, événements, revues et partages ne sont jamais exécutés par la récupération.

## Vérifications

Régressions unitaires : schéma fermé, limites, textes incomplets, authentification, substitution de contexte, plaintext authentifié invalide et contenu choisi des demandes. Régressions navigateur : stockage réel, chiffrement réel, conflits, quota, verrouillage pendant chiffrement, époque après effacement, montée v2 vers v3 sans réécriture, reprise/confirmation/consommation et conservation des anciens textes. Les résultats exécutés sont consignés dans le compte rendu de livraison.
