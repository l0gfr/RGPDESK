import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import JSZip from "jszip";
const phrase = "Fictional premium desk phrase 2026 correct";
async function ready(page: Page) { await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible(); }
async function create(page: Page) {
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill("Atelier Horizon · fictif");
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase); await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check(); await page.getByRole("button", { name: "Créer le coffre chiffré", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Atelier Horizon · fictif", exact: true })).toBeVisible();
}
async function navigate(page: Page, name: string) { await page.getByRole("button", { name, exact: true }).click(); }
async function importFiction(page: Page) {
  await navigate(page, "Importer un CSV"); await page.getByRole("button", { name: "Essayer le modèle fictif" }).click();
  await page.getByLabel("Associer Activité", { exact: true }).selectOption("title"); await page.getByLabel("Associer Rôle", { exact: true }).selectOption("role");
  await page.getByLabel("Associer Finalité", { exact: true }).selectOption("purpose"); await page.getByLabel("Associer Durée", { exact: true }).selectOption("retentionPeriod");
  await expect(page.getByText("Rejet : rôle non reconnu", { exact: true })).toBeVisible(); await page.getByLabel("J’ai examiné les lignes rejetées").check();
  await page.getByRole("button", { name: "Importer les fiches examinées", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Enregistré dans le coffre chiffré.");
}
function watchCalls() {
  const calls: string[] = []; Object.defineProperty(window, "rgpdeskCalls", { value: calls });
  const nativeFetch = window.fetch.bind(window); window.fetch = (...args) => { calls.push("fetch"); return nativeFetch(...args); };
  const send = XMLHttpRequest.prototype.send; XMLHttpRequest.prototype.send = function (...args) { calls.push("xhr"); return send.apply(this, args); };
  const beacon = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (...args) => { calls.push("beacon"); return beacon(...args); };
  const Socket = WebSocket; window.WebSocket = class extends Socket { constructor(...args: ConstructorParameters<typeof WebSocket>) { calls.push("socket"); super(...args); } };
  const submit = HTMLFormElement.prototype.submit; HTMLFormElement.prototype.submit = function () { calls.push("form"); return submit.call(this); };
  document.addEventListener("securitypolicyviolation", (e) => calls.push(`csp:${e.effectiveDirective}`));
}
test("offline lot 2 to lot 3: CSV, contract reference, action closure, reviewed delivery and local verification", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.addInitScript(watchCalls); await ready(page);
  const verifier = await context.newPage(); await verifier.goto("/app/privacy/verify/"); await expect(verifier.locator("astro-island[ssr]")).toHaveCount(0); await expect(verifier.getByLabel("Dossier ZIP à vérifier")).toBeEnabled();
  await page.bringToFront(); await context.setOffline(true); await create(page); await importFiction(page);
  await navigate(page, "Documents"); await page.getByRole("button", { name: "Ajouter une référence", exact: true }).click();
  await page.getByLabel("Titre interne", { exact: true }).fill("CANARY_DOC_TITLE_23"); await page.getByLabel("Périmètre de la référence", { exact: true }).fill("CANARY_DOC_SCOPE_23");
  await page.getByLabel("Localisation / référence interne", { exact: false }).fill("CANARY_PATH_23 /private/fictif/contrat");
  await page.getByLabel("Bénévoles • exemple fictif", { exact: true }).check();
  await page.getByRole("button", { name: "Enregistrer la référence", exact: true }).click(); await expect(page.getByRole("button", { name: "Examiner CANARY_DOC_TITLE_23", exact: true })).toBeVisible();
  await navigate(page, "Actions & décisions"); await page.getByLabel("Information manquante", { exact: true }).selectOption("R-004");
  const finding = page.locator(".finding-list li").filter({ hasText: "Bénévoles • exemple fictif" }); await finding.getByRole("button", { name: "Créer une action", exact: true }).click();
  await page.getByLabel("Responsable de l’action", { exact: true }).fill("CANARY_ACTION_OWNER_23"); await page.getByLabel("Échéance déclarée", { exact: true }).fill("2026-10-15");
  await page.getByRole("button", { name: "Enregistrer l’action", exact: true }).click(); await expect(page.getByText("CANARY_ACTION_OWNER_23", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Clôturer", exact: true }).click(); await page.getByLabel("Auteur déclaré de la clôture", { exact: true }).fill("CANARY_AUTHOR_23"); await page.getByLabel("Justification de clôture", { exact: true }).fill("CANARY_CLOSURE_23 Critère à préciser, transmission pour avis.");
  await page.getByRole("button", { name: "Enregistrer la clôture", exact: true }).click(); await expect(page.getByText(/CANARY_CLOSURE_23 Critère/)).toBeVisible();
  await navigate(page, "Partager un dossier"); await page.getByLabel("Destinataire déclaré", { exact: true }).fill("Comité fictif"); await page.getByLabel("Périmètre public de cette livraison", { exact: true }).fill("Gestion des bénévoles, revue de travail."); await page.getByLabel("Bénévoles • exemple fictif · Responsable", { exact: true }).check();
  await page.getByLabel("Réserves à communiquer", { exact: true }).fill("Conservation à examiner."); await page.getByRole("button", { name: "Prévisualiser le dossier", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("Conservation à examiner."); await expect(page.getByRole("table")).not.toContainText("CANARY_");
  await expect(page.getByRole("button", { name: "Confirmer et télécharger le dossier", exact: true })).toBeDisabled();
  await page.getByLabel("J’ai relu ce contenu en clair").check(); const downloadPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "Confirmer et télécharger le dossier", exact: true }).click(); const downloaded = await downloadPromise;
  expect(downloaded.suggestedFilename()).toBe("rgpdesk-dossier.zip"); const path = (await downloaded.path())!; const bytes = await readFile(path); const zip = await JSZip.loadAsync(bytes);
  for (const entry of Object.values(zip.files)) expect(await entry.async("string")).not.toContain("CANARY_");
  expect(Object.keys(zip.files).sort()).toEqual(["README.txt", "manifest.json", "register.csv", "register.json", "report.html"]);
  const cli = JSON.parse(execFileSync(process.execPath, ["packages/privacy-verifier/bin/rgpdesk-verify.mjs", path], { encoding: "utf8" })); expect(cli.valid).toBe(true);
  await verifier.getByLabel("Dossier ZIP à vérifier").setInputFiles({ name: "dossier.zip", mimeType: "application/zip", buffer: bytes }); await expect(verifier.getByRole("status")).toContainText("Intégrité technique vérifiée");
  const corrupt = Buffer.from(bytes); corrupt[60]! ^= 1; await verifier.getByLabel("Dossier ZIP à vérifier").setInputFiles({ name: "alteration.zip", mimeType: "application/zip", buffer: corrupt }); await expect(verifier.getByRole("status")).toContainText("Dossier refusé");
  await page.bringToFront(); await navigate(page, "Registre"); await page.getByRole("button", { name: "Modifier Bénévoles • exemple fictif", exact: true }).click(); await page.getByLabel("Nom de l’activité", { exact: true }).fill("Titre modifié après livraison"); await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click(); await navigate(page, "Partager un dossier");
  const oldPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "Télécharger l’instantané", exact: true }).click(); const old = await readFile((await (await oldPromise).path())!); expect(old.equals(bytes)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { rgpdeskCalls: string[] }).rgpdeskCalls)).toEqual([]);
});

test("CSV encoding errors and cancellation do not add any records", async ({ page }) => {
  await ready(page); await create(page); await navigate(page, "Importer un CSV");
  await page.getByLabel("Fichier CSV", { exact: true }).setInputFiles({ name: "cp1252.csv", mimeType: "text/csv", buffer: Buffer.from([0x4e,0x6f,0x6d,0x3b,0x52,0xf4,0x6c,0x65,0x0a,0xc9,0x71,0x75,0x69,0x70,0x65,0x3b,...Buffer.from("controller")]) });
  await expect(page.getByRole("alert")).toContainText("CSV refusé"); await page.getByLabel("Encodage", { exact: true }).selectOption("windows-1252");
  await page.getByLabel("Fichier CSV", { exact: true }).setInputFiles({ name: "cp1252.csv", mimeType: "text/csv", buffer: Buffer.from("Nom;Rôle\nÉquipe;controller", "latin1") });
  await page.getByLabel("Associer Nom", { exact: true }).selectOption("title"); await page.getByLabel("Associer Rôle", { exact: true }).selectOption("role"); await expect(page.getByRole("table")).toContainText("Équipe");
  await page.getByRole("button", { name: "Annuler l’import", exact: true }).click(); await navigate(page, "Registre"); await expect(page.locator(".activity-records li")).toHaveCount(0);
});

test("a change from another tab invalidates the already reviewed delivery", async ({ page, context }) => {
  await ready(page); await create(page); await importFiction(page); await navigate(page, "Partager un dossier");
  await page.getByLabel("Destinataire déclaré", { exact: true }).fill("Comité fictif"); await page.getByLabel("Périmètre public de cette livraison", { exact: true }).fill("Périmètre fictif"); await page.getByLabel("Bénévoles • exemple fictif · Responsable", { exact: true }).check(); await page.getByRole("button", { name: "Prévisualiser le dossier", exact: true }).click(); await page.getByLabel("J’ai relu ce contenu en clair").check();
  const other = await context.newPage(); await ready(other); await other.getByRole("button", { name: "Ouvrir le coffre 1", exact: true }).click(); await other.getByLabel("Phrase secrète du coffre", { exact: true }).fill(phrase); await other.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await other.getByRole("button", { name: "Modifier Bénévoles • exemple fictif", exact: true }).click(); await other.getByLabel("Notes internes", { exact: true }).fill("Changement interne fictif invalidant aussi la revue"); await other.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click(); await expect(other.getByRole("button", { name: "Modifier Bénévoles • exemple fictif", exact: true })).toBeVisible();
  await page.bringToFront(); await page.getByRole("button", { name: "Confirmer et télécharger le dossier", exact: true }).click(); await expect(page.getByRole("alert")).toContainText("autre onglet"); await expect(page.getByRole("button", { name: "Télécharger l’instantané", exact: true })).toHaveCount(0);
});

test("premium interface remains usable at desktop, tablet and narrow mobile widths", async ({ page }, testInfo) => {
  await ready(page);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Créer le coffre chiffré", exact: true })).toBeVisible();
    if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`rgpdesk-accueil-${width}.png`), fullPage: true });
  }
  await create(page); await importFiction(page);
  await page.setViewportSize({ width: 1440, height: 1000 }); await navigate(page, "Registre"); await page.screenshot({ path: testInfo.outputPath("rgpdesk-registre-1440.png"), fullPage: true }); await page.setViewportSize({ width: 320, height: 1000 });
  for (const panel of ["Registre", "Documents", "Actions & décisions", "Partager un dossier", "Sauvegarde"]) { await navigate(page, panel); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
});
