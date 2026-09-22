import { PrivacyError } from "@rgpdesk/privacy-core";

export const fr = {
  unknown: "Inconnu / à examiner",
  saved: "Enregistré dans le coffre chiffré.",
  locked: "Coffre verrouillé. Les modifications non enregistrées ont été abandonnées.",
  errors: {
    INVALID: "Données ou format invalides. Vérifiez les champs et les limites indiquées.",
    LIMIT: "Limite dépassée : 200 activités et 2 Mio de contenu par espace, 8 instantanés de 512 Kio, 12 Mio par sauvegarde.",
    CONFLICT: "Cet espace a changé dans un autre onglet. Verrouillez puis rouvrez-le avant de continuer.",
    LOCKED: "Opération annulée après verrouillage. Rouvrez le coffre pour continuer.",
    EPOCH: "Le stockage a été effacé ou remplacé. Rechargez cette page avant de continuer.",
    COLLISION: "Cet espace existe déjà. Restauration refusée, aucune donnée existante remplacée.",
    CRYPTO: "Phrase secrète incorrecte ou contenu chiffré altéré.",
    STORAGE: "Opération impossible : stockage indisponible ou quota dépassé. Les données existantes sont conservées.",
  },
} as const;

export function errorMessage(error: unknown): string {
  return fr.errors[error instanceof PrivacyError ? error.code : "STORAGE"];
}
