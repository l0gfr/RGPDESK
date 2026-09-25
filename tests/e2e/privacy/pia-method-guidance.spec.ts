import { expect, test } from "@playwright/test";

test("PIA reuses register facts and offers optional reading without deciding any risk", async ({ page }) => {
  await page.goto("/app/privacy/#demo/aipd");
  await page.getByLabel("Traitement à étudier", { exact: true }).selectOption({ label: "Accès aux locaux par badge · projet fictif" });
  await page.getByRole("button", { name: "Reprendre l’AIPD", exact: true }).click();
  const atelier = page.getByRole("region", { name: "Atelier AIPD", exact: true });
  await atelier.getByRole("button", { name: /Principes généraux/ }).click();
  const facts = atelier.getByRole("region", { name: "Faits du registre pour les principes fondamentaux", exact: true });
  await expect(facts).toBeVisible();
  await facts.getByText("Finalités, fondements et conservation", { exact: true }).click();
  await expect(facts.locator("input,textarea")).toHaveCount(0);
  await expect(facts.getByText("Fondement déclaré", { exact: true }).first()).toBeVisible();
  await atelier.getByRole("button", { name: /Nécessité/ }).click();
  await expect(atelier.getByText(/cela ne rend pas l’examen lui-même facultatif/)).toBeVisible();
  await atelier.locator(".necessity-reading > summary").click();
  await atelier.getByText("Examiner les limitations", { exact: true }).click();
  await expect(atelier.getByText(/les effets même sans incident/)).toBeVisible();
  await expect(atelier.locator(".necessity-reading input,.necessity-reading textarea")).toHaveCount(0);
  await atelier.getByRole("button", { name: /Risques humains/ }).click();
  await atelier.locator(".rights-explorer > summary").click();
  const search = atelier.getByLabel("Chercher un droit ou un effet", { exact: true });
  await search.fill("expression");
  await atelier.getByLabel("Piste à examiner", { exact: true }).selectOption("expression");
  await search.fill("aucun-resultat-fictif");
  await expect(atelier.getByRole("button", { name: "Décrire un scénario pour ce droit", exact: true })).toHaveCount(0);
  await expect(atelier.getByLabel("Piste à examiner", { exact: true })).toHaveValue("");
  await search.fill("autonomie");
  await atelier.getByLabel("Piste à examiner", { exact: true }).selectOption("autonomy");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `width ${width}`).toBe(true);
    await expect(atelier.getByRole("button", { name: "Décrire un scénario pour ce droit", exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => ({ ...localStorage, ...sessionStorage }))).toEqual({});
});
