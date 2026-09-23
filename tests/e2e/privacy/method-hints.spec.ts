import { test, expect } from "@playwright/test";

test("method prompts remain local reading aids without changing the draft or blocking navigation", async ({ page, context }) => {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Explorer la démo", exact: true }).click();
  await page.getByRole("button", { name: "Analyse", exact: true }).click();
  await page.getByRole("button", { name: "Travailler l’analyse", exact: true }).click();
  const notebook = page.locator(".review-notebook");
  const first = notebook.locator(".analysis-question").first();
  const inputs = () => notebook.locator("input,textarea,select").evaluateAll((elements) => elements.map((e) => (e as HTMLInputElement).value));
  const before = await inputs();
  const requests: string[] = [];
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  page.on("request", (request) => requests.push(request.url()));
  const hints = first.locator(".method-hints");
  await hints.locator("summary").press("Enter");
  await expect(hints).toHaveAttribute("open", "");
  await expect(hints).toContainText("attentes raisonnables");
  await expect(hints).toContainText("Estelle De Marco");
  await expect(hints.getByRole("link", { name: "CC BY 4.0", exact: true })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  expect(await inputs()).toEqual(before);
  await expect(hints.locator("input,textarea,select")).toHaveCount(0);
  await page.getByRole("button", { name: "Analyse", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Quitter cette saisie ?" })).toHaveCount(0);
  await page.getByRole("button", { name: /02 \/ Nécessité & proportionnalité/ }).click();
  const necessity = page.locator(".review-notebook").first().locator(".method-hints").first();
  await necessity.locator("summary").click();
  await expect(necessity).toContainText("urgence");
  await expect(necessity).toContainText("1.2 du 20 septembre 2026");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `method hints ${width}`).toBe(true);
  }
  expect(requests).toEqual([]);
});
