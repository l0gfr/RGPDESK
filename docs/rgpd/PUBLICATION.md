# Publication de RGPDESK

La publication et le déploiement sur Zen ont été autorisés le 22 septembre 2026. Les rapports des lots 0 à 3 décrivent l'état historique avant cette autorisation. La première version reste expérimentale : revue juridique humaine, audit de sécurité indépendant et qualification Firefox/Safari non réalisés.

## Une distribution séparée

Ne jamais publier `apps/web/dist` en entier sur RGPDESK.fr : ce répertoire contient aussi le domaine cyber conservé pour les régressions. Le workflow manuel `deploy-production.yml` appartient au socle BLACKPROOF ; ne pas l'utiliser pour RGPDESK.

La commande suivante utilise le build déjà qualifié, depuis un checkout propre de la révision à publier :

```sh
pnpm install --frozen-lockfile
pnpm verify:all
pnpm test:privacy:release
pnpm privacy:release
python3 artifacts/rgpdesk/verify-release.py artifacts/rgpdesk "$(git rev-parse HEAD)"
```

`--candidate` autorise uniquement les essais locaux avec des fichiers non commités. Un tel artefact indique `dirtyWorktree: true` et le vérificateur de publication le refuse.

Le générateur copie les cinq pages RGPD (application, guide utilisateur, confidentialité, vérificateur, FAQ), duplique l'entrée sur `/`, suit leurs dépendances compilées avec esbuild et conserve leurs octets. Il refuse les liens symboliques, chemins sortants, imports réseau et imports dynamiques non littéraux. Aucun remplacement de noms ou de formats cyber n'est effectué. Les quatre fichiers de licence et notices sont copiés sans modification. Les fichiers `robots.txt` et `release.json` complètent le site.

Le ZIP `artifacts/rgpdesk-release.zip` contient `site/`, les deux configurations Apache, un manifeste fermé, les SHA-256 et un vérificateur Python autonome. Les fichiers d'exploitation sont hors du document root. La configuration TLS contient la CSP extraite des pages exactes et le commit Git. L'artefact doit être construit après la dernière modification du code, puis qualifié sans reconstruire entre les tests et le transfert.

## CI et provenance

`.github/workflows/rgpdesk.yml` tourne sur `main` et les PR. Il impose la suite complète de régression, les audits disponibles, les tests du générateur, le vérificateur Python et les E2E RGPD, y compris la documentation sans JavaScript, les liens et le rendu mobile, sur la distribution isolée. L'artefact téléchargeable est lié au SHA du workflow. Les trois tests cyber conditionnels ignorés par la suite générale ne sont pas présentés comme réussis.

Un checksum identifie les octets ; il ne constitue pas une signature d'auteur. Vérifier le SHA de la source, le succès du workflow et le digest transmis par l'opérateur. Ne jamais exécuter ni activer une archive dont cette chaîne n'est pas établie.

## Première installation Apache

Préconditions : DNS `rgpdesk.fr` vers le serveur visé, modules SSL/headers/rewrite/mime, Certbot et Python 3 présents. Ne pas toucher aux autres vhosts, à SSH, aux pare-feux, aux comptes ou aux services existants. La première installation refuse un vhost RGPDESK déjà présent ; une mise à jour exige une sauvegarde de sa configuration et une procédure de retour à la release précédente.

1. Copier l'archive hors des racines publiques. Vérifier son SHA-256 attendu avant extraction et son manifeste avec `verify-release.py` après extraction. Une copie protégée appartenant à root doit être vérifiée à nouveau avant activation.
2. Préparer `/var/www/rgpdesk-acme` et un vhost HTTP avec `apache/rgpdesk-bootstrap.conf`. Il ne sert que les challenges ACME ; aucune application n'est exposée en HTTP. Faire `apache2ctl configtest` avant chaque rechargement gracieux.
3. Obtenir le certificat de `rgpdesk.fr` avec Certbot en mode webroot sur `/var/www/rgpdesk-acme`. Conserver ce chemin dans le vhost HTTP final pour le renouvellement. Ne pas arrêter Apache et ne pas remplacer les autres certificats.
4. Installer `site/` dans `/var/www/rgpdesk/releases/<commit>`, appartenant à root, dossiers 0755 et fichiers 0644. Installer le vhost TLS généré. Il pointe directement vers cette release, sans lien symbolique ni fallback SPA. Activer seulement après validation Apache. En cas d'échec, revenir au vhost précédent ou désactiver uniquement ce nouveau vhost.
5. Contrôler publiquement le certificat, la redirection HTTPS, le commit de `release.json` et de `X-RGPDESK-Commit`, les hashes de toutes les ressources publiques, les headers, les 404 hors inventaire et le refus des méthodes d'écriture. Vérifier les parcours visibles sans utiliser de vraies données personnelles.

Le vhost n'a ni proxy, ni endpoint d'upload, ni statistiques. Le journal d'accès est désactivé ; le journal d'erreurs Apache peut contenir des données de connexion. `connect-src 'none'`, `form-action 'none'` et l'interdiction des scripts inline non hachés restent actifs. La notice de confidentialité est disponible dans l'application.

Les opérations privilégiées sont exécutées par l'opérateur. Une connexion serveur ou une archive transférée ne prouvent pas que le site est en production. Seuls les contrôles HTTPS sur les octets effectivement servis permettent d'annoncer le déploiement.


## Mises à jour courantes et sauvegarde Zen

`deploy/rgpdesk/update-release.py` remplace le couplage activation puis sauvegarde générale. Une mise à jour ne lance **ni Borg ni `zen-backup.service`** et ne modifie aucune tâche planifiée. RGPDESK conserve la politique de sauvegarde Zen existante. Les coffres des visiteurs restent dans leurs navigateurs : la sauvegarde serveur ne les contient pas.

L’opérateur exécute une copie du script dont le SHA-256 est épinglé, avec quatre arguments hexadécimaux : commit nouveau, SHA-256 du ZIP CI, commit précédent et SHA-256 du vhost courant. Le ZIP est attendu dans `/home/bluetouff/rgpdesk-<commit>/rgpdesk-release.zip`. La procédure opérateur doit vérifier le script avant de l’exécuter, sans importer de module depuis ce répertoire utilisateur.

Avant l’activation : vérification des répertoires privilégiés, refus des liens et fichiers ambigus, verrou de déploiement, contrôle du vhost courant, syntaxe Apache, archive CI bornée et manifeste fermé. Le script conserve la release précédente, l’ancien vhost et le ZIP dans une archive root protégée ; seuls le nouveau répertoire de release et le vhost RGPDESK sont installés. Après rechargement gracieux, le SHA est contrôlé en HTTPS local avec vérification TLS. Une erreur de syntaxe, de rechargement ou de preuve HTTPS restaure le vhost précédent. Aucun nouvel essai automatique.

L’état du timer et le résultat du dernier backup sont affichés séparément, en lecture seule. **Un site activé peut coexister avec une sauvegarde en erreur.** Ce résultat ne doit pas être présenté comme une activation échouée ni comme une sauvegarde fraîche vérifiée. Une restauration locale et distante exige sa propre preuve ; un timer actif ou un code retour zéro ne la remplace pas.

Le 22 septembre 2026, le lancement global demandé par l’ancienne procédure a terminé avec le statut 1 : journal Apache l0g modifié pendant l’archivage. Une archive locale était annoncée, sans preuve de passage à la copie distante pour ce lancement. Ne pas transformer tous les avertissements Borg en succès. Le diagnostic et une éventuelle correction de la politique globale des logs doivent être séparés des mises à jour RGPDESK et préserver les autres applications.

### Retour arrière et formats des coffres

La release précédente et son vhost permettent un retour arrière du site par l’opérateur après contrôle Apache. Cela ne restaure pas les coffres des visiteurs. Un enregistrement fait par la nouvelle application emploie `rgpd-master-v8`, qu’une application ancienne limitée à v7 ne sait pas lire. En cas de retour arrière du site, ne pas supprimer de coffre : conserver les sauvegardes, rétablir une version compatible v8 ou examiner une sauvegarde antérieure dans un profil distinct. Aucun script de déploiement ne modifie IndexedDB des visiteurs.


## Références documentaires v7

Le format `rgpd-master-v7` ajoute les repères et empreintes facultatifs des références. Les schémas v1 à v6 restent inchangés et les anciennes sauvegardes sont ouvertes par migration en mémoire ; le disque n’est modifié qu’après un enregistrement protégé. Une version de l’application limitée au v6 ne peut pas rouvrir un coffre enregistré en v7. Conserver une sauvegarde avant mise à jour et utiliser la version actuelle pour la restauration. Les formats de partage et l’enveloppe chiffrée ne changent pas.


### Suivi des demandes : format v8

`rgpd-master-v8` ajoute une collection facultative de demandes et réponses. Les schémas v1 à v7 restent inchangés. L’ouverture migre en mémoire ; une écriture explicite produit le format courant. Un retour arrière vers une application limitée à v7 ne permet pas de lire un coffre enregistré en v8. La base IndexedDB doit aussi être compatible v3 pour les brouillons chiffrés (voir REPRISE-ET-LECTURE.md). Aucun déploiement ne réécrit les coffres à distance.

Les validateurs master historiques sont régénérés avec `inlineRefs: false` : les références de schéma sont compilées en fonctions réutilisées plutôt que dupliquées. Les schémas, bornes, formats et règles de refus ne changent pas. Le contrôle de taille d’un fichier de release reste à 5 000 000 octets.
