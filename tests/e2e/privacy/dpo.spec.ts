import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("DPO cases work offline with saved chronology, reviews and responsive labelled controls", async ({ page, context }, info) => {
  await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  const requests: string[] = []; page.on("request", (r) => requests.push(r.url())); await context.setOffline(true);
  await page.getByRole("button", { name: "Dossiers DPO", exact: true }).click();
  for (const kind of ["Intérêt légitime", "Transferts", "Demandes de droits", "Violations"]) {
    await page.getByRole("button", { name: kind, exact: true }).click();
    await expect(page.locator(".dpo-workbench .records li")).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Demandes de droits", exact: true }).click();
  await page.getByRole("button", { name: "Ouvrir Demande d’accès DR-01 · fictive", exact: true }).click();
  await page.getByLabel("Responsable du suivi", { exact: true }).fill("Équipe fictive de recette");
  await page.getByRole("button", { name: "Enregistrer le dossier", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Modifications conservées pour cette visite uniquement.");
  await page.getByRole("button", { name: "03 Chronologie", exact: true }).click();
  await page.getByLabel("Date de l’événement, en UTC", { exact: true }).fill(new Date(Date.now() - 1000).toISOString());
  await page.getByLabel("Auteur déclaré de l’événement", { exact: true }).fill("DPO fictif");
  await page.getByLabel("Événement ou complément", { exact: true }).fill("Réponse fictive préparée, non envoyée.");
  await page.getByRole("button", { name: "Conserver cet événement", exact: true }).click();
  await expect(page.locator(".dpo-timeline li")).toHaveCount(2);
  await page.getByRole("button", { name: "04 Revue & historique", exact: true }).click();
  await page.getByLabel("Auteur déclaré de la revue", { exact: true }).fill("DPO fictif");
  await page.getByLabel("Motivation et suites", { exact: true }).fill("Projet à relire, aucune réponse envoyée.");
  await page.getByRole("button", { name: "Conserver cette revue", exact: true }).click();
  await expect(page.getByLabel("Revue historique", { exact: true }).locator("option")).toHaveCount(3);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `DPO ${width}`).toBe(true);
  }
  await page.screenshot({ path: info.outputPath("dpo-review-320.png"), fullPage: true });
  expect(requests).toEqual([]);
});

test("AIPD restitution is explicitly selected, reviewed and downloaded without internal notes", async ({ page, context }) => {
  await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Restitution AIPD", exact: true }).click();
  await page.getByLabel("Étude à restituer", { exact: true }).selectOption({ index: 1 });
  await expect(page.locator('.choices input:checked')).toHaveCount(0);
  await page.getByLabel("Destinataire de l’AIPD", { exact: true }).fill("Comité fictif de recette");
  await page.getByLabel("Périmètre de la restitution", { exact: true }).fill("Projet de badges fictif");
  await page.getByLabel("Traitement et périmètre", { exact: true }).check();
  await page.getByLabel("Scénarios et niveaux déclarés", { exact: true }).check();
  await page.getByLabel("Mesures et suivi", { exact: true }).check();
  await page.getByRole("button", { name: "Prévisualiser la restitution AIPD", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("Utilisation des horaires à une autre fin");
  await page.getByRole("checkbox", { name: "J’ai relu les valeurs" }).check();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Conserver et télécharger l’AIPD", exact: true }).click();
  const dl = await pending; const html = await readFile((await dl.path())!, "utf8");
  expect(html).toContain("Comité fictif de recette"); expect(html).toContain("default-src 'none'");
  for (const marker of ["NOTE INTERNE", "EXERCICE /", "<script", "Auteur déclaré"]) expect(html).not.toContain(marker);
  await expect(page.getByRole("button", { name: "Télécharger cette AIPD", exact: true })).toHaveCount(1);
});
