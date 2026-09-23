# Pages publiques RGPDESK

## Navigation et aide

`SiteHeader.astro` est commun au bureau, au guide, au vérificateur, à la notice de confidentialité, et à la FAQ. Les icônes sont locales et rendues en SVG. Le menu mobile et les réponses de FAQ utilisent les éléments HTML `details` / `summary`, sans JavaScript.

Depuis le bureau, les pages auxiliaires s’ouvrent dans un nouvel onglet avec `noopener noreferrer`. Le lien Mon bureau et la marque restent sur `#main`, pour ne pas recharger un coffre en cours de saisie. Les règles de verrouillage restent inchangées.

La FAQ explique les fonctions réellement disponibles et leurs limites, sur la base du guide utilisateur : stockage local, visibilité des coffres, sauvegardes, clients séparés, import CSV, recherche locale, flux, analyse, AIPD et restitutions. Elle propose 24 réponses dans cinq rubriques. Chaque réponse renvoie à un chapitre du guide. Les six questions métier distinguent texte applicable, repères CNIL et fonctionnement du produit : unité du registre, dérogation de l’article 30 §5, intérêt légitime, conservation, sous-traitance et AIPD. Les références sont affichées dans les réponses ; aucune décision juridique n’est automatisée.

## Soutien retiré temporairement

À la demande de l’utilisateur le 23 septembre 2026, la page de soutien et ses liens sont retirés. Aucun paiement ni raccordement Stripe n’est présent.

## Distribution isolée

Le générateur de release inclut explicitement la FAQ et exclut la page de soutien, même si un ancien build la contient encore. Le vérificateur de releases conserve son chemin historique autorisé pour vérifier les archives déjà produites. Les nouvelles distributions n’embarquent pas ce fichier.
