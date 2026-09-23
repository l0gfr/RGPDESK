import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import type {} from "../../fixtures/privacy/vault-harness";

let harness = "";
test.beforeAll(async () => {
  harness = (await build({ entryPoints: ["tests/fixtures/privacy/vault-harness.ts"], bundle: true, platform: "browser", format: "iife", write: false })).outputFiles[0]!.text;
});
test.beforeEach(async ({ page }) => {
  await page.route("**/__privacy_harness.js", (route) => route.fulfill({ contentType: "application/javascript", body: harness }));
  await page.route("**/__privacy_harness", (route) => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><head><script src="/__privacy_harness.js"></script></head><body>Real IndexedDB test harness</body></html>' }));
  await page.goto("/__privacy_harness");
  await page.waitForFunction(() => Boolean(window.privacyTest));
});

test("delivery snapshots stay encrypted and immutable across edits, full backup and restore", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault();
    let session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional snapshot phrase 2026 correct";
    let m = api.createWorkspace(crypto.randomUUID(), "NEVER_EXPORT_ORG_INTERNAL_TEST", new Date().toISOString());
    m = api.putActivity(m, api.createActivity(m.id, crypto.randomUUID(), "controller"), m.revision, new Date().toISOString());
    // create() requires revision 1, restore accepts a valid preserved revision.
    await vault.restore(await api.encodeBackup(m, phrase), phrase, session);
    const dto = api.projectShare(m, { profile: "article30-controller", recipient: "Destinataire fictif", scope: "Registre fictif", activityIds: [m.activities[0]!.id], documentIds: [], clientId: null, reservations: [] }, () => crypto.randomUUID(), new Date().toISOString());
    const pack = await api.packageFiles(dto); const delivered = await vault.deliver(m, dto, pack.files, m.revision, phrase, session);
    const snapshotBefore = JSON.stringify(await vault.table("snapshots").toArray());
    m = api.reviseWorkspace(delivered, delivered.revision, new Date().toISOString(), { organization: { ...delivered.organization, name: "Nom modifié fictif" } }); await vault.save(m, phrase, delivered.revision, session);
    const same = api.canonicalJson(await vault.deliveryFiles(m, dto.id, phrase, session)) === api.canonicalJson(pack.files);
    const oldCipherUnchanged = snapshotBefore === JSON.stringify(await vault.table("snapshots").toArray());
    const backup = await vault.backup(m, phrase, session);
    const raw = JSON.stringify([await vault.table("records").toArray(), await vault.table("snapshots").toArray()]);
    await vault.wipe(session.epoch); session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const restored = await vault.restore(backup, phrase, session);
    const restoredFiles = await vault.deliveryFiles(restored, dto.id, phrase, session);
    const verified = await api.verifyPackage(await api.zipFiles(restoredFiles));
    return { same, oldCipherUnchanged, raw, backupLeaks: backup.includes("NEVER_EXPORT"), restoredSame: api.canonicalJson(restoredFiles) === api.canonicalJson(pack.files), valid: verified.valid, count: await vault.table("snapshots").count() };
  });
  expect(result.same).toBe(true); expect(result.oldCipherUnchanged).toBe(true); expect(result.raw).not.toContain("NEVER_EXPORT"); expect(result.raw).not.toContain("Destinataire"); expect(result.backupLeaks).toBe(false); expect(result.restoredSame).toBe(true); expect(result.valid).toBe(true); expect(result.count).toBe(1);
});

test("quota failure rolls back both delivery receipt and snapshot in a native IndexedDB transaction", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault(); const session = { epoch: await vault.initialize(), signal: new AbortController().signal }; const phrase = "Fictional snapshot phrase 2026 correct";
    let m = api.createWorkspace(crypto.randomUUID(), "Fictif", new Date().toISOString()); m.activities = [api.createActivity(m.id, crypto.randomUUID(), "controller")]; await vault.create(m, phrase, session);
    const dto = api.projectShare(m, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [m.activities[0]!.id], documentIds: [], clientId: null, reservations: [] }, () => crypto.randomUUID(), new Date().toISOString()); const pack = await api.packageFiles(dto);
    const before = JSON.stringify(await vault.table("records").toArray()); const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) { if (this.name === "records") throw new DOMException("Quota", "QuotaExceededError"); return original.apply(this, args); };
    let failed = false; try { await vault.deliver(m, dto, pack.files, m.revision, phrase, session); } catch { failed = true; } finally { IDBObjectStore.prototype.put = original; }
    return { failed, unchanged: before === JSON.stringify(await vault.table("records").toArray()), snapshots: await vault.table("snapshots").count() };
  }); expect(result).toEqual({ failed: true, unchanged: true, snapshots: 0 });
});

test("review revision and lock guards reject delivery without writing either store", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault(); const control = new AbortController(); const session = { epoch: await vault.initialize(), signal: control.signal }; const phrase = "Fictional snapshot phrase 2026 correct";
    const m = api.createWorkspace(crypto.randomUUID(), "Fictif", new Date().toISOString()); m.activities = [api.createActivity(m.id, crypto.randomUUID(), "controller")]; await vault.create(m, phrase, session);
    const dto = api.projectShare(m, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [m.activities[0]!.id], documentIds: [], clientId: null, reservations: [] }, () => crypto.randomUUID(), new Date().toISOString()); const pack = await api.packageFiles(dto);
    const next = api.reviseWorkspace(m, m.revision, new Date().toISOString(), { scope: api.knowledge("Modification concurrente") }); await vault.save(next, phrase, m.revision, session);
    const conflict = await vault.deliver(m, dto, pack.files, m.revision, phrase, session).then(() => "unexpected", (e: Error) => e.message);
    const dto2 = api.projectShare(next, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [m.activities[0]!.id], documentIds: [], clientId: null, reservations: [] }, () => crypto.randomUUID(), new Date().toISOString()); const pack2 = await api.packageFiles(dto2);
    const original = crypto.subtle.encrypt.bind(crypto.subtle); crypto.subtle.encrypt = async (...args) => { const value = await original(...args); control.abort(); return value; };
    const locked = await vault.deliver(next, dto2, pack2.files, next.revision, phrase, session).then(() => "unexpected", (e: Error) => e.message); crypto.subtle.encrypt = original;
    return { conflict, locked, revision: (await vault.list())[0]!.revision, snapshots: await vault.table("snapshots").count() };
  }); expect(result).toEqual({ conflict: "CONFLICT", locked: "LOCKED", revision: 2, snapshots: 0 });
});

test("snapshot context substitution and omitted backup inventory cannot bypass validation", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault(); const session = { epoch: await vault.initialize(), signal: new AbortController().signal }; const phrase = "Fictional snapshot phrase 2026 correct";
    const m = api.createWorkspace(crypto.randomUUID(), "Fictif", new Date().toISOString()); m.activities = [api.createActivity(m.id, crypto.randomUUID(), "controller")]; await vault.create(m, phrase, session);
    const dto = api.projectShare(m, { profile: "article30-controller", recipient: "Fictif", scope: "Fictif", activityIds: [m.activities[0]!.id], documentIds: [], clientId: null, reservations: [] }, () => crypto.randomUUID(), new Date().toISOString()); const pack = await api.packageFiles(dto); const delivered = await vault.deliver(m, dto, pack.files, m.revision, phrase, session);
    const record = (await vault.table("snapshots").toArray())[0]; const receipt = delivered.deliveries[0]!;
    const substituted = await api.openSnapshot(record.envelope, { ...receipt, id: crypto.randomUUID() }, phrase).then(() => "unexpected", (e: Error) => e.message);
    const omitted = await api.encodeBackup(delivered, phrase).then(() => "unexpected", (e: Error) => e.message);
    const payload = { format: "rgpd-backup-payload-v2", master: delivered, snapshots: [], inventory: [{ kind: "master", id: delivered.id, revision: delivered.revision }] };
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(delivered.id, delivered.revision, "backup"), value: payload }], phrase);
    const before = JSON.stringify(await vault.table("records").toArray());
    const missing = await vault.restore(JSON.stringify({ format: "rgpd-backup-v2", workspaceId: delivered.id, revision: delivered.revision, envelope }), phrase, session).then(() => "unexpected", (e: Error) => e.message);
    return { substituted, omitted, missing, unchanged: before === JSON.stringify(await vault.table("records").toArray()) };
  }); expect(result).toEqual({ substituted: "CRYPTO", omitted: "INVALID", missing: "INVALID", unchanged: true });
});

test("IndexedDB v1 upgrade preserves the old encrypted master and v1 backup migration", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest; const phrase = "Fictional snapshot phrase 2026 correct";
    const current = api.createWorkspace(crypto.randomUUID(), "Ancien coffre fictif", new Date().toISOString());
    const old = JSON.parse(JSON.stringify(current)); old.format = "rgpd-master-v1"; delete old.impactAssessments; delete old.dpoCases; delete old.piaPublications; delete old.organization.representatives;
    for (const k of ["documents", "actions", "decisions", "imports", "deliveries"]) delete old[k];
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(old.id, 1, "master"), value: old }], phrase);
    const LegacyVault = Object.getPrototypeOf(api.PrivacyVault);
    const legacy = new LegacyVault(api.PRIVACY_DB_NAME);
    legacy.version(1).stores({ records: "id", metadata: "key" });
    const oldEpoch = crypto.randomUUID();
    await legacy.table("metadata").put({ key: "epoch", value: oldEpoch });
    await legacy.table("records").put({ id: old.id, revision: 1, format: "rgpd-envelope-v1", envelope });
    const before = JSON.stringify(await legacy.table("records").toArray()); legacy.close();
    const vault = new api.PrivacyVault(); const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    if (session.epoch !== oldEpoch || !vault.backendDB().objectStoreNames.contains("snapshots")) throw new Error("Migration failed");
    const opened = await vault.unlock(old.id, phrase, session);
    const untouched = before === JSON.stringify(await vault.table("records").toArray());
    const payload = { format: "rgpd-backup-payload-v1", master: old, inventory: [{ kind: "master", id: old.id, revision: 1 }] };
    const [backupEnvelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(old.id, 1, "backup"), value: payload }], phrase);
    const decoded = await api.decodeArchive(JSON.stringify({ format: "rgpd-backup-v1", workspaceId: old.id, revision: 1, envelope: backupEnvelope }), phrase);
    return { untouched, format: opened.format, oldRevision: opened.revision, same: api.canonicalJson(opened) === api.canonicalJson(decoded.master) };
  }); expect(result).toEqual({ untouched: true, format: "rgpd-master-v5", oldRevision: 1, same: true });
});


test("v2 encrypted content migrates without rewriting disk and v3 analysis survives backup restoration", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest; const phrase = "Fictional analysis migration phrase 2026!";
    const master = api.createWorkspace(crypto.randomUUID(), "Mission historique fictive", new Date().toISOString());
    master.activities.push(api.createActivity(master.id, crypto.randomUUID(), "controller"));
    const old = JSON.parse(JSON.stringify(master)); old.format = "rgpd-master-v2"; delete old.impactAssessments; delete old.dpoCases; delete old.piaPublications;
    for (const activity of old.activities) { delete activity.analysis; delete activity.flows; }
    const vault = new api.PrivacyVault(); let session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(old.id, 1, "master"), value: old }], phrase);
    await vault.table("records").add({ id: old.id, revision: 1, format: "rgpd-envelope-v1", envelope });
    const before = JSON.stringify(await vault.table("records").toArray());
    const opened = await vault.unlock(old.id, phrase, session);
    const untouched = before === JSON.stringify(await vault.table("records").toArray());
    const activity = structuredClone(opened.activities[0]!);
    activity.analysis.operations = api.knowledge("PRIVATE_V3_OPERATION");
    activity.analysis.notes[0]!.evidence = api.knowledge("PRIVATE_V3_EVIDENCE");
    activity.flows.push({ ...api.createDataFlow(crypto.randomUUID()), source: api.knowledge("PRIVATE_V3_FLOW") });
    const next = api.putActivity(opened, activity, opened.revision, new Date().toISOString());
    await vault.save(next, phrase, opened.revision, session);
    const backup = await vault.backup(next, phrase, session);
    const encrypted = JSON.stringify(await vault.table("records").toArray());
    await vault.wipe(session.epoch); session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const restored = await vault.restore(backup, phrase, session);
    return { untouched, format: restored.format, revision: restored.revision, equal: api.canonicalJson(restored) === api.canonicalJson(next), leaked: (encrypted + backup).includes("PRIVATE_V3"), sourceUnchanged: old.format === "rgpd-master-v2" && !old.activities[0].analysis };
  });
  expect(result).toEqual({ untouched: true, format: "rgpd-master-v5", revision: 2, equal: true, leaked: false, sourceUnchanged: true });
});

test("a genuine v3 vault remains intact on opening and AIPD reviews survive native backup restore", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault();
    const phrase = "Fictional AIPD migration phrase 2026!";
    let session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const source = api.createWorkspace(crypto.randomUUID(), "Ancien dossier AIPD fictif", new Date().toISOString());
    source.activities.push(api.createActivity(source.id, crypto.randomUUID(), "controller"));
    source.activities[0]!.analysis.notes[0]!.facts = api.knowledge("PRIVATE_OLD_ANALYSIS");
    const legacy = JSON.parse(JSON.stringify(source)); legacy.format = "rgpd-master-v3"; delete legacy.impactAssessments; delete legacy.dpoCases; delete legacy.piaPublications;
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(legacy.id, 1, "master"), value: legacy }], phrase);
    await vault.table("records").add({ id: legacy.id, revision: 1, format: "rgpd-envelope-v1", envelope });
    const before = JSON.stringify(await vault.table("records").toArray());
    const opened = await vault.unlock(legacy.id, phrase, session);
    const untouched = before === JSON.stringify(await vault.table("records").toArray());
    const pia = api.createImpactAssessment(opened.id, opened.activities[0]!, crypto.randomUUID());
    pia.content.monitoring = api.knowledge("PRIVATE_PIA_MONITORING");
    let next = api.putImpactAssessment(opened, pia, opened.revision, new Date().toISOString());
    await vault.save(next, phrase, opened.revision, session);
    const reviewed = api.recordPiaReview(next, pia.id, { id: crypto.randomUUID(), author: "Fictif", reason: "PRIVATE_PIA_REVIEW", outcome: "rework" }, next.revision, new Date().toISOString());
    await vault.save(reviewed, phrase, next.revision, session); next = reviewed;
    const backup = await vault.backup(next, phrase, session);
    const raw = JSON.stringify(await vault.table("records").toArray());
    await vault.wipe(session.epoch); session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const restored = await vault.restore(backup, phrase, session);
    return { untouched, equal: api.canonicalJson(next) === api.canonicalJson(restored), count: (await vault.listCurrent(session.epoch)).length, format: restored.format, leaked: (raw + backup).includes("PRIVATE_") };
  });
  expect(result).toEqual({ untouched: true, equal: true, count: 1, format: "rgpd-master-v5", leaked: false });
});


test("v4 migrates read-only then DPO v5 reviews and publications survive native encrypted restore", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest, vault = new api.PrivacyVault();
    const phrase = "Fictional DPO restore phrase 2026!", now = () => new Date().toISOString();
    let session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const source = api.createWorkspace(crypto.randomUUID(), "FICTITIOUS_PRIVATE_DPO_ORG", now());
    const activity = api.createActivity(source.id, crypto.randomUUID(), "controller");
    if (activity.role !== "controller") throw new Error("fixture");
    activity.purposes.push(api.createPurpose(crypto.randomUUID())); source.activities.push(activity);
    const legacy = JSON.parse(JSON.stringify(source)); legacy.format = "rgpd-master-v4"; delete legacy.dpoCases; delete legacy.piaPublications;
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(legacy.id, 1, "master"), value: legacy }], phrase);
    await vault.table("records").add({ id: legacy.id, revision: 1, format: "rgpd-envelope-v1", envelope });
    const before = JSON.stringify(await vault.table("records").toArray());
    let current = await vault.unlock(legacy.id, phrase, session);
    const untouched = before === JSON.stringify(await vault.table("records").toArray());
    const persist = async (next: typeof current) => { await vault.save(next, phrase, current.revision, session); current = next; };
    for (const kind of ["interest", "transfer", "rights", "breach"] as const) {
      const item = api.createDpoCase(current.id, crypto.randomUUID(), kind); item.activityIds = [current.activities[0]!.id];
      if (kind === "interest") { const a = current.activities[0]!; if (a.role !== "controller") throw new Error("fixture"); item.purposeId = a.purposes[0]!.id; }
      item.content.notes[0]!.facts = api.knowledge("FICTITIOUS_PRIVATE_DPO_FACT");
      await persist(api.putDpoCase(current, item, current.revision, now()));
      await persist(api.appendDpoEvent(current, item.id, { id: crypto.randomUUID(), at: now(), author: "Fictif", description: "FICTITIOUS_PRIVATE_DPO_EVENT", evidence: api.unknown() }, current.revision, now()));
      await persist(api.recordDpoReview(current, item.id, { id: crypto.randomUUID(), author: "Fictif", outcome: "rework", reason: "FICTITIOUS_PRIVATE_DPO_REVIEW" }, current.revision, now()));
    }
    const pia = api.createImpactAssessment(current.id, current.activities[0]!, crypto.randomUUID());
    await persist(api.putImpactAssessment(current, pia, current.revision, now()));
    const publication = api.projectPiaPublication(current, { piaId: pia.id, reviewId: null, sections: ["context"], recipient: "FICTITIOUS_PRIVATE_DPO_RECIPIENT", scope: "Essai fictif", reservations: "" }, crypto.randomUUID(), now());
    await persist(api.recordPiaPublication(current, publication, current.revision, now()));
    const backup = await vault.backup(current, phrase, session);
    const disk = JSON.stringify(await vault.table("records").toArray());
    await vault.wipe(session.epoch); session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const restored = await vault.restore(backup, phrase, session);
    return { untouched, equal: api.canonicalJson(current) === api.canonicalJson(restored), format: restored.format,
      leaked: (disk + backup).includes("FICTITIOUS_PRIVATE_DPO"), cases: restored.dpoCases.length,
      reviews: restored.dpoCases.reduce((n,c) => n + c.reviews.length, 0), publications: restored.piaPublications.length,
      listed: (await vault.listCurrent(session.epoch)).length };
  });
  expect(result).toEqual({ untouched: true, equal: true, format: "rgpd-master-v5", leaked: false, cases: 4, reviews: 4, publications: 1, listed: 1 });
});
