import { expect, test } from "@playwright/test";

test("verifier refuses premature file selection while its component is loading", async ({ page }) => {
  let resume: () => void = () => {};
  const gate = new Promise<void>((resolve) => { resume = resolve; });
  await page.route("**/_astro/VerifyPanel.*.js", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/app/privacy/verify/", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Dossier ZIP à vérifier")).toBeDisabled();
    await expect(page.getByRole("status")).toHaveText("Chargement du vérificateur local…");
  } finally {
    resume();
  }
  await expect(page.getByLabel("Dossier ZIP à vérifier")).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByLabel("Dossier ZIP à vérifier").setInputFiles({
    name: "invalid.zip", mimeType: "application/zip", buffer: Buffer.from("synthetic invalid ZIP"),
  });
  await expect(page.getByRole("status")).toContainText("Dossier refusé");
});

test("guide is readable without JavaScript and every local link and chapter resolves", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/app/privacy/guide/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Menez l’entretien.");
    const chapters = page.getByRole("navigation", { name: "Sommaire du guide" }).getByRole("link");
    await expect(chapters).toHaveCount(14);
    await expect(page.locator(".business-chapter")).toHaveCount(6);
    await page.locator("#entretien-recruitment summary").first().click();
    await expect(page.locator("#entretien-recruitment .business-questions > li")).toHaveCount(6);
    await expect(page.locator("#entretien-recruitment")).toContainText("Fiche 13");
    for (const chapter of await page.locator(".business-chapter").all()) {
      if (!(await chapter.locator(".business-questions").isVisible())) await chapter.locator("summary").first().click();
      await expect(chapter.locator(".question-source")).toHaveCount(6);
      for (const href of await chapter.locator(".question-source").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))) {
        const source = new URL(href);
        expect(source.protocol).toBe("https:");
        expect(source.hostname).toBe("www.cnil.fr");
      }
    }
    const localLinks = await page.locator('a[href^="/"], a[href^="#"]').evaluateAll((elements) => elements.map((element) => (element as HTMLAnchorElement).getAttribute("href")!));
    for (const href of new Set(localLinks)) {
      if (href.startsWith("#")) {
        await expect(page.locator(`[id=${JSON.stringify(decodeURIComponent(href.slice(1)))}]`)).toHaveCount(1);
      } else {
        // Release metadata and preserved notices are added only by the isolated builder.
        // The CI artifact pass must check them, including release.json.
        const releaseOnly = ["/release.json", "/NOTICE.txt", "/THIRD_PARTY_NOTICES.txt", "/TRADEMARKS.txt"];
        if (process.env.PLAYWRIGHT_RGPD_RELEASE !== "1" && releaseOnly.includes(href)) continue;
        const response = await page.request.get(href);
        expect(response.status(), href).toBe(200);
      }
    }
    await expect(page.getByRole("article")).toContainText("La sauvegarde du serveur RGPDESK ne contient pas vos coffres.");
    await expect(page.getByRole("article")).toContainText("il ne remplace pas votre analyse");
    await expect(page.locator("figure.guide-visual")).toHaveCount(5);
    await expect(page.getByRole("article")).not.toContainText("qualification Firefox");
    await expect(page.locator("script, iframe, form")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("entry explains the product, keeps the guide separate from an open vault and fits small screens", async ({ page }) => {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Voyez vos données.");
  const guide = page.getByRole("navigation", { name: "Aide" }).getByRole("link", { name: "Guide d’utilisation" });
  await expect(guide).toHaveAttribute("target", "_blank");
  await expect(guide).toHaveAttribute("rel", /noopener/);
  await page.getByRole("link", { name: "Commencer mon registre" }).click();
  await expect(page.getByRole("heading", { name: "Créer le registre de mon organisation" })).toBeInViewport();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `entry width ${width}`).toBe(false);
  }
  await page.goto("/app/privacy/guide/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `guide width ${width}`).toBe(false);
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("navigation", { name: "Sommaire du guide" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "9. Sauvegarder et restaurer sans perdre son travail", exact: true })).toBeVisible();
});
