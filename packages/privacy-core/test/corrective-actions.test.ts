import {describe,it,expect} from 'vitest';
import {createWorkspace,createActivity,createPurpose,createDataGroup,createDataFlow,createFlowStep,assertWorkspace,knowledge as k,unknown,correctionFields,newCorrectionChange,prepareCorrectiveAction,completeCorrectiveAction,abandonCorrectiveAction,previewCorrectiveAction,correctiveConflicts,correctiveVersion,sortCorrectiveActions,reviseWorkspace,putActivity,putDocument,closeAction,createImpactAssessment,recordPiaReview,piaReviewState,projectShare,migrateWorkspace,type Workspace,type EvidenceReference,type CorrectionValue} from '../src/index';
const at='2026-09-24T16:00:00.000Z',id=()=>crypto.randomUUID();
function fixture(){
 const w=createWorkspace(id(),'Fictional corrective mission',at),a=createActivity(w.id,id(),'controller');if(a.role!=='controller')throw Error('fixture');
 a.title='Fictional ensemble';a.purposes=[createPurpose(id())];a.purposes[0]!.description=k('Fictional purpose');
 const g=createDataGroup(id(),1);g.data=k('BEFORE_DATA');g.people=k('Fictional participants');g.retention.period=k('BEFORE_RETENTION');a.dataGroups=[g];
 a.flowSupports=[{id:id(),code:1,name:'Fictional support'}];const f=createDataFlow(id()),s=createFlowStep(id());f.dataGroupIds=[g.id];s.operation=k('Fictional consultation');s.access=k('BEFORE_ACCESS');s.supportIds=[a.flowSupports[0]!.id];f.journey={reference:'1a',purposeIds:[a.purposes[0]!.id],steps:[s]};a.flows=[f];w.activities=[a];
 const d:EvidenceReference={id:id(),workspaceId:w.id,title:'PRIVATE_PROOF_TITLE',category:'other',contractReview:null,activityIds:[a.id],purposeIds:[],partyIds:[],scope:'Fictional scope',version:'v1',declaredAuthor:'',internalRef:'PRIVATE_PROOF_PATH',publicReference:'Public description',reservations:'',sensitivity:'internal',status:'declared',reviewedRevision:null,reviewedAt:null,reviewDue:null,audience:'',channel:'',availability:unknown()};w.documents=[d];assertWorkspace(w);
 return {w,a,g,f,s,d};
}
function change(w:Workspace,key:string,after:CorrectionValue){const field=correctionFields(w.activities[0]!,w).find(f=>f.key===key);if(!field)throw Error('fixture target');return {...newCorrectionChange(field),after};}
function plan(w:Workspace,key:string,after:CorrectionValue,deps:string[]=[],actionId:string=id()){
 return prepareCorrectiveAction(w,{id:actionId,activityId:w.activities[0]!.id,title:'Fictional correction',priority:'first',reason:'PRIVATE_REASON',owner:'Fictional owner',due:'2026-10-01',dependsOn:deps,changes:[change(w,key,after)]},w.revision,at);
}
const evidence=(w:Workspace)=>({author:'Fictional reviewer',justification:'PRIVATE_JUSTIFICATION',evidence:[{documentId:w.documents[0]!.id,version:'v1',locator:'PRIVATE_PAGE',meaning:'PRIVATE_OBSERVATION'}]});
const complete=(w:Workspace,actionId=w.actions.at(-1)!.id)=>completeCorrectiveAction(w,actionId,evidence(w),w.revision,at);
describe('evidence-backed corrective actions',()=>{
 it('prepares without editing facts then applies facts and immutable evidence in one revision',()=>{
  const {w,a,g,s,f}=fixture(),before=JSON.stringify(w),prepared=plan(w,`step/${f.id}/${s.id}/access`,k('AFTER_ACCESS'));
  expect(JSON.stringify(w)).toBe(before);expect(prepared.activities).toEqual(w.activities);expect(previewCorrectiveAction(prepared,prepared.actions[0]!.id).activity.flows[0]!.journey!.steps[0]!.access).toEqual(k('AFTER_ACCESS'));
  const next=complete(prepared),app=next.actions[0]!.corrective!.application!;expect(next.revision).toBe(prepared.revision+1);expect(app.revision).toBe(next.revision);expect(app.version).toBe(2);expect(correctiveVersion(next,a.id)).toBe(2);expect(next.activities[0]!.flows[0]!.journey!.steps[0]!.access).toEqual(k('AFTER_ACCESS'));expect(app.before.activity).toEqual(a);expect(app.after.activity).toEqual(next.activities[0]);expect(app.evidence).toEqual(evidence(w).evidence);expect(app.before.documents[0]!.internalRef).toBe('PRIVATE_PROOF_PATH');
  const second=complete(plan(next,`group/${g.id}/retention/period`,k('AFTER_RETENTION')));expect(correctiveVersion(second,a.id)).toBe(3);expect(second.actions[0]).toEqual(next.actions[0]);
 });
 it('refreshes the current selected export and flags old reviews without rewriting either',()=>{
  const {w,a,g,f}=fixture(),pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];const reviewed=recordPiaReview(w,pia.id,{id:id(),author:'Fictional author',reason:'Fictional review',outcome:'rework'},w.revision,at);
  const options={profile:'article30-controller' as const,recipient:'Fictional board',scope:'Fictional scope',reservations:[],activityIds:[a.id],documentIds:[],clientId:null,flowIds:[f.id]},oldExport=projectShare(reviewed,options,id,at),oldBytes=JSON.stringify(oldExport);
  const next=complete(plan(reviewed,`group/${g.id}/data`,k('AFTER_DATA'))),output=JSON.stringify(projectShare(next,options,id,at));expect(output).toContain('AFTER_DATA');expect(output).not.toContain('BEFORE_DATA');for(const marker of ['PRIVATE_',g.id,next.actions[0]!.id])expect(output).not.toContain(marker);
  expect(JSON.stringify(oldExport)).toBe(oldBytes);expect(piaReviewState(next,next.impactAssessments[0]!)).toBe('changed');expect(next.impactAssessments).toEqual(reviewed.impactAssessments);
 });
 it('blocks stale targets but permits an unrelated change; explicit re-preparation updates the baseline',()=>{
  const {w,g}=fixture(),key=`group/${g.id}/data`,prepared=plan(w,key,k('AFTER_DATA')),other=reviseWorkspace(prepared,prepared.revision,at,{scope:k('Unrelated scope')});expect(()=>complete(other)).not.toThrow();
  const a=structuredClone(prepared.activities[0]!);a.dataGroups![0]!.people=k('CHANGED_PEOPLE');const changed=putActivity(prepared,a,prepared.revision,at);expect(correctiveConflicts(changed,changed.actions[0]!)).toHaveLength(1);expect(()=>complete(changed)).toThrow('CONFLICT');expect(()=>previewCorrectiveAction(changed,changed.actions[0]!.id)).toThrow('CONFLICT');
  const renewed=plan(changed,key,k('AFTER_DATA'),[],changed.actions[0]!.id);expect(()=>complete(renewed)).not.toThrow();expect(()=>completeCorrectiveAction(renewed,renewed.actions[0]!.id,evidence(renewed),prepared.revision,at)).toThrow('CONFLICT');
 });
 it.each(['missing','unversioned','changed-version','wrong-scope','blank-locator','blank-meaning','duplicate'])('refuses evidence %s with no fact modification',kind=>{
  const {w,g}=fixture(),p=plan(w,`group/${g.id}/data`,k('AFTER_DATA')),input=evidence(p);if(kind==='missing')input.evidence=[];if(kind==='unversioned')p.documents[0]!.version='';if(kind==='changed-version')p.documents[0]!.version='v2';if(kind==='wrong-scope'){const other=createActivity(w.id,id(),'processor');p.activities.push(other);p.documents[0]!.activityIds=[other.id];}if(kind==='blank-locator')input.evidence[0]!.locator=' ';if(kind==='blank-meaning')input.evidence[0]!.meaning=' ';if(kind==='duplicate')input.evidence.push({...input.evidence[0]!});const before=JSON.stringify(p);expect(()=>completeCorrectiveAction(p,p.actions[0]!.id,input,p.revision,at)).toThrow();expect(JSON.stringify(p)).toBe(before);
 });
 it('enforces dependencies, rejects cycles and does not treat abandonment as execution',()=>{
  const {w,g,s,f}=fixture(),p=plan(w,`group/${g.id}/data`,k('AFTER_DATA')),first=p.actions[0]!.id,q=plan(p,`step/${f.id}/${s.id}/access`,k('AFTER_ACCESS'),[first]);expect(()=>complete(q)).toThrow('CONFLICT');
  const abandoned=abandonCorrectiveAction(q,first,'Fictional author','Fictional reason',q.revision,at);expect(abandoned.activities).toEqual(w.activities);expect(()=>complete(abandoned)).toThrow('CONFLICT');
  const cycle=structuredClone(q);cycle.actions[0]!.corrective!.dependsOn=[cycle.actions[1]!.id];expect(()=>assertWorkspace(cycle)).toThrow('INVALID');
  const done=complete(q,first); // Linked group changed, so the dependent flow requires a deliberate rebase.
  expect(()=>complete(done)).toThrow('CONFLICT');const rebased=plan(done,`step/${f.id}/${s.id}/access`,k('AFTER_ACCESS'),[first],done.actions[1]!.id);expect(()=>complete(rebased)).not.toThrow();
 });
 it('keeps historical names and proof versions after live inventory changes',()=>{
  const {w,s,f,g}=fixture();w.systems=[{id:id(),workspaceId:w.id,name:'Fictional new destination',description:unknown()}];
  const next=complete(plan(w,`step/${f.id}/${s.id}/destination`,{reference:`system:${w.systems[0]!.id}`,description:unknown()})),frozen=JSON.stringify(next.actions);
  const updated=putDocument(next,{...next.documents[0]!,version:'v2',title:'New proof title'},at);const renamed=reviseWorkspace(updated,updated.revision,at,{systems:updated.systems.map(x=>({...x,name:'Renamed destination'}))});expect(JSON.stringify(renamed.actions)).toBe(frozen);expect(()=>assertWorkspace(renamed)).not.toThrow();
  const removed=structuredClone(renamed.activities[0]!);removed.flows=[];removed.dataGroups=removed.dataGroups!.filter(x=>x.id!==g.id);expect(()=>putActivity(renamed,removed,renamed.revision,at)).not.toThrow();
 });
 it.each(['unknown-key','false-label','prototype-key','foreign-endpoint','foreign-link','wrong-kind','no-op','extra-property','too-many','blank-priority'])('fails closed for %s',kind=>{
  const {w,g,s,f}=fixture(),c=change(w,`group/${g.id}/data`,k('AFTER_DATA'));if(kind==='unknown-key')c.key='activity/madeUp';if(kind==='false-label')c.label='Misleading label';if(kind==='prototype-key')c.key='__proto__/polluted';if(kind==='foreign-endpoint')Object.assign(c,change(w,`step/${f.id}/${s.id}/source`,{reference:`system:${id()}`,description:unknown()}));if(kind==='foreign-link')Object.assign(c,change(w,`group/${g.id}/purposeIds`,[id()]));if(kind==='wrong-kind')c.after='wrong';if(kind==='no-op')c.after=c.before;if(kind==='extra-property')Object.assign(c,{unexpected:true});
  const input={id:id(),activityId:w.activities[0]!.id,title:'Fictional correction',priority:'first' as const,reason:'Fictional reason',owner:'Fictional owner',due:null,dependsOn:[],changes:kind==='too-many'?Array.from({length:13},()=>c):[c]};if(kind==='blank-priority')Object.assign(input,{priority:''});expect(()=>prepareCorrectiveAction(w,input,w.revision,at)).toThrow();expect(({} as Record<string,unknown>).polluted).toBeUndefined();
 });
 it.each(['drop-plan','rewrite-closed','fake-after','fake-evidence','fake-version','fake-revision','fake-dependency','fake-inventory'])('protects history from %s',kind=>{
  const {w,g}=fixture(),p=plan(w,`group/${g.id}/data`,k('AFTER_DATA')),done=complete(p),bad=structuredClone(done);
  if(kind==='drop-plan'){delete bad.actions[0]!.corrective;expect(()=>reviseWorkspace(done,done.revision,at,{actions:bad.actions})).toThrow();return;}
  if(kind==='rewrite-closed'){bad.actions[0]!.closure!.author='Changed';expect(()=>reviseWorkspace(done,done.revision,at,{actions:bad.actions})).toThrow();return;}
  const app=bad.actions[0]!.corrective!.application!;
  if(kind==='fake-after')app.after.activity.dataGroups![0]!.data=k('FABRICATED');if(kind==='fake-evidence')app.evidence[0]!.version='v9';if(kind==='fake-version')app.version=3;if(kind==='fake-revision')app.revision=bad.revision+1;if(kind==='fake-dependency')bad.actions[0]!.corrective!.dependsOn=[id()];if(kind==='fake-inventory')app.after.organization.name='FABRICATED';expect(()=>assertWorkspace(bad)).toThrow();
 });
 it('prevents bypass via the old close command and generic transaction assembly',()=>{
  const {w,g}=fixture(),p=plan(w,`group/${g.id}/data`,k('AFTER_DATA')),done=complete(p);expect(()=>closeAction(p,p.actions[0]!.id,'Fictional','Fictional',at)).toThrow();expect(()=>reviseWorkspace(p,p.revision,at,{actions:done.actions})).toThrow();expect(()=>reviseWorkspace(w,w.revision,at,{actions:done.actions,activities:done.activities})).toThrow();
 });
 it('never reuses an internal identifier from a past correction in a public export',()=>{
  const {w,g}=fixture(),done=complete(plan(w,`group/${g.id}/data`,k('AFTER_DATA'))),a=structuredClone(done.activities[0]!);a.flows=[];a.dataGroups=[];const next=putActivity(done,a,done.revision,at);let n=0;
  expect(()=>projectShare(next,{profile:'article30-controller',recipient:'Fictional',scope:'Fictional',reservations:[],activityIds:[a.id],documentIds:[],clientId:null},()=>n++===0?g.id:id(),at)).toThrow('INVALID');
  const prepared=plan(w,`group/${g.id}/data`,k('AFTER_DATA'));
  const out=JSON.stringify(projectShare(prepared,{profile:'article30-controller',recipient:'Fictional',scope:'Fictional',reservations:[],activityIds:[a.id],documentIds:[],clientId:null,actionIds:[prepared.actions[0]!.id]},id,at));expect(out).toContain('Fictional correction');expect(out).not.toContain('PRIVATE_');expect(out).not.toContain('basis');
 });
 it('accepts read-only reactive views after completion without mutating snapshots',()=>{
  const {w,g}=fixture(),done=complete(plan(w,`group/${g.id}/data`,k('AFTER_DATA'))),before=JSON.stringify(done);
  const wrap=(value:unknown):unknown=>value&&typeof value==='object'?new Proxy(value,{get:(target,key)=>wrap(Reflect.get(target,key)),set:()=>{throw Error('mutation');}}):value;
  expect(()=>assertWorkspace(wrap(done))).not.toThrow();expect(JSON.stringify(done)).toBe(before);
 });
 it('sorts explicit priorities and dates; upgrades v10 without touching source data',()=>{
  const {w,g}=fixture(),p=plan(w,`group/${g.id}/data`,k('AFTER_DATA'));const items=[{...p.actions[0]!,id:id(),corrective:{...p.actions[0]!.corrective!,priority:'later' as const}},p.actions[0]!];expect(sortCorrectiveActions(items)[0]!.id).toBe(p.actions[0]!.id);
  const old={...w,format:'rgpd-master-v10'},before=JSON.stringify(old);expect(migrateWorkspace(old)).toEqual({...old,format:'rgpd-master-v11'});expect(JSON.stringify(old)).toBe(before);expect(()=>migrateWorkspace({...p,format:'rgpd-master-v10'})).toThrow();
 });
});
