import {test,expect} from "@playwright/test";
import {build} from "esbuild";
import type {} from "../../fixtures/privacy/vault-harness";
test("describe ordered paths without leaving D1 and reuse supports in D2",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto('/app/privacy/#demo/registre');await page.getByRole('button',{name:'Modifier Accès aux locaux par badge · projet fictif',exact:true}).click();
 await page.getByRole('navigation',{name:'Étapes de la fiche'}).getByRole('button').nth(2).click();
 const d1=page.locator('.data-group-card').nth(0),d2=page.locator('.data-group-card').nth(1);await d1.locator('summary').first().click();
 await d1.getByRole('button',{name:'Ajouter un parcours',exact:true}).click();
 const first=d1.locator('.journey-editor');await first.getByRole('group',{name:'Parcours 1a · Sous-finalités',exact:true}).getByRole('checkbox').nth(1).check();
 await first.locator('.journey-supports > summary').click();
 for(const name of ['Messagerie fictive','Liste fictive','Synthèse fictive']){await first.getByLabel('Nouveau support · parcours 1a',{exact:true}).fill(name);await first.getByRole('button',{name:'Créer le support',exact:true}).click();}
 for(let i=1;i<=3;i++){
  if(i>1)await first.getByRole('button',{name:'Ajouter une étape au parcours 1a',exact:true}).click();
  await first.getByLabel(`Parcours 1a · Étape ${i} · Opération`,{exact:true}).fill(['Recueillir la demande fictive','Vérifier la présence dans la liste fictive','Inscrire la demande fictive'][i-1]!);
  await first.getByRole('group',{name:`Parcours 1a · Étape ${i} · Supports utilisés`,exact:true}).getByRole('checkbox').nth(Math.min(i-1,1)).check();
  await first.getByLabel(`Parcours 1a · Étape ${i} · Qui intervient et pour quoi`,{exact:true}).fill('Équipe fictive habilitée');
 }
 await first.locator('.journey-step').nth(2).locator('.journey-context > summary').click();
 await first.getByRole('combobox',{name:'Parcours 1a · Étape 3 · Choisir l’origine',exact:true}).selectOption({label:'Support 1 · Messagerie fictive'});
 await first.getByRole('combobox',{name:'Parcours 1a · Étape 3 · Choisir la destination',exact:true}).selectOption({label:'Support 2 · Liste fictive'});
 await expect(first.getByRole('group',{name:'Parcours 1a · Étape 3 · Supports utilisés',exact:true}).getByRole('checkbox').nth(0)).toBeChecked();
 await expect(first.getByRole('group',{name:'Parcours 1a · Étape 3 · Supports utilisés',exact:true}).getByRole('checkbox').nth(0)).toBeDisabled();
 await first.getByLabel('Parcours 1a · Étape 3 · Quand ou sous quelle condition',{exact:true}).fill('Seulement si la demande fictive est absente');
 await first.getByLabel('Support 2 · Nom',{exact:true}).fill('Liste fictive renommée');
 await first.locator('.journey-preview > summary').click();
 const map=first.getByRole('region',{name:'Parcours 1a',exact:true});await expect(map).toContainText('Liste fictive renommée');await expect(map).toContainText('Seulement si');await expect(map).not.toContainText('SF1');await expect(map.locator('ol > li')).toHaveCount(3);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.setViewportSize({width:1280,height:800});
 await d1.getByRole('button',{name:'Ajouter un parcours',exact:true}).click();await expect(d1.getByRole('group',{name:'Parcours 1b · Sous-finalités',exact:true}).getByRole('checkbox').nth(0)).not.toBeChecked();
 await d2.locator('summary').first().click();
 for(const ref of ['2a','2b','2c']){await d2.getByRole('button',{name:'Ajouter un parcours',exact:true}).click();await expect(d2.getByRole('group',{name:`Parcours ${ref} · Étape 1 · Supports utilisés`,exact:true})).toContainText('Liste fictive renommée');await d2.getByLabel(`Parcours ${ref} · Étape 1 · Opération`,{exact:true}).fill(`Consultation fictive ${ref}`);}
 await page.getByRole('button',{name:'Enregistrer la fiche',exact:true}).click();
 await page.getByRole('button',{name:'Modifier Accès aux locaux par badge · projet fictif',exact:true}).click();await page.getByRole('button',{name:'Les flux',exact:true}).click();
 await expect(page.locator('.flow-map .journey-map')).toHaveCount(5);await expect(page.locator('.flow-map')).toContainText('Seulement si');await expect(page.locator('.flow-map')).toContainText('Liste fictive renommée');expect(errors).toEqual([]);
});
test("v9 storage stays untouched on unlock and v10 journeys survive encrypted backup and draft",async({page})=>{
 test.setTimeout(60000);
 const harness=(await build({entryPoints:['tests/fixtures/privacy/vault-harness.ts'],bundle:true,platform:'browser',format:'iife',write:false})).outputFiles[0]!.text;
 await page.route('**/__journey.js',r=>r.fulfill({contentType:'application/javascript',body:harness}));await page.route('**/__journey',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><script src="/__journey.js"></script></head><body>Fictional journey test</body></html>'}));await page.goto('/__journey');await page.waitForFunction(()=>!!window.privacyTest);
 const result=await page.evaluate(async()=>{
  const t=window.privacyTest,at=new Date().toISOString(),phrase='Fictional journey phrase 2026 protected',vault=new t.PrivacyVault();const session={epoch:await vault.initialize(),signal:new AbortController().signal};
  const w=t.createWorkspace(crypto.randomUUID(),'Fictional journey test',at),old={...w,format:'rgpd-master-v9'};
  const [envelope]=await t.encryptLocalPayloadBatch([{aad:t.contextFor(w.id,1,'master'),value:old}],phrase);await vault.table('records').add({id:w.id,revision:1,format:'rgpd-envelope-v1',envelope});
  const before=JSON.stringify(await vault.table('records').toArray()),opened=await vault.unlock(w.id,phrase,session),untouched=before===JSON.stringify(await vault.table('records').toArray());
  const a=t.createActivity(w.id,crypto.randomUUID(),'controller'),g=t.createDataGroup(crypto.randomUUID(),1),f=t.createDataFlow(crypto.randomUUID()),s=t.createFlowStep(crypto.randomUUID());
  a.dataGroups=[g];a.flowSupports=[{id:crypto.randomUUID(),code:1,name:'PRIVATE_JOURNEY_SUPPORT_CANARY'}];s.supportIds=[a.flowSupports[0]!.id];s.operation=t.knowledge('PRIVATE_JOURNEY_OPERATION_CANARY');f.dataGroupIds=[g.id];f.journey={reference:'1a',purposeIds:[],steps:[s]};a.flows=[f];
  const next=t.putActivity(opened,a,1,at);await vault.save(next,phrase,1,session);const raw=JSON.stringify(await vault.table('records').toArray()),reopened=await vault.unlock(w.id,phrase,session),backup=await vault.backup(reopened,phrase,session),decoded=await t.decodeBackup(backup,phrase);
  const draft={format:'rgpd-draft-v3' as const,workspaceId:w.id,revision:2,id:crypto.randomUUID(),sequence:1,updatedAt:at,form:{kind:'activity' as const,draft:a,documentIds:[],section:'record' as const,step:2}};
  const encrypted=await t.sealRecovery(draft,phrase),recovered=await t.openRecovery(encrypted,phrase,w.id,2,draft.id,1);vault.close();
  return{untouched,format:opened.format,same:JSON.stringify(next)===JSON.stringify(decoded),draftSame:JSON.stringify(recovered)===JSON.stringify(draft),leak:(raw+backup+JSON.stringify(encrypted)).includes('CANARY')};
 });expect(result).toEqual({untouched:true,format:'rgpd-master-v11',same:true,draftSame:true,leak:false});
});
