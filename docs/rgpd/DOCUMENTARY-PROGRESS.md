# Repères d’avancement des registres

24 septembre 2026. Présentation documentaire, sans nouvelle saisie ni modification des formats de données.

Les registres responsable et sous-traitant affichent six groupes de faits : finalités ou opérations, personnes, données, destinataires, conservation ou clients responsables, protections. Une rubrique est renseignée si tous ses champs comptés contiennent un texte, partielle si certains seulement sont renseignés, à renseigner sinon. Une finalité absente ne peut pas être considérée comme renseignée. La conservation compte le critère et le point de départ de chaque finalité ; les protections comptent mesures de sécurité et transferts déclarés.

Cette mesure ne contrôle pas le sens, la justesse, l’actualité ou la qualité juridique du texte. Elle exclut les fondements juridiques, analyses, flux et justificatifs ; elle ne mesure pas l’achèvement d’une mission DPO ni une conformité. Le statut manuel de l’activité reste distinct. L’ensemble du registre inclut les fiches archivées, explicitement signalées comme telles.

## Parcours

- Synthèse de trois états sur le registre et repères iconographiques sur chaque fiche.
- Dans la lecture d’activité, les rubriques incomplètes ouvrent le formulaire existant à la bonne étape.
- Les nouveaux rapports de registre affichent une matrice par activité, avec liens numériques vers les fiches, états lisibles sans couleur et rendu imprimable sans JavaScript.
- La prévisualisation, le dossier de démonstration et le fichier partagé présentent les mêmes états, calculés depuis la seule projection sélectionnée. Aucune lecture du coffre privé pour enrichir un rapport.

## Compatibilité et sécurité

Le rendu HTML porte le marqueur `rgpdesk-register-folio-2`. Les formats JSON/CSV et leurs schémas sont inchangés. Les anciens rendus folio 1 (v1/v2) et le rendu historique tabulaire v1 restent acceptés uniquement s’ils sont strictement identiques au rendu canonique correspondant. Un ancien fichier téléchargé conserve ses octets, son manifeste et ses empreintes dans le coffre ; il n’est pas régénéré à la lecture.

Les nouveaux rapports nécessitent le vérificateur prenant en charge folio 2 ; un vérificateur plus ancien peut les refuser. La CSP conserve `default-src 'none'` et épingle les styles par SHA-256. Pas de script, ressource distante, police externe, bibliothèque de graphiques ou stockage supplémentaire. Les limites de taille restent appliquées ; une sélection trop volumineuse est refusée comme auparavant.

Les restitutions AIPD conservent leur présentation actuelle : leurs appréciations et revues humaines ne sont pas assimilées à cette mesure de saisie du registre.
