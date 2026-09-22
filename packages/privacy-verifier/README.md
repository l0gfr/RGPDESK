# Vérificateur local RGPDESK

Le navigateur (`/app/privacy/verify/`) et la CLI consomment le même `src/index.js`. Aucun réseau, signature ou registre distant.

```sh
node packages/privacy-verifier/bin/rgpdesk-verify.mjs dossier.zip
```

Node 22.23.2, installation du monorepo avec le lockfile. Codes de sortie : 0 pour intégrité technique vérifiée, 1 pour fichier refusé, 2 pour usage incorrect. La CLI refuse les liens symboliques, fichiers non réguliers, fichiers trop grands ou modifiés pendant la lecture. La sortie n’expose aucun contenu métier ni chemin de fichier.

Contrat fermé `rgpd-share-v1` et manifeste `rgpd-manifest-v1`, schémas dans `packages/privacy-core/schemas`. Le ZIP contient exactement `manifest.json`, `register.json`, `register.csv`, `report.html`, `README.txt`. Pas de répertoire, commentaires, champs ZIP extra, ZIP64, entrées dupliquées, noms équivoques, plages chevauchantes ou octets cachés. Précontrôles adaptés du vérificateur BLACKPROOF au commit 211166d, sous licence AGPL-3.0-only, sans modifier ce dernier. JSZip 3.10.1 déjà verrouillé ; décompression par flux borné avec CRC32 vérifié.

Limites : ZIP 2 Mio, fichier décompressé 512 Kio, somme 2 Mio ; JSON profondeur 24 / 30 000 conteneurs. Les fichiers sont décodés en UTF-8 strict. Schémas, liens, identifiants uniques, profils, couverture documentaire, inventaire, tailles et SHA-256 sont vérifiés. Le CSV et le HTML sont reproduits depuis le même DTO, puis comparés octet pour octet pour refuser une variante active ou divergente, même avec de nouveaux hashes.

Canonicalisation `rgpdesk-sorted-json-v1` : clés d’objets triées selon l’ordre JavaScript par défaut (UTF-16), ordre des tableaux conservé, chaînes/nombres par JSON.stringify, pas d’espaces. Valeurs limitées par les schémas, aucun undefined ni non-fini. L’empreinte propre du manifeste porte sur sa forme canonique UTF-8 sans la propriété `sha256` et sans le saut de ligne terminal du fichier. Les autres empreintes portent sur les octets UTF-8 exacts livrés, saut de ligne inclus.

**Limite d’authenticité :** un attaquant peut modifier le registre et recalculer tous les fichiers et empreintes. Le résultat ne prouve pas la vérité, la licéité, l’auteur, la réception ni un horodatage de confiance. Les dates et identités sont des déclarations. Un profil renseigné ne représente pas une certification juridique.
