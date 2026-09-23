import { test, expect, type Page } from "@playwright/test";

const phrase = "Fictional DPO atlas phrase 2026!";
async function create(page: Page) {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill("Atelier fictif des données");
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await page.getByRole("button", { name: "Créer le coffre chiffré", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre mission");
  await page.getByRole("button", { name: "Registre", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une activité responsable", exact: true }).click();
  await page.getByLabel("Nom de l’activité", { exact: true }).fill("Recrutement fictif");
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await expect(page.getByRole("button", { name: "Modifier Recrutement fictif", exact: true })).toBeVisible();
}

test("declared flows, analysis and clause notes stay private, encrypted and usable offline", async ({ page, context }) => {
  const diagnostics: string[] = [];
  page.on("console", (message) => diagnostics.push(message.text()));
  page.on("pageerror", (error) => diagnostics.push(error.message));
  await create(page);
  await page.waitForLoadState("networkidle"); await context.setOffline(true);
  const requests: string[] = []; page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Modifier Recrutement fictif", exact: true }).click();
  await page.getByRole("navigation", { name: "Étapes de la fiche", exact: true }).getByRole("button").nth(2).click();
  await expect(page.getByRole("heading", { name: "Décrire les données et leurs flux.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter un flux", exact: true }).click();
  await page.getByLabel("Flux 1 · Origine", { exact: true }).fill('PRIVATE_FLOW_<img src=x onerror="alert(1)">');
  await page.getByLabel("Flux 1 · Destination", { exact: true }).fill("Outil fictif de recrutement");
  await page.getByLabel("Flux 1 · Opération", { exact: true }).fill("Collecte du CV fictif");
  await page.getByText("Préciser le canal, les pays et les habilitations", { exact: true }).click();
  await page.getByLabel("Flux 1 · Accès et habilitations", { exact: true }).fill("PRIVATE_ACCESS_DPO");
  await expect(page.locator(".flow-map img")).toHaveCount(0);
  await expect(page.getByLabel("Flux 1 · Lieux et accès à distance", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Catégories de destinataires", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Les flux", exact: true }).click();
  await expect(page.locator(".flow-editor .analysis-question")).toHaveCount(1);
  await expect(page.getByLabel("Flux 1 · Origine", { exact: true })).toHaveValue('PRIVATE_FLOW_<img src=x onerror="alert(1)">');
  await page.getByRole("button", { name: "L’analyse", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Examiner les exigences RGPD de cette activité.", exact: true })).toBeVisible();
  const lawfulness = page.locator(".review-notebook > .analysis-question").nth(1);
  await lawfulness.locator("summary").first().click();
  await lawfulness.getByText("Examiner l’intérêt légitime, si vous envisagez ce fondement", { exact: true }).click();
  await expect(lawfulness.locator(".legitimate-interest-guide ol > li")).toHaveCount(3);
  await expect(lawfulness.locator(".method-source")).toHaveAttribute("href", "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr");
  await page.getByLabel("Analyse 2 · Faits recueillis", { exact: true }).fill("PRIVATE_INTEREST_REVIEW_DPO : finalité recrutement, hypothèse à examiner");
  await expect(page.getByLabel("Analyse 2 · Appréciation motivée", { exact: true })).toHaveValue("");
  const security = page.locator(".review-notebook > .analysis-question").nth(5);
  await security.locator("summary").first().click();
  await expect(security.locator(".method-source")).toContainText("art. 32");
  await expect(security.locator(".method-source")).not.toContainText("art. 35");
  await page.getByLabel("Opérations détaillées du traitement", { exact: true }).fill("PRIVATE_OPERATIONS_DPO");
  await page.getByLabel("Personnes habilitées et droits d’accès", { exact: true }).fill("Équipe RH fictive : consultation limitée");
  await page.getByLabel("Analyse 1 · Faits recueillis", { exact: true }).fill("PRIVATE_FACTS_DPO");
  await page.getByLabel("Analyse 1 · Éléments de preuve et références", { exact: true }).fill("PRIVATE_EVIDENCE_DPO");
  await page.getByLabel("Analyse 1 · Objections et incertitudes", { exact: true }).fill("PRIVATE_OBJECTIONS_DPO");
  await expect(page.getByLabel("Analyse 1 · Appréciation motivée", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Cartographie", exact: true }).click();
  await expect(page.locator(".flow-map")).toContainText("PRIVATE_FLOW_<img");
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une référence", exact: true }).click();
  await page.getByLabel("Titre interne", { exact: true }).fill("Contrat fictif");
  await page.getByLabel("Périmètre de la référence", { exact: true }).fill("Prestation de recrutement fictive");
  await page.getByRole("group", { name: "Activités couvertes", exact: true }).getByLabel("Recrutement fictif", { exact: true }).check();
  await page.getByRole("button", { name: "Commencer la revue article 28", exact: true }).click();
  await expect(page.locator(".contract-workbench .analysis-question")).toHaveCount(11);
  await page.getByLabel("Contrat 1 · Faits recueillis", { exact: true }).fill("PRIVATE_CONTRACT_DPO");
  await page.getByRole("button", { name: "Enregistrer la référence", exact: true }).click();
  await expect(page.getByRole("button", { name: "Examiner Contrat fictif", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sauvegarde", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger la sauvegarde chiffrée", exact: true }).click();
  const download = await downloadPromise; const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).toString()).not.toContain("PRIVATE_");
  const raw = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open("rgpdesk-vault-v1"); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    try { return await new Promise<string>((resolve, reject) => { const tx = db.transaction("records", "readonly"); const req = tx.objectStore("records").getAll(); req.onsuccess = () => resolve(JSON.stringify(req.result)); req.onerror = () => reject(req.error); }); } finally { db.close(); }
  });
  expect(raw).not.toContain("PRIVATE_"); expect(raw).not.toContain("Recrutement fictif");
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
  await expect(page.locator("body")).not.toContainText("PRIVATE_");
  await page.getByRole("button", { name: "Ouvrir le coffre 1", exact: true }).click();
  await page.getByLabel("Phrase secrète du coffre", { exact: true }).fill(phrase);
  await page.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await page.getByRole("button", { name: "Analyse", exact: true }).click();
  await page.getByRole("button", { name: "Travailler l’analyse", exact: true }).click();
  await expect(page.getByLabel("Analyse 1 · Faits recueillis", { exact: true })).toHaveValue("PRIVATE_FACTS_DPO");
  await page.locator(".review-notebook > .analysis-question").nth(1).locator("summary").first().click();
  await expect(page.getByLabel("Analyse 2 · Faits recueillis", { exact: true })).toHaveValue("PRIVATE_INTEREST_REVIEW_DPO : finalité recrutement, hypothèse à examiner");
  await page.getByRole("button", { name: "Les flux", exact: true }).click();
  await expect(page.getByLabel("Flux 1 · Origine", { exact: true })).toHaveValue('PRIVATE_FLOW_<img src=x onerror="alert(1)">');
  expect(requests).toEqual([]); expect(diagnostics.join("\n")).not.toContain("PRIVATE_");
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("");
});

test("atelier layout and long declared flow labels remain readable across viewport widths", async ({ page }, testInfo) => {
  await page.goto("/app/privacy/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `entry ${width}`).toBe(false);
    if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`atelier-accueil-${width}.png`), fullPage: true });
  }
  await create(page);
  await page.getByRole("button", { name: "Cartographie", exact: true }).click();
  await page.getByRole("button", { name: "Compléter la cartographie", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un flux", exact: true }).click();
  await page.getByLabel("Flux 1 · Origine", { exact: true }).fill("Origine fictive " + "X".repeat(200));
  await page.getByLabel("Flux 1 · Destination", { exact: true }).fill("Destination fictive avec un libellé métier long");
  await page.getByLabel("Flux 1 · Opération", { exact: true }).fill("Consultation et traitement déclarés pour cet exemple fictif");
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Cartographie", exact: true }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `flow ${width}`).toBe(false);
    if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`atelier-flux-${width}.png`), fullPage: true });
  }
  await page.goto("/app/privacy/guide/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `guide ${width}`).toBe(false);
    if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`atelier-guide-${width}.png`) });
  }
});
