import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
const surface=(page:Page)=>page.getByRole('dialog',{name:'Votre rapport en PDF',exact:true});
async function stubPrint(page:Page){await page.addInitScript(()=>{window.print=()=>{document.documentElement.dataset.printCalls=String(Number(document.documentElement.dataset.printCalls||0)+1);};});}
async function register(page:Page){
 await page.goto('/app/privacy/#demo/partager');
 await button(page,'Charger la sélection d’exemple').click();
 await button(page,'Prévisualiser le dossier').click();
 await expect(button(page,'Conserver et exporter en PDF')).toBeDisabled();
 await page.getByLabel('J’ai relu ce contenu en clair').check();
}
async function pia(page:Page){
 await page.goto('/app/privacy/#demo/restitution-aipd');
 await button(page,'Restitution AIPD').click();
 await page.getByRole('combobox',{name:'Étude à restituer',exact:true}).selectOption({index:1});
 await page.getByRole('combobox',{name:'Version de l’étude',exact:true}).selectOption({index:1});
 await page.getByLabel('Destinataire de l’AIPD',{exact:true}).fill('Comité PDF fictif');
 await page.getByLabel('Périmètre de la restitution',{exact:true}).fill('Périmètre PDF fictif');
 for(const choice of await page.locator('.choices input').all())await choice.check();
 await button(page,'Prévisualiser la restitution AIPD').click();
 await expect(button(page,'Conserver et exporter en PDF')).toBeDisabled();
 await page.getByLabel('J’ai relu les valeurs').check();
}

test('register PDF uses the reviewed snapshot offline, prints only that report and restores navigation',async({page,context},info)=>{
 await page.addInitScript(()=>document.addEventListener("securitypolicyviolation",()=>{document.documentElement.dataset.pdfCspViolation="yes";}));
 await stubPrint(page);await register(page);await page.waitForLoadState('networkidle');await context.setOffline(true);
 const preview=await page.getByLabel('Aperçu du rapport à remettre',{exact:true}).locator('body').evaluate(n=>n.outerHTML);
 const title=await page.title();const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
 await page.evaluate(()=>{const el=document.createElement('p');el.id='private-canary';el.textContent='PRIVATE_OUTSIDE_REPORT_CANARY';document.querySelector('main')!.append(el);});
 await button(page,'Conserver et exporter en PDF').click();
 await expect(button(page,'Enregistrer au format PDF')).toBeEnabled();
 expect(await surface(page).locator('body').evaluate(n=>n.outerHTML)).toBe(preview);
 await expect(surface(page).locator('article.activity')).toHaveCount(3);
 await expect(surface(page)).not.toContainText('PRIVATE_OUTSIDE_REPORT_CANARY');
 await expect(button(page,'Revenir au dossier')).toBeFocused();
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:1000});
  expect(await surface(page).evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:1100});
 await surface(page).screenshot({path:info.outputPath('pdf-register-view.png')});
 await button(page,'Enregistrer au format PDF').click();await expect(page.locator('html')).toHaveAttribute('data-print-calls','1');
 await page.emulateMedia({media:'print'});
 await expect(page.locator('#private-canary')).toBeHidden();await expect(surface(page).locator('.pdf-toolbar')).toBeHidden();
 await writeFile(info.outputPath('expected-register.json'),JSON.stringify(await surface(page).locator('body').innerText()));
 await page.pdf({path:info.outputPath('register-export.pdf'),format:'A4',printBackground:true,margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}});
 await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');
 await expect(surface(page)).toHaveCount(0);expect(await page.title()).toBe(title);
 await expect(page.locator('body')).not.toHaveAttribute('data-rgpdesk-pdf-open','');
 expect(await page.locator('body > [inert]').count()).toBe(0);
 await expect(button(page,'Exporter en PDF')).toHaveCount(1);
 await button(page,'Registre').click();await button(page,'Modifier Recrutement · exemple fictif').click();
 await page.getByLabel('Nom de l’activité',{exact:true}).fill('EDIT_AFTER_PDF_SNAPSHOT');
 await button(page,'Enregistrer la fiche').click();await button(page,'Partager un dossier').click();
 await button(page,'Exporter en PDF').click();await expect(surface(page)).toContainText('Recrutement · exemple fictif');
 await expect(surface(page)).not.toContainText('EDIT_AFTER_PDF_SNAPSHOT');
 await button(page,'Revenir au dossier').click();await expect(button(page,'Exporter en PDF')).toHaveCount(1);
 // Local stylesheet URLs can be requested from the preloaded cache while offline.
 expect(requests.every(url=>new URL(url).pathname.endsWith('.css'))).toBe(true);
 expect(await page.evaluate(()=>({...localStorage,...sessionStorage}))).toEqual({});
 await expect(page.locator('html')).not.toHaveAttribute('data-pdf-csp-violation','yes');
});

test('AIPD PDF retains every selected row, print layout and immutable publication, then clears on automatic lock',async({page,context},info)=>{
 await stubPrint(page);await page.clock.install();await pia(page);await page.waitForLoadState('networkidle');await context.setOffline(true);
 const rows=await page.getByLabel('Aperçu du rapport AIPD à remettre',{exact:true}).locator('[data-pia-row]').allTextContents();
 await button(page,'Conserver et exporter en PDF').click();await expect(button(page,'Enregistrer au format PDF')).toBeEnabled();
 expect(await surface(page).locator('[data-pia-row]').allTextContents()).toEqual(rows);
 await expect(surface(page).locator('.ar-chapter')).toHaveCount(9);
 await expect(surface(page)).not.toContainText('NOTE INTERNE');
 const links=surface(page).locator('a');await links.last().focus();await page.keyboard.press('Tab');await expect(button(page,'Enregistrer au format PDF')).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(links.last()).toBeFocused();
 await button(page,'Enregistrer au format PDF').click();await expect(page.locator('html')).toHaveAttribute('data-print-calls','1');
 await page.emulateMedia({media:'print'});await expect(surface(page).locator('.ar-toc')).toBeHidden();
 expect(await surface(page).locator('[data-pia-row]').evaluateAll(nodes=>nodes.filter(n=>!n.getBoundingClientRect().height).length)).toBe(0);
 await writeFile(info.outputPath('expected-pia.json'),JSON.stringify(rows));
 await page.pdf({path:info.outputPath('pia-export.pdf'),format:'A4',printBackground:true,margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}});
 await page.emulateMedia({media:'screen'});await button(page,'Revenir au dossier').click();
 await expect(button(page,'Exporter en PDF')).toHaveCount(1);await button(page,'Exporter en PDF').click();
 expect(await surface(page).locator('[data-pia-row]').allTextContents()).toEqual(rows);
 await page.clock.runFor(15*60_000+100);
 await expect(surface(page)).toHaveCount(0);await expect(page.locator('body > [inert]')).toHaveCount(0);
 await expect(button(page,'Explorer la démo')).toBeEnabled();await expect(page.locator('body')).not.toContainText('Comité PDF fictif');
});

test('PDF remains blocked if its local stylesheet cannot load',async({page})=>{
 await stubPrint(page);await page.route('**/*.css',route=>route.abort());await register(page);
 await button(page,'Conserver et exporter en PDF').click();
 await expect(surface(page).getByRole('status')).toContainText('Mise en page indisponible');
 await expect(button(page,'Enregistrer au format PDF')).toBeDisabled();
 await button(page,'Revenir au dossier').click();await expect(surface(page)).toHaveCount(0);
 await expect(page.locator('html')).not.toHaveAttribute('data-print-calls','1');
});

test('all final demo reports offer a local PDF action outside the printed document',async({page})=>{
 await stubPrint(page);
 for(const slug of ['registre','sous-traitance','aipd']){
  await page.goto(`/app/privacy/demo/${slug}/`);
  await expect(page.locator('script:not([src])')).toHaveCount(0);
  const source=await page.locator('script').getAttribute('src');
  expect(new URL(source!,page.url()).origin).toBe(new URL(page.url()).origin);
  await expect(button(page,'Exporter en PDF')).toBeVisible();await button(page,'Exporter en PDF').click();
  await expect(page.locator('html')).toHaveAttribute('data-print-calls','1');
  await page.emulateMedia({media:'print'});await expect(page.locator('.sample-report-navigation')).toBeHidden();await page.emulateMedia({media:'screen'});
 }
});

test('a private vault PDF preserves the encrypted history and refuses printing after a concurrent revision',async({page,context})=>{
 test.setTimeout(60_000);await stubPrint(page);await page.goto('/app/privacy/');await expect(page.locator('[data-rgpdesk-ready="true"]')).toBeVisible();
 const phrase='Fictional PDF security phrase 2026 correct';
 await page.getByLabel('Nom de l’organisme',{exact:true}).fill('PDF private fixture');
 await page.getByLabel('Nouvelle phrase secrète',{exact:true}).fill(phrase);await page.getByLabel('Confirmer la phrase secrète',{exact:true}).fill(phrase);
 await page.getByLabel('Je comprends qu’une phrase perdue').check();await button(page,'Créer le coffre chiffré').click();
 await button(page,'Registre').click();await button(page,'Ajouter une activité responsable').click();
 await page.getByLabel('Nom de l’activité',{exact:true}).fill('PDF_PUBLIC_ACTIVITY');
 await button(page,'Voir toute la fiche').click();await page.getByLabel('Notes internes',{exact:true}).fill('PRIVATE_PDF_NOTES');
 await button(page,'Enregistrer la fiche').click();await button(page,'Partager un dossier').click();
 await page.getByLabel('Destinataire déclaré',{exact:true}).fill('Destinataire fictif');await page.getByLabel('Périmètre public de cette livraison',{exact:true}).fill('Périmètre fictif');
 await page.getByLabel('PDF_PUBLIC_ACTIVITY · Responsable',{exact:true}).check();await button(page,'Prévisualiser le dossier').click();await page.getByLabel('J’ai relu ce contenu en clair').check();
 await button(page,'Conserver et exporter en PDF').click();await expect(button(page,'Enregistrer au format PDF')).toBeEnabled();
 await expect(surface(page)).toContainText('PDF_PUBLIC_ACTIVITY');await expect(surface(page)).not.toContainText('PRIVATE_PDF_NOTES');
 const records=await page.evaluate(()=>new Promise<string>((resolve,reject)=>{const r=indexedDB.open('rgpdesk-vault-v1');r.onerror=()=>reject(new Error('Fixture storage unavailable'));r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readonly'),rows=tx.objectStore('records').getAll();tx.oncomplete=()=>{resolve(JSON.stringify(rows.result));db.close();};};}));
 expect(records).not.toContain('PDF_PUBLIC_ACTIVITY');expect(records).not.toContain('PRIVATE_PDF_NOTES');
 const other=await context.newPage();await other.goto('/app/privacy/');await button(other,'Ouvrir le coffre 1').click();await other.getByLabel('Phrase secrète du coffre',{exact:true}).fill(phrase);await button(other,'Déverrouiller').click();
 await button(other,'Organisation').click();await other.getByLabel('Nom de l’organisme',{exact:true}).fill('Concurrent revision fixture');await button(other,'Enregistrer l’organisation').click();await expect(other.getByRole('status')).toHaveText('Enregistré dans le coffre chiffré.');
 await button(page,'Enregistrer au format PDF').click();await expect(surface(page).getByRole('status')).toContainText('Le coffre a changé');await expect(page.locator('html')).not.toHaveAttribute('data-print-calls','1');
 await button(page,'Revenir au dossier').click();await button(page,'Verrouiller le coffre').click();await expect(surface(page)).toHaveCount(0);
 await button(page,'Ouvrir le coffre 1').click();await page.getByLabel('Phrase secrète du coffre',{exact:true}).fill(phrase);await button(page,'Déverrouiller').click();await button(page,'Partager un dossier').click();
 await button(page,'Exporter en PDF').click();await expect(surface(page)).toContainText('PDF private fixture');await expect(surface(page)).not.toContainText('Concurrent revision fixture');
 await button(page,'Enregistrer au format PDF').click();await expect(page.locator('html')).toHaveAttribute('data-print-calls','1');
});

test('export access stays visible while reading long reports on desktop and mobile',async({page},info)=>{
 for(const kind of ['register','pia']){
  if(kind==='register')await register(page);else await pia(page);
  const preview=page.getByRole('region',{name:kind==='register'?'Aperçu du rapport à remettre':'Aperçu du rapport AIPD à remettre',exact:true});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});
   await preview.locator(kind==='register'?'.activity':'.ar-chapter').nth(1).scrollIntoViewIfNeeded();
   await expect(button(page,'Accéder à l’export')).toBeInViewport({ratio:1});
   if(width===390)await page.screenshot({path:info.outputPath(`export-access-${kind}-390.png`)});
   await button(page,'Accéder à l’export').click();
   await expect(page.getByRole('region',{name:'Confirmation de l’export',exact:true})).toBeFocused();
   await expect(button(page,'Conserver et exporter en PDF')).toBeInViewport({ratio:1});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
});
