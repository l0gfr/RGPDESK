import { visualRegisterReport } from "./share-report.js";
import validate from "./generated/share-validator.js";
export const SHARE_LIMITATION = "Vérification technique locale : structure, liens, inventaire et empreintes. Elle ne prouve ni la vérité des déclarations, ni leur auteur, ni la conformité juridique, ni un horodatage de confiance. Un tiers peut modifier les fichiers et recalculer toutes les empreintes.";
export const SHARE_FILES = ["README.txt", "manifest.json", "register.csv", "register.json", "report.html"];
export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}
export function shareCoverage(register) {
  if (register.profile === "client-excerpt") return "excerpt";
  const unknown = (v) => v && typeof v === "object" && (v.state === "unknown" || Object.entries(v).some(([key, child]) => key !== "legalBasis" && unknown(child)));
  if (!register.activities.length || unknown(register.organization) || unknown(register.parties) || unknown(register.activities)
    || register.activities.some((a) => a.role === "controller" ? !a.purposes.length : !a.controllerIds.length)) return "incomplete";
  return "documented-profile";
}
export function assertShare(value) {
  if (!validate(value)) throw new Error("INVALID_SHARE");
  const ids = new Set([value.id]);
  const add = (id) => { if (ids.has(id)) throw new Error("INVALID_LINK"); ids.add(id); };
  const parties = new Set(value.parties.map((p) => p.id));
  const activities = new Set(value.activities.map((a) => a.id));
  const linkedParties = new Set();
  for (const entity of [...value.parties, ...value.activities, ...value.references]) add(entity.id);
  for (const a of value.activities) {
    if ((value.profile === "article30-controller" && a.role !== "controller") || (["article30-processor", "client-excerpt"].includes(value.profile) && a.role !== "processor")) throw new Error("INVALID_PROFILE");
    if (a.role === "controller") for (const p of a.purposes) { add(p.id); if (value.profile !== "internal-review" && p.legalBasis.state !== "unknown") throw new Error("INVALID_PROFILE"); }
    else for (const id of a.controllerIds) { if (!parties.has(id)) throw new Error("INVALID_LINK"); linkedParties.add(id); }
    if (value.profile === "client-excerpt" && a.controllerIds.length !== 1) throw new Error("INVALID_PROFILE");
  }
  if (value.parties.some((p) => !linkedParties.has(p.id)) || (value.profile === "client-excerpt" && value.parties.length !== 1)) throw new Error("INVALID_PROFILE");
  for (const ref of value.references) if (!ref.activityIds.length || ref.activityIds.some((id) => !activities.has(id))) throw new Error("INVALID_LINK");
  if (value.coverage !== shareCoverage(value)) throw new Error("INVALID_COVERAGE");
}
export function csvCell(input) {
  let value = String(input).normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u061c\u200b-\u200f\u202a-\u202e\u2066-\u2069\uFEFF]/g, "");
  if (/^[\s\uFEFF]*[=+\-@]/u.test(value) || /^[\t\r\n]/u.test(value)) value = `'${value}`;
  return `"${value.replace(/"/g, '""')}"`;
}
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const PROFILE_LABELS = { "article30-controller": "Article 30 · Responsable", "article30-processor": "Article 30 · Sous-traitant", "internal-review": "Revue documentaire", "client-excerpt": "Extrait client" };
export const COVERAGE_LABELS = { excerpt: "Extrait limité au périmètre choisi", incomplete: "Dossier documentaire incomplet", "documented-profile": "Rubriques du profil renseignées, déclarations non validées" };
const labels = { name: "Nom", contact: "Coordonnées", dpo: "DPO / situation déclarée", representatives: "Représentant / responsables conjoints", title: "Activité", role: "Rôle", dataCategories: "Catégories de données", dataSubjects: "Catégories de personnes", recipients: "Destinataires", transfers: "Transferts et garanties déclarés", securityMeasures: "Mesures de sécurité déclarées", purposes: "Finalités", description: "Description", legalBasis: "Base légale (complément)", retention: "Conservation", period: "Durée ou critère", trigger: "Événement de départ", controllerIds: "Références clients", operations: "Catégories d’opérations", id: "Référence de livraison", activityIds: "Activités liées", text: "Référence publique déclarée" };
export function shareRows(register) {
  const rows = [];
  const walk = (value, path) => {
    if (value && typeof value === "object" && "state" in value) rows.push([path, value.state === "unknown" ? "Non renseigné" : value.value]);
    else if (Array.isArray(value)) { if (!value.length) rows.push([path, "Non renseigné"]); value.forEach((v, i) => walk(v, `${path} / ${i + 1}`)); }
    else if (value && typeof value === "object") Object.keys(value).sort().forEach((k) => walk(value[k], `${path} / ${labels[k] ?? k}`));
    else rows.push([path, String(value)]);
  };
  rows.push(["Profil", PROFILE_LABELS[register.profile]], ["État documentaire", COVERAGE_LABELS[register.coverage]], ["Destinataire déclaré", register.recipient], ["Périmètre public", register.scope], ["Date déclarée", register.createdAt], ["Catalogue", register.catalogVersion]);
  register.reservations.forEach((r) => rows.push(["Réserve", r]));
  walk(register.organization, "Organisation"); walk(register.parties, "Clients responsables"); walk(register.activities, "Registre"); walk(register.references, "Références publiques");
  return rows;
}
const REPORT_STYLE = "body{margin:0;background:#f6f6ef;color:#142f3c;font:14px/1.7 system-ui,sans-serif}header,main,footer{max-width:1100px;margin:auto;padding:36px}header{border-bottom:1px solid #dce2d3}header>p:first-child{letter-spacing:.16em;font-size:10px;color:#8a713f}h1{font:40px/1.15 Georgia,serif;letter-spacing:-.03em}table{border-collapse:collapse;width:100%;background:#fffefa}caption{font-size:18px;text-align:left;padding:20px 0}th,td{border-bottom:1px solid #e3e5dc;text-align:left;vertical-align:top;padding:12px 16px}th{font-size:11px;font-weight:500;width:36%;background:#f0f3e8}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}footer{font-size:11px;color:#64716f}thead{display:table-header-group}@media(max-width:600px){header,main,footer{padding:20px}th,td{padding:8px}h1{font-size:30px}}@media print{body{background:white;font-size:10pt}header,main,footer{padding:12px}tr{break-inside:avoid}thead{display:table-header-group}footer{font-size:8pt}}";
export function renderLegacyShareFiles(register) {
  assertShare(register);
  const rows = shareRows(register);
  const csv = [["Rubrique", "Déclaration"], ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  // No executable content, remote resources, dynamic attributes or supplied markup.
  const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; base-uri \'none\'; form-action \'none\'; style-src \'sha256-HjKvt33E9zKZNFLTaLmRcFkleKDU5Bj3FDv8lNx7Oqw=\'"><style>' + REPORT_STYLE + '</style><title>RGPDESK · Dossier documentaire</title></head><body><header><p>RGPDESK / DOSSIER DOCUMENTAIRE</p><h1>' + escapeHtml(PROFILE_LABELS[register.profile]) + '</h1><p>' + escapeHtml(COVERAGE_LABELS[register.coverage]) + '</p></header><main><p>Les rubriques renseignées ne prouvent pas une conformité juridique. Les réserves restent applicables. Les dates et identités sont déclarées.</p><table><caption>Registre et réserves partagés</caption><thead><tr><th scope="col">Rubrique</th><th scope="col">Déclaration</th></tr></thead><tbody>' + rows.map(([key, value]) => '<tr><th scope="row">' + escapeHtml(key) + '</th><td><pre>' + escapeHtml(value) + '</pre></td></tr>').join('') + '</tbody></table></main><footer><p>' + escapeHtml(SHARE_LIMITATION) + '</p></footer></body></html>\n';
  return { "register.json": canonicalJson(register) + "\n", "register.csv": csv, "report.html": html,
    "README.txt": "RGPDESK / rgpd-share-v1\n" + SHARE_LIMITATION + "\nFichiers en clair. Conservez-les et transmettez-les selon le périmètre examiné. Les identifiants ne permettent pas de retrouver ceux du coffre. Le CSV neutralise les préfixes de formules ; ne retirez pas leur apostrophe de protection.\nCatalogue proposé sans revue juridique humaine. Ce dossier ne remplace pas une analyse juridique.\n" };
}

export function renderShareFiles(register) {
  const files = renderLegacyShareFiles(register);
  files["report.html"] = visualRegisterReport(register, shareRows(register), PROFILE_LABELS, COVERAGE_LABELS, SHARE_LIMITATION);
  return files;
}
