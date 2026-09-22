import { createActivity, createPurpose, reviseWorkspace } from "./commands";
import { knowledge, unknown, type Activity, type ImportRecord, type Workspace } from "./model";
import { assertWorkspace, PrivacyError, utf8Size } from "./validation";
export const CSV_FIELDS = ["title", "role", "purpose", "legalBasis", "retentionPeriod", "retentionTrigger", "dataCategories", "dataSubjects", "recipients", "transfers", "securityMeasures", "operations"] as const;
export type CsvField = typeof CSV_FIELDS[number];
export interface CsvTable { headers: string[]; rows: string[][] }
export type CsvMapping = { column: number; field: CsvField }[];
export interface CsvPreview { activities: Activity[]; acceptedRows: number[]; rejectedRows: ImportRecord["rejectedRows"]; ignoredColumns: number[]; ignoredCells: ImportRecord["ignoredCells"] }
export const MAX_CSV_BYTES = 2 * 1024 * 1024;
// RFC 4180-style quoted fields, also supporting an explicitly chosen semicolon/tab.
export function parseCsv(text: string, delimiter: "," | ";" | "\t"): CsvTable {
  if (!([",", ";", "\t"] as string[]).includes(delimiter)) throw new PrivacyError("INVALID");
  if (utf8Size(text) > MAX_CSV_BYTES) throw new PrivacyError("LIMIT");
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; let closed = false;
  const finishCell = () => { row.push(cell); cell = ""; closed = false; if (row.length > 50) throw new PrivacyError("LIMIT"); };
  const finishRow = () => { finishCell(); rows.push(row); row = []; if (rows.length > 201) throw new PrivacyError("LIMIT"); };
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += c;
    } else if (c === delimiter) finishCell();
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; finishRow(); }
    else if (closed) throw new PrivacyError("INVALID");
    else if (c === '"') { if (cell.length) throw new PrivacyError("INVALID"); quoted = true; }
    else cell += c;
    if (cell.length > 4000) throw new PrivacyError("LIMIT");
  }
  if (quoted) throw new PrivacyError("INVALID");
  if (cell || row.length || closed) finishRow();
  const headers = rows.shift();
  if (!headers || !rows.length || headers.some((h) => !h.trim() || h.length > 160) || new Set(headers.map((h) => h.trim().normalize("NFKC").toLowerCase())).size !== headers.length) throw new PrivacyError("INVALID");
  return { headers, rows };
}
const importedKnowledge = (value: string) => /^(?:\s*|\?|inconnu[e]?|unknown|non renseign[ée]|n\/a)$/i.test(value.trim()) ? unknown() : knowledge(value);
export function previewCsv(master: Workspace, table: CsvTable, mapping: CsvMapping, id: () => string): CsvPreview {
  if (mapping.length > CSV_FIELDS.length || new Set(mapping.map((m) => m.field)).size !== mapping.length || new Set(mapping.map((m) => m.column)).size !== mapping.length
    || mapping.some((m) => !CSV_FIELDS.includes(m.field) || !Number.isInteger(m.column) || m.column < 0 || m.column >= table.headers.length)
    || !mapping.some((m) => m.field === "title") || !mapping.some((m) => m.field === "role")) throw new PrivacyError("INVALID");
  const out: CsvPreview = { activities: [], acceptedRows: [], rejectedRows: [], ignoredCells: [], ignoredColumns: table.headers.flatMap((_, i) => mapping.some((m) => m.column === i) ? [] : [i]) };
  for (const [index, row] of table.rows.entries()) {
    const reject = (reason: ImportRecord["rejectedRows"][number]["reason"]) => out.rejectedRows.push({ row: index + 2, reason });
    if (row.length !== table.headers.length) { reject("columns"); continue; }
    const get = (field: CsvField) => row[mapping.find((m) => m.field === field)?.column ?? -1]?.trim() ?? "";
    const role = get("role").toLowerCase();
    if (!["controller", "responsable", "processor", "sous-traitant"].includes(role)) { reject("role"); continue; }
    if (!get("title")) { reject("title"); continue; }
    const a = createActivity(master.id, id(), ["controller", "responsable"].includes(role) ? "controller" : "processor");
    a.title = get("title");
    for (const field of ["dataCategories", "dataSubjects", "recipients", "transfers", "securityMeasures"] as const) a[field] = importedKnowledge(get(field));
    if (a.role === "controller") { const p = createPurpose(id()); p.description = importedKnowledge(get("purpose")); p.legalBasis = importedKnowledge(get("legalBasis")); p.retention = { period: importedKnowledge(get("retentionPeriod")), trigger: importedKnowledge(get("retentionTrigger")) }; a.purposes = [p]; }
    else a.operations = importedKnowledge(get("operations"));
    try { assertWorkspace({ ...master, activities: [...master.activities, a] }); }
    catch { reject("invalid"); continue; }
    const incompatible = a.role === "controller" ? ["operations"] : ["purpose", "legalBasis", "retentionPeriod", "retentionTrigger"];
    for (const cell of mapping) if (incompatible.includes(cell.field) && row[cell.column]?.trim()) out.ignoredCells.push({ row: index + 2, column: cell.column, reason: "role-incompatible" });
    out.activities.push(a); out.acceptedRows.push(index + 2);
  }
  return out;
}
export function commitCsv(master: Workspace, table: CsvTable, mapping: CsvMapping, encoding: ImportRecord["encoding"], delimiter: ImportRecord["delimiter"], id: () => string, now: string): Workspace {
  const preview = previewCsv(master, table, mapping, id);
  if (!preview.activities.length) throw new PrivacyError("INVALID");
  const record: ImportRecord = { id: id(), workspaceId: master.id, at: now, revision: master.revision + 1, encoding, delimiter,
    mapping: mapping.map((m) => ({ column: m.column, field: m.field })), acceptedRows: preview.acceptedRows, rejectedRows: preview.rejectedRows, ignoredColumns: preview.ignoredColumns, ignoredCells: preview.ignoredCells, activityIds: preview.activities.map((a) => a.id) };
  return reviseWorkspace(master, master.revision, now, { activities: [...master.activities, ...preview.activities], imports: [...master.imports, record] });
}
export const FICTIONAL_CSV = 'Activité;Rôle;Finalité;Données;Personnes;Durée;Colonne ignorée\r\nBénévoles • exemple fictif;responsable;Organiser les permanences;Coordonnées;Bénévoles;;Exemple non importé\r\nInfolettre • exemple fictif;responsable;Informer les adhérents;Adresse électronique;Adhérents;inconnu;Exemple non importé\r\nService • exemple fictif;sous-traitant;;Coordonnées;Utilisateurs;;Exemple non importé\r\nLigne à examiner;inconnu;;;;;Rejet volontaire\r\n';
