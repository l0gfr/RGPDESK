import { test, expect, type Page } from "@playwright/test";
const phrase = "Fictional inventory phrase 2026!";
async function addVault(page: Page, name: string) {
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByLabel("Nom de l’organisme", { exact: true }).fill(name);
  await page.getByLabel("Nouvelle phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Confirmer la phrase secrète", { exact: true }).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check();
  await page.getByRole("button", { name: "Créer le coffre chiffré", exact: true }).click();
  await expect(page.getByRole("button", { name: "Verrouiller le coffre", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Verrouiller le coffre", exact: true }).click();
}
test("two vaults created in another tab appear on return without creating a third", async ({ page, context }) => {
  await page.goto("/app/privacy/");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  const writer = await context.newPage(); await writer.goto("/app/privacy/");
  await addVault(writer, "Premier coffre fictif"); await addVault(writer, "Second coffre fictif");
  await page.bringToFront();
  await expect(page.getByRole("button", { name: /^Ouvrir le coffre [12]$/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Actualiser la liste des coffres", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Ouvrir le coffre [12]$/ })).toHaveCount(2);
  await page.reload();
  await expect(page.getByRole("button", { name: /^Ouvrir le coffre [12]$/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Ouvrir le coffre 1", exact: true }).click();
  await page.getByLabel("Phrase secrète du coffre", { exact: true }).fill(phrase);
  await page.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await expect(page.getByRole("button", { name: "Verrouiller le coffre", exact: true })).toBeVisible();
  await writer.close();
});
test("a blocked script never presents the server-rendered inventory as empty", async ({ page }) => {
  await page.route("**/*.js", (route) => route.abort());
  await page.goto("/app/privacy/");
  await expect(page.getByText("Recherche des coffres enregistrés…", { exact: true })).toBeVisible();
  await expect(page.getByText(/Aucun coffre (enregistré|trouvé)/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Créer le coffre chiffré", exact: true })).toBeDisabled();
});
test("unavailable IndexedDB is a read error, not an empty list", async ({ page }) => {
  await page.addInitScript(() => { IDBFactory.prototype.open = () => { throw new DOMException("Unavailable", "SecurityError"); }; });
  await page.goto("/app/privacy/");
  await expect(page.getByText("La liste des coffres n’a pas pu être lue.", { exact: false })).toBeVisible();
  await expect(page.getByText(/Aucun coffre (enregistré|trouvé)/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Créer le coffre chiffré", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Actualiser la liste des coffres", exact: true })).toBeEnabled();
});

test("refreshing the known inventory does not interrupt typing and a read failure still blocks writes", async ({ page }) => {
  await page.goto("/app/privacy/#registre");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  const name = page.getByLabel("Nom de l’organisme", { exact: true });
  await name.fill("Fictional uninterrupted input");
  const interrupted = await page.evaluate(async () => {
    const fieldset = document.querySelector<HTMLFieldSetElement>("#creer-registre fieldset")!;
    let disabled = false;
    const observer = new MutationObserver(records => {
      disabled ||= fieldset.disabled || records.some(record => record.oldValue !== null);
    });
    observer.observe(fieldset, { attributes: true, attributeFilter: ["disabled"], attributeOldValue: true });
    window.dispatchEvent(new Event("focus"));
    // Let the real IndexedDB read and DOM updates run; no crypto or storage replacement.
    await new Promise(resolve => setTimeout(resolve, 100));
    observer.disconnect();
    return disabled;
  });
  expect(interrupted).toBe(false);
  await expect(name).toHaveValue("Fictional uninterrupted input");
  await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (...args) {
      if (this.name === "metadata") throw new DOMException("Fictional read failure", "SecurityError");
      return original.apply(this, args);
    };
    window.dispatchEvent(new Event("focus"));
  });
  await expect(page.getByText("La liste des coffres n’a pas pu être lue.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer le coffre chiffré", exact: true })).toBeDisabled();
  await expect(page.getByText(/Aucun coffre (enregistré|trouvé)/)).toHaveCount(0);
});
