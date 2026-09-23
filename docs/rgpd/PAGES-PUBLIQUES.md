# Pages publiques RGPDESK

## Navigation et aide

`SiteHeader.astro` est commun au bureau, au guide, au vérificateur, à la notice de confidentialité, à la FAQ et à la page de soutien. Les icônes sont locales et rendues en SVG. Le menu mobile et les réponses de FAQ utilisent les éléments HTML `details` / `summary`, sans JavaScript.

Depuis le bureau, les pages auxiliaires s’ouvrent dans un nouvel onglet avec `noopener noreferrer`. Le lien Mon bureau et la marque restent sur `#main`, pour ne pas recharger un coffre en cours de saisie. Les règles de verrouillage restent inchangées.

La FAQ explique les fonctions réellement disponibles et leurs limites, sur la base du guide utilisateur : stockage local, visibilité des coffres, sauvegardes, clients séparés, import CSV, recherche locale, flux, analyse, AIPD et restitutions. Elle ne crée aucune nouvelle règle juridique.

## Soutien financier à raccorder

La page `/app/privacy/soutenir/` propose les contributions métier, les retours d’usage et le code. Elle annonce clairement que le paiement n’est pas encore disponible. Aucun lien du compte Stripe l0g n’a été repris ; aucun script, iframe, formulaire ou appel Stripe n’a été ajouté.

Pour activer les contributions, obtenir le nom public de l’association et son propre lien Stripe Payment Links, puis vérifier le bénéficiaire affiché par Stripe et les modalités choisies. Ne pas inventer de montant, récurrence, contrepartie, reçu fiscal ni avantage fiscal. Préférer un lien externe explicite vers la page hébergée par Stripe, sans ouvrir l’accès réseau de l’application ni transmettre une donnée de coffre. Une clé secrète n’a pas sa place dans ce site statique.

## Distribution isolée

Le générateur de release inclut explicitement les pages FAQ et soutien et exige leur présence, avec les mêmes contraintes CSP. Le vérificateur indépendant accepte uniquement ces deux chemins supplémentaires et conserve la compatibilité des anciennes archives. Aucun contrôle d’intégrité, de chemin ou de contenu du manifeste n’a été désactivé.
