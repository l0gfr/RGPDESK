import JSZip from "jszip";
import type { EvidenceReference } from "@rgpdesk/privacy-core";

export const FILING_FOLDERS = [
  { path: "01_Gouvernance-et-perimetre", title: "Gouvernance & périmètre", icon: "organization", detail: "Missions, rôles, périmètre et comptes rendus." },
  { path: "02_Information-et-droits", title: "Information & droits", icon: "rights", detail: "Notices, procédures et réponses examinées." },
  { path: "03_Contrats-et-prestataires", title: "Contrats & prestataires", icon: "parties", detail: "Contrats, annexes et éléments de contrôle." },
  { path: "04_Systemes-flux-et-securite", title: "Systèmes, flux & sécurité", icon: "flows", detail: "Schémas, habilitations, mesures et tests." },
  { path: "05_Analyses-et-decisions", title: "Analyses & décisions", icon: "analysis", detail: "Analyses, avis, arbitrages et suivi." },
  { path: "06_Livrables", title: "Livrables", icon: "delivery", detail: "Versions préparées pour chaque destinataire." },
] as const;

// A filename suggestion is plain text, never a path used to read/write the filesystem.
function segment(value: string, fallback: string): string {
  const clean = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
  return clean || fallback;
}
export function suggestedDocumentPath(doc: EvidenceReference, folder: string): string {
  if (!FILING_FOLDERS.some(f => f.path === folder) || !doc.documentCode) return "";
  return `${folder}/${segment(doc.documentCode, "DOC")}_${segment(doc.title, "Intitule")}_${segment(doc.version, "version-a-preciser")}.ext`;
}

export const FILING_README = `RGPDESK · Organiser les pièces d’une mission

Ce classement facultatif est un point de départ. Conservez l’organisation du client si elle convient. Cette archive contient uniquement des dossiers vides et ce mode d’emploi, aucun document ni renseignement de votre coffre. Elle ne chiffre pas votre espace documentaire.

1. Choisissez un espace autorisé pour cette mission, séparé de ceux des autres clients. Les droits d’accès et la protection du support doivent être configurés dans votre environnement ; les dossiers seuls ne les assurent pas.
2. Rangez une pièce une seule fois. Dans RGPDESK, reliez sa référence à toutes les activités et questions concernées.
3. Depuis Documents, attribuez un repère stable. Exemple de nom : DOC-0042_Contrat-prestataire_v03_2026-09-23.pdf. Le repère est propre au coffre ; gardez le contexte du client.
4. Indiquez où la retrouver : chemin relatif à la mission, référence dans votre GED ou autre localisation compréhensible par les personnes autorisées. N’inscrivez ni mot de passe ni lien contenant un jeton d’accès.
5. Conservez les versions nécessaires à vos examens selon votre politique de conservation. Ne remplacez pas silencieusement une version citée. Les liens RGPDESK et une éventuelle empreinte ne conservent pas l’original.
6. Adaptez les accès et le chiffrement aux documents. Sauvegardez séparément les pièces ET le coffre .rgpdesk ; celui-ci ne contient aucune pièce originale. Gardez une copie isolée et testez la restauration des deux ensembles.

Repérer une version : le contrôle facultatif SHA-256 lit un fichier choisi sur votre appareil. Il n’affiche pas son contenu et ne le transmet pas. Seules l’empreinte, la taille, la version déclarée et la date locale de calcul sont conservées après enregistrement de la référence dans le coffre chiffré. Une correspondance concerne les octets, pas l’auteur, la signature ou la valeur juridique du document.

Recommandations de sécurité, CNIL :
https://www.cnil.fr/fr/securite-sauvegarder
https://www.cnil.fr/fr/securite-gerer-les-habilitations

Classement proposé par RGPDESK, sans portée normative. Sources consultées le 23 septembre 2026.
`;

export async function createFilingKit(): Promise<Uint8Array<ArrayBuffer>> {
  const zip = new JSZip();
  const date = new Date("2026-09-23T12:00:00.000Z");
  for (const folder of FILING_FOLDERS) zip.file(`Mission-client/${folder.path}/`, null, { dir: true, date });
  zip.file("Mission-client/LIRE-MOI.txt", FILING_README, { date });
  return new Uint8Array(await zip.generateAsync({ type: "arraybuffer", compression: "STORE" }));
}
