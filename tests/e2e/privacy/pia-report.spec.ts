import { expect, test } from "@playwright/test";

test("AIPD folio stays readable, navigable and complete without JavaScript, on screen and in print", async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/app/privacy/demo/aipd/");
    const report = page.locator(".pia-report");
    await expect(report.locator(".ar-chapter")).toHaveCount(8);
    await expect(report.locator(".ar-risk")).toHaveCount(3);
    await expect(report.locator(".ar-measures .ar-card")).toHaveCount(3);
    await expect(report.locator(".ar-alternatives .ar-card")).toHaveCount(2);
    await expect(report.locator(".ar-toc a")).toHaveCount(8);
    await report
      .getByRole("navigation", { name: "Sommaire de l’AIPD" })
      .getByRole("link", { name: /Scénarios et niveaux déclarés/ })
      .click();
    await expect(page).toHaveURL(/#pia-section-4$/);
    await report
      .locator(".ar-risk")
      .first()
      .getByRole("link", { name: "Mesure 1", exact: true })
      .click();
    await expect(page).toHaveURL(/#pia-measure-0$/);
    await report
      .locator("#pia-measure-0")
      .getByRole("link", { name: "Risque 1", exact: true })
      .click();
    await expect(page).toHaveURL(/#pia-risk-0$/);
    const count = await report.locator("[data-pia-row]").count();
    expect(count).toBeGreaterThan(100);
    expect(
      await report
        .locator("[data-pia-row]")
        .evaluateAll(
          (nodes) =>
            new Set(nodes.map((n) => n.getAttribute("data-pia-row"))).size,
        ),
    ).toBe(count);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `AIPD ${width}`,
      ).toBe(true);
      const tooSmall = await report
        .locator("p,dt,dd,h1,h2,h3,h4,strong,a")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => {
              const s = getComputedStyle(n);
              return (
                n.getBoundingClientRect().width > 1 &&
                parseFloat(s.fontSize) < 14
              );
            })
            .map((n) => n.tagName),
        );
      expect(tooSmall).toEqual([]);
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page
      .locator(".ar-intro")
      .screenshot({ path: info.outputPath("aipd-overview.png") });
    await report
      .locator(".ar-risk")
      .first()
      .screenshot({ path: info.outputPath("aipd-scenario.png") });
    await page.emulateMedia({ media: "print" });
    await expect(report.locator(".ar-toc")).toBeHidden();
    const hiddenValues = await report
      .locator("[data-pia-row]")
      .evaluateAll(
        (nodes) =>
          nodes.filter((n) => !n.getBoundingClientRect().height).length,
      );
    expect(hiddenValues).toBe(0);
    await page.pdf({
      path: info.outputPath("aipd-print.pdf"),
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
  } finally {
    await context.close();
  }
});
