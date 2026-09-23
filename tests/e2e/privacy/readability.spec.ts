import { expect, test } from "@playwright/test";

for (const width of [1440, 320]) test(`privacy text stays readable and reflows at ${width}px`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width, height: 1000 });
  const routes = ["", "guide/", "faq/", "confidentialite/", "verify/", "demo/", "demo/registre/", "demo/sous-traitance/", "demo/aipd/",
    "#demo/bureau", "#demo/registre", "#demo/cartographie", "#demo/analyse", "#demo/aipd", "#demo/dossiers-dpo", "#demo/organisation", "#demo/intervenants", "#demo/systemes", "#demo/documents", "#demo/actions", "#demo/partager", "#demo/restitution-aipd", "#demo/sauvegarde", "#demo/importer-csv"];
  for (const route of routes) {
    await page.goto(`/app/privacy/${route}`);
    if (route.startsWith("#demo/")) await expect(page.getByRole("button", { name: "Quitter la démo", exact: true })).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("body *")].filter(el => {
      const style = getComputedStyle(el);
      return el.getClientRects().length && !el.closest('[aria-hidden="true"], .sr-only, script, style')
        && style.visibility !== "hidden" && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        && Number.parseFloat(style.fontSize) < 14;
    }).map(el => ({ tag: el.tagName, class: el.className, size: getComputedStyle(el).fontSize })));
    expect(small, route).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    for (const control of await page.locator('input:not([type="checkbox"]):visible, textarea:visible, select:visible').all()) {
      expect(await control.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize)), route).toBeGreaterThanOrEqual(16);
    }
  }
});
