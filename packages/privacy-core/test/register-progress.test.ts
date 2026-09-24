import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createActivity, createPurpose, knowledge, unknown, activityProgress, registerProgress } from "../src/index";
import { PROGRESS_STYLE } from "../src/share-progress.js";
const uid = (n:number) => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
function activity(){const a=createActivity(uid(1),uid(2),"controller");if(a.role!=="controller")throw new Error();a.purposes=[createPurpose(uid(3))];return a;}
test("empty register and missing purpose cannot look complete",()=>{
  expect(registerProgress([])).toEqual({rows:[],counts:{documented:0,partial:0,missing:0},total:0});
  const a=activity();a.purposes=[];expect(registerProgress([a]).counts).toEqual({documented:0,partial:0,missing:6});
});
test("multiple purposes count each missing value and separate partial from filled",()=>{
  const a=activity();a.purposes.push(createPurpose(uid(4)));a.purposes[0]!.description=knowledge("Fictif");a.purposes[0]!.retention.period=knowledge("Critère fictif");
  let points=activityProgress(a);expect(points[0]).toMatchObject({state:"partial",documented:1,total:2});expect(points[4]).toMatchObject({state:"partial",documented:1,total:4});
  for(const p of a.purposes){p.description=knowledge("Fictif");p.retention={period:knowledge("Critère"),trigger:knowledge("Début")};}
  points=activityProgress(a);expect(points[0]!.state).toBe("documented");expect(points[4]!.state).toBe("documented");
});
test("progress is independent of lawfulness, internal notes, workflow status and private proofs",()=>{
 const a=activity();const before=activityProgress(a);a.internalNotes="PRIVATE_NOTE";a.status="active";a.purposes[0]!.legalBasis=knowledge("PRIVATE_BASIS");expect(activityProgress(a)).toEqual(before);
 a.status="archived";expect(activityProgress(a)).toEqual(before);expect(JSON.stringify(registerProgress([a]))).not.toContain("PRIVATE_");
});
test("processor uses operations and selected clients, never invented retention fields",()=>{
 const a=createActivity(uid(1),uid(2),"processor");if(a.role!=="processor")throw new Error();a.operations=knowledge("Opération fictive");a.controllerIds=[uid(3)];
 const points=activityProgress(a);expect(points[0]).toMatchObject({label:"Opérations",state:"documented"});expect(points[4]).toMatchObject({label:"Clients responsables",state:"documented",step:1});expect(JSON.stringify(points)).not.toContain("Conservation");
});
test("declared non-applicability is a filled statement, not legal acceptance, while whitespace stays missing",()=>{
 const a=activity();a.transfers=knowledge("Aucun transfert déclaré, à examiner");expect(activityProgress(a)[5]).toMatchObject({state:"partial",documented:1,total:2});a.securityMeasures={state:"documented",value:"  "};expect(activityProgress(a)[5]!.state).toBe("partial");a.transfers=unknown();expect(activityProgress(a)[5]!.state).toBe("missing");
});
test("totals equal the six visible groups per activity, with no percent or weighted score",()=>{
 const a=activity();a.dataSubjects=knowledge("Personnes fictives");const result=registerProgress([a,activity()]);expect(result.counts).toEqual({documented:1,partial:0,missing:11});expect(result.total).toBe(12);expect(Object.values(result.counts).reduce((x,y)=>x+y,0)).toBe(result.total);
});
test("app and passive report use the same self-contained progress stylesheet",()=>{
 expect(PROGRESS_STYLE).toBe(readFileSync(new URL("../../../apps/web/src/features/privacy/assets/register-progress.css",import.meta.url),"utf8"));expect(PROGRESS_STYLE).not.toMatch(/url\(|@import/);
});
