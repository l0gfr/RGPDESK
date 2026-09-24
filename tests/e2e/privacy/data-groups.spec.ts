import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import type {} from "../../fixtures/privacy/vault-harness";

test("facts precede grounds; a data group feeds the map and selected AIPD inventory", async ({ page }) => {
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/app/privacy/#demo/registre");
  await page.getByRole("button",{name:"Modifier Accès aux locaux par badge · projet fictif",exact:true}).click();
  const steps=page.getByRole("navigation",{name:"Étapes de la fiche",exact:true});
  await steps.getByRole("button").nth(1).click();
  await expect(page.getByLabel(/Fondement juridique documenté/)).toHaveCount(0);
  await expect(page.getByLabel("Sous-finalité 1",{exact:true})).toHaveValue("Vérifier l’habilitation à entrer dans une zone.");
  await steps.getByRole("button").nth(2).click();
  const first=page.locator(".data-group-card").first();await first.locator("summary").first().click();
  await page.getByLabel("D1 · Catégories de données",{exact:true}).fill("DONNEES_FICTIVES_CANARY");
  await expect(first.getByRole("group",{name:"D1 · Sous-finalités concernées",exact:true}).getByRole("checkbox").first()).toBeChecked();
  await first.locator(".analysis-question > summary").click();
  await expect(first.locator(".linked-fact")).toContainText("DONNEES_FICTIVES_CANARY");
  await first.locator(".group-examination > summary").filter({hasText:"Conservation et effacement"}).click();
  await page.getByLabel("D1 · Durée ou critère de conservation",{exact:true}).fill("Critère fictif à vérifier");
  await first.locator(".group-examination > summary").filter({hasText:"Minimisation et garanties"}).click();
  await page.getByLabel("D1 · Canaux : quels échanges peut-on éviter ?",{exact:true}).fill("Échange fictif supprimé");
  await steps.getByRole("button").nth(4).click();
  await expect(page.getByLabel("Fondement juridique documenté 1 (complément)",{exact:true})).toHaveValue("");
  await page.getByRole("button",{name:"Enregistrer la fiche",exact:true}).click();
  await page.getByRole("button",{name:"Restitution AIPD",exact:true}).click();
  await page.getByRole("combobox",{name:"Étude à restituer",exact:true}).selectOption({label:"Accès aux locaux par badge · projet fictif"});
  await page.getByLabel("Destinataire de l’AIPD",{exact:true}).fill("Direction fictive");
  await page.getByLabel("Périmètre de la restitution",{exact:true}).fill("Exercice fictif");
  await page.getByLabel("Groupes de données, flux et minimisation",{exact:true}).check();
  await page.getByRole("button",{name:"Prévisualiser la restitution AIPD"}).click();
  await expect(page.locator(".ar-inventory")).toContainText("DONNEES_FICTIVES_CANARY");
  await expect(page.locator(".ar-inventory")).toContainText("Échange fictif supprimé");
  await expect(page.locator(".ar-inventory")).not.toContainText("NOTE INTERNE");
  expect(errors).toEqual([]);
});

test("risk workshop is usable before AIPD and retains the same scenarios when one is begun", async ({ page }) => {
  await page.goto("/app/privacy/#demo/risques");
  await page.getByLabel("Traitement à étudier",{exact:true}).selectOption({label:"Recrutement · exemple fictif"});
  await page.getByRole("button",{name:"Examiner les risques et les mesures",exact:true}).click();
  await expect(page.getByRole("navigation",{name:"Parcours risques et mesures"}).getByRole("button")).toHaveCount(2);
  await expect(page.getByLabel("Position sur la réalisation de l’AIPD")).toHaveCount(0);
  await page.getByRole("button",{name:"Décrire un scénario de risque",exact:true}).click();
  await page.getByLabel("Scénario 1 · Nom",{exact:true}).fill("SCENARIO_FICTIF_AVANT_AIPD");
  await page.getByRole("button",{name:"Enregistrer l’étude",exact:true}).click();
  await page.getByRole("button",{name:"Restitution AIPD",exact:true}).click();
  await expect(page.getByLabel("Étude à restituer").locator("option").filter({hasText:"Recrutement · exemple fictif"})).toHaveCount(0);
  await page.getByRole("button",{name:"AIPD / PIA",exact:true}).click();
  await page.getByLabel("Traitement à étudier",{exact:true}).selectOption({label:"Recrutement · exemple fictif"});
  await page.getByRole("button",{name:"Ouvrir une étude d’impact",exact:true}).click();
  await page.getByRole("navigation",{name:"Parcours AIPD",exact:true}).getByRole("button").nth(3).click();
  await expect(page.getByLabel("Scénario 1 · Nom",{exact:true})).toHaveValue("SCENARIO_FICTIF_AVANT_AIPD");
  await page.getByRole("navigation",{name:"Parcours AIPD",exact:true}).getByRole("button").first().click();
  await expect(page.getByLabel("Position sur la réalisation de l’AIPD")).toHaveValue("unknown");
});

test("real IndexedDB opens v8 without writing, stores v9 groups and round-trips its encrypted backup",async({page})=>{
 test.setTimeout(60000);
 const harness=(await build({entryPoints:["tests/fixtures/privacy/vault-harness.ts"],bundle:true,platform:"browser",format:"iife",write:false})).outputFiles[0]!.text;
 await page.route("**/__groups.js",r=>r.fulfill({contentType:"application/javascript",body:harness}));
 await page.route("**/__groups",r=>r.fulfill({contentType:"text/html",body:'<!doctype html><html><head><script src="/__groups.js"></script></head><body>Fictitious storage harness</body></html>'}));
 await page.goto("/__groups");await page.waitForFunction(()=>!!window.privacyTest);
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,at=new Date().toISOString(),phrase="Fictional encrypted group phrase 2026!",vault=new a.PrivacyVault();
  const session={epoch:await vault.initialize(),signal:new AbortController().signal},w=a.createWorkspace(crypto.randomUUID(),"LEGACY_FICTITIOUS_CANARY",at);
  const legacy={...w,format:"rgpd-master-v8"};
  const [envelope]=await a.encryptLocalPayloadBatch([{aad:a.contextFor(w.id,1,"master"),value:legacy}],phrase);
  await vault.table("records").add({id:w.id,revision:1,format:"rgpd-envelope-v1",envelope});
  const before=JSON.stringify(await vault.table("records").toArray()),opened=await vault.unlock(w.id,phrase,session),unchanged=before===JSON.stringify(await vault.table("records").toArray());
  const activity=a.createActivity(w.id,crypto.randomUUID(),"controller"),g=a.createDataGroup(crypto.randomUUID(),1);g.data=a.knowledge("PRIVATE_GROUP_CANARY");activity.dataGroups=[g];
  const next=a.putActivity(opened,activity,1,at);await vault.save(next,phrase,1,session);
  const raw=JSON.stringify(await vault.table("records").toArray()),reopened=await vault.unlock(w.id,phrase,session),backup=await vault.backup(reopened,phrase,session),decoded=await a.decodeBackup(backup,phrase);
  vault.close();return{unchanged,format:opened.format,same:JSON.stringify(decoded)===JSON.stringify(next),raw,backup};
 });
 expect(result.unchanged).toBe(true);expect(result.format).toBe("rgpd-master-v9");expect(result.same).toBe(true);expect(result.raw+result.backup).not.toContain("CANARY");
});
