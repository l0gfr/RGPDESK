# Dossiers DPO et restitution AIPD

Tranche autorisée le 23 septembre 2026 : priorités 1 à 7. Statut des vérifications dans le compte rendu de livraison, sans assimilation à une revue juridique ou un audit humain indépendant.

## Architecture et migration

Le maître devient `rgpd-master-v5`. Deux collections s’ajoutent : `dpoCases` et `piaPublications`. Les schémas historiques v1 à v4 restent inchangés. La migration v4 ajoute des listes vides, sans modifier les identifiants, les révisions ou le document source ; elle s’exécute en mémoire. Une écriture persistante passe toujours par la commande, la validation du maître et la transaction gardée du coffre.

Le namespace IndexedDB, sa version, l’enveloppe chiffrée, les paramètres PBKDF2/AES-GCM et le contexte authentifié sont inchangés. Les sauvegardes complètes emportent les deux collections dans le maître chiffré, y compris en démonstration. Les exports de registre gardent leur format et leur liste blanche v1 ; aucun dossier DPO n’y est ajouté.

## Invariants

- Un dossier d’intérêt légitime concerne exactement une finalité d’une activité responsable. La finalité reste fixe après création. Les autres dossiers peuvent relier jusqu’à 20 activités identifiées.
- Les notes séparent faits, preuves, objections, appréciation et suites. Inconnue et absence ne sont pas confondues.
- Les événements et revues sont conservés sans réécriture. Une correction s’exprime par un complément ou une nouvelle revue. La création simultanée d’une revue et d’une modification de son contenu est refusée.
- Une revue fige les notes et le contexte des activités, acteurs, systèmes et références documentaires. Un changement ultérieur est signalé par comparaison, sans modifier la revue.
- Une clôture demeure une déclaration humaine. Le logiciel ne certifie ni la conformité, ni la réalité d’un envoi, ni l’identité de l’auteur.
- Le maître garde sa limite globale de 2 MiB et ses bornes de profondeur/nœuds. Plafonds additionnels : 200 dossiers, 40 événements et 8 revues par dossier, 8 restitutions AIPD, 512 KiB par restitution. Refus sans purge automatique.

## Échéances

Le profil article 12 utilise des mois calendaires et le calendrier de jours fériés déclaré par l’utilisateur. Le calcul nécessite sa confirmation explicite. La prolongation exige un motif et une date d’information dans le délai initial ; il s’agit d’une déclaration, pas d’une preuve d’envoi. Les situations particulières relèvent d’une date manuelle motivée. Aucune suspension automatique.

Le repère violation de 72 heures est calculé en temps écoulé, uniquement pour le rôle responsable déclaré et une prise de connaissance renseignée. Le rôle sous-traitant ne reçoit pas ce repère. Les dates événementielles sont normalisées en UTC ; les dates du régime article 12 sont des dates calendaires sans conversion implicite de fuseau.

## Restitution AIPD

La projection sélectionne explicitement les champs par rubrique. Aucune sérialisation du dossier interne dans le rapport. La nécessité et les principes partagent seulement appréciations et suites ; faits, preuves et objections sont exclus. Les identifiants des scénarios sont remplacés par des numéros de présentation. Partager les mesures exige de partager les scénarios correspondants.

Le destinataire, périmètre, réserves et chaque valeur sont prévisualisés et confirmés. Une restitution est conservée dans le maître avant le téléchargement, avec garde de révision et de session après les opérations asynchrones. Ses valeurs sont immuables. Le rendu HTML est autonome, sans script, avec échappement du texte et CSP restrictive à empreinte de style. Une future version du moteur peut modifier la présentation des valeurs conservées ; aucune identité binaire perpétuelle du HTML n’est promise.

Le fichier est en clair. La liste blanche n’identifie pas une donnée personnelle collée dans un champ explicitement autorisé. L’utilisateur doit la relire. Le rapport ne reprend pas les contrats, les pièces, les événements ou les autres dossiers. Aucun format PIA CNIL, signature, envoi, accusé de réception ou certification n’est annoncé.

## Qualification humaine et limites

Les questionnaires sont rédigés par RGPDESK avec des sources identifiées. Les guides d’analyse RGPD v1.0 et de nécessité/proportionnalité v1.2 ont été reçus le 23 septembre 2026. Des aides contextuelles en adaptent certains points, sans reprendre les exemples fournis. Leur intégration complète et la validation experte ne sont pas revendiquées ; voir METHODE-GRILLES.md. Le support public d’Estelle De Marco déjà référencé reste une lecture méthodologique, distincte d’une approbation du produit.

Les tests logiciels, une revue technique de code et la sauvegarde planifiée de Zen ne remplacent pas un audit indépendant, une qualification de tous les navigateurs ou une restauration réelle. Les sauvegardes Zen protègent le site et ses éléments serveur ; elles ne contiennent pas les coffres des visiteurs. Chaque utilisateur doit conserver sa sauvegarde `.rgpdesk` et sa phrase.
