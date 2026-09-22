# RGPD Local — dossier de conception pour Codex

**Version : 1.0 — 22 septembre 2026.** « RGPD Local » est un nom de travail, pas un nom commercial ou un domaine dont la disponibilité aurait été vérifiée.

## Décision proposée

Créer un produit dédié, dérivé du socle technique de BLACKPROOF, pour **tenir un registre vivant, rattacher les justificatifs, suivre les décisions et préparer des dossiers partageables maîtrisés**, sans envoyer les données métier à un serveur.

Conserver Astro/Svelte/TypeScript, le stockage local chiffré et les mécanismes de sécurité/export pertinents. Construire un **nouveau domaine centré sur les activités de traitement**. Ne pas convertir les catégories cyber en catégories RGPD par remplacement de chaînes de caractères.

La première version publiable est délimitée : registre responsable/sous-traitant, références documentaires, manques explicables, actions, exports et sauvegardes. Les demandes de droits et les violations viennent ensuite ; l'AIPD complète et les analyses approfondies de transferts constituent un lot distinct.

## Utilisation

Copier ce dossier à la racine d'un **fork dédié** du dépôt BLACKPROOF. Ne pas l'appliquer directement au service de production. Lire `00-CODEX-START.md` et envoyer son premier prompt à Codex.

`AGENTS-RGPD.md` est une proposition d'instructions à fusionner avec les fichiers `AGENTS.md` existants : il ne les remplace pas automatiquement. Le dépôt inspecté possède notamment `apps/web/AGENTS.md`.

## Contenu

- `00-CODEX-START.md` : prompt de départ, périmètre du premier travail et prompt de continuation.
- `AGENTS-RGPD.md` : conventions et interdictions pour l'agent.
- `docs/rgpd/SPEC.md` : produit, parcours, fonctionnalités et exclusions.
- `docs/rgpd/ARCHITECTURE.md` : découpage, modèle, stockage et formats.
- `docs/rgpd/LEGAL-RULES.md` : règles proposées et pièges juridiques à empêcher.
- `docs/rgpd/BACKLOG-ACCEPTANCE.md` : lots, critères de recette et cas de test.
- `docs/rgpd/SOURCES.md` : sources primaires et périmètre de l'examen.

## Périmètre de l'examen

Le site, le README, l'arborescence, les documents sécurité/stockage, le manifeste web et des fichiers de code ont été consultés. La référence d'arborescence observée est `211166d19543335ff3c1285a963782bdb28985a1`. Les constats sont sourcés dans `SOURCES.md`.

Ce dossier **n'est ni un audit exhaustif du dépôt, ni une exécution de ses tests, ni une validation juridique professionnelle**. Il ne contient pas une application implémentée. Les décisions d'architecture et les objectifs de tests sont des propositions ; les validations techniques et juridiques de publication restent à réaliser.

## Principes à ne pas négocier

Le logiciel organise une démarche, il ne délivre pas une certification. Une absence de justificatif n'est pas automatiquement une infraction ; la présence d'un document ne prouve pas son adéquation. L'empreinte d'un export vérifie sa cohérence technique, pas la vérité de son contenu.

Aucun backend métier, compte, télémétrie, IA distante, stockage de pièces d'identité ou de fichiers clients dans la première version. Pas de promesse d'alerte lorsque le navigateur est fermé. Pas de suppression prétendument universelle des copies déjà exportées.

Le code dérivé conserve ses obligations de licence et ses notices. Les règles propres aux noms et marques BLACKPROOF sont distinctes de la licence du logiciel. [B01, B07]
