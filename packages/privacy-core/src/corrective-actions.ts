import { knowledgeText, type Activity, type Knowledge, type Workspace, type DocumentaryAction, type EvidenceCitation, type FlowStep, type DataFlow } from './model';
import type { CorrectionValue, CorrectionChange, CorrectivePlan } from './remediation-model';
import { canonicalJson } from './share-format.js';
import { PrivacyError, assertWorkspace } from './validation';
import { reviseWorkspace } from './commands';
import { CATALOG_VERSION } from './catalog';
import { assertLinkedFacts } from './linked-facts';
import { piaContext } from './pia';
import type { PiaContext } from './pia-model';

export const CORRECTION_PRIORITIES = {first:'À traiter d’abord',next:'Ensuite',later:'Plus tard'} as const;
// Domain records contain JSON data only. A JSON copy also accepts read-only reactive
// views during validation, unlike structuredClone, without changing the source.
const copyJson = <T>(value:T):T => JSON.parse(JSON.stringify(value)) as T;
const same = (a: unknown,b: unknown) => canonicalJson(a)===canonicalJson(b);
function invalid():never {throw new PrivacyError('INVALID');}
export interface CorrectionField {
  key:string; label:string; kind:'knowledge'|'text'|'links'|'endpoint'; value:CorrectionValue;
  options:{value:string;label:string}[]; basis:string;
}
type Field = CorrectionField & {write:(value:CorrectionValue)=>void};
type Inventory = Pick<Workspace,'parties'|'systems'>;
/** Closed field catalogue. No user-provided property path is traversed or assigned. */
function fields(a:Activity, inventory:Inventory):Field[] {
  const result:Field[]=[];
  const add=(key:string,label:string,kind:Field['kind'],value:CorrectionValue,write:Field['write'],options:Field['options']=[],context:unknown=null)=>result.push({key,label,kind,value,write,options,basis:canonicalJson([a.id,a.role,a.title,value,context])});
  const k=(key:string,label:string,value:Knowledge,write:(v:Knowledge)=>void,context:unknown=null)=>add(key,label,'knowledge',value,v=>{if(!v||typeof v!=='object'||Array.isArray(v)||!('state' in v))invalid();write(v);},[],context);
  const links=(key:string,label:string,value:string[],write:(v:string[])=>void,options:Field['options'],context:unknown)=>add(key,label,'links',value,v=>{if(!Array.isArray(v)||new Set(v).size!==v.length||v.some(id=>!options.some(o=>o.value===id)))invalid();write([...v]);},options,context);
  for(const [field,label] of Object.entries({dataCategories:'Données · description générale',dataSubjects:'Personnes · description générale',recipients:'Destinataires · description générale',transfers:'Transferts déclarés',securityMeasures:'Mesures de sécurité'}) as [keyof Pick<Activity,'dataCategories'|'dataSubjects'|'recipients'|'transfers'|'securityMeasures'>,string][])k(`activity/${field}`,label,a[field],v=>{a[field]=v;});
  if(a.role==='processor') {k('activity/operations','Opérations confiées',a.operations,v=>{a.operations=v;});k('activity/instructions','Instructions du client',a.instructions,v=>{a.instructions=v;});}
  const purposes=a.role==='controller'?a.purposes.map((p,i)=>({value:p.id,label:`SF${i+1} · ${knowledgeText(p.description)||'À préciser'}`})):[];
  if(a.role==='controller') for(const [i,p] of a.purposes.entries()) {
    for(const [field,label] of [['description','Sous-finalité'],['legalBasis','Fondement juridique déclaré']] as const)k(`purpose/${p.id}/${field}`,`SF${i+1} · ${label}`,p[field],v=>{p[field]=v;},p);
    for(const [field,label] of [['period','Durée générale'],['trigger','Départ de la conservation générale']] as const)k(`purpose/${p.id}/retention/${field}`,`SF${i+1} · ${label}`,p.retention[field],v=>{p.retention[field]=v;},p);
  }
  for(const g of a.dataGroups??[]) {
    for(const [field,label] of [['data','Catégories de données'],['people','Personnes concernées'],['guarantees','Garanties et vérification']] as const)k(`group/${g.id}/${field}`,`D${g.code} · ${label}`,g[field],v=>{g[field]=v;},g);
    for(const [field,label] of [['period','Durée ou critère'],['trigger','Départ de la conservation'],['deletion','Effacement']] as const)k(`group/${g.id}/retention/${field}`,`D${g.code} · ${label}`,g.retention[field],v=>{g.retention[field]=v;},g);
    for(const [field,label] of [['data','Données'],['supports','Supports'],['channels','Canaux'],['recipients','Destinataires'],['retention','Conservation']] as const)k(`group/${g.id}/minimisation/${field}`,`D${g.code} · Minimisation · ${label}`,g.minimisation[field],v=>{g.minimisation[field]=v;},g);
    links(`group/${g.id}/purposeIds`,`D${g.code} · Sous-finalités générales`,g.purposeIds,v=>{g.purposeIds=v;},purposes,g);
  }
  const endpoints=(step:boolean)=>[{value:'',label:'Description libre'},{value:'subjects',label:'Personnes du groupe'},...inventory.parties.map(p=>({value:`party:${p.id}`,label:`Intervenant · ${p.name}`})),...inventory.systems.map(s=>({value:`system:${s.id}`,label:`Système · ${s.name}`})),...(step?(a.flowSupports??[]).map(s=>({value:`support:${s.id}`,label:`Support ${s.code} · ${s.name}`})):[])];
  const stepFields=(s:FlowStep|DataFlow,prefix:string,label:string,context:unknown)=>{
    for(const [field,name] of [['operation','Opération'],['channel','Canal'],['location','Lieux'],['access','Personnes autorisées et périmètre']] as const)k(`${prefix}/${field}`,`${label} · ${name}`,s[field],v=>{s[field]=v;},context);
    if('when' in s)k(`${prefix}/when`,`${label} · Quand / condition`,s.when,v=>{s.when=v;},context);
    for(const endpoint of ['source','destination'] as const) {
      const options=endpoints('supportIds' in s), ref=s[`${endpoint}Ref`];
      add(`${prefix}/${endpoint}`,`${label} · ${endpoint==='source'?'Origine':'Destination'}`,'endpoint',{reference:ref??'',description:s[endpoint]},v=>{
        if(!v||typeof v!=='object'||Array.isArray(v)||!('reference' in v)||!options.some(o=>o.value===v.reference))invalid();
        if(v.reference&&v.description.state!=='unknown')invalid();
        // Discriminated catalogue above limits step references to the corresponding endpoint type.
        if('supportIds' in s){if(v.reference)s[`${endpoint}Ref`]=v.reference as FlowStep['sourceRef'];else delete s[`${endpoint}Ref`];}
        else {if(v.reference)s[`${endpoint}Ref`]=v.reference as DataFlow['sourceRef'];else delete s[`${endpoint}Ref`];}
        s[endpoint]=copyJson(v.description);
      },options,context);
    }
    if('supportIds' in s)links(`${prefix}/supportIds`,`${label} · Supports utilisés`,s.supportIds,v=>{s.supportIds=v;},(a.flowSupports??[]).map(x=>({value:x.id,label:`Support ${x.code} · ${x.name}`})),context);
  };
  for(const [i,f] of a.flows.entries()) {
    const refs=(f.journey?.steps??[f]).flatMap(s=>[s.sourceRef,s.destinationRef]);
    const context={flow:f,groups:(a.dataGroups??[]).filter(g=>f.dataGroupIds?.includes(g.id)),supports:a.flowSupports??[],parties:inventory.parties.filter(p=>refs.includes(`party:${p.id}`)),systems:inventory.systems.filter(p=>refs.includes(`system:${p.id}`))};
    if(f.journey) {
      links(`flow/${f.id}/purposeIds`,`Parcours ${f.journey.reference} · Sous-finalités`,f.journey.purposeIds,v=>{f.journey!.purposeIds=v;},purposes,context);
      for(const [j,s] of f.journey.steps.entries())stepFields(s,`step/${f.id}/${s.id}`,`Parcours ${f.journey.reference} · Étape ${j+1}`,context);
    } else stepFields(f,`flow/${f.id}`,`Flux ${i+1}`,context);
  }
  for(const s of a.flowSupports??[])add(`support/${s.id}/name`,`Support ${s.code} · Nom`,'text',s.name,v=>{if(typeof v!=='string'||!v.trim()||v.length>160)invalid();s.name=v;},[],s);
  return result;
}
export function correctionFields(a:Activity, inventory:Inventory):CorrectionField[]{return fields(copyJson(a),inventory).map(({write:_write,...f})=>f);}
export function correctionValueText(value:CorrectionValue,options:CorrectionField['options']=[]):string {
  if(typeof value==='string')return value||'À préciser';
  if(Array.isArray(value))return value.map(id=>options.find(o=>o.value===id)?.label??'Référence conservée').join(' ; ')||'Aucun lien sélectionné';
  if('reference' in value)return value.reference?options.find(o=>o.value===value.reference)?.label??'Référence conservée':knowledgeText(value.description)||'À préciser';
  return knowledgeText(value)||'À documenter';
}
export function newCorrectionChange(field:CorrectionField):CorrectionChange{return {key:field.key,label:field.label,before:copyJson(field.value),after:copyJson(field.value),basis:field.basis};}
function applyChanges(a:Activity, inventory:Inventory, changes:CorrectionChange[]):Activity {
  const next=copyJson(a), catalogue=fields(next,inventory);
  if(!changes.length||changes.length>12||new Set(changes.map(c=>c.key)).size!==changes.length)invalid();
  for(const change of changes) {
    const field=catalogue.find(f=>f.key===change.key);
    if(!field||field.basis!==change.basis||!same(field.value,change.before))throw new PrivacyError('CONFLICT');
    if(change.label!==field.label||same(change.before,change.after))invalid();
  }
  for(const change of changes)catalogue.find(f=>f.key===change.key)!.write(copyJson(change.after));
  return next;
}
export function correctiveConflicts(w:Workspace,a:DocumentaryAction):string[]{
  if(!a.corrective)return [];
  const activity=w.activities.find(x=>x.id===a.activityId);
  const current=activity?correctionFields(activity,w):[];
  return a.corrective.changes.filter(c=>!current.some(f=>f.key===c.key&&f.basis===c.basis&&same(f.value,c.before))).map(c=>c.label);
}
export function correctiveVersion(w:Workspace,id:string):number {return 1+w.actions.filter(a=>a.activityId===id&&a.corrective?.application).length;}
export function sortCorrectiveActions(actions:DocumentaryAction[]):DocumentaryAction[]{
  const rank={first:0,next:1,later:2};
  return [...actions].sort((a,b)=>Number(!!a.closure)-Number(!!b.closure)||(rank[a.corrective?.priority??'later']-rank[b.corrective?.priority??'later'])||(a.due??'9999').localeCompare(b.due??'9999')||a.createdAt.localeCompare(b.createdAt));
}
export function prepareCorrectiveAction(w:Workspace,input:{id:string;activityId:string;title:string;priority:CorrectivePlan['priority'];reason:string;owner:string;due:string|null;dependsOn:string[];changes:CorrectionChange[]},revision:number,at:string):Workspace {
  assertWorkspace(w);
  const old=w.actions.find(a=>a.id===input.id),a=w.activities.find(a=>a.id===input.activityId);
  if(!a||old&&(!old.corrective||old.closure||old.activityId!==input.activityId))invalid();
  const candidate=applyChanges(a,w,input.changes);
  assertWorkspace({...w,activities:w.activities.map(x=>x.id===a.id?candidate:x)});
  const next:DocumentaryAction={id:input.id,workspaceId:w.id,findingKey:`R-001:${a.id}:corrective:${input.id}`,ruleId:'R-001',activityId:a.id,scope:a.title,owner:input.owner.trim(),due:input.due,createdAt:old?.createdAt??at,catalogVersion:CATALOG_VERSION,reviewedRevision:old?.reviewedRevision??revision+1,closure:null,
    corrective:{title:input.title.trim(),priority:input.priority,reason:input.reason.trim(),dependsOn:[...input.dependsOn],changes:copyJson(input.changes),preparedAt:at,preparedRevision:revision+1,application:null}};
  return reviseWorkspace(w,revision,at,{actions:old?w.actions.map(x=>x.id===old.id?next:x):[...w.actions,next]});
}
/** Read-only projection; the persisted facts are unchanged until completion succeeds. */
export function previewCorrectiveAction(w:Workspace,id:string):PiaContext {
  assertWorkspace(w);
  const action=w.actions.find(a=>a.id===id),activity=w.activities.find(a=>a.id===action?.activityId);
  if(!action?.corrective||action.closure||!activity)invalid();
  const next=applyChanges(activity,w,action.corrective.changes);
  const candidate={...w,activities:w.activities.map(a=>a.id===next.id?next:a)};
  assertWorkspace(candidate);
  return correctionContexts(w,candidate,next.id).after;
}
export function completeCorrectiveAction(w:Workspace,id:string,input:{author:string;justification:string;evidence:EvidenceCitation[]},revision:number,at:string):Workspace {
  assertWorkspace(w);
  const action=w.actions.find(a=>a.id===id),p=action?.corrective,a=w.activities.find(x=>x.id===action?.activityId);
  if(!action||!p||action.closure||!a)invalid();
  if(p.dependsOn.some(id=>!w.actions.find(a=>a.id===id)?.corrective?.application))throw new PrivacyError('CONFLICT');
  checkEvidence(input.evidence,w.documents.filter(d=>d.activityIds.includes(a.id)));
  const activity=applyChanges(a,w,p.changes),activities=w.activities.map(x=>x.id===a.id?activity:x);
  const contexts=correctionContexts(w,{...w,activities},a.id);
  const application={revision:revision+1,version:correctiveVersion(w,a.id)+1,...contexts,evidence:copyJson(input.evidence)};
  return reviseWorkspace(w,revision,at,{activities,actions:w.actions.map(x=>x.id===id?{...x,closure:{at,author:input.author.trim(),justification:input.justification.trim()},corrective:{...p,application}}:x)});
}
export function abandonCorrectiveAction(w:Workspace,id:string,author:string,justification:string,revision:number,at:string):Workspace {
  const a=w.actions.find(x=>x.id===id);if(!a?.corrective||a.closure)invalid();
  return reviseWorkspace(w,revision,at,{actions:w.actions.map(x=>x.id===id?{...x,closure:{at,author:author.trim(),justification:justification.trim()}}:x)});
}
function checkEvidence(evidence:EvidenceCitation[],documents:Workspace['documents']):void {
  if(!evidence.length||evidence.length>8||new Set(evidence.map(e=>e.documentId)).size!==evidence.length)invalid();
  for(const c of evidence) {const d=documents.find(d=>d.id===c.documentId);if(!d||!d.version.trim()||d.version!==c.version||!c.meaning.trim()||!c.locator.trim())throw new PrivacyError('CONFLICT');}
}
/** Validate snapshots through the normal master boundary, with no live-reference fallback. */
function validateContext(w:Workspace,c:PiaContext):void {
  if(c.activity.workspaceId!==w.id||[...c.documents,...c.parties,...c.systems].some(e=>e.workspaceId!==w.id))invalid();
  const contextWorkspace:Workspace={format:w.format,id:w.id,revision:w.revision,createdAt:w.createdAt,updatedAt:w.updatedAt,language:w.language,organization:c.organization,scope:c.scope,jurisdiction:c.jurisdiction,activities:[c.activity],parties:c.parties,systems:c.systems,documents:[],actions:[],decisions:[],imports:[],deliveries:[],impactAssessments:[],dpoCases:[],piaPublications:[]};
  // Documentary metadata may cover several activities; validate its closed schema in the parent,
  // and its citations against this frozen inventory without pretending other activities are present.
  const activity=copyJson(c.activity);activity.analysis.notes=activity.analysis.notes.map(n=>({...n,citations:[]}));
  contextWorkspace.activities=[activity];assertWorkspace(contextWorkspace);
  assertLinkedFacts({...contextWorkspace,activities:[c.activity],documents:c.documents});
  const docIds=new Set(c.documents.map(d=>d.id));
  if(docIds.size!==c.documents.length||c.documents.some(d=>!d.activityIds.includes(c.activity.id)))invalid();
  for(const n of c.activity.analysis.notes)for(const citation of n.citations??[])if(!docIds.has(citation.documentId))invalid();
}
export function assertCorrectiveActions(w:Workspace):void {
  const versions=new Map<string,number>(),revisions=new Set<number>();
  for(const a of w.actions){const p=a.corrective;if(!p)continue;
    if(a.workspaceId!==w.id||!a.activityId||p.preparedAt<a.createdAt||p.preparedAt>w.updatedAt||p.preparedRevision<a.reviewedRevision||p.preparedRevision>w.revision)invalid();
    if(p.dependsOn.some(id=>id===a.id||!w.actions.some(x=>x.id===id&&x.corrective))||new Set(p.changes.map(c=>c.key)).size!==p.changes.length)invalid();
    const app=p.application;if(!app)continue;
    if(!a.closure||app.revision<=p.preparedRevision||app.revision>w.revision||revisions.has(app.revision)||a.closure.at<p.preparedAt)invalid();revisions.add(app.revision);
    if(app.before.activity.id!==a.activityId||app.after.activity.id!==a.activityId||app.version<2)invalid();
    validateContext(w,app.before);validateContext(w,app.after);checkEvidence(app.evidence,app.before.documents);
    if(!same({...app.before,activity:null},{...app.after,activity:null}))invalid();
    if(p.dependsOn.some(id=>{const dep=w.actions.find(x=>x.id===id)?.corrective?.application;return !dep||dep.revision>=app.revision;}))invalid();
    if(!same(app.after.activity,applyChanges(app.before.activity,app.before,p.changes)))invalid();
    versions.set(a.activityId,(versions.get(a.activityId)??0)+1);
  }
  for(const [id,count] of versions){const list=w.actions.filter(a=>a.activityId===id&&a.corrective?.application).map(a=>a.corrective!.application!).sort((a,b)=>a.revision-b.revision);if(list.some((x,i)=>x.version!==i+2)||list.length!==count)invalid();}
  // Bounded DAG: dependencies express order only, never a computed legal priority.
  const done=new Set<string>(),active=new Set<string>();
  function visit(id:string){if(active.has(id))invalid();if(done.has(id))return;active.add(id);for(const d of w.actions.find(a=>a.id===id)?.corrective?.dependsOn??[])visit(d);active.delete(id);done.add(id);}
  for(const a of w.actions)if(a.corrective)visit(a.id);
}
function correctionContexts(before:Workspace,after:Workspace,id:string):{before:PiaContext;after:PiaContext} {
  const left=copyJson(piaContext(before,id)),right=copyJson(piaContext(after,id));
  const partyIds=new Set([...left.parties,...right.parties].map(p=>p.id)),systemIds=new Set([...left.systems,...right.systems].map(p=>p.id));
  left.parties=copyJson(before.parties.filter(p=>partyIds.has(p.id)));right.parties=copyJson(after.parties.filter(p=>partyIds.has(p.id)));
  left.systems=copyJson(before.systems.filter(p=>systemIds.has(p.id)));right.systems=copyJson(after.systems.filter(p=>systemIds.has(p.id)));
  return {before:left,after:right};
}
export function assertCorrectiveHistory(before:Workspace,after:Workspace,at:string):void {
  for(const old of before.actions){if(!old.corrective)continue;const next=after.actions.find(a=>a.id===old.id);if(!next?.corrective||next.activityId!==old.activityId||next.corrective.preparedAt<old.corrective.preparedAt||next.corrective.preparedRevision<old.corrective.preparedRevision)invalid();}
  for(const a of after.actions){const app=a.corrective?.application,old=before.actions.find(x=>x.id===a.id);if(!app||old?.corrective?.application)continue;
    if(!old?.corrective||old.closure||!a.closure||a.closure.at!==at||app.revision!==before.revision+1||app.version!==correctiveVersion(before,a.activityId!)+1||!same({...a,closure:null,corrective:{...a.corrective,application:null}},old))invalid();
    const contexts=correctionContexts(before,after,a.activityId!);
    if(!same(app.before,contexts.before)||!same(app.after,contexts.after))invalid();
    if(old.corrective.dependsOn.some(id=>!before.actions.find(a=>a.id===id)?.corrective?.application))invalid();
  }
}
export function correctiveReexamination(w:Workspace,activityId:string):string[]{return ['Analyse RGPD du traitement',...w.impactAssessments.filter(p=>p.activityId===activityId).map(p=>p.scope==='risks'?'Risques et mesures':'Étude d’impact (AIPD)'),...w.dpoCases.filter(c=>c.activityIds.includes(activityId)).map(c=>c.title)];}
