import { test, expect } from "@playwright/test";

test("register and map share one draft, cancel discards it, and a processor is not offered a legal-basis choice", async ({ page }) => {
  await page.goto("/app/privacy/");
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await page.getByRole("button", { name: "Registre", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Recrutement · exemple fictif", exact: true }).click();
  await page.getByRole("navigation", { name: "Étapes de la fiche", exact: true }).getByRole("button").nth(2).click();
  const initialCount = await page.locator(".flow-editor .analysis-question").count();
  await expect(page.locator(".flow-editor > details.analysis-question[open]")).toHaveCount(0);
  await page.getByRole("button", { name: "Ajouter un flux", exact: true }).click();
  const number = initialCount + 1;
  await page.getByLabel(`Flux ${number} · Origine`, { exact: true }).fill("Origine temporaire fictive");
  await page.getByLabel(`Flux ${number} · Destination`, { exact: true }).fill("Destination temporaire fictive");
  await page.getByRole("button", { name: "Les flux", exact: true }).click();
  await expect(page.getByLabel(`Flux ${number} · Origine`, { exact: true })).toHaveValue("Origine temporaire fictive");
  await expect(page.locator(".flow-editor .analysis-question")).toHaveCount(number);
  await page.getByRole("button", { name: "Annuler l’édition", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Recrutement · exemple fictif", exact: true }).click();
  await page.getByRole("button", { name: "Les flux", exact: true }).click();
  await expect(page.locator(".flow-editor .analysis-question")).toHaveCount(initialCount);
  await expect(page.locator(".flow-editor")).not.toContainText("Origine temporaire fictive");
  await page.getByRole("button", { name: "Annuler l’édition", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Ateliers pour un client · exemple fictif", exact: true }).click();
  await page.getByRole("button", { name: "L’analyse", exact: true }).click();
  await page.locator(".review-notebook > .analysis-question").nth(1).locator("summary").first().click();
  await expect(page.locator(".legitimate-interest-guide")).toHaveCount(0);
  await expect(page.locator(".review-notebook")).toContainText("Sous-traitant");
});
