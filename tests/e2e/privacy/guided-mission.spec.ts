import { expect, test, type Page } from "@playwright/test";

async function createMission(page: Page) {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill("Mission entièrement fictive");
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill("Fictional mission passphrase 2026!");
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill("Fictional mission passphrase 2026!");
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await page.getByRole("button", { name: "Créer le coffre chiffré", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre mission, étape par étape.");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
}

test("guided interview becomes an activity-specific follow-up, without legal defaults or network", async ({ page, context }) => {
  await createMission(page);
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Choisir ma première activité" }).click();
  await page.getByRole("button", { name: "Gestion des candidatures", exact: true }).click();
  await expect(page.locator(".interview-card")).toContainText("personnes qui recrutent");
  await expect(page.locator(".interview-card .question-source")).toHaveCount(6);
  await expect(page.locator(".interview-card")).toContainText("Un logiciel classe-t-il ou écarte-t-il");
  await page.getByRole("button", { name: "Créer une fiche responsable", exact: true }).click();
  await expect(page.getByLabel("Nom de l’activité", { exact: true })).toHaveValue("Gestion des candidatures");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.locator(".step-heading h3")).toBeFocused();
  await page.getByRole("button", { name: "Ajouter une finalité", exact: true }).click();
  await page.getByLabel("Finalité 1", { exact: true }).fill("Examiner des candidatures fictives");
  await expect(page.getByLabel("Fondement juridique documenté 1 (complément)", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Durée ou critère de conservation 1", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Catégories de personnes", { exact: true }).fill("Candidats fictifs");
  await page.getByLabel("Catégories de données", { exact: true }).fill("Parcours professionnel fictif");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByLabel("Transferts documentés", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByLabel("État de l’examen des transferts", { exact: true })).toHaveValue("unknown");
  await page.getByLabel("Notes internes", { exact: true }).fill("PRIVATE_GUIDED_INTERVIEW_63AF");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.locator(".review-summary")).toContainText("Examiner des candidatures fictives");
  await expect(page.locator(".review-summary")).toContainText("À examiner");
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Préparer les questions de cette activité" }).click();
  await expect(page.getByLabel("Périmètre", { exact: true }).locator("option:checked")).toHaveText("Gestion des candidatures");
  const finding = page.locator(".finding-list > li").filter({ hasText: "Conservation à documenter" }).first();
  await finding.getByText("Préparer l’échange", { exact: true }).click();
  await expect(finding).toContainText("comment la suppression est-elle organisée");
  await finding.getByRole("button", { name: "Créer une action", exact: true }).click();
  await page.getByLabel("Responsable de l’action", { exact: true }).fill("Interlocuteur RH fictif");
  await page.getByRole("button", { name: "Enregistrer l’action", exact: true }).click();
  await expect(page.locator(".records")).toContainText("Interlocuteur RH fictif");
  expect(requests).toEqual([]);
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("#actions");
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await expect(page.getByText("Mission entièrement fictive", { exact: true })).toHaveCount(0);
  await expect(page.getByText("PRIVATE_GUIDED_INTERVIEW_63AF")).toHaveCount(0);
});

test("processor interview keeps its role and can save an incomplete draft", async ({ page }) => {
  await createMission(page);
  await page.getByRole("button", { name: "Choisir ma première activité" }).click();
  await page.getByRole("button", { name: "Prestation pour un client", exact: true }).click();
  await page.getByRole("button", { name: "Créer une fiche sous-traitante", exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Catégories d’opérations", { exact: true }).fill("Assistance fictive sur instruction");
  await page.getByRole("button", { name: "Voir toute la fiche", exact: true }).click();
  await expect(page.getByLabel(/Fondement juridique documenté/)).toHaveCount(0);
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Prestation pour un client", exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByLabel("Catégories d’opérations", { exact: true })).toHaveValue("Assistance fictive sur instruction");
});

test("public pages use visitor language and illustrated guide fits narrow screens", async ({ page }, testInfo) => {
  for (const route of ["/app/privacy/", "/app/privacy/confidentialite/", "/app/privacy/guide/"]) {
    await page.goto(route);
    await expect(page.locator("body")).not.toContainText(/qualification|audit de sécurité indépendant|sans revue juridique humaine|Lots 0 à 3|fr-eu-2026-09-22\.draft/);
  }
  await expect(page.locator("figure.guide-visual")).toHaveCount(5);
  await page.locator("#entretien-recruitment > summary").click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `guide ${width}`).toBe(false);
    if (width === 390 || width === 1440) {
      await page.locator("#entretien-recruitment").screenshot({ path: testInfo.outputPath(`trame-recrutement-${width}.png`) });
      await page.locator(".annotated-record").screenshot({ path: testInfo.outputPath(`guide-fiche-${width}.png`) });
      await page.locator(".guide-storage").screenshot({ path: testInfo.outputPath(`guide-sauvegarde-${width}.png`) });
    }
  }
  await createMission(page);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `mission ${width}`).toBe(false);
    if (width === 390 || width === 1440) await page.locator(".desk-workspace").screenshot({ path: testInfo.outputPath(`mission-${width}.png`) });
  }
});
