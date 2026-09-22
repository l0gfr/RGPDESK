import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { packageFiles, zipFiles } from "../../privacy-verifier/src/index.js";
import { createActivity, createPurpose, createWorkspace, reviseWorkspace, putActivity, knowledge, unknown, parseCsv, previewCsv, commitCsv, FICTIONAL_CSV, evaluateWorkspace, createAction, closeAction, addDecision, reviewNeeded, CATALOG_VERSION, migrateWorkspace, projectShare, assertShare, renderShareFiles, csvCell, canonicalJson, type CsvMapping, type EvidenceReference } from "../src/index";
let sequence = 1;
const id = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const now = "2026-09-22T12:00:00.000Z";
function fixture() {
  const m = createWorkspace(id(), "Organisme fictif", now);
  const a = createActivity(m.id, id(), "controller");
  if (a.role !== "controller") throw new Error();
  a.purposes = [createPurpose(id())]; a.title = "Bénévoles fictifs";
  return putActivity(m, a, m.revision, now);
}
const mapping: CsvMapping = [{ column: 0, field: "title" }, { column: 1, field: "role" }, { column: 2, field: "purpose" }, { column: 5, field: "retentionPeriod" }];
describe("bounded CSV and explicit mapping", () => {
  it("previews every rejected row and ignored column without mutating the workspace", () => {
    const m = fixture(), before = canonicalJson(m);
    const table = parseCsv(FICTIONAL_CSV, ";");
    const preview = previewCsv(m, table, mapping, id);
    expect(preview.acceptedRows).toEqual([2, 3, 4]); expect(preview.rejectedRows).toEqual([{ row: 5, reason: "role" }]);
    expect(preview.ignoredColumns).toEqual([3, 4, 6]); expect(canonicalJson(m)).toBe(before);
    const next = commitCsv(m, table, mapping, "utf-8", ";", id, now);
    expect(next.imports[0]?.acceptedRows).toEqual([2, 3, 4]);
    expect(next.activities[2]?.role === "controller" && next.activities[2].purposes[0]?.retention.period).toEqual(unknown());
    expect(JSON.stringify(next.imports)).not.toContain("Exemple non importé");
  });
  it("never merges by title, guesses a role or fills a legal basis", () => {
    const m = fixture(); const table = parseCsv("title,role\nMême,controller\nMême,controller\nSans rôle,\n", ",");
    const map = mapping.slice(0, 2); const next = commitCsv(m, table, map, "utf-8", ",", id, now);
    expect(next.activities.filter((a) => a.title === "Même")).toHaveLength(2);
    expect(next.imports[0]?.rejectedRows).toEqual([{ row: 4, reason: "role" }]);
    const a = next.activities[1]; expect(a?.role === "controller" && a.purposes[0]?.legalBasis).toEqual(unknown());
  });
  it("requires unique explicit column and field mappings", () => {
    const table = parseCsv(FICTIONAL_CSV, ";"), m = fixture();
    for (const map of [[], [{ column: 0, field: "title" }], [...mapping, { column: 0, field: "operations" }], [...mapping, { column: 3, field: "purpose" }], [{ column: 99, field: "title" }, mapping[1]!]]) expect(() => previewCsv(m, table, map as CsvMapping, id)).toThrow("INVALID");
  });
  it("handles BOM, quotes, escaped quotes and multiline cells; rejects broken quoting", () => {
    expect(parseCsv('\uFEFFNom;Rôle\r\n"Un; texte\navec ""guillemets""";controller\r\n', ";").rows[0]).toEqual(['Un; texte\navec "guillemets"', "controller"]);
    for (const text of ['a,a\nx,y', 'a, A \nx,y', 'a,b\n"broken,b', 'a,b\n"closed"tail,b', 'a,b\nmid"quote,b']) expect(() => parseCsv(text, ",")).toThrow("INVALID");
  });
  it("rejects byte, row, column and cell bounds", () => {
    for (const text of ["é".repeat(1_048_577), "a,b\n" + "x,y\n".repeat(201), Array.from({ length: 51 }, (_, i) => `c${i}`).join(",") + "\nx", "a,b\n" + "x".repeat(4001) + ",y"]) expect(() => parseCsv(text, ",")).toThrow("LIMIT");
  });
  it("treats hostile text as inert and rejects ambiguous control characters", () => {
    const map: CsvMapping = [{ column: 0, field: "title" }, { column: 1, field: "role" }];
    const p = previewCsv(fixture(), parseCsv('a;b\n<script>alert(1)</script>;controller\n=1+1;controller\nbad\u202E;controller\nextra;controller;surplus', ";"), map, id);
    expect(p.activities.map((a) => a.title)).toEqual(["<script>alert(1)</script>", "=1+1"]);
    expect(p.rejectedRows.map((r) => r.reason)).toEqual(["invalid", "columns"]);
  });
});
describe("documentary history", () => {
  it("findings have stable keys, preserve independent article 9/10 questions and create no tasks implicitly", () => {
    const m = fixture(); const a = m.activities[0]!;
    if (a.role === "controller") { a.purposes[0]!.legalBasis = knowledge("Analyse contractuelle déclarée"); a.dataCategories = knowledge("IBAN"); }
    const findings = evaluateWorkspace(m, "2026-09-22");
    expect(findings.some((f) => f.ruleId === "R-002")).toBe(false); expect(findings.some((f) => f.ruleId === "R-003")).toBe(true);
    expect(findings.map((f) => f.key)).toEqual(evaluateWorkspace({ ...m, revision: m.revision + 1 }, "2026-09-22").map((f) => f.key)); expect(m.actions).toEqual([]);
  });
  it("deduplicates actions and retains a motivated closure without removing findings", () => {
    const m = fixture(); const f = evaluateWorkspace(m, "2026-09-22").find((f) => f.ruleId === "R-004")!;
    const next = createAction(m, f, { id: id(), owner: "Équipe fictive", due: "2026-10-01" }, now);
    expect(() => createAction(next, f, { id: id(), owner: "Autre", due: null }, now)).toThrow("COLLISION");
    expect(() => closeAction(next, next.actions[0]!.id, "Auteur", "", now)).toThrow("INVALID");
    const closed = closeAction(next, next.actions[0]!.id, "Auteur fictif", "Critère examiné, ajout à la fiche prévu.", now);
    expect(closed.actions[0]?.closure?.justification).toContain("Critère");
    expect(evaluateWorkspace(closed, "2026-09-22").some((v) => v.key === f.key)).toBe(true);
    expect(() => reviseWorkspace(closed, closed.revision, now, { actions: [] })).toThrow("INVALID");
    expect(() => closeAction(closed, closed.actions[0]!.id, "Autre", "Réécriture", now)).toThrow("INVALID");
  });
  it("signals changed catalogues without rewriting old decisions", () => {
    const m = addDecision(fixture(), { id: id(), ruleId: "R-009", activityId: null, author: "Auteur fictif", justification: "Analyse du contexte", conclusion: "Question laissée ouverte" }, now);
    expect(reviewNeeded(m.decisions[0]!, m)).toBe(false); expect(reviewNeeded(m.decisions[0]!, m, CATALOG_VERSION + ".2")).toBe(true);
    expect(() => reviseWorkspace(m, m.revision, now, { decisions: [] })).toThrow("INVALID");
    expect(reviewNeeded(m.decisions[0]!, reviseWorkspace(m, m.revision, now, { scope: knowledge("Périmètre modifié") }))).toBe(true);
  });
  it("contract references cover only declared linked parties and never imply legal validation", () => {
    const m = fixture(); const pid = id(); m.parties.push({ id: pid, workspaceId: m.id, name: "Prestataire fictif", contact: unknown() }); m.activities[0]!.review.subcontractorIds.push(pid);
    expect(evaluateWorkspace(m, "2026-09-22").some((f) => f.ruleId === "R-005")).toBe(true);
    const doc: EvidenceReference = { id: id(), workspaceId: m.id, title: "GDPR compliant", category: "contract", activityIds: [m.activities[0]!.id], purposeIds: [], partyIds: [pid], scope: "Une activité", version: "", declaredAuthor: "", internalRef: "interne", publicReference: "", reservations: "", sensitivity: "internal", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: "2026-09-21", audience: "", channel: "", availability: unknown() };
    m.documents.push(doc); const findings = evaluateWorkspace(m, "2026-09-22");
    expect(findings.some((f) => f.ruleId === "R-005")).toBe(false); expect(findings.some((f) => f.ruleId === "R-008")).toBe(true);
  });
  it("explicitly migrates v1 without modifying original IDs, revision or source", () => {
    const m = fixture(); const legacy = JSON.parse(JSON.stringify(m));
    for (const key of ["documents", "actions", "decisions", "imports", "deliveries"]) delete legacy[key];
    legacy.format = "rgpd-master-v1"; delete legacy.organization.representatives; legacy.activities.forEach((a: Record<string, unknown>) => delete a.review);
    const bytes = JSON.stringify(legacy); const migrated = migrateWorkspace(legacy);
    expect(migrated.format).toBe("rgpd-master-v2"); expect(migrated.revision).toBe(m.revision); expect(migrated.activities[0]?.id).toBe(m.activities[0]?.id); expect(JSON.stringify(legacy)).toBe(bytes);
    expect(() => migrateWorkspace({ ...legacy, unknown: true })).toThrow();
  });
});
describe("whitelist projection", () => {
  const options = (m: ReturnType<typeof fixture>) => ({ profile: "article30-controller" as const, recipient: "Destinataire fictif", scope: "Périmètre public", reservations: ["Analyse incomplète"], activityIds: [m.activities[0]!.id], documentIds: [], clientId: null });
  it("excludes every internal source field and creates fresh uncorrelated IDs", () => {
    const m = fixture(); m.scope = knowledge("CANARY_SCOPE"); m.jurisdiction = knowledge("CANARY_JURISDICTION");
    m.activities[0]!.internalNotes = "CANARY_NOTES"; m.activities[0]!.review.article9 = knowledge("CANARY_REVIEW");
    m.systems.push({ id: id(), workspaceId: m.id, name: "CANARY_SYSTEM", description: knowledge("CANARY_DESCRIPTION") });
    m.parties.push({ id: id(), workspaceId: m.id, name: "CANARY_OTHER_CLIENT", contact: knowledge("CANARY_CONTACT") });
    const a = m.activities[0]!; if (a.role === "controller") a.purposes[0]!.legalBasis = knowledge("CANARY_BASIS");
    const dto = projectShare(m, options(m), id, now); const second = projectShare(m, options(m), id, now);
    expect(dto.id).not.toBe(second.id); expect(dto.activities[0]?.id).not.toBe(second.activities[0]?.id);
    for (const file of Object.values(renderShareFiles(dto))) { expect(file).not.toContain("CANARY_"); expect(file).not.toContain(m.id); expect(file).not.toContain(m.activities[0]!.id); }
    expect(dto.coverage).toBe("incomplete");
  });
  it("rejects multi-client activities and unknown linked IDs", () => {
    const m = fixture(); const p1 = id(), p2 = id();
    m.parties.push(...[p1, p2].map((pid) => ({ id: pid, workspaceId: m.id, name: "Client fictif", contact: unknown() })));
    const a = createActivity(m.id, id(), "processor"); if (a.role !== "processor") throw new Error(); a.controllerIds = [p1, p2]; m.activities.push(a);
    const opts = { ...options(m), profile: "client-excerpt" as const, clientId: p1, activityIds: [a.id] };
    expect(() => projectShare(m, opts, id, now)).toThrow("INVALID");
    a.controllerIds = [p1]; const dto = projectShare(m, opts, id, now); expect(dto.parties).toHaveLength(1); expect(dto.coverage).toBe("excerpt");
    const publicActivity = dto.activities[0]!; if (publicActivity.role === "processor") publicActivity.controllerIds = [id()];
    expect(() => assertShare(dto)).toThrow("INVALID_LINK");
  });
  it("neutralizes CSV formulas including compatibility characters, and escapes supplied HTML", () => {
    for (const formula of ["=1+1", "  +cmd", "@SUM(A1)", "\tvalue", "＝1+1", "\n-2"]) expect(csvCell(formula).startsWith('"\'')).toBe(true);
    const m = fixture(); m.activities[0]!.title = '<img src=x onerror=alert(1)>';
    const html = renderShareFiles(projectShare(m, options(m), id, now))["report.html"]!;
    expect(html).toContain("&lt;img"); expect(html).not.toContain("<img"); expect(html).not.toContain("<script");
  });
  it("labels complete documentary fields without legal conclusions", () => {
    const m = fixture(); const a = m.activities[0]!;
    m.organization.contact = knowledge("Coordonnées fictives"); m.organization.dpo = knowledge("Situation motivée déclarée"); m.organization.representatives = knowledge("Situation motivée déclarée");
    a.dataCategories = a.dataSubjects = a.recipients = a.transfers = a.securityMeasures = knowledge("Déclaration fictive");
    if (a.role === "controller") { a.purposes[0]!.description = knowledge("Finalité"); a.purposes[0]!.retention = { period: knowledge("Critère motivé"), trigger: knowledge("Événement") }; }
    const dto = projectShare(m, options(m), id, now); expect(dto.coverage).toBe("documented-profile");
    expect(renderShareFiles(dto)["report.html"]).toContain("déclarations non validées");
  });
});

it("scans all decoded ZIP files for every internal field and stable identifier", async () => {
  const m = fixture(); const a = m.activities[0]!;
  m.scope = knowledge("CANARY_SCOPE_23"); m.jurisdiction = knowledge("CANARY_JURISDICTION_23");
  a.internalNotes = "CANARY_NOTE_23"; a.review.article9 = knowledge("CANARY_ARTICLE9_23"); a.review.article10 = knowledge("CANARY_ARTICLE10_23");
  if (a.role === "controller") a.purposes[0]!.legalBasis = knowledge("CANARY_BASIS_23");
  const pid = id(); m.parties.push({ id: pid, workspaceId: m.id, name: "CANARY_OTHER_CLIENT_23", contact: knowledge("CANARY_OTHER_CONTACT_23") });
  const systemId = id(); m.systems.push({ id: systemId, workspaceId: m.id, name: "CANARY_SYSTEM_23", description: knowledge("CANARY_SYSTEM_DESCRIPTION_23") }); a.systemIds = [systemId]; a.participantIds = [pid];
  const other = createActivity(m.id, id(), "processor"); if (other.role === "processor") { other.title = "CANARY_OTHER_ACTIVITY_23"; other.controllerIds = [pid]; other.instructions = knowledge("CANARY_INSTRUCTIONS_23"); other.operations = knowledge("CANARY_OPERATIONS_23"); } m.activities.push(other);
  const doc: EvidenceReference = { id: id(), workspaceId: m.id, title: "CANARY_TITLE_23", category: "contract", activityIds: [a.id], purposeIds: [], partyIds: [], scope: "CANARY_DOC_SCOPE_23", version: "CANARY_VERSION_23", declaredAuthor: "CANARY_AUTHOR_23", internalRef: "CANARY_PATH_23", publicReference: "CANARY_UNSELECTED_PUBLIC_REF_23", reservations: "CANARY_RESERVES_23", sensitivity: "restricted", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: "2026-10-01", audience: "CANARY_AUDIENCE_23", channel: "CANARY_CHANNEL_23", availability: knowledge("CANARY_AVAILABILITY_23") }; m.documents.push(doc);
  let withHistory = addDecision(m, { id: id(), activityId: a.id, ruleId: "R-004", author: "CANARY_DECISION_AUTHOR_23", justification: "CANARY_DECISION_MOTIVE_23", conclusion: "CANARY_DECISION_23" }, now);
  const finding = evaluateWorkspace(withHistory, "2026-09-22").find((f) => f.ruleId === "R-004")!;
  withHistory = createAction(withHistory, finding, { id: id(), owner: "CANARY_ACTION_OWNER_23", due: "2026-10-01" }, now);
  withHistory = closeAction(withHistory, withHistory.actions[0]!.id, "CANARY_CLOSURE_AUTHOR_23", "CANARY_CLOSURE_REASON_23", now);
  const stableIds = [m.id, ...m.activities.map((v) => v.id), ...m.parties.map((v) => v.id), ...m.documents.map((v) => v.id), ...m.systems.map((v) => v.id), ...withHistory.decisions.map((v) => v.id), ...withHistory.actions.map((v) => v.id)];
  const dto = projectShare(withHistory, { profile: "article30-controller", recipient: "Équipe fictive", scope: "Extrait déclaré", reservations: [], activityIds: [a.id], clientId: null, documentIds: [] }, id, now);
  const zip = await JSZip.loadAsync(await zipFiles((await packageFiles(dto)).files));
  for (const entry of Object.values(zip.files)) { const text = await entry.async("string"); expect(text).not.toContain("CANARY_"); for (const internalId of stableIds) expect(text).not.toContain(internalId); }
});
