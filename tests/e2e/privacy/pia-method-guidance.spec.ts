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
  const angle = atelier.getByRole("radio", { name: /^Exercice révélé/ });
  await expect(angle).not.toBeChecked();
  await angle.check();
  await atelier.getByRole("button", { name: "Garder l’angle ouvert", exact: true }).click();
  await expect(angle).not.toBeChecked();
  await angle.check();
  await search.fill("");
  await atelier.getByLabel("Piste à examiner", { exact: true }).selectOption("correspondence");
  await expect(angle).not.toBeChecked();
  await atelier.locator(".consequence-reading > summary").click();
  await expect(atelier.getByRole("heading", { name: "Matérielles", exact: true })).toBeVisible();
  await expect(atelier.locator(".consequence-reading input,.consequence-reading textarea")).toHaveCount(0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `width ${width}`).toBe(true);
    await expect(atelier.getByRole("button", { name: "Décrire un scénario pour ce droit", exact: true })).toBeVisible();
    const cards = await atelier.locator(".rights-angle-grid label").evaluateAll(elements => elements.map(element => ({
      overflow: element.scrollWidth > element.clientWidth,
      radioWidth: element.querySelector("input")!.getBoundingClientRect().width,
    })));
    for (const card of cards) {
      expect(card.overflow, `card width ${width}`).toBe(false);
      expect(card.radioWidth, `radio width ${width}`).toBeLessThan(32);
      expect(card.radioWidth, `radio width ${width}`).toBeGreaterThan(8);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const scenarios = atelier.locator(".pia-risk");
  const previousCount = await scenarios.count();
  await angle.check();
  await expect(scenarios).toHaveCount(previousCount);
  await atelier.getByRole("button", { name: "Décrire un scénario pour ce droit", exact: true }).click();
  await expect(scenarios).toHaveCount(previousCount + 1);
  const added = scenarios.last();
  await expect(added.getByRole("textbox", { name: /Scénario .* · Nom/ })).toBeFocused();
  await expect(added.getByRole("textbox", { name: /Droits et libertés affectés/ })).toHaveValue(/Angle choisi, à examiner : Exercice révélé/);
  await expect(added.getByRole("textbox", { name: /Droits et libertés affectés/ })).toHaveValue(/#page=199/);
  for (const label of ["Événement redouté", "Conséquences concrètes pour les personnes", "Sources de risque et scénario"]) {
    await expect(added.getByRole("textbox", { name: new RegExp(label) })).toHaveValue("");
  }
  for (const label of ["Gravité initiale", "Vraisemblance initiale", "Gravité résiduelle", "Vraisemblance résiduelle", "Le risque résiduel est-il élevé"]) {
    await expect(added.getByRole("combobox", { name: new RegExp(label) })).toHaveValue("unknown");
  }
  expect(await page.evaluate(() => ({ ...localStorage, ...sessionStorage }))).toEqual({});
});
