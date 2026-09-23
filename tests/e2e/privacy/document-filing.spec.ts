import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
const abc="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const file=(body="abc")=>({name:"PRIVATE_ORIGINAL.txt",mimeType:"text/plain",buffer:Buffer.from(body)});
const phrase="Fictional documentation phrase 2026 correct";

test("local file comparison, explicit replacement, encrypted reopen and generic folder kit",async({page,context},info)=>{
  test.setTimeout(90_000);
  const logs:string[]=[], errors:string[]=[], requests:string[]=[];
  page.on("console",m=>logs.push(m.text()));page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/app/privacy/");await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
  await page.getByLabel("Nom de l’organisme",{exact:true}).fill("FILING_FICTIF");
  await page.getByLabel("Nouvelle phrase secrète",{exact:true}).fill(phrase);await page.getByLabel("Confirmer la phrase secrète",{exact:true}).fill(phrase);
  await page.getByLabel("Je comprends qu’une phrase perdue").check();await page.getByRole("button",{name:"Créer le coffre chiffré",exact:true}).click();
  await page.getByRole("button",{name:"Documents",exact:true}).click();
  await page.locator(".document-organization > summary").click();
  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Télécharger le classement vide",exact:true}).click();
  const zip=await JSZip.loadAsync(await readFile((await (await download).path())!));
  expect(Object.values(zip.files).filter(f=>!f.dir).map(f=>f.name)).toEqual(["Mission-client/LIRE-MOI.txt"]);
  expect(await zip.file("Mission-client/LIRE-MOI.txt")!.async("string")).not.toContain("FILING_FICTIF");
  await page.waitForLoadState("networkidle");page.on("request",r=>requests.push(r.url()));await context.setOffline(true);
  await page.getByRole("button",{name:"Ajouter une référence",exact:true}).click();
  await page.getByLabel("Titre interne",{exact:true}).fill("NOTICE_FICTIVE");await page.getByLabel("Périmètre de la référence",{exact:true}).fill("Exemple");
  await page.getByLabel("Version déclarée",{exact:true}).fill("v1");await page.getByLabel("Catégorie",{exact:true}).selectOption("other");
  await page.locator(".document-filing > summary").click();await page.getByRole("button",{name:"Attribuer un repère",exact:true}).click();
  await expect(page.locator(".reference-code")).toContainText("DOC-0001");
  await page.getByRole("button",{name:"Utiliser la suggestion comme localisation",exact:true}).click();
  await expect(page.getByLabel("Localisation / référence interne",{exact:true})).toHaveValue(/DOC-0001_NOTICE-FICTIVE_v1.ext/);
  await page.locator('.fingerprint input[type="file"]').setInputFiles(file());await expect(page.locator(".comparison")).toContainText(abc);
  await page.getByRole("button",{name:"Conserver cette empreinte",exact:true}).click();
  // A provisional result can be corrected before the first save, without inventing a new version.
  await page.locator('.fingerprint input[type="file"]').setInputFiles(file());await expect(page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true}).click();await page.getByRole("button",{name:"Enregistrer la référence",exact:true}).click();
  await page.getByRole("button",{name:"Examiner NOTICE_FICTIVE",exact:true}).click();await page.locator(".document-filing > summary").click();
  await page.locator('.fingerprint input[type="file"]').setInputFiles(file());await expect(page.locator(".comparison")).toContainText("correspond à l’empreinte");
  await page.locator('.fingerprint input[type="file"]').setInputFiles(file("modified"));await expect(page.locator(".comparison")).toContainText("différent");
  await expect(page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true})).toBeDisabled();await expect(page.locator(".baseline")).toContainText(abc);
  await page.getByLabel("Version déclarée",{exact:true}).fill("v2");await page.locator('.fingerprint input[type="file"]').setInputFiles(file("modified"));
  await expect(page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true})).toBeDisabled();await page.getByLabel("Je remplace l’empreinte de référence").check();
  await page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true}).click();
  await page.getByRole("button",{name:"Annuler la référence",exact:true}).click();
  await page.getByRole("button",{name:"Examiner NOTICE_FICTIVE",exact:true}).click();await page.locator(".document-filing > summary").click();
  await expect(page.locator(".baseline")).toContainText(abc);await expect(page.getByLabel("Version déclarée",{exact:true})).toHaveValue("v1");
  for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator(".baseline code").evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
  }
  await page.screenshot({path:info.outputPath("documents-320.png"),fullPage:true});
  await page.getByRole("button",{name:"Annuler la référence",exact:true}).click();
  expect(requests).toEqual([]);expect(errors).toEqual([]);expect(logs.join("\n")).not.toContain("PRIVATE_ORIGINAL");
  expect(page.url()).not.toMatch(/FILING|NOTICE|DOC-0001/);
  await context.setOffline(false);await page.reload();await page.getByRole("button",{name:"Ouvrir le coffre 1",exact:true}).click();
  await page.getByLabel("Phrase secrète du coffre",{exact:true}).fill(phrase);await page.getByRole("button",{name:"Déverrouiller",exact:true}).click();
  await page.getByRole("button",{name:"Documents",exact:true}).click();await page.getByRole("button",{name:"Examiner NOTICE_FICTIVE",exact:true}).click();
  await page.locator(".document-filing > summary").click();await expect(page.locator(".baseline")).toContainText(abc);await expect(page.locator(".reference-code")).toContainText("DOC-0001");
  await page.getByLabel("Version déclarée",{exact:true}).fill("v2");await page.locator('.fingerprint input[type="file"]').setInputFiles(file("modified"));await page.getByLabel("Je remplace l’empreinte de référence").check();
  await page.getByRole("button",{name:"Remplacer l’empreinte pour cette version",exact:true}).click();await page.getByRole("button",{name:"Enregistrer la référence",exact:true}).click();
  await page.getByRole("button",{name:"Examiner NOTICE_FICTIVE",exact:true}).click();await page.locator(".document-filing > summary").click();await expect(page.locator(".baseline")).toContainText("v2");await expect(page.locator(".baseline")).not.toContainText(abc);

});

test("leaving a reference during file reading cancels the result",async({page})=>{
  await page.addInitScript(()=>{
    const original=Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer=function(){
      if(this instanceof File && this.name==="PRIVATE_ORIGINAL.txt")return new Promise<ArrayBuffer>(resolve=>{Object.defineProperty(window,"releaseFilingRead",{configurable:true,value:()=>original.call(this).then(resolve)});});
      return original.call(this);
    };
  });
  await page.goto("/app/privacy/#demo/documents");await page.getByRole("button",{name:/Examiner Contrat du prestataire de badges/,exact:true}).click();
  await page.locator(".document-filing > summary").click();await page.locator('.fingerprint input[type="file"]').setInputFiles(file());
  await expect(page.getByText("Calcul local en cours…",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Annuler la référence",exact:true}).click();
  await page.evaluate(()=> (window as unknown as {releaseFilingRead:()=>Promise<void>}).releaseFilingRead());
  await page.getByRole("button",{name:/Examiner Contrat du prestataire de badges/,exact:true}).click();await page.locator(".document-filing > summary").click();
  await expect(page.locator(".baseline,.comparison")).toHaveCount(0);await expect(page.locator("body")).not.toContainText(abc);
});
