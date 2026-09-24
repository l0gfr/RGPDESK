import { describe,it,expect } from 'vitest';
import { createWorkspace,createActivity, createDpoCase, createImpactAssessment } from '@rgpdesk/privacy-core';
import { sealRecovery,openRecovery,openMaster,sealMaster,contextFor } from './crypto';
import { encryptLocalPayloadBatch } from '../../../lib/local-encryption';
import { parseRecovery,type RecoveryDraft } from './recovery';
const phrase='Fictional recovery phrase 2026 correct';
const master=()=>createWorkspace(crypto.randomUUID(),'Fictif','2026-09-24T10:00:00.000Z');
const fixture=():RecoveryDraft=>{const w=master(),a=createActivity(w.id,crypto.randomUUID(),'controller');a.title='RECOVERY_CANARY';return {format:'rgpd-draft-v1',workspaceId:w.id,revision:1,id:crypto.randomUUID(),sequence:1,updatedAt:'2026-09-24T10:00:00.000Z',form:{kind:'activity',draft:a,documentIds:[],section:'record',step:0}};};
describe('separate encrypted recovery copies',()=>{
 it('round trips real WebCrypto without plaintext metadata',async()=>{const d=fixture(),e=await sealRecovery(d,phrase);expect(JSON.stringify(e)).not.toContain('RECOVERY_CANARY');expect(e.iterations).toBe(600000);expect(await openRecovery(e,phrase,d.workspaceId,d.revision,d.id,d.sequence)).toEqual(d);});
 it('rejects wrong secret, destination, sequence and master-context substitution',async()=>{const d=fixture(),e=await sealRecovery(d,phrase);await expect(openRecovery(e,'Another fictional passphrase 2026',d.workspaceId,1,d.id,1)).rejects.toThrow();await expect(openRecovery(e,phrase,crypto.randomUUID(),1,d.id,1)).rejects.toThrow();await expect(openRecovery(e,phrase,d.workspaceId,1,d.id,2)).rejects.toThrow();await expect(openMaster(e,phrase,d.workspaceId,1)).rejects.toThrow();const m=master();await expect(openRecovery(await sealMaster(m,phrase),phrase,m.id,1,d.id,1)).rejects.toThrow();});
 it('allows incomplete text without weakening the saved master and rejects extra data',()=>{const d=fixture();if(d.form.kind!=='activity')throw new Error();d.form.draft.title='';expect(parseRecovery(d)).toEqual(d);expect(()=>parseRecovery({...d,secret:phrase})).toThrow();expect(()=>parseRecovery({...d,form:{...d.form,confirmed:true}})).toThrow();d.form.draft.internalNotes='a'.repeat(4001);expect(()=>parseRecovery(d)).toThrow();});
 it('validates plaintext even when correctly authenticated',async()=>{const d=fixture();const [e]=await encryptLocalPayloadBatch([{aad:contextFor(d.workspaceId,1,`draft:${d.id}:1`),value:{...d,form:{kind:'activity',draft:{bad:true}}}}],phrase);await expect(openRecovery(e,phrase,d.workspaceId,1,d.id,1)).rejects.toThrow();});
 it('refuses a draft from another workspace and overlong or unknown form values',()=>{const d=fixture();if(d.form.kind!=='activity')throw new Error();d.form.draft.workspaceId=crypto.randomUUID();expect(()=>parseRecovery(d)).toThrow();expect(()=>parseRecovery({...fixture(),form:{kind:'password',value:phrase}})).toThrow();});
 it('preserves pending DPO and AIPD text, never confirmation state',()=>{const d=fixture(),w=master(),a=createActivity(w.id,crypto.randomUUID(),'controller');d.workspaceId=w.id;d.form={kind:'dpo',draft:createDpoCase(w.id,crypto.randomUUID(),'breach'),step:'review',reviewAuthor:'Auteur fictif',reviewReason:'À relire',eventAt:'date en cours',eventAuthor:'',eventText:'',eventEvidence:'',outcome:'rework'};expect(parseRecovery(d)).toEqual(d);d.form={kind:'pia',draft:createImpactAssessment(w.id,a,crypto.randomUUID()),step:5,author:'Auteur fictif',reason:'À relire',outcome:'rework'};expect(parseRecovery(d)).toEqual(d);expect(()=>parseRecovery({...d,form:{...d.form,acknowledged:true}})).toThrow();});
});

it('v2 recovery accepts data groups without weakening v1 and protects them with real WebCrypto',async()=>{
 const d=fixture();d.format='rgpd-draft-v2';
 if(d.form.kind!=='activity')throw Error('fixture');
 const {createDataGroup}=await import('@rgpdesk/privacy-core');
 d.form.draft.dataGroups=[createDataGroup(crypto.randomUUID(),1)];
 d.form.draft.dataGroups[0]!.data={state:'documented',value:'PRIVATE_GROUP_DRAFT_CANARY'};
 const {parseRecovery}=await import('./recovery');
 expect(parseRecovery(d)).toEqual(d);expect(()=>parseRecovery({...d,format:'rgpd-draft-v1'})).toThrow('INVALID');
 const {sealRecovery,openRecovery}=await import('./crypto');
 const phrase='Fictitious group recovery passphrase 2026!';
 const sealed=await sealRecovery(d,phrase);
 expect(JSON.stringify(sealed)).not.toContain('PRIVATE_GROUP');
 expect(await openRecovery(sealed,phrase,d.workspaceId,d.revision,d.id,d.sequence)).toEqual(d);
});
