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
    const old = JSON.parse(JSON.stringify(current)); old.format = "rgpd-master-v1"; delete old.organization.representatives;
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
  }); expect(result).toEqual({ untouched: true, format: "rgpd-master-v2", oldRevision: 1, same: true });
});
