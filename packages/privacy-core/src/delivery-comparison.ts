import { assertShare, canonicalJson, PROFILE_LABELS, COVERAGE_LABELS } from "./share-format.js";
import { knowledgeText, type Knowledge } from "./model";
import type { SharedActivity, SharedRegister } from "./share";
export interface DeliveryDifference {section:string;label:string;before:string;after:string;structured:boolean}
const key=(a:SharedActivity)=>canonicalJson([a.role,a.title]);
const knowledge=(k:Knowledge)=>k.state==='unknown'?'À documenter':`Déclaré : ${knowledgeText(k)}`;
const lines=(values:unknown[])=>values.map(v=>typeof v==='string'?v:canonicalJson(v)).sort().join('\n');
/** Uses only the two verified share DTOs. Opaque delivery IDs are intentionally not identities. */
export function compareDeliveries(before: SharedRegister, after: SharedRegister): {differences:DeliveryDifference[];ambiguous:string[];scopeChanged:boolean} {
  assertShare(before); assertShare(after);
  const differences:DeliveryDifference[]=[], ambiguous:string[]=[];
  const add=(section:string,label:string,a:string,b:string,structured=false)=>{if(a!==b)differences.push({section,label,before:a,after:b,structured});};
  const shared: [string, (s:SharedRegister)=>string][] = [
    ['Profil',s=>PROFILE_LABELS[s.profile]],['Destinataire',s=>s.recipient],['Périmètre',s=>s.scope],['Réserves',s=>canonicalJson([...s.reservations].sort())],
    ['Couverture',s=>COVERAGE_LABELS[s.coverage]],['Catalogue',s=>s.catalogVersion],['Organisation',s=>canonicalJson(s.organization)],
    ['Lecture pour la direction',s=>s.executive?canonicalJson(s.executive):'Non incluse'],
  ];
  shared.forEach(([label,read])=>add('Cadre du partage',label,read(before),read(after),['Organisation','Lecture pour la direction','Réserves'].includes(label)));
  const names=new Set([...before.activities,...after.activities].map(key));
  for(const name of names){
    const aa=before.activities.filter(a=>key(a)===name),bb=after.activities.filter(a=>key(a)===name), title=(aa[0]??bb[0])!.title;
    if(aa.length>1||bb.length>1){ambiguous.push(title);continue;}
    const a=aa[0],b=bb[0];
    if(!a||!b){add('Activités',title,a?'Présente dans ce dossier':'Absente de ce dossier',b?'Présente dans ce dossier':'Absente de ce dossier');continue;}
    const fields={dataSubjects:'Personnes',dataCategories:'Données',recipients:'Destinataires',transfers:'Transferts',securityMeasures:'Mesures de sécurité'} as const;
    for(const [field,label] of Object.entries(fields))add(title,label,knowledge(a[field as keyof typeof fields]),knowledge(b[field as keyof typeof fields]));
    if(a.role==='controller'&&b.role==='controller'){
      const purposes=(x:typeof a)=>lines(x.purposes.map(p=>({description:p.description,legalBasis:p.legalBasis,retention:p.retention})));
      add(title,'Finalités et déclarations associées',purposes(a),purposes(b),true);
    }
    if(a.role==='processor'&&b.role==='processor'){
      add(title,'Opérations',knowledge(a.operations),knowledge(b.operations));
      const controllers=(s:SharedRegister,x:typeof a)=>lines(x.controllerIds.map(id=>{const p=s.parties.find(p=>p.id===id)!;return {name:p.name,contact:p.contact};}));
      add(title,'Responsables de traitement',controllers(before,a),controllers(after,b),true);
    }
  }
  const activity=(s:SharedRegister,id:string|null)=>id===null?'Organisation':(()=>{const a=s.activities.find(a=>a.id===id)!;return {title:a.title,role:a.role};})();
  add('Intervenants','Informations communiquées',lines(before.parties.map(p=>({name:p.name,contact:p.contact}))),lines(after.parties.map(p=>({name:p.name,contact:p.contact}))),true);
  const groups: [string,(s:SharedRegister)=>unknown[]][] = [
    ['Flux',s=>(s.flows??[]).map(f=>({activity:activity(s,f.activityId),source:f.source,destination:f.destination,operation:f.operation,data:f.data,channel:f.channel,location:f.location,access:f.access}))],
    ['Références publiques',s=>s.references.map(r=>({text:r.text,activities:r.activityIds.map(id=>activity(s,id)).sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b)))}))],
    ['Positions',s=>(s.positions??[]).map(p=>({activity:activity(s,p.activityId),position:p.position,reason:p.reason}))],
    ['Suites annoncées',s=>(s.nextSteps??[]).map(p=>({activity:activity(s,p.activityId),task:p.task,owner:p.owner,due:p.due}))],
  ];
  // Multiset subtraction preserves duplicates; an omission is never a closure or deletion claim.
  for(const [section,read] of groups){
    const old=read(before).map(v=>canonicalJson(v)), next=read(after).map(v=>canonicalJson(v)), removed:string[]=[];
    for(const value of old){const index=next.indexOf(value);if(index<0)removed.push(value);else next.splice(index,1);}
    if(removed.length||next.length)add(section,'Contenu uniquement présent dans chaque dossier',removed.join('\n'),next.join('\n'),true);
  }
  return {differences,ambiguous,scopeChanged:before.profile!==after.profile||before.recipient!==after.recipient||before.scope!==after.scope};
}
