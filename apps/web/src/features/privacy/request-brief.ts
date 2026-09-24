import { CATALOG, evaluateWorkspace, type Workspace } from "@rgpdesk/privacy-core";
import { questionPlaybook } from "./guidance";
export interface RequestItem { key:string; activityId:string|null; activity:string; question:string; evidence:string; owner:string; due:string }
/** Positive projection only: no notes, paths, citations, fingerprints or document titles. */
export function requestItems(w:Workspace,day:string):RequestItem[] {
  const findings=evaluateWorkspace(w,day), result:RequestItem[]=[];
  for(const f of findings){
    const tracked=w.actions.find(a=>a.findingKey===f.key&&!a.closure), playbook=questionPlaybook[f.ruleId];
    result.push({key:`finding:${f.key}`,activityId:f.activityId,activity:w.activities.find(a=>a.id===f.activityId)?.title??"Organisation",question:playbook?.ask??CATALOG.find(r=>r.id===f.ruleId)?.title??f.ruleId,evidence:playbook?.find??"",owner:tracked?.owner??"",due:tracked?.due??""});
  }
  for(const a of w.actions.filter(a=>!a.closure&&!findings.some(f=>f.key===a.findingKey))){const p=questionPlaybook[a.ruleId];result.push({key:`action:${a.id}`,activityId:a.activityId,activity:w.activities.find(x=>x.id===a.activityId)?.title??"Organisation",question:p?.ask??CATALOG.find(r=>r.id===a.ruleId)?.title??a.ruleId,evidence:p?.find??"",owner:a.owner,due:a.due??""});}
  for(const a of w.activities)for(const [i,q] of (a.interviewQuestions??[]).entries())result.push({key:`interview:${a.id}:${i}`,activityId:a.id,activity:a.title,question:q,evidence:"",owner:"",due:""});
  return result;
}
export function requestText(recipient:string,items:RequestItem[]):string {
  if(!recipient.trim()||recipient.length>160||!items.length||items.length>30)throw new Error("INVALID_REQUEST");
  return `Questions et pièces à réunir\nÀ l’attention de : ${recipient.trim()}\n\nMerci de préciser les points ci-dessous et de signaler les informations indisponibles. Conservez les originaux dans votre espace documentaire habituel.\n\n`+items.map((i,n)=>`${n+1}. ${i.activity}\n${i.question}${i.evidence?`\nÀ retrouver : ${i.evidence}`:""}${i.due?`\nÉchéance convenue à confirmer : ${i.due}`:""}`).join("\n\n")+"\n\nDemande préparée par le rédacteur. Aucune réponse ni réception n’est présumée.\n";
}
