import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

test("a shared demo anchor opens its section, back and forward work, and a pending edit survives a cancelled history move", async ({ page }) => {
  await page.goto("/app/privacy/#demo/registre");
  await expect(page.getByRole("heading", {name:"Votre registre RGPD.",exact:true})).toBeVisible();
  await page.getByRole("button", {name:"Analyse",exact:true}).click();
  await expect(page).toHaveURL(/#demo\/analyse$/);
  await page.goBack();
  await expect(page.getByRole("heading", {name:"Votre registre RGPD.",exact:true})).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", {name:"Votre analyse, point par point.",exact:true})).toBeVisible();
  await page.getByRole("button", {name:"Registre",exact:true}).click();
  await page.getByRole("button", {name:"Modifier Recrutement · exemple fictif",exact:true}).click();
  await page.getByLabel("Nom de l’activité",{exact:true}).fill("FICTIONAL UNSAVED LINK");
  await page.goBack();
  await expect(page.getByRole("dialog", {name:"Avant de changer de rubrique",exact:true})).toBeVisible();
  await expect(page).toHaveURL(/#demo\/registre$/);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Nom de l’activité",{exact:true})).toHaveValue("FICTIONAL UNSAVED LINK");
  await page.getByRole("button", {name:"Analyse",exact:true}).click();
  await page.getByRole("button", {name:"Quitter sans enregistrer",exact:true}).click();
  await expect(page).toHaveURL(/#demo\/analyse$/);
  expect(page.url()).not.toContain("FICTIONAL");
  expect(await page.evaluate(()=>({...localStorage,...sessionStorage}))).toEqual({});
});

test("a private section link requires an explicit vault and does not create or select one", async ({ page }) => {
  await page.goto("/app/privacy/#registre");
  await expect(page.getByText("Ce lien mène à « Registre ».", {exact:false})).toBeVisible();
  await expect(page.getByRole("button",{name:"Créer le coffre chiffré",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Verrouiller le coffre",exact:true})).toHaveCount(0);
  await page.getByLabel("Nom de l’organisme", {exact:true}).fill("FICTIONAL ANCHOR VAULT");
  await page.getByLabel("Nouvelle phrase secrète", {exact:true}).fill("Fictional anchor phrase 2026!");
  await page.getByLabel("Confirmer la phrase secrète", {exact:true}).fill("Fictional anchor phrase 2026!");
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await page.getByRole("button",{name:"Créer le coffre chiffré",exact:true}).click();
  try {
    await expect(page.getByRole("heading", {name:"Votre registre RGPD.",exact:true})).toBeVisible();
  } catch (cause) {
    // Structural diagnostics only: never log field values, vault contents or identifiers.
    const state = await page.evaluate(() => ({
      hash: location.hash,
      heading: document.querySelector("h1")?.textContent,
      ready: document.querySelector("[data-rgpdesk-ready]")?.getAttribute("data-rgpdesk-ready"),
      error: !!document.querySelector('[role="alert"]'),
      creating: [...document.querySelectorAll("button")].some(button => button.textContent?.includes("Opération en cours")),
      inputs: [...document.querySelectorAll<HTMLInputElement>("#creer-registre input")].map(input => ({ type: input.type, valid: input.validity.valid, missing: input.validity.valueMissing, checked: input.type === "checkbox" ? input.checked : undefined })),
    }));
    throw new Error(`Private section navigation state: ${JSON.stringify(state)}`, { cause });
  }
  await expect(page).toHaveURL(/#registre$/);
  expect(new URL(page.url()).search).toBe("");
});

test("the final demonstration dossier is immediately readable without JavaScript and uses the real passive reports", async ({ browser, baseURL }) => {
  const context=await browser.newContext({javaScriptEnabled:false,baseURL});
  const page=await context.newPage();
  try {
    const requests: string[]=[]; page.on("request", r=>requests.push(r.url()));
    await page.goto("/app/privacy/demo/");
    await expect(page.getByRole("heading", {name:"Parcourez le dossier.",exact:true})).toBeVisible();
    await page.getByRole("link", {name:"Lire le registre final",exact:true}).click();
    await expect(page.getByRole("region",{name:"Synthèse direction",exact:true})).toBeVisible();
    await expect(page.getByRole("region",{name:"Cartographie sélectionnée",exact:true})).toBeVisible();
    await expect(page.locator("article.activity")).toHaveCount(3);
    const routes=["registre","sous-traitance","aipd"];
    for (const slug of routes) {
      await page.goto(`/app/privacy/demo/${slug}/`);
      await expect(page.locator("body")).not.toContainText("NOTE INTERNE");
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(232, 238, 242)");
      await expect(page.locator("iframe,form,input,textarea")).toHaveCount(0);
      await expect(page.locator("[data-report-pdf]")).toBeHidden();
      const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
      expect(csp).toContain("connect-src 'none'"); expect(csp).not.toContain("unsafe-");
      for(const style of await page.locator("style").allTextContents())expect(csp).toContain(`sha256-${createHash("sha256").update(style).digest("base64")}`);
      for(const script of await page.locator("script:not([src])").allTextContents())expect(csp).toContain(`sha256-${createHash("sha256").update(script).digest("base64")}`);
      for(const width of [1440,768,390,320]){
        await page.setViewportSize({width,height:1000});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${slug} ${width}`).toBe(true);
      }
    }
    await expect(page.getByRole("heading",{level:2})).toHaveCount(9);
    await expect(page.locator("body")).toContainText("Aucune mise en œuvre autorisée");
    expect(requests.every(url=>new URL(url).origin===new URL(baseURL!).origin)).toBe(true);
    await expect(page.getByRole("link",{name:"← Le dossier complet",exact:true})).toHaveAttribute("href","/app/privacy/demo/");
  } finally {await context.close();}
});
