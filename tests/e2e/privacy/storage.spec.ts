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

test("encrypted storage exposes only technical metadata and reopens faithfully", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const epoch = await vault.initialize();
    const session = { epoch, signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "NEVER_LEAK_CLIENT_FICTIONAL_7D31", new Date().toISOString());
    await vault.create(master, phrase, session);
    const raw = await vault.table("records").toArray();
    const restored = await vault.unlock(master.id, phrase, session);
    const result = { same: JSON.stringify(restored) === JSON.stringify(master), raw: JSON.stringify(raw), listed: await vault.list() };
    vault.close();
    return result;
  });
  expect(result.same).toBe(true);
  expect(result.raw).not.toContain("NEVER_LEAK");
  expect(result.raw).not.toContain("Fictional storage phrase");
  expect(Object.keys(result.listed[0]!).sort()).toEqual(["id", "revision"]);
});

test("wrong phrase, truncated backup and collision preserve exact stored bytes", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await vault.create(master, phrase, session);
    const before = JSON.stringify(await vault.table("records").toArray());
    const backup = await vault.backup(master, phrase, session);
    const errors = [];
    for (const operation of [() => vault.unlock(master.id, "Wrong fictional phrase 2026", session), () => vault.restore(backup.slice(0, -2), phrase, session), () => vault.restore(backup, phrase, session)]) {
      try { await operation(); errors.push("unexpected success"); } catch (error) { errors.push((error as Error).message); }
    }
    return { errors, same: before === JSON.stringify(await vault.table("records").toArray()) };
  });
  expect(result.errors).toEqual(["CRYPTO", "INVALID", "COLLISION"]);
  expect(result.same).toBe(true);
});

test("two database connections serialize optimistic writers and reject stale backup", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const first = new api.PrivacyVault();
    const second = new api.PrivacyVault();
    const session = { epoch: await first.initialize(), signal: new AbortController().signal };
    await second.initialize();
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await first.create(master, phrase, session);
    const next = api.reviseWorkspace(master, 1, new Date().toISOString(), { scope: api.knowledge("Fictional scope") });
    const writes = await Promise.allSettled([first.save(next, phrase, 1, session), second.save(next, phrase, 1, session)]);
    const staleBackup = await first.backup(master, phrase, session).then(() => "unexpected", (error: Error) => error.message);
    return { statuses: writes.map((item) => item.status).sort(), staleBackup, revision: (await first.list())[0]!.revision };
  });
  expect(result.statuses).toEqual(["fulfilled", "rejected"]);
  expect(result.staleBackup).toBe("CONFLICT");
  expect(result.revision).toBe(2);
});

test("manual lock during real encryption prevents persistence", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const control = new AbortController();
    const session = { epoch: await vault.initialize(), signal: control.signal };
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    const pending = vault.create(master, "Fictional storage phrase 2026 correct", session);
    control.abort();
    const error = await pending.then(() => "unexpected", (cause: Error) => cause.message);
    return { error, count: (await vault.list()).length };
  });
  expect(result).toEqual({ error: "LOCKED", count: 0 });
});

test("transaction abort during put is atomic", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const control = new AbortController();
    const session = { epoch: await vault.initialize(), signal: control.signal };
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
      const request = original.apply(this, args);
      if (this.name === "records") queueMicrotask(() => control.abort());
      return request;
    };
    let failed = false;
    try { await vault.create(master, "Fictional storage phrase 2026 correct", session); } catch { failed = true; }
    finally { IDBObjectStore.prototype.put = original; }
    return { failed, count: (await vault.list()).length };
  });
  expect(result).toEqual({ failed: true, count: 0 });
});

test("quota failure during the actual write preserves previous ciphertext", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await vault.create(master, phrase, session);
    const before = JSON.stringify(await vault.table("records").toArray());
    const next = api.reviseWorkspace(master, 1, new Date().toISOString(), { scope: api.knowledge("Fictional modified scope") });
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
      if (this.name === "records") throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return original.apply(this, args);
    };
    let failed = false;
    try { await vault.save(next, phrase, 1, session); } catch { failed = true; }
    finally { IDBObjectStore.prototype.put = original; }
    return { failed, same: before === JSON.stringify(await vault.table("records").toArray()) };
  });
  expect(result).toEqual({ failed: true, same: true });
});

test("old session cannot resurrect data after wipe, even without broadcasts", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const first = new api.PrivacyVault();
    const stale = new api.PrivacyVault();
    const session = { epoch: await first.initialize(), signal: new AbortController().signal };
    await stale.initialize();
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await first.create(master, phrase, session);
    const backup = await first.backup(master, phrase, session);
    await first.wipe(session.epoch);
    const errors = [];
    for (const operation of [() => stale.create(master, phrase, session), () => stale.restore(backup, phrase, session), () => stale.backup(master, phrase, session)]) {
      errors.push(await operation().then(() => "unexpected", (error: Error) => error.message));
    }
    return { errors, count: (await first.list()).length, different: await first.initialize() !== session.epoch };
  });
  expect(result).toEqual({ errors: ["EPOCH", "EPOCH", "EPOCH"], count: 0, different: true });
});

test("storage-key substitution, revision spoof and authenticated invalid plaintext fail closed", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await vault.create(master, phrase, session);
    const original = await vault.table("records").get(master.id);
    const substituteId = crypto.randomUUID();
    await vault.table("records").put({ ...original, id: substituteId });
    const substitution = await vault.unlock(substituteId, phrase, session).then(() => "unexpected", (error: Error) => error.message);
    await vault.table("records").put({ ...original, revision: 2 });
    const revision = await vault.unlock(master.id, phrase, session).then(() => "unexpected", (error: Error) => error.message);
    const [envelope] = await api.encryptLocalPayloadBatch([{ aad: api.contextFor(master.id, 1, "master"), value: { ...master, score: 100 } }], phrase);
    await vault.table("records").put({ ...original, envelope });
    const invalid = await vault.unlock(master.id, phrase, session).then(() => "unexpected", (error: Error) => error.message);
    return { substitution, revision, invalid };
  });
  expect(result).toEqual({ substitution: "CRYPTO", revision: "CRYPTO", invalid: "INVALID" });
});

test("concurrent restores refuse collision and a fresh destination round trips all fields", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const first = new api.PrivacyVault();
    const second = new api.PrivacyVault();
    const session = { epoch: await first.initialize(), signal: new AbortController().signal };
    await second.initialize();
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    const backup = await api.encodeBackup(master, phrase);
    const results = await Promise.allSettled([first.restore(backup, phrase, session), second.restore(backup, phrase, session)]);
    return { statuses: results.map((item) => item.status).sort(), same: JSON.stringify(await first.unlock(master.id, phrase, session)) === JSON.stringify(master) };
  });
  expect(result).toEqual({ statuses: ["fulfilled", "rejected"], same: true });
});

test("lock during decrypt cancels unlock and restore without releasing or storing plaintext", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const control = new AbortController();
    const epoch = await vault.initialize();
    const normal = { epoch, signal: new AbortController().signal };
    const locked = { epoch, signal: control.signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await vault.create(master, phrase, normal);
    const restoredMaster = api.createWorkspace(crypto.randomUUID(), "Other fictional organization", new Date().toISOString());
    const backup = await api.encodeBackup(restoredMaster, phrase);
    const original = crypto.subtle.decrypt.bind(crypto.subtle);
    crypto.subtle.decrypt = async (...args) => { const result = await original(...args); control.abort(); return result; };
    const unlock = await vault.unlock(master.id, phrase, locked).then(() => "unexpected", (error: Error) => error.message);
    const restoreControl = new AbortController();
    crypto.subtle.decrypt = async (...args) => { const result = await original(...args); restoreControl.abort(); return result; };
    const restore = await vault.restore(backup, phrase, { epoch, signal: restoreControl.signal }).then(() => "unexpected", (error: Error) => error.message);
    crypto.subtle.decrypt = original;
    return { unlock, restore, count: (await vault.list()).length };
  });
  expect(result).toEqual({ unlock: "LOCKED", restore: "LOCKED", count: 1 });
});

test("backup rechecks revision after encryption and rejects a concurrent save", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Fictional organization", new Date().toISOString());
    await vault.create(master, phrase, session);
    const next = api.reviseWorkspace(master, 1, new Date().toISOString(), { scope: api.knowledge("Fictional revision 2") });
    const original = crypto.subtle.encrypt.bind(crypto.subtle);
    let changed = false;
    crypto.subtle.encrypt = async (...args) => {
      const result = await original(...args);
      if (!changed) { changed = true; crypto.subtle.encrypt = original; await vault.save(next, phrase, 1, session); }
      return result;
    };
    const error = await vault.backup(master, phrase, session).then(() => "unexpected", (cause: Error) => cause.message);
    return { error, revision: (await vault.list())[0]!.revision };
  });
  expect(result).toEqual({ error: "CONFLICT", revision: 2 });
});

test("caller mutation during crypto cannot change the captured document", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.privacyTest;
    const vault = new api.PrivacyVault();
    const session = { epoch: await vault.initialize(), signal: new AbortController().signal };
    const phrase = "Fictional storage phrase 2026 correct";
    const master = api.createWorkspace(crypto.randomUUID(), "Original fictional organization", new Date().toISOString());
    const pending = vault.create(master, phrase, session);
    master.organization.name = "Mutation after command";
    await pending;
    return (await vault.unlock(master.id, phrase, session)).organization.name;
  });
  expect(result).toBe("Original fictional organization");
});
