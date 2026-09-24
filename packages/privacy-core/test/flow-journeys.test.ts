import { describe,it,expect } from "vitest";
import { createWorkspace,createActivity,createPurpose,createDataGroup,createDataFlow,createFlowStep,assertWorkspace,migrateWorkspace,knowledge as k,unknown,groupPurposeIds,resolveFlow,journeySteps,dataGroupRows,nextJourneyReference,createImpactAssessment,recordPiaReview,putActivity,piaReviewState,piaContext,projectShare,projectPiaPublication,renderPiaPublication,entityDossier } from "../src/index";
import validateV9 from "../src/generated/master-v9-validator.js";
let seq=980000;const id=()=>`00000000-0000-4000-8000-${String(seq++).padStart(12,"0")}`,now="2026-09-24T15:00:00.000Z";
function fixture(){
 const w=createWorkspace(id(),"Atelier fictif",now),a=createActivity(w.id,id(),"controller");if(a.role!=="controller")throw Error("fixture");
 a.purposes=[createPurpose(id()),createPurpose(id())];a.purposes[0]!.description=k("Préparer un atelier fictif");a.purposes[1]!.description=k("Organiser les places fictives");
 a.dataGroups=[createDataGroup(id(),1),createDataGroup(id(),2)];a.dataGroups[0]!.data=k("Catégorie fictive A");a.dataGroups[1]!.data=k("Catégorie fictive B");a.dataGroups.forEach(g=>g.people=k("Participants fictifs"));
 a.flowSupports=[{id:id(),code:1,name:"Boîte de contact fictive"},{id:id(),code:2,name:"Liste fictive"},{id:id(),code:3,name:"Document de synthèse fictif"}];
 for(const [group,n,ps] of [[0,3,[0,1]],[0,1,[1]],[1,2,[0]],[1,1,[0]],[1,1,[0]]] as const){
  const f=createDataFlow(id());f.dataGroupIds=[a.dataGroups[group]!.id];f.journey={reference:nextJourneyReference(a,a.dataGroups[group]!.id),purposeIds:ps.map(i=>a.purposes[i]!.id),steps:Array.from({length:n},()=>createFlowStep(id()))};
  f.journey.steps.forEach((s,i)=>{s.operation=k(`Opération fictive ${i+1}`);s.access=k("Rôle fictif autorisé");s.supportIds=[a.flowSupports![Math.min(i,2)]!.id];});a.flows.push(f);
 }
 w.activities=[a];assertWorkspace(w);return {w,a,f:a.flows[0]!,step:a.flows[0]!.journey!.steps[0]!};
}
describe("linked journeys inside data groups",()=>{
 it("keeps five paths and eight operations distinct with shared supports and scoped purposes",()=>{
  const {w,a,f,step}=fixture();expect(a.flows.map(f=>f.journey!.reference)).toEqual(["1a","1b","2a","2b","2c"]);expect(a.flows.flatMap(f=>f.journey!.steps)).toHaveLength(8);
  expect(groupPurposeIds(a,a.dataGroups![0]!)).toEqual(a.purposes.map(p=>p.id));expect(a.dataGroups![0]!.purposeIds).toEqual([]);
  const other=resolveFlow(a.flows[1]!,a,w);expect(other.operation).toEqual({state:"documented",value:expect.stringContaining("SF2")});expect(JSON.stringify(other)).not.toContain("SF1");
  step.when=k("À la clôture fictive");expect(resolveFlow(f,a,w).operation).toEqual({state:"documented",value:expect.stringContaining("À la clôture fictive")});
  step.sourceRef=`support:${a.flowSupports![0]!.id}`;step.destinationRef=`support:${a.flowSupports![1]!.id}`;step.supportIds=[];assertWorkspace(w);expect(journeySteps(a,f,w)[0]!.destination).toContain("Support 2");
  a.flowSupports![0]!.name="Support fictif renommé";expect(journeySteps(a,f,w)[0]!.supports).toContain("renommé");expect(a.purposes[0]!.legalBasis).toEqual(unknown());expect(a.dataGroups![0]!.retention.period).toEqual(unknown());
 });
 it("migrates v9 without changing data, revisions or old frozen contexts",()=>{
  const {w,a}=fixture();a.flows=[];delete a.flowSupports;w.impactAssessments=[createImpactAssessment(w.id,a,id())];
  const reviewed=recordPiaReview(w,w.impactAssessments[0]!.id,{id:id(),author:"Fictif",reason:"Lecture fictive",outcome:"rework"},w.revision,now),old={...reviewed,format:"rgpd-master-v9"};
  expect(validateV9(old)).toBe(true);const before=JSON.stringify(old);expect(migrateWorkspace(old)).toEqual({...old,format:"rgpd-master-v10"});expect(JSON.stringify(old)).toBe(before);
  expect(()=>migrateWorkspace({...fixture().w,format:"rgpd-master-v9"})).toThrow("INVALID");
 });
 it.each(["foreign-support","foreign-support-endpoint","foreign-purpose","duplicate-step","duplicate-support-code","duplicate-reference","copied-root","unknown-property","too-many-steps","oversized"])("rejects %s",kind=>{
  const {w,a,f,step}=fixture();
  if(kind==="foreign-support")step.supportIds=[id()];if(kind==="foreign-support-endpoint")step.sourceRef=`support:${id()}`;if(kind==="foreign-purpose")f.journey!.purposeIds=[id()];if(kind==="duplicate-step")step.id=a.id;
  if(kind==="duplicate-support-code")a.flowSupports![1]!.code=1;if(kind==="duplicate-reference")a.flows[1]!.journey!.reference="1a";
  if(kind==="copied-root")f.operation=k("Ambiguous duplicate");if(kind==="unknown-property")Object.assign(step,{payload:"no"});
  if(kind==="too-many-steps")f.journey!.steps=Array.from({length:9},()=>createFlowStep(id()));if(kind==="oversized")step.operation=k("a".repeat(4001));
  expect(()=>assertWorkspace(w)).toThrow("INVALID");
 });
 it("freezes linked inventory and detects a changed condition without rewriting history",()=>{
  const {w,a,f,step}=fixture(),system={id:id(),workspaceId:w.id,name:"Système fictif",description:unknown()};w.systems=[system];step.sourceRef=`system:${system.id}`;
  expect(piaContext(w,a.id).systems).toEqual([system]);expect(entityDossier(w,"system",system.id).flows).toHaveLength(1);
  const pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];const reviewed=recordPiaReview(w,pia.id,{id:id(),author:"Fictif",reason:"Lecture fictive",outcome:"rework"},w.revision,now),before=JSON.stringify(reviewed.impactAssessments[0]!.reviews);
  const updated=structuredClone(a);updated.flows[0]!.journey!.steps[0]!.when=k("NOUVELLE_CONDITION_FICTIVE");const next=putActivity(reviewed,updated,reviewed.revision,now);
  expect(piaReviewState(next,next.impactAssessments[0]!)).toBe("changed");expect(JSON.stringify(next.impactAssessments[0]!.reviews)).toBe(before);
  const corrupt=structuredClone(next);corrupt.impactAssessments[0]!.reviews[0]!.context.activity.flows[0]!.journey!.steps[0]!.supportIds=[id()];expect(()=>assertWorkspace(corrupt)).toThrow("INVALID");
  updated.flows[0]!.journey!.reference="3a";expect(()=>putActivity(reviewed,updated,reviewed.revision,now)).toThrow("INVALID");expect(f.journey!.reference).toBe("1a");
 });
 it("projects ordered text only on explicit selection and escapes markup",async()=>{
  const {w,a,f,step}=fixture();step.operation=k("<em>EXEMPLE_FICTIF</em>");a.internalNotes="PRIVATE_JOURNEY_NOTE";
  const opts={profile:"article30-controller" as const,recipient:"Fictif",scope:"Fictif",reservations:[],activityIds:[a.id],documentIds:[],clientId:null};
  expect(JSON.stringify(projectShare(w,opts,id,now))).not.toContain("EXEMPLE_FICTIF");
  const selected=projectShare(w,{...opts,flowIds:[f.id]},id,now);expect(selected.flows![0]!.operation).toEqual({state:"documented",value:expect.stringContaining("Parcours 1a")});
  for(const secret of [step.id,a.flowSupports![0]!.id,"PRIVATE_JOURNEY_NOTE"])expect(JSON.stringify(selected)).not.toContain(secret);
  const pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];const dto=projectPiaPublication(w,{piaId:pia.id,reviewId:null,sections:["inventory"],recipient:"Fictif",scope:"Fictif",reservations:""},id(),now),html=await renderPiaPublication(dto);
  expect(html).toContain("&lt;em&gt;EXEMPLE_FICTIF");expect(html).not.toContain("<em>EXEMPLE_FICTIF");expect(dataGroupRows(a,w)[0]!.rows.some(r=>r.value.includes("Parcours 1a"))).toBe(true);
 });
});
