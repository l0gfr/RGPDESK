import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

const phrase = "Fictional practice backup phrase 2026!";
async function ready(page: Page) { await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible(); }
async function demo(page: Page) {
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Prenez la place du DPO.", exact: true })).toBeVisible();
}
async function nav(page: Page, name: string) { await page.getByRole("button", { name, exact: true }).click(); }
async function stored(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open("rgpdesk-vault-v1"); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try {
      const stores = Array.from(db.objectStoreNames);
      const tx = db.transaction(stores, "readonly");
      return await Promise.all(stores.map((name) => new Promise((resolve, reject) => { const r = tx.objectStore(name).getAll(); r.onsuccess = () => resolve([name, r.result]); r.onerror = () => reject(r.error); })));
    } finally { db.close(); }
  });
}
test("practice does not write browser storage or change an existing encrypted vault", async ({ page, context }) => {
  await ready(page);
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill("Existing fictitious organization");
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check(); await nav(page, "Créer le coffre chiffré");
  await nav(page, "Verrouiller le coffre");
  const before = await stored(page);
  const browserStorage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const calls: string[] = []; page.on("request", (request) => calls.push(request.method()));
  await context.setOffline(true); await demo(page); await nav(page, "Registre");
  await nav(page, "Modifier Recrutement · exemple fictif");
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("Fictional edited demonstration");
  await nav(page, "Enregistrer la fiche");
  await expect(page.getByRole("status")).toHaveText("Modifications conservées pour cette visite uniquement.");
  await nav(page, "Quitter la démo");
  await expect(page.getByRole("button", { name: "Ouvrir le coffre 1", exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(before);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(browserStorage);
  expect(calls).toEqual([]);
  await nav(page, "Ouvrir le coffre 1"); await page.getByLabel("Phrase secrète du coffre", { exact: true }).fill(phrase); await nav(page, "Déverrouiller");
  await expect(page.getByRole("heading", { name: "Existing fictitious organization", exact: true })).toBeVisible();
  await nav(page, "Registre"); await expect(page.locator(".activity-records > li")).toHaveCount(0);
});

test("guided practice exposes populated register, flows, PIA history and every panel without overflow", async ({ page }, testInfo) => {
  await ready(page); await demo(page);
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overview ${width}`).toBe(true);
    if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`demo-overview-${width}.png`), fullPage: true });
  }
  await nav(page, "Commencer par le registre"); await expect(page.locator(".activity-records > li")).toHaveCount(4);
  await page.getByRole("complementary", { name: "Repère de démonstration", exact: true }).getByRole("button", { name: "Continuer : Suivre les données", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Votre carte des flux.", exact: true })).toBeVisible();
  await nav(page, "AIPD / PIA"); await nav(page, "Lire l’AIPD d’exemple");
  const reader = page.getByRole("article", { name: "Dossier AIPD en lecture" });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole("heading", { name: "Contexte et déclenchement", exact: true })).toBeVisible();
  await reader.getByRole("button", { name: "02 Les choix", exact: true }).click();
  await expect(reader.getByRole("heading", { name: "Nécessité et proportionnalité", exact: true })).toBeFocused();
  await expect(reader.getByRole("region", { name: "Contexte et déclenchement" })).toBeHidden();
  await expect(reader.locator(".pia-reader-option")).toHaveCount(2);
  await expect(page.getByRole("complementary", { name: "Repère de démonstration" }).getByRole("button", { name: /^Continuer :/ })).toBeEnabled();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `AIPD ${width}`).toBe(true);
  }
  await page.getByLabel("Version du dossier", { exact: true }).selectOption("0");
  await expect(page.getByRole("region", { name: "Atelier AIPD", exact: true })).toContainText("Réexaminer le projet");
  await expect(page.getByRole("region", { name: "Atelier AIPD", exact: true })).toContainText("Aucune mise en œuvre autorisée");
  await nav(page, "Fermer l’étude");
  for (const name of ["Registre", "Cartographie", "Analyse", "Organisation", "Intervenants", "Systèmes", "Documents", "Actions & décisions", "Importer un CSV", "Partager un dossier", "Sauvegarde"]) {
    await nav(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
    await expect(page.getByRole("complementary", { name: "Mode démonstration", exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Effacer les coffres RGPDESK de ce profil", exact: true })).toHaveCount(0);
  await page.reload(); await expect(page.getByRole("complementary", { name: "Mode démonstration", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Ouvrir le coffre/ })).toHaveCount(0);
});

test("practice delivers a verified fictional ZIP then a real encrypted restorable backup, without storing a vault", async ({ page }) => {
  test.setTimeout(90_000);
  await ready(page); const before = await stored(page); await demo(page); await nav(page, "Partager un dossier");
  await nav(page, "Charger la sélection d’exemple"); await nav(page, "Prévisualiser le dossier");
  await expect(page.getByRole("table")).toContainText("DÉMONSTRATION FICTIVE");
  const previewProgress = await page.locator(".report-preview .document-progress .dp-total, .report-preview .document-progress .dp-row-title, .report-preview .document-progress .dp-point").allTextContents();
  expect(previewProgress.length).toBeGreaterThan(3);
  await expect(page.getByRole("table")).not.toContainText("NOTE INTERNE");
  await expect(page.getByRole("button", { name: "Confirmer et télécharger le dossier", exact: true })).toBeDisabled();
  await page.getByLabel("J’ai relu ce contenu en clair").check();
  const zipDownload = page.waitForEvent("download"); await nav(page, "Confirmer et télécharger le dossier");
  const downloaded = await zipDownload; expect(downloaded.suggestedFilename()).toBe("rgpdesk-demonstration-dossier.zip");
  const bytes = await readFile((await downloaded.path())!); const zip = await JSZip.loadAsync(bytes);
  expect(Object.keys(zip.files).sort()).toEqual(["README.txt", "manifest.json", "register.csv", "register.json", "report.html"]);
  for (const entry of Object.values(zip.files)) expect(await entry.async("string")).not.toContain("NOTE INTERNE");
  const report = await page.context().newPage();
  const reportRequests: string[] = [];
  report.on("request", (request) => reportRequests.push(request.url()));
  try {
    await report.setContent(await zip.file("report.html")!.async("string"));
    expect(await report.locator(".document-progress .dp-total, .document-progress .dp-row-title, .document-progress .dp-point").allTextContents()).toEqual(previewProgress);
    await expect(report.getByRole("heading", { level: 1 })).toContainText("Maison Sillage");
    await expect(report.locator(".activity")).toHaveCount(3);
    await expect(report.locator("script, iframe, img, link")).toHaveCount(0);
    expect(await report.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).toBe("rgb(232, 238, 242)");
    for (const width of [1440, 768, 390, 320]) {
      await report.setViewportSize({ width, height: 900 });
      expect(await report.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `report ${width}`).toBe(true);
    }
    expect(reportRequests).toEqual([]);
  } finally { await report.close(); }

  await nav(page, "Sauvegarde");
  await page.getByLabel("Phrase pour la sauvegarde de démonstration", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase de démonstration", { exact: true }).fill(phrase);
  const backupDownload = page.waitForEvent("download"); await nav(page, "Chiffrer et télécharger l’exercice");
  const backup = await backupDownload; const backupBytes = await readFile((await backup.path())!);
  expect(backupBytes.toString()).not.toContain("Sillage");
  expect(JSON.parse(backupBytes.toString()).envelope.iterations).toBe(600_000);
  expect(await stored(page)).toEqual(before);
  await nav(page, "Quitter la démo");
  await page.getByText("Restaurer une sauvegarde chiffrée", { exact: true }).click();
  await page.getByLabel("Fichier de sauvegarde RGPDESK", { exact: true }).setInputFiles({ name: "demo.rgpdesk", mimeType: "application/json", buffer: backupBytes });
  await page.getByLabel("Phrase secrète de la sauvegarde", { exact: true }).fill(phrase);
  await page.getByLabel("Je souhaite réintroduire les données").check(); await nav(page, "Restaurer dans ce navigateur");
  await expect(page.getByRole("button", { name: "Verrouiller le coffre", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Mode démonstration", exact: true })).toHaveCount(0);
  await nav(page, "Partager un dossier");
  const originalDownload = page.waitForEvent("download"); await nav(page, "Télécharger l’instantané");
  expect(await readFile((await (await originalDownload).path())!)).toEqual(bytes);
});

test("the volatile demonstration remains usable when IndexedDB is unavailable", async ({ page }) => {
  await page.addInitScript(() => { IDBFactory.prototype.open = () => { throw new DOMException("Unavailable", "SecurityError"); }; });
  await page.goto("/app/privacy/");
  await expect(page.getByText("La liste des coffres n’a pas pu être lue.", { exact: false })).toBeVisible();
  await demo(page); await nav(page, "Registre");
  await expect(page.locator(".activity-records > li")).toHaveCount(4);
  await nav(page, "Quitter la démo");
  await expect(page.getByRole("button", { name: "Créer le coffre chiffré", exact: true })).toBeDisabled();
});


test("demo opens the filled example and keeps guidance without losing an unfinished edit", async ({ page }) => {
  await ready(page); await demo(page); await nav(page, "Commencer par le registre");
  await nav(page, "Ouvrir la fiche d’exemple");
  const guide = page.getByRole("complementary", { name: "Repère de démonstration" });
  await expect(guide).toBeVisible();
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue(/badge/i);
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("Fictional unsaved badge project");
  await guide.getByRole("button", { name: "Continuer : Suivre les données" }).click();
  await expect(page.getByRole("button", { name: "Reprendre ma saisie", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue("Fictional unsaved badge project");
  await nav(page, "Annuler l’édition");
  await expect(page.getByRole("button", { name: "Modifier Fictional unsaved badge project" })).toHaveCount(0);
  await guide.getByRole("button", { name: "Continuer : Suivre les données" }).click();
  await expect(page.getByRole("heading", { name: "Votre carte des flux." })).toBeFocused();
});


test("demo entry actions stay separated and readable at rest, on hover and by keyboard", async ({ page }) => {
  await ready(page); await demo(page);
  const actions = page.locator(".demo-cover-actions button, .demo-cover-actions a");
  const contrast = async (button: Locator) => button.evaluate((el) => {
    const style = getComputedStyle(el);
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.map(Number);
      if (rgb.length > 3 && rgb[3] !== 1) throw new Error("Contrast requires an opaque button background");
      return rgb.slice(0,3).map((v) => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126,.7152,.0722][i], 0);
    };
    const a = luminance(style.color), b = luminance(style.backgroundColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0,0);
    const boxes = await actions.evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, right:r.right }; }));
    expect(boxes).toHaveLength(2);
    expect(boxes[1].top - boxes[0].bottom >= 11 || boxes[1].left - boxes[0].right >= 11).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (let i=0; i<2; i++) {
      expect(await contrast(actions.nth(i))).toBeGreaterThanOrEqual(4.5);
      await actions.nth(i).hover(); expect(await contrast(actions.nth(i))).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0,0);
    }
    await actions.first().focus(); await page.keyboard.press("Tab");
    await expect(actions.last()).toBeFocused();
    expect(await actions.last().evaluate((el) => el.matches(":focus-visible") && parseFloat(getComputedStyle(el).outlineWidth) >= 2)).toBe(true);
    expect(await contrast(actions.last())).toBeGreaterThanOrEqual(4.5);
  }
  const openedReport = page.waitForEvent("popup");
  await actions.last().press("Enter");
  const report = await openedReport;
  await expect(report.getByRole("heading", {name:"Parcourez le dossier.", exact:true})).toBeVisible();
  await report.close();
  for (const panel of ["Cartographie", "Analyse"]) {
    await nav(page, panel);
    const action = page.locator(".analysis-context button");
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000}); await page.mouse.move(0,0);
      expect(await contrast(action)).toBeGreaterThanOrEqual(4.5);
      await action.hover(); expect(await contrast(action)).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0,0); await action.focus();
      await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
      await expect(action).toBeFocused();
      expect(await action.evaluate((el) => el.matches(":focus-visible") && parseFloat(getComputedStyle(el).outlineWidth) >= 2)).toBe(true);
      expect(await contrast(action)).toBeGreaterThanOrEqual(4.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
