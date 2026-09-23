import { test, expect, type Page } from "@playwright/test";

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const prompt = (page: Page) => page.getByRole("dialog", { name: "Avant de changer de rubrique", exact: true });
async function start(page: Page) {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await button(page, "Explorer la démo").click();
}
async function rights(page: Page) {
  await button(page, "Dossiers DPO").click();
  await button(page, "Demandes de droits").click();
  await button(page, "Ouvrir Demande d’accès DR-01 · fictive").click();
}

test("saved dossiers and unchanged or reverted activities leave freely", async ({ page }) => {
  await start(page); await rights(page);
  await button(page, "Registre").click();
  await expect(prompt(page)).toHaveCount(0);
  await button(page, "Modifier Recrutement · exemple fictif").click();
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("Fictional temporary name");
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("Recrutement · exemple fictif");
  await button(page, "AIPD / PIA").click();
  await button(page, "Lire l’AIPD d’exemple").click();
  await button(page, "Sauvegarde").click();
  await expect(prompt(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sauvegarder votre travail.", exact: true })).toBeFocused();
});

test("dirty search navigation keeps the draft on Escape and discards only after explicit choice", async ({ page, context }) => {
  await start(page); await button(page, "Registre").click();
  await button(page, "Modifier Recrutement · exemple fictif").click();
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("FICTIONAL UNSAVED NAVIGATION");
  await page.waitForLoadState("networkidle");
  const storage = await page.evaluate(() => ({ local: {...localStorage}, session: {...sessionStorage} }));
  const requests: string[] = []; page.on("request", (request) => requests.push(request.url()));
  await context.setOffline(true);
  await button(page, "Rechercher dans le coffre").click();
  const search = page.getByRole("dialog", { name: "Retrouvez une information.", exact: true });
  await expect(search).toBeVisible();
  await page.getByRole("searchbox").fill("DR-01");
  await button(page, "Ouvrir Demande d’accès DR-01 · fictive").click();
  await expect(search).toHaveCount(0);
  await expect(button(page, "Reprendre ma saisie")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(button(page, "Quitter sans enregistrer")).toBeFocused();
  await page.keyboard.press("Shift+Tab"); await expect(button(page, "Reprendre ma saisie")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-draft-heading]")).toBeFocused();
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue("FICTIONAL UNSAVED NAVIGATION");
  await button(page, "Dossiers DPO").click();
  await button(page, "Quitter sans enregistrer").click();
  await expect(page.getByRole("heading", { name: "Les dossiers de votre mission.", exact: true })).toBeFocused();
  await button(page, "Registre").click();
  await button(page, "Modifier Recrutement · exemple fictif").click();
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue("Recrutement · exemple fictif");
  expect(await page.evaluate(() => ({ local: {...localStorage}, session: {...sessionStorage} }))).toEqual(storage);
  expect(requests).toEqual([]);
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("");
});

test("DPO chronology and review drafts remain protected even after saving the dossier", async ({ page }) => {
  await start(page); await rights(page);
  await button(page, "03 Chronologie").click();
  await page.getByLabel("Événement ou complément", { exact: true }).fill("Fictional pending event");
  await button(page, "04 Revue & historique").click();
  await page.getByLabel("Motivation et suites", { exact: true }).fill("Fictional pending review");
  await button(page, "Enregistrer le dossier").click();
  await button(page, "Ma mission").click();
  await button(page, "Reprendre ma saisie").click();
  await expect(page.getByLabel("Motivation et suites", { exact: true })).toHaveValue("Fictional pending review");
  await button(page, "03 Chronologie").click();
  await expect(page.getByLabel("Événement ou complément", { exact: true })).toHaveValue("Fictional pending event");
  await button(page, "Fermer le dossier").click();
  await button(page, "Quitter sans enregistrer").click();
  await button(page, "Ouvrir Demande d’accès DR-01 · fictive").click();
  await button(page, "03 Chronologie").click();
  await expect(page.getByLabel("Événement ou complément", { exact: true })).toHaveValue("");
  await button(page, "04 Revue & historique").click();
  await expect(page.getByLabel("Motivation et suites", { exact: true })).toHaveValue("");
});

test("PIA human decision remains a separate explicit action, protected on leave", async ({ page }) => {
  await start(page); await button(page, "AIPD / PIA").click();
  await button(page, "Lire l’AIPD d’exemple").click();
  await page.getByRole("button", { name: /Avis & décision/ }).click();
  await page.getByLabel("Motifs et réserves de la décision", { exact: true }).fill("Fictional pending human opinion");
  await button(page, "Enregistrer l’étude").click();
  await button(page, "Registre").click();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Motifs et réserves de la décision", { exact: true })).toHaveValue("Fictional pending human opinion");
  await button(page, "Fermer l’étude").click();
  await button(page, "Quitter sans enregistrer").click();
  await button(page, "Lire le dossier").click();
  await page.getByRole("button", { name: /Avis & décision/ }).click();
  await expect(page.getByLabel("Motifs et réserves de la décision", { exact: true })).toHaveValue("");
});

test("automatic locking destroys the pending destination and modal without reviving the draft", async ({ page }) => {
  await page.clock.install(); await start(page); await rights(page);
  await page.getByLabel("Titre du dossier", { exact: true }).fill("Fictional forgotten draft");
  await button(page, "Ma mission").click(); await expect(prompt(page)).toBeVisible();
  await page.clock.runFor(15 * 60_000 + 100);
  await expect(prompt(page)).toHaveCount(0);
  await expect(button(page, "Explorer la démo")).toBeEnabled();
  await page.keyboard.press("Escape"); await button(page, "Explorer la démo").click();
  await expect(page.getByRole("heading", { name: "Prenez la place du DPO.", exact: true })).toBeVisible();
  await expect(page.getByText("Fictional forgotten draft", { exact: true })).toHaveCount(0);
});

test("compact guidance, sticky save actions and search dialog fit narrow screens", async ({ page }, info) => {
  await start(page); await rights(page);
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const guide = page.locator(".demo-guide");
    expect((await guide.boundingBox())!.height).toBeLessThan(width === 1440 ? 180 : 290);
    await page.getByLabel("Responsable du suivi", { exact: true }).fill("Fictional team");
    await button(page, "03 Chronologie").click();
    await page.getByLabel("Événement ou complément", { exact: true }).scrollIntoViewIfNeeded();
    const save = button(page, "Enregistrer le dossier");
    await expect(save).toBeInViewport();
    await button(page, "Rechercher dans le coffre").click();
    await expect(page.getByRole("searchbox")).toBeFocused();
    await page.getByRole("searchbox").fill("fictif");
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(button(page, "Rechercher dans le coffre")).toBeFocused();
    await button(page, "01 Cadrage").click();
  }
  await page.setViewportSize({ width:1440, height:1000 });
  await page.locator("[data-draft-heading]").scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath("compact-dpo-1440.png")});
});
