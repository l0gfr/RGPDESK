import { describe, it, expect } from "vitest";
import { createWorkspace, createActivity, createPurpose, createDataGroup, createDataFlow, createImpactAssessment, createPiaRisk, putActivity, putImpactAssessment, recordPiaReview, piaReviewState, projectPiaPublication, renderPiaPublication, projectShare, migrateWorkspace, assertWorkspace, reviseWorkspace, resolvedFlows, activityFacts, purposeRetention, evaluateWorkspace, dataGroupRows, dataGroupOpenPoints, activityProgress, knowledge as k, unknown } from "../src/index";
import validateV8 from "../src/generated/master-v8-validator.js";
let seq=910000; const id=()=>`00000000-0000-4000-8000-${String(seq++).padStart(12,"0")}`, now="2026-09-24T12:00:00.000Z";
function fixture(){
 const w=createWorkspace(id(),"Organisation fictive",now), a=createActivity(w.id,id(),"controller");
 if(a.role!=="controller")throw Error("fixture");
 const p=createPurpose(id()); p.description=k("Sous-finalité fictive"); a.purposes=[p];
 const g=createDataGroup(id(),1);g.data=k("DONNEES_GROUPE_FICTIF");g.people=k("Adhérents fictifs");g.purposeIds=[p.id];g.retention.period=k("Critère fictif documenté");g.retention.trigger=k("Événement fictif");g.guarantees=k("GARANTIE_SELECTION_EXPLICITE");a.dataGroups=[g];
 const f=createDataFlow(id());f.dataGroupIds=[g.id];f.sourceRef="subjects";f.destination=k("Équipe fictive");f.channel=k("Support fictif");f.access=k("Fonction fictive habilitée");a.flows=[f];a.internalNotes="PRIVATE_NOTES_CANARY";a.analysis.notes[0]!.evidence=k("PRIVATE_EVIDENCE_CANARY");w.activities=[a];assertWorkspace(w);return {w,a,p,g,f};
}
describe("one inventory, scoped groups and reused risks",()=>{
 it("migrates v8 strictly and preserves bytes, identifiers, revision and frozen reviews",()=>{
  const {w,a}=fixture();delete a.dataGroups;a.flows=[];
  const pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];
  const reviewed=recordPiaReview(w,pia.id,{id:id(),author:"Fictif",reason:"À examiner",outcome:"rework"},w.revision,now);
  const old={...reviewed,format:"rgpd-master-v8"};expect(validateV8(old)).toBe(true);const before=JSON.stringify(old);
  const next=migrateWorkspace(old);expect(next).toEqual({...old,format:"rgpd-master-v9"});expect(JSON.stringify(old)).toBe(before);
  expect(()=>migrateWorkspace({...old,hidden:"no"})).toThrow("INVALID");expect(()=>migrateWorkspace({...old,activities:[fixture().a]})).toThrow("INVALID");
 });
 it("resolves groups from their declared links, keeps no second data copy and includes retention by purpose",()=>{
  const {w,a,g,p}=fixture();expect(resolvedFlows(a,w)[0]!.data).toEqual(k("D1 : DONNEES_GROUPE_FICTIF"));
  g.data=k("VERSION_DEUX");expect(resolvedFlows(a,w)[0]!.data).toEqual(k("D1 : VERSION_DEUX"));
  const dto=projectShare(w,{profile:"article30-controller",recipient:"Fictif",scope:"Test",reservations:[],activityIds:[a.id],documentIds:[],clientId:null},id,now);
  expect(JSON.stringify(dto)).toContain("VERSION_DEUX");expect(JSON.stringify(dto)).not.toContain(g.id);
  const shared=dto.activities[0]!;expect(shared.role).toBe("controller");if(shared.role==="controller")expect(shared.purposes[0]!.retention.period).toEqual(k("D1 : Critère fictif documenté"));
  expect(p.legalBasis).toEqual(unknown());expect(a.dataCategories).toEqual(unknown());
 });
 it.each(["foreign-purpose","foreign-group","duplicate-code","duplicate-id","copied-data","activity-copy","invalid-code","unknown-key","oversized"])("rejects %s without changing the original",kind=>{
  const {w,a,g,f}=fixture();const before=JSON.stringify(w),bad=structuredClone(w),b=bad.activities[0]!,bg=b.dataGroups![0]!,bf=b.flows[0]!;
  if(kind==="foreign-purpose")bg.purposeIds=[id()];if(kind==="foreign-group")bf.dataGroupIds=[id()];
  if(kind==="duplicate-code")b.dataGroups!.push({...createDataGroup(id(),1)});
  if(kind==="duplicate-id")bg.id=a.id;
  if(kind==="copied-data")bf.data=k("COPY");if(kind==="activity-copy")bf.dataFromActivity=true;
  if(kind==="invalid-code")bg.code=0;if(kind==="unknown-key")Object.assign(bg,{secret:true});if(kind==="oversized")bg.data=k("a".repeat(4001));
  expect(()=>assertWorkspace(bad)).toThrow("INVALID");expect(JSON.stringify(w)).toBe(before);expect(f.dataGroupIds).toEqual([g.id]);
 });
 it("signals missing minimisation and distinguishes declared facts from completeness",()=>{
  const {a,g}=fixture();expect(dataGroupOpenPoints(a,g).join()).toContain("minimisation");g.people=unknown();expect(activityProgress(a)[1]!.state).toBe("missing");
  expect(g.retention.period.state).toBe("documented");expect(g.minimisation.retention.state).toBe("unknown");
 });
 it("resolves only the people of the selected flow groups",()=>{
  const {w,a,g}=fixture(), other=createDataGroup(id(),2);other.people=k("UNRELATED_PEOPLE_CANARY");a.dataGroups!.push(other);
  expect(resolvedFlows(a,w)[0]!.source).toEqual(k(`D1 : ${g.people.state === "documented" ? g.people.value : ""}`));
  expect(dataGroupRows(a,w)[0]!.rows.find(r=>r.label.includes("Parcours"))!.value).not.toContain("UNRELATED_PEOPLE_CANARY");
 });
 it("does not present a partially described group as a complete aggregate",()=>{
  const {w,a,p}=fixture(), second=createDataGroup(id(),2);second.purposeIds=[p.id];a.dataGroups!.push(second);
  expect(activityFacts(a,w).dataCategories.state).toBe("unknown");expect(activityFacts(a,w).dataSubjects.state).toBe("unknown");expect(activityFacts(a,w).recipients.state).toBe("unknown");
  expect(purposeRetention(a,p).period.state).toBe("unknown");expect(dataGroupRows(a,w)[0]!.rows[0]!.value).toBe("DONNEES_GROUPE_FICTIF");
  expect(evaluateWorkspace(w,"2026-09-24").some(f=>f.ruleId==="R-004" && f.scope===p.id)).toBe(true);
 });
 it("keeps finding keys stable when another group question is answered",()=>{
  const {w,g}=fixture();g.data=unknown();const before=evaluateWorkspace(w,"2026-09-24").find(f=>f.message.includes("minimisation"))!.key;
  g.data=k("Faits fictifs");expect(evaluateWorkspace(w,"2026-09-24").find(f=>f.message.includes("minimisation"))!.key).toBe(before);
 });
 it("renders an unfinished draft with a missing purpose as unknown",()=>{
  const {w,a,g}=fixture();g.purposeIds=[id()];expect(dataGroupRows(a,w)[0]!.rows[2]!.value).toBe("À documenter");expect(()=>assertWorkspace(w)).toThrow("INVALID");
 });
 it("freezes group facts, detects changes in minimisation, and rejects ref corruption in history",()=>{
  const {w,a,g}=fixture();const pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];
  const reviewed=recordPiaReview(w,pia.id,{id:id(),author:"Fictif",reason:"À examiner",outcome:"rework"},w.revision,now), frozen=JSON.stringify(reviewed.impactAssessments[0]!.reviews);
  const updated=structuredClone(a);updated.dataGroups![0]!.minimisation.channels=k("Canal supprimé après examen fictif");
  const next=putActivity(reviewed,updated,reviewed.revision,now);expect(piaReviewState(next,next.impactAssessments[0]!)).toBe("changed");expect(JSON.stringify(next.impactAssessments[0]!.reviews)).toBe(frozen);
  const bad=structuredClone(next);bad.impactAssessments[0]!.reviews[0]!.context.activity.dataGroups![0]!.purposeIds=[id()];expect(()=>assertWorkspace(bad)).toThrow("INVALID");
  updated.dataGroups![0]!.code=2;expect(()=>putActivity(reviewed,updated,reviewed.revision,now)).toThrow("INVALID");expect(g.code).toBe(1);
 });
 it("excludes group examination from default context export and includes only selected inventory rows",async()=>{
  const {w,a,g}=fixture();const pia=createImpactAssessment(w.id,a,id());w.impactAssessments=[pia];
  g.minimisation.data=k('<img src="https://invalid.test/x" onerror="invalid">');
  const options={piaId:pia.id,reviewId:null,sections:["context" as const],recipient:"Destinataire fictif",scope:"Périmètre fictif",reservations:""};
  const minimal=projectPiaPublication(w,options,id(),now);expect(JSON.stringify(minimal)).not.toContain("GARANTIE_SELECTION_EXPLICITE");
  const selected=projectPiaPublication(w,{...options,sections:["inventory"]},id(),now),html=await renderPiaPublication(selected);
  expect(html).toContain("GARANTIE_SELECTION_EXPLICITE");expect(html).toContain("&lt;img");expect(html).not.toContain('<img src=');
  for(const secret of [w.id,a.id,g.id,"PRIVATE_NOTES_CANARY","PRIVATE_EVIDENCE_CANARY"])expect(html).not.toContain(secret);
  expect(dataGroupRows(a,w)[0]!.rows.some(r=>r.label.includes("Sous-finalités"))).toBe(true);
 });
 it("starts risk work without declaring an AIPD, then reuses the exact scenarios on explicit promotion",()=>{
  const {w,a}=fixture(),study=createImpactAssessment(w.id,a,id());study.scope="risks";study.content.risks=[{...createPiaRisk(id()),title:"Risque fictif"}];
  const next=putImpactAssessment(w,study,w.revision,now);expect(next.impactAssessments[0]!.content.screeningDecision).toBe("unknown");
  expect(()=>recordPiaReview(next,study.id,{id:id(),author:"Fictif",reason:"Test",outcome:"rework"},next.revision,now)).toThrow("INVALID");
  expect(()=>projectPiaPublication(next,{piaId:study.id,reviewId:null,sections:["risks"],recipient:"Fictif",scope:"Test",reservations:""},id(),now)).toThrow("INVALID");
  const full=putImpactAssessment(next,{...study,scope:"aipd"},next.revision,now);expect(full.impactAssessments).toHaveLength(1);expect(full.impactAssessments[0]!.content.risks).toEqual(study.content.risks);
  expect(()=>reviseWorkspace(full,full.revision,now,{impactAssessments:[study]})).toThrow("INVALID");
 });
});
