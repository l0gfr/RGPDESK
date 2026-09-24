import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import type {} from '../../fixtures/privacy/vault-harness';
let harness='';
test.beforeAll(async()=>{harness=(await build({entryPoints:['tests/fixtures/privacy/vault-harness.ts'],bundle:true,platform:'browser',format:'iife',write:false})).outputFiles[0]!.text;});
test.beforeEach(async({page})=>{await page.route('**/__privacy_harness.js',route=>route.fulfill({contentType:'application/javascript',body:harness}));await page.route('**/__privacy_harness',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><script src="/__privacy_harness.js"></script>'}));await page.goto('/__privacy_harness');await page.waitForFunction(()=>Boolean(window.privacyTest));});

test('draft writes are encrypted, serial, claimed once and consumed with the saved revision',async({page})=>{
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,v=new a.PrivacyVault(),session={epoch:await v.initialize(),signal:new AbortController().signal},phrase='Fictional draft phrase 2026 correct';
  const m=a.createWorkspace(crypto.randomUUID(),'Fictif',new Date().toISOString());await v.create(m,phrase,session);
  const draft=a.createActivity(m.id,crypto.randomUUID(),'controller');draft.title='DRAFT_SECRET';
  const f={kind:'activity' as const,draft,documentIds:[],section:'record' as const,step:0};
  const w=new a.RecoveryWriter(v,m.id,phrase,session),first=w.update(f,m.revision);draft.title='SECOND_SECRET';await Promise.all([first,w.update(f,m.revision)]);
  const saved=(await v.readDrafts(m,phrase,session))[0]!;const raw=JSON.stringify(await v.table('drafts').toArray());
  const other=new a.RecoveryWriter(v,m.id,phrase,session);await other.adopt(saved);const competing=new a.RecoveryWriter(v,m.id,phrase,session);const rejected=await competing.adopt(saved).then(()=>false,()=>true);
  const next=a.putActivity(m,draft,m.revision,new Date().toISOString());await v.save(next,phrase,m.revision,session,await other.settle());
  return {raw,saved:saved.form.kind==='activity'?saved.form.draft.title:'',sequence:saved.sequence,rejected,count:await v.table('drafts').count(),revision:(await v.list())[0]!.revision};
 });expect(result.raw).not.toContain('SECRET');expect({...result,raw:''}).toEqual({raw:'',saved:'SECOND_SECRET',sequence:2,rejected:true,count:0,revision:2});
});

test('quota failure rolls back master and consumed draft together; backups omit pending forms',async({page})=>{
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,v=new a.PrivacyVault(),session={epoch:await v.initialize(),signal:new AbortController().signal},phrase='Fictional draft phrase 2026 correct';
  const m=a.createWorkspace(crypto.randomUUID(),'Fictif',new Date().toISOString());await v.create(m,phrase,session);
  const draft=a.createActivity(m.id,crypto.randomUUID(),'controller');draft.title='PENDING_ONLY';const w=new a.RecoveryWriter(v,m.id,phrase,session);await w.update({kind:'activity',draft,documentIds:[],section:'record',step:0},m.revision);
  const before=JSON.stringify([await v.table('records').toArray(),await v.table('drafts').toArray()]);const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){if(this.name==='records')throw new DOMException('Quota','QuotaExceededError');return put.apply(this,args);};
  let rejected=false;try{await v.save(a.putActivity(m,draft,m.revision,new Date().toISOString()),phrase,m.revision,session,await w.settle());}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}
  const unchanged=before===JSON.stringify([await v.table('records').toArray(),await v.table('drafts').toArray()]);const archive=await a.decodeArchive(await v.backup(m,phrase,session),phrase);
  return {rejected,unchanged,leaked:JSON.stringify(archive).includes('PENDING_ONLY'),activities:archive.master.activities.length};
 });expect(result).toEqual({rejected:true,unchanged:true,leaked:false,activities:0});
});

test('lock during encryption, stale revision and wipe epoch prevent delayed draft writes',async({page})=>{
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,v=new a.PrivacyVault(),control=new AbortController(),session={epoch:await v.initialize(),signal:control.signal},phrase='Fictional draft phrase 2026 correct';
  const m=a.createWorkspace(crypto.randomUUID(),'Fictif',new Date().toISOString());await v.create(m,phrase,session);
  const f={kind:'activity' as const,draft:a.createActivity(m.id,crypto.randomUUID(),'controller'),documentIds:[],section:'record' as const,step:0};
  const encrypt=crypto.subtle.encrypt.bind(crypto.subtle);crypto.subtle.encrypt=async(...args)=>{const bytes=await encrypt(...args);control.abort();return bytes;};
  const locked=await new a.RecoveryWriter(v,m.id,phrase,session).update(f,m.revision).then(()=>'',(e:Error)=>e.message);crypto.subtle.encrypt=encrypt;
  const live={epoch:session.epoch,signal:new AbortController().signal};await v.save(a.reviseWorkspace(m,m.revision,new Date().toISOString(),{scope:a.knowledge('new')}),phrase,m.revision,live);
  const conflict=await new a.RecoveryWriter(v,m.id,phrase,live).update(f,m.revision).then(()=>'',(e:Error)=>e.message);await v.wipe(live.epoch);
  const epoch=await new a.RecoveryWriter(v,m.id,phrase,live).update(f,2).then(()=>'',(e:Error)=>e.message);
  return {locked,conflict,epoch,count:await v.table('drafts').count(),masters:await v.table('records').count()};
 });expect(result).toEqual({locked:'LOCKED',conflict:'CONFLICT',epoch:'EPOCH',count:0,masters:0});
});

test('v2 database upgrade preserves ciphertext; malformed draft cannot change the saved dossier',async({page})=>{
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,phrase='Fictional draft phrase 2026 correct';const m=a.createWorkspace(crypto.randomUUID(),'Fictif',new Date().toISOString());
  const Legacy=Object.getPrototypeOf(a.PrivacyVault),legacy=new Legacy(a.PRIVACY_DB_NAME);legacy.version(2).stores({records:'id',metadata:'key',snapshots:'[workspaceId+id], workspaceId'});const epoch=crypto.randomUUID();await legacy.table('metadata').put({key:'epoch',value:epoch});await legacy.table('records').put({id:m.id,revision:1,format:'rgpd-envelope-v1',envelope:await a.sealMaster(m,phrase)});const before=JSON.stringify(await legacy.table('records').toArray());legacy.close();
  const v=new a.PrivacyVault(),session={epoch:await v.initialize(),signal:new AbortController().signal};await v.unlock(m.id,phrase,session);
  await v.table('drafts').put({workspaceId:m.id,id:crypto.randomUUID(),revision:1,sequence:1,envelope:{}});const failed=await v.readDrafts(m,phrase,session).then(()=>false,()=>true);
  return {sameEpoch:session.epoch===epoch,unchanged:before===JSON.stringify(await v.table('records').toArray()),failed,kept:await v.table('drafts').count()};
 });expect(result).toEqual({sameEpoch:true,unchanged:true,failed:true,kept:1});
});


test('passive preview matches the downloaded report across all profiles and the graphical presentation',async({page})=>{
 const comparisons=await page.evaluate(()=>{
  const a=window.privacyTest,m=a.createDemoWorkspace(()=>crypto.randomUUID(),'2026-09-24T00:00:00.000Z');
  const collect=(body:HTMLElement)=>Array.from(body.querySelectorAll('h1,h2,h3,p,dt,dd,figcaption,caption,th,td,small,li')).map(e=>[e.tagName,(e.textContent??'').replace(/\s+/g,' ').trim()]);
  const profiles=['article30-controller','article30-processor','client-excerpt','internal-review'] as const;
  return [...profiles,'presentation' as const].map(profile=>{
   const processor=m.activities.find(x=>x.role==='processor')!;
   const selected=profile==='client-excerpt'?[processor]:m.activities.filter(x=>(profile==='internal-review'||profile==='presentation')||(profile==='article30-processor'?x.role==='processor':x.role==='controller'));
   const dto=a.projectShare(m,{profile:profile==='presentation'?'internal-review':profile,recipient:'<img src=x onerror=alert(1)> & é',scope:'Fictif',activityIds:selected.map(x=>x.id),documentIds:[],clientId:profile==='client-excerpt'&&processor.role==='processor'?processor.controllerIds[0]!:null,reservations:['Réserve fictive'],...(profile==='presentation'?{presentation:true,flowIds:selected.flatMap(x=>x.flows.map(f=>f.id)),decisionIds:m.decisions.map(x=>x.id),actionIds:m.actions.filter(x=>!x.closure).map(x=>x.id),executive:{changes:'Changement fictif',arbitrations:'Avis à recueillir'}}:{})},()=>crypto.randomUUID(),'2026-09-24T00:00:00.000Z');
   // Parser belongs to this test only; production builds text nodes directly.
   const expected=new DOMParser().parseFromString(a.renderShareFiles(dto)['report.html']!,'text/html').body;
   const actual=a.reportBody(dto);
   return {profile,expected:collect(expected),actual:collect(actual),active:actual.querySelectorAll('script,img,iframe,[style],[onclick],[onerror]').length};
  });
 });for(const row of comparisons){expect(row.active).toBe(0);expect(row.actual,row.profile).toEqual(row.expected);}
});

test('v7 request migration stays in memory until save and requests survive encrypted backup and restore',async({page})=>{
 const result=await page.evaluate(async()=>{
  const a=window.privacyTest,v=new a.PrivacyVault(),phrase='Fictional requests backup phrase 2026 correct',at=new Date().toISOString();let session={epoch:await v.initialize(),signal:new AbortController().signal};
  const m=a.createWorkspace(crypto.randomUUID(),'PRIVATE_ORG',at),activity=a.createActivity(m.id,crypto.randomUUID(),'controller');m.activities=[activity];
  const old={...m,format:'rgpd-master-v7'},[envelope]=await a.encryptLocalPayloadBatch([{aad:a.contextFor(m.id,1,'master'),value:old}],phrase);await v.table('records').put({id:m.id,revision:1,format:'rgpd-envelope-v1',envelope});const before=JSON.stringify(await v.table('records').toArray());let opened=await v.unlock(m.id,phrase,session);const unchanged=before===JSON.stringify(await v.table('records').toArray());
  const requestId=crypto.randomUUID(),itemId=crypto.randomUUID();let next=a.createCollection(opened,{id:requestId,recipient:'PRIVATE_RECIPIENT',due:null,items:[{id:itemId,activityId:activity.id,activity:activity.title,question:'PRIVATE_QUESTION',evidenceHint:'PRIVATE_EVIDENCE'}]},opened.revision,at);await v.save(next,phrase,opened.revision,session);opened=next;
  next=a.addCollectionReply(opened,requestId,itemId,{id:crypto.randomUUID(),author:'PRIVATE_AUTHOR',text:'PRIVATE_ANSWER',documentIds:[]},opened.revision,at);await v.save(next,phrase,opened.revision,session);
  const backup=await v.backup(next,phrase,session),raw=JSON.stringify(await v.table('records').toArray());await v.wipe(session.epoch);session={epoch:await v.initialize(),signal:new AbortController().signal};const restored=await v.restore(backup,phrase,session);
  return{unchanged,format:restored.format,same:a.canonicalJson(next)===a.canonicalJson(restored),leak:(backup+raw).includes('PRIVATE_'),reply:restored.collections![0]!.items[0]!.replies[0]!.text};
 });expect(result).toEqual({unchanged:true,format:'rgpd-master-v11',same:true,leak:false,reply:'PRIVATE_ANSWER'});
});
