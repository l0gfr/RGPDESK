import { expect, test, type Page } from "@playwright/test";
async function nav(page: Page, name: string) { await page.getByRole("button", { name, exact: true }).click(); }
async function ready(page: Page) { await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible(); }
async function search(page: Page, query: string) {
  await nav(page, "Rechercher dans le coffre");
  await page.getByRole("searchbox", { name: "Rechercher dans ce coffre", exact: true }).fill(query);
}
async function create(page: Page, name: string, phrase: string) {
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill(name);
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await nav(page, "Créer le coffre chiffré");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre mission, étape par étape.");
}

test("search stays offline and volatile, opens the exact activity and clears when locked", async ({ page, context }) => {
  await ready(page); await nav(page, "Explorer la démo");
  await page.waitForLoadState("networkidle");
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const requests: string[] = []; page.on("request", (request) => requests.push(request.url()));
  await context.setOffline(true);
  await search(page, "recrutement");
  await page.getByRole("combobox", { name: "Dans", exact: true }).selectOption("activity");
  await nav(page, "Ouvrir Recrutement · exemple fictif");
  await expect(page.getByRole("article", { name: "Lecture de l’activité" }).getByRole("heading", {name:"Recrutement · exemple fictif",exact:true})).toBeVisible();
  await expect(page.getByRole("article", { name: "Lecture de l’activité" }).locator("input,textarea")).toHaveCount(0);
  await search(page, "fictif");
  for (const button of await page.locator(".search-results button").all()) await expect(button).toBeEnabled();
  await nav(page, "Fermer la recherche");
  await nav(page, "Quitter la démo");
  await expect(page.locator("#workspace-search")).toHaveCount(0);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(storage);
  expect(requests).toEqual([]);
});

test("search handles literal markup and repeated PIA navigation without overflow", async ({ page }) => {
  await ready(page); await nav(page, "Explorer la démo");
  await search(page, '<img src=x onerror=alert(1)>');
  await expect(page.locator(".search-count")).toContainText("Aucun résultat");
  await expect(page.locator(".workspace-search img")).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Rechercher dans ce coffre", exact: true }).fill("fictif");
  await page.getByRole("combobox", { name: "Dans", exact: true }).selectOption("pia");
  const result = page.locator(".search-results button").first(); const title = await result.innerText();
  await result.click(); await expect(page.getByRole("button", { name: "Enregistrer l’étude", exact: true })).toBeVisible();
  await nav(page, "Fermer l’étude");
  await search(page, "fictif"); await page.getByRole("combobox", { name: "Dans", exact: true }).selectOption("pia");
  await nav(page, title.trim()); await expect(page.getByRole("button", { name: "Enregistrer l’étude", exact: true })).toBeVisible();
  await nav(page, "Fermer l’étude"); await search(page, "fictif");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("two client vaults stay separate and opaque when switching and after reload", async ({ page }) => {
  test.setTimeout(90_000);
  await ready(page);
  const alpha = "Fictional alpha client phrase 2026!", beta = "Fictional beta client phrase 2026!";
  await create(page, "CLIENT FICTIF ALPHA", alpha);
  const alphaReference = await page.locator(".client-switcher small").innerText();
  await nav(page, "Registre"); await nav(page, "Ajouter une activité responsable");
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("ACTIVITE FICTIVE ALPHA");
  await nav(page, "Enregistrer la fiche"); await nav(page, "Ma mission");
  await nav(page, "Ajouter un client"); await expect(page.getByLabel("Nom de l’organisme", { exact: true })).toBeFocused();
  await expect(page.locator(".sidebar-caption")).toHaveCount(0);
  await create(page, "CLIENT FICTIF BETA", beta);
  const betaReference = await page.locator(".client-switcher small").innerText();
  expect(betaReference).not.toBe(alphaReference);
  await search(page, "ALPHA"); await expect(page.locator(".search-count")).toContainText("Aucun résultat");
  await nav(page, "Fermer la recherche"); await nav(page, "Changer de registre");
  await page.reload(); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await expect(page.locator("#client-vaults .records > li")).toHaveCount(2);
  await expect(page.locator("#client-vaults")).not.toContainText("CLIENT FICTIF");
  const alphaId = alphaReference.replace("Repère du coffre : ", "");
  await page.locator("#client-vaults .records > li").filter({ hasText: alphaId }).getByRole("button").click();
  await page.getByLabel("Phrase secrète du coffre", { exact: true }).fill(alpha); await nav(page, "Déverrouiller");
  await search(page, "ALPHA"); await expect(page.locator(".search-results")).toContainText("ACTIVITE FICTIVE ALPHA");
  await expect(page.locator(".sidebar-caption")).toContainText("CLIENT FICTIF ALPHA");
});

test("new interview starters filter locally without setting legal defaults", async ({ page }) => {
  await ready(page); await nav(page, "Explorer la démo"); await nav(page, "Registre"); await nav(page, "Choisir un point de départ");
  await page.getByRole("searchbox", { name: "Trouver une activité", exact: true }).fill("fournisseurs");
  await expect(page.locator(".starter-card")).toHaveCount(1);
  await nav(page, "Achats et gestion des fournisseurs");
  await expect(page.locator(".interview-card .question-source")).toHaveCount(6);
  await nav(page, "Créer une fiche responsable");
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue("Achats et gestion des fournisseurs");
  await nav(page, "Continuer");
  await expect(page.getByRole("button", { name: "Ajouter une finalité", exact: true })).toBeVisible();
  await expect(page.locator('textarea[aria-label^="Fondement"]')).toHaveCount(0);
});

test("search opens the selected document or DPO case rather than only their section", async ({ page }) => {
  await ready(page); await nav(page, "Explorer la démo"); await search(page, "badge");
  await page.getByRole("combobox", { name: "Dans", exact: true }).selectOption("document");
  await nav(page, "Ouvrir Contrat du prestataire de badges · fictif");
  await expect(page.getByRole("textbox", { name: "Titre interne", exact: true })).toHaveValue("Contrat du prestataire de badges · fictif");
  await nav(page, "Annuler la référence"); await nav(page, "Ma mission"); await search(page, "DR-01");
  await nav(page, "Ouvrir Demande d’accès DR-01 · fictive");
  await expect(page.getByRole("textbox", { name: "Titre du dossier", exact: true })).toHaveValue("Demande d’accès DR-01 · fictive");
});
