# Instructions proposées pour l'agent

À intégrer aux AGENTS.md pertinents après lecture de ceux qui existent. Ce fichier ne remplace aucune instruction locale automatiquement. La documentation officielle de Codex décrit le mécanisme de découverte et de priorité des AGENTS.md. [O01]

## Produit

Application RGPD local-first, mono-utilisateur, sans backend métier. Le traitement de données est l'objet central. Le logiciel documente des faits déclarés, des justificatifs, des réserves et des décisions ; il ne certifie pas un organisme. Langue initiale : français. Préparer des clés d'internationalisation sans inventer une traduction juridique anglaise pour publier plus vite.

## Travail sur le dépôt

Lire d'abord les instructions existantes et les documents de sécurité. Respecter le gestionnaire de paquets, les versions et les scripts réellement présents. Ne pas ajouter de framework, ORM, backend, service cloud ou dépendance lourde pour un besoin couvert par le socle. Pas de refonte transversale avant une première tranche fonctionnelle.

Créer le domaine RGPD séparément ; préserver les schémas et tests historiques BLACKPROOF. Les primitives communes peuvent être extraites dans une modification dédiée accompagnée de tests différentiels. Ne pas faire importer des fichiers de apps/web par un package métier.

Conserver les notices et la licence applicables. Ne pas modifier les auteurs Git de l'utilisateur ni fabriquer une attribution humaine. Ne pas déployer, publier un paquet, créer un dépôt distant ou pousser sans autorisation explicite.

## Sécurité

Données métier interdites dans : réseau, URL, query string, logs, console, télémétrie, rapport d'erreur, localStorage et fixtures. Les seules métadonnées persistées en clair sont des identifiants opaques, versions/révisions et métadonnées techniques explicitement nécessaires ; leur fuite résiduelle est documentée.

Pas de secrets réels, pièces d'identité, données de clients ou de salariés dans le dépôt. Pas de pièces justificatives binaires stockées. Pas d'évaluation de formules tableur, de HTML fourni par l'utilisateur, de eval ou de fonction construite depuis un catalogue.

Préserver chiffrement, verrouillage, gardes multi-onglets, protections ZIP/XLSX, contrôle des sauvegardes et CSP. Ne pas affaiblir les paramètres cryptographiques pour gagner en performance. Un cast TypeScript n'est pas une validation des données.

Les exports publics sont construits par liste blanche, validés puis prévisualisés. Les pièces internes, chemins, commentaires et journaux ne sont jamais inclus par défaut. Les données textuelles partageables sont échappées et revues : aucune liste blanche ne détecte à elle seule une donnée personnelle collée dans un commentaire autorisé.

## Droit et langage

Toute règle garde sa source, son article, sa version, sa portée et sa date de revue. Distinguer texte applicable, recommandation d'autorité et pratique produit. Toute proposition législative est inactive. Une information inconnue reste inconnue, jamais fausse ou « non applicable » par défaut.

Interdire « certifié RGPD », « conforme à 100 % », « preuve irréfutable », « effacement garanti de toutes les copies », « identité vérifiée » pour un simple nom saisi. Les vérifications d'intégrité ne sont pas des validations juridiques.

Ne pas inventer de base légale, durée, contrat signé, autorisation de transfert, délai spécial ni validation d'un juriste. Ne pas présenter les champs d'accountability ajoutés au registre comme tous expressément obligatoires au titre de l'article 30.

## Tests et compte rendu

Tester les fonctions métier sans navigateur, les adaptateurs de stockage séparément et le parcours réel en E2E. Ajouter des jeux hostiles et des marqueurs de fuite. Les tests de chiffrement/déchiffrement utilisent WebCrypto réel, pas un mock remplaçant le chiffrement par du JSON.

Les tests non exécutés restent non exécutés. Indiquer la commande, son résultat et le blocage éventuel. Ne pas neutraliser un contrôle pour annoncer une réussite. Livrer des modifications petites, des critères de recette démontrables et une documentation mise à jour.
