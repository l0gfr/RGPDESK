import { test, expect } from "@playwright/test";

test("one fact update explains its effect in AIPD and DPO reviews; references remain local and historical", async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const logs: string[] = [], errors: string[] = [], requests: string[] = [];
  page.on("console", (m) => logs.push(m.text())); page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app/privacy/"); await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await page.waitForLoadState("networkidle");
  page.on("request", (r) => requests.push(r.url())); await context.setOffline(true);
  const marker = "RECETTE_LOCALE <b>Équipe de permanence fictive</b>";
  await page.getByRole("button", { name: "Registre", exact: true }).click();
  await page.getByRole("button", { name: "Modifier Accès aux locaux par badge · projet fictif", exact: true }).click();
  await page.getByRole("button", { name: "Les flux", exact: true }).click();
  await page.getByLabel("Flux 1 · Destination", { exact: true }).fill(marker);
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "AIPD / PIA", exact: true }).click();
  await page.getByRole("button", { name: "Lire le dossier", exact: true }).click();
  const trace = page.locator(".review-trace");
  await expect(trace).toContainText("Opérations et circulation");
  await expect(trace.locator(".review-trace-change")).toHaveCount(1);
  await trace.locator(".review-trace-change summary").click();
  await expect(trace.locator("dd").first()).toHaveText("Gestion des badges");
  await expect(trace.locator("dd").last()).toHaveText(marker);
  await expect(trace.locator("dd b")).toHaveCount(0);
  await page.locator(".review-evidence > summary").click();
  await page.getByRole("button", { name: "Examiner Contrat du prestataire de badges · fictif", exact: true }).click();
  const referenceHeading = page.getByRole("heading", { name: "Référence documentaire", exact: true });
  await expect(referenceHeading).toBeFocused();
  await expect(referenceHeading).toBeInViewport({ ratio: 1 });
  await expect(page.getByLabel("Titre interne", { exact: true })).toHaveValue("Contrat du prestataire de badges · fictif");
  await page.getByLabel("Version déclarée", { exact: true }).fill("Exercice v2");
  await page.getByLabel("Localisation / référence interne", { exact: true }).fill("RECETTE_LOCALE / armoire fictive B");
  await page.getByRole("button", { name: "Enregistrer la référence", exact: true }).click();
  await expect(page.getByLabel("Titre interne", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "AIPD / PIA", exact: true }).click();
  await page.getByRole("button", { name: "Lire le dossier", exact: true }).click();
  await expect(trace.locator(".review-trace-change")).toHaveCount(3);
  const version = trace.locator(".review-trace-change").filter({ has: page.getByText("Version", { exact: true }) });
  await version.locator("summary").click(); await expect(version.locator("dd").first()).toHaveText("Exercice v1"); await expect(version.locator("dd").last()).toHaveText("Exercice v2");
  await page.getByLabel("Version du dossier", { exact: true }).selectOption("0");
  const history = page.locator(".review-evidence").filter({ hasText: "Références conservées avec cette position" });
  await history.locator("summary").click(); await expect(history).toContainText("Version Exercice v1"); await expect(history).not.toContainText("Exercice v2");
  await expect(history.locator("a,button")).toHaveCount(0);
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `review ${width}`).toBe(true);
  }
  await page.screenshot({path:info.outputPath("review-trace-320.png"),fullPage:true});
  await page.getByRole("button", { name: "Fermer l’étude", exact: true }).click();
  await page.getByRole("button", { name: "Dossiers DPO", exact: true }).click();
  await page.getByRole("button", { name: "Ouvrir Badges : examiner l’intérêt poursuivi · fictif", exact: true }).click();
  await expect(trace.locator(".review-trace-change")).toHaveCount(3);
  await page.getByRole("button", { name: "02 Analyse", exact: true }).click();
  await page.getByLabel("Intérêt légitime 1 · Appréciation motivée", {exact:true}).fill("RECETTE_LOCALE / argument à enregistrer");
  await page.locator(".review-evidence > summary").click();
  await expect(page.getByRole("button", { name: "Examiner Contrat du prestataire de badges · fictif", exact: true })).toBeDisabled();
  await expect(trace).toContainText("saisies non enregistrées");
  await page.getByRole("button", { name: "Quitter la démo", exact: true }).click();
  await expect(page.locator(".review-trace,.review-evidence")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("RECETTE_LOCALE");
  expect(requests).toEqual([]); expect(errors).toEqual([]); expect(logs.join("\n")).not.toContain("RECETTE_LOCALE");
  expect(new URL(page.url()).search + new URL(page.url()).hash).toBe("");
});

test("public browser entry retains CSP denial of business requests and form submission", async ({ page }) => {
  await page.goto("/app/privacy/");
  const policy=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(policy).toContain("connect-src 'none'"); expect(policy).toContain("form-action 'none'");
  expect(policy).toContain("object-src 'none'"); expect(policy).not.toContain("'unsafe-inline'"); expect(policy).not.toContain("'unsafe-eval'");
});


test("reference links are selected from the activity, cancel is lossless and a new reference knows its activity", async ({ page }) => {
  await page.goto("/app/privacy/");
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await page.getByRole("button", { name: "Registre", exact: true }).click();
  const edit = () => page.getByRole("button", { name: "Modifier Recrutement · exemple fictif", exact: true }).click();
  await edit(); await page.getByRole("button", { name: "Les justificatifs", exact: true }).click();
  const ref = page.getByRole("checkbox", { name: /Contrat du prestataire de badges · fictif/ });
  await expect(ref).not.toBeChecked(); await ref.check();
  await page.getByRole("button", { name: "Annuler l’édition", exact: true }).click();
  await edit(); await page.getByRole("button", { name: "Les justificatifs", exact: true }).click();
  await expect(ref).not.toBeChecked(); await ref.check();
  await page.getByRole("button", { name: "Enregistrer la fiche", exact: true }).click();
  await page.getByRole("button", { name: "Référencer un document pour cette activité", exact: true }).click();
  await expect(page.getByLabel("Titre interne", { exact: true })).toHaveValue("");
  await expect(page.getByRole("group", { name: "Activités couvertes", exact: true }).getByRole("checkbox", { name: "Recrutement · exemple fictif", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Annuler la référence", exact: true }).click();
  await page.getByRole("button", { name: "Examiner Contrat du prestataire de badges · fictif", exact: true }).click();
  const activities = page.getByRole("group", { name: "Activités couvertes", exact: true });
  await expect(activities.getByRole("checkbox", { name: "Recrutement · exemple fictif", exact: true })).toBeChecked();
  await expect(activities.getByRole("checkbox", { name: "Accès aux locaux par badge · projet fictif", exact: true })).toBeChecked();
  await expect(page.getByLabel("Version déclarée", { exact: true })).toHaveValue("Exercice v1");
  await expect(page.getByRole("button", { name: "Examiner Contrat du prestataire de badges · fictif", exact: true })).toHaveCount(1);
});
