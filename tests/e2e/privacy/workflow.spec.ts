import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const phrase = "Fictional end to end phrase 2026 correct";
const organization = "Association fictive des Alizés";
function watchNetworkPrimitives() {
  const calls: string[] = [];
  Object.defineProperty(window, "privacyNetworkCalls", { value: calls });
  const originalFetch = window.fetch.bind(window);
  window.fetch = (...args) => { calls.push("fetch"); return originalFetch(...args); };
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) { calls.push("xhr"); return originalSend.apply(this, args); };
  const originalBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = (...args) => { calls.push("beacon"); return originalBeacon(...args); };
  const OriginalSocket = window.WebSocket;
  window.WebSocket = class extends OriginalSocket {
    constructor(...args: ConstructorParameters<typeof WebSocket>) { calls.push("websocket"); super(...args); }
  };
  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () { calls.push("form"); return originalSubmit.call(this); };
  document.addEventListener("securitypolicyviolation", (event) => calls.push(`csp:${event.effectiveDirective}`));
}
async function ready(page: Page) {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
}
async function create(page: Page, name = organization) {
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill(name);
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await page.getByRole("button", { name: "Créer le coffre chiffré", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Registre", exact: true }).click();
}
async function unlock(page: Page) {
  await page.getByRole("button", { name: "Ouvrir le coffre 1", exact: true }).click();
  await page.getByLabel("Phrase secrète du coffre", { exact: true }).fill(phrase);
  await page.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await expect(page.getByRole("heading", { name: organization, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Registre", exact: true }).click();
}
async function activity(page: Page, role: "responsable" | "sous-traitante", title: string) {
  await page.getByRole("button", { name: `Ajouter une activité ${role}`, exact: true }).click();
  await page.getByLabel("Nom de l’activité", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Voir toute la fiche", exact: true }).click();
}
async function saveActivity(page: Page, title: string) {
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await expect(page.getByRole("button", { name: `Modifier ${title}`, exact: true })).toBeVisible();
}
async function backup(page: Page) {
  await page.getByRole("button", { name: "Sauvegarde", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger la sauvegarde chiffrée", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("rgpdesk-sauvegarde.rgpdesk");
  return readFile((await download.path())!);
}
async function selectRestore(page: Page, bytes: Buffer) {
  await page.locator("details.restore").evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await page.getByLabel("Fichier de sauvegarde RGPDESK", { exact: true }).setInputFiles({ name: "rgpdesk-sauvegarde.rgpdesk", mimeType: "application/json", buffer: bytes });
  await page.getByLabel("Phrase secrète de la sauvegarde", { exact: true }).fill(phrase);
  await page.getByLabel("Je souhaite réintroduire").check();
}

test("offline controller and processor workflow, reopen, encrypted backup and fresh-profile restore", async ({ page, context, browser, baseURL }) => {
  test.setTimeout(60_000);
  const attempts: string[] = [];
  const logs: string[] = [];
  await page.addInitScript(watchNetworkPrimitives);
  page.on("console", (message) => logs.push(message.text()));
  await ready(page);
  await page.waitForLoadState("networkidle");
  page.on("request", (request) => attempts.push(request.url()));
  await context.setOffline(true);
  await create(page);
  await page.getByRole("button", { name: "Intervenants", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un intervenant", exact: true }).click();
  await page.getByLabel("Nom de l’intervenant", { exact: true }).fill("Client SaaS fictif");
  await page.getByRole("button", { name: "Enregistrer l’intervenant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Modifier Client SaaS fictif", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Systèmes", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un système", exact: true }).click();
  await page.getByLabel("Nom du système", { exact: true }).fill("Outil de gestion fictif");
  await page.getByRole("button", { name: "Enregistrer le système", exact: true }).click();
  await expect(page.getByRole("button", { name: "Modifier Outil de gestion fictif", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Registre", exact: true }).click();
  await activity(page, "responsable", "Gestion des bénévoles fictifs");
  await page.getByRole("button", { name: "Ajouter une finalité", exact: true }).click();
  await page.getByLabel("Finalité 1", { exact: true }).fill("Coordonner les activités associatives fictives");
  await expect(page.getByLabel("Fondement juridique documenté 1 (complément)", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Durée ou critère de conservation 1", { exact: true })).toHaveValue("");
  await page.getByLabel("Outil de gestion fictif", { exact: true }).check();
  await page.getByLabel("Notes internes", { exact: true }).fill("NEVER_LEAK_INTERNAL_NOTE_7D31");
  await saveActivity(page, "Gestion des bénévoles fictifs");
  await activity(page, "sous-traitante", "Service SaaS fictif");
  await page.getByLabel("Catégories d’opérations", { exact: true }).fill("Hébergement et assistance déclarés");
  await page.getByRole("group", { name: "Clients responsables identifiés", exact: true }).getByLabel("Client SaaS fictif", { exact: true }).check();
  await expect(page.getByLabel(/Fondement juridique documenté/)).toHaveCount(0);
  await saveActivity(page, "Service SaaS fictif");
  const bytes = await backup(page);
  expect(bytes.toString()).not.toContain(organization);
  expect(bytes.toString()).not.toContain("NEVER_LEAK_INTERNAL_NOTE_7D31");
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("");
  expect(await page.title()).toBe("RGPDESK | Votre registre RGPD, de la fiche au dossier partagé");
  expect(attempts).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { privacyNetworkCalls: string[] }).privacyNetworkCalls)).toEqual([]);
  expect(logs.join("\n")).not.toContain("NEVER_LEAK");
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await expect(page.getByText(organization, { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await unlock(page);
  await expect(page.getByRole("button", { name: "Modifier Gestion des bénévoles fictifs", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Modifier Service SaaS fictif", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Modifier Gestion des bénévoles fictifs", exact: true }).click();
  await page.getByRole("button", { name: "Voir toute la fiche", exact: true }).click();
  await expect(page.getByLabel("Notes internes", { exact: true })).toHaveValue("NEVER_LEAK_INTERNAL_NOTE_7D31");
  await page.getByRole("button", { name: "Annuler l’édition", exact: true }).click();
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await selectRestore(page, bytes);
  await page.getByRole("button", { name: "Restaurer dans ce navigateur", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Cet espace existe déjà");
  await selectRestore(page, bytes.subarray(0, bytes.length - 3));
  await page.getByRole("button", { name: "Restaurer dans ce navigateur", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("format invalides");
  await selectRestore(page, bytes);
  await page.getByLabel("Phrase secrète de la sauvegarde", { exact: true }).fill("Wrong fictional password 2026");
  await page.getByRole("button", { name: "Restaurer dans ce navigateur", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Phrase secrète incorrecte");
  const fresh = await browser.newContext({ baseURL });
  try {
    const restored = await fresh.newPage();
    await restored.addInitScript(watchNetworkPrimitives);
    await ready(restored);
    await fresh.setOffline(true);
    await selectRestore(restored, bytes);
    await restored.getByRole("button", { name: "Restaurer dans ce navigateur", exact: true }).click();
    await expect(restored.getByRole("heading", { name: organization, exact: true })).toBeVisible();
    await restored.getByRole("button", { name: "Registre", exact: true }).click();
    await expect(restored.getByRole("button", { name: "Modifier Gestion des bénévoles fictifs", exact: true })).toBeVisible();
    await expect(restored.getByRole("button", { name: "Modifier Service SaaS fictif", exact: true })).toBeVisible();
    expect(await restored.evaluate(() => (window as unknown as { privacyNetworkCalls: string[] }).privacyNetworkCalls)).toEqual([]);
  } finally { await fresh.close(); }
});

test("hostile strings remain text and sensitive values stay out of stores, URLs and logs", async ({ page }) => {
  const canary = '<img src=x onerror="alert(7)"> FICTIONAL_CANARY_7D31';
  const logs: string[] = [];
  const dialogs: string[] = [];
  page.on("console", (message) => logs.push(message.text()));
  page.on("dialog", async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await ready(page);
  await create(page, canary);
  expect(await page.locator("main img").count()).toBe(0);
  const storage = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const data: unknown[] = [];
    for (const entry of databases) {
      const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open(entry.name!); request.onsuccess = () => resolve(request.result); });
      for (const name of db.objectStoreNames) data.push(await new Promise((resolve) => { const request = db.transaction(name).objectStore(name).getAll(); request.onsuccess = () => resolve(request.result); }));
      db.close();
    }
    return { data: JSON.stringify(data), local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), names: databases.map((db) => db.name) };
  });
  expect(storage.names).toEqual(["rgpdesk-vault-v1"]);
  expect(JSON.stringify(storage)).not.toContain("FICTIONAL_CANARY_7D31");
  expect(JSON.stringify(storage)).not.toContain(phrase);
  expect(logs.join("\n")).not.toContain("FICTIONAL_CANARY_7D31");
  expect(dialogs).toEqual([]);
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("");
});

test("two open tabs reject stale writes and clear both views after local wipe", async ({ page, context }) => {
  await ready(page);
  await create(page);
  const other = await context.newPage();
  await ready(other);
  await unlock(other);
  await activity(page, "responsable", "Première fiche fictive");
  await saveActivity(page, "Première fiche fictive");
  await activity(other, "responsable", "Conflit fictif");
  await other.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await expect(other.getByRole("alert")).toContainText("autre onglet");
  await page.getByRole("button", { name: "Effacer les coffres RGPDESK de ce profil", exact: true }).click();
  await page.getByLabel("Saisissez EFFACER", { exact: true }).fill("EFFACER");
  await page.getByRole("button", { name: "Confirmer l’effacement local", exact: true }).click();
  await expect(other.getByRole("link", { name: "Recharger l’application", exact: true })).toBeVisible();
  await expect(other.getByRole("heading", { name: organization, exact: true })).toHaveCount(0);
  await expect(other.getByLabel("Nom de l’activité", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Recharger l’application", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Aucun coffre enregistré dans ce profil.", { exact: true })).toBeVisible();
});

test("manual lock during a save cannot reopen the page or commit the pending edit", async ({ page }) => {
  await ready(page);
  await create(page);
  await activity(page, "responsable", "Brouillon abandonné fictif");
  // Real PBKDF2/AES-GCM runs; a test-only scheduling barrier holds its completion.
  await page.evaluate(() => {
    const original = crypto.subtle.encrypt.bind(crypto.subtle);
    crypto.subtle.encrypt = async (...args) => {
      const result = await original(...args);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return result;
    };
  });
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await unlock(page);
  await expect(page.getByRole("button", { name: "Modifier Brouillon abandonné fictif", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await expect(page.getByText("Révision 1", { exact: true })).toBeVisible();
});

test("idle and background deadlines clear unlocked fields and passwords", async ({ page }) => {
  await page.clock.install();
  await ready(page);
  await create(page);
  await page.clock.runFor(15 * 60_000 + 100);
  await expect(page.getByRole("heading", { name: organization, exact: true })).toHaveCount(0);
  await unlock(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(60_100);
  await expect(page.getByRole("heading", { name: organization, exact: true })).toHaveCount(0);
  expect(await page.locator('input[type="password"]').evaluateAll((inputs) => inputs.every((input) => (input as HTMLInputElement).value === ""))).toBe(true);
});

test("RGPD production CSP blocks network and form attempts without unsafe execution", async ({ page }) => {
  await ready(page);
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(policy).toContain("connect-src 'none'");
  expect(policy).toContain("form-action 'none'");
  expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/);
  let sent = 0;
  await page.route("**/__privacy_egress", async (route) => { sent++; await route.abort(); });
  const result = await page.evaluate(async () => {
    const violations: string[] = [];
    document.addEventListener("securitypolicyviolation", (event) => violations.push(event.effectiveDirective));
    const blocked = await fetch("/__privacy_egress", { method: "POST", body: "synthetic-probe" }).then(() => false, () => true);
    navigator.sendBeacon("/__privacy_egress", "synthetic-probe");
    const form = document.createElement("form");
    form.method = "POST"; form.action = "/__privacy_egress";
    document.body.append(form); form.submit();
    await new Promise((resolve) => setTimeout(resolve, 50));
    form.remove();
    return { blocked, violations };
  });
  expect(result.blocked).toBe(true);
  expect(result.violations).toContain("connect-src");
  expect(result.violations).toContain("form-action");
  expect(sent).toBe(0);
});

test("desktop and narrow layouts keep all controls accessible without overflow", async ({ page }) => {
  await ready(page);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await create(page);
  await activity(page, "responsable", "Fiche fictive étroite");
  await page.getByRole("button", { name: "Ajouter une finalité", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Nom de l’activité", { exact: true }).focus();
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toBeFocused();
});
