import {CATALOG,CATALOG_VERSION} from "./catalog";
import { knowledge, type DocumentaryAction, type Activity, type ReviewNote, type Workspace, type WorkCheckpoint, type CitationReview } from "./model";
import { reviseWorkspace } from "./commands";
import { PrivacyError, assertWorkspace } from "./validation";

/** Only current, explicitly linked questions. Historical reviews are deliberately excluded. */
export function reviewTargets(w: Workspace): {key: string; title: string; activityIds: string[]; note: ReviewNote}[] {
  const rows: ReturnType<typeof reviewTargets> = [];
  const add = (prefix: string, title: string, activityIds: string[], notes: ReviewNote[]) => notes.forEach((note, i) => rows.push({key:`${prefix}/${note.questionId}`,title:`${title} · question ${i+1}`,activityIds,note}));
  w.activities.forEach(a => add(`activity/${a.id}`,`RGPD · ${a.title}`,[a.id],a.analysis.notes));
  w.impactAssessments.forEach(p => { const title=w.activities.find(a=>a.id===p.activityId)?.title ?? "Activité"; add(`pia/${p.id}/principles`,`AIPD · Principes · ${title}`,[p.activityId],p.content.principles); add(`pia/${p.id}/necessity`,`AIPD · Nécessité · ${title}`,[p.activityId],p.content.necessity.notes); });
  w.dpoCases.forEach(c=>add(`dpo/${c.id}`,c.title,c.activityIds,c.content.notes));
  w.documents.forEach(d=>{if(d.contractReview)add(`document/${d.id}`,`Contrat · ${d.title}`,d.activityIds,d.contractReview.notes);});
  return rows;
}
export function reexaminationQueue(w: Workspace) {
  return reviewTargets(w).flatMap(target=>(target.note.citations ?? []).flatMap(citation=>{
    const document=w.documents.find(d=>d.id===citation.documentId);
    return document && document.version!==citation.version ? [{target,citation,document}] : [];
  }));
}
export function reexamineCitation(w: Workspace, input: {target: string; documentId: string; locator: string; fromVersion: string; toVersion: string; outcome: CitationReview["outcome"]; assessment: string; author: string; reason: string}, expectedRevision: number, at: string): Workspace {
  assertWorkspace(w);
  if(w.revision!==expectedRevision)throw new PrivacyError("CONFLICT");
  const next=structuredClone(w), row=reexaminationQueue(next).find(r=>r.target.key===input.target && r.citation.documentId===input.documentId && r.citation.locator===input.locator);
  if(!row || row.citation.version!==input.fromVersion || row.document.version!==input.toVersion)throw new PrivacyError("CONFLICT");
  const before=structuredClone(row.target.note.assessment), after=input.outcome==="maintained" ? before : knowledge(input.assessment);
  if(!input.author.trim() || !input.reason.trim() || after.state!=="documented")throw new PrivacyError("INVALID");
  const review: CitationReview={target:input.target,documentId:input.documentId,locator:input.locator,meaning:row.citation.meaning,fromVersion:input.fromVersion,toVersion:input.toVersion,before,after:structuredClone(after),outcome:input.outcome,author:input.author.trim(),reason:input.reason.trim(),at,revision:w.revision+1};
  row.citation.version=row.document.version; row.target.note.assessment=after;
  return reviseWorkspace(w,expectedRevision,at,{activities:next.activities,impactAssessments:next.impactAssessments,dpoCases:next.dpoCases,documents:next.documents,citationReviews:[...(w.citationReviews ?? []),review]});
}
export function checkpointExists(w: Workspace, c: WorkCheckpoint): boolean {
  const field={activity:"activities",pia:"impactAssessments",dpo:"dpoCases",document:"documents",party:"parties",system:"systems"} as const;
  return w[field[c.kind]].some(item=>item.id===c.id);
}
export function assertWorkbench(w: Workspace): void {
  if(w.workCheckpoint && !checkpointExists(w,w.workCheckpoint))throw new PrivacyError("INVALID");
  let revision=0;
  for(const r of w.citationReviews ?? []) {
    if(r.revision<=revision || r.revision>w.revision || r.at>w.updatedAt || r.at<w.createdAt || r.fromVersion===r.toVersion || !r.reason.trim() || !r.author.trim() || r.after.state!=="documented" || (r.outcome==="maintained" && JSON.stringify(r.before)!==JSON.stringify(r.after)))throw new PrivacyError("INVALID");
    revision=r.revision;
  }
}
export function entityDossier(w: Workspace, kind: "party" | "system", id: string) {
  const ref=`${kind}:${id}`, linked=(a: Activity)=>kind==="system" ? a.systemIds.includes(id) : a.participantIds.includes(id)||a.review.subcontractorIds.includes(id)||(a.role==="processor"&&a.controllerIds.includes(id));
  const activities=w.activities.filter(a=>linked(a)||a.flows.some(f=>f.sourceRef===ref||f.destinationRef===ref));
  const ids=new Set(activities.map(a=>a.id));
  const documents=w.documents.filter(d=>(kind==="party"&&d.partyIds.includes(id))||d.activityIds.some(a=>ids.has(a)));
  return {activities, flows:activities.flatMap(a=>a.flows.filter(f=>f.sourceRef===ref||f.destinationRef===ref).map(flow=>({activity:a,flow}))),documents,questions:reviewTargets(w).filter(t=>t.activityIds.some(a=>ids.has(a)) && t.note.citations?.some(c=>documents.some(d=>d.id===c.documentId))),actions:w.actions.filter(a=>a.activityId!==null&&ids.has(a.activityId)&&!a.closure)};
}

/** Display the question the DPO chose to track, without inventing an instruction. */
export function documentaryActionLabel(a: Pick<DocumentaryAction,"catalogVersion"|"ruleId"|"scope">): string {
  const title=a.catalogVersion===CATALOG_VERSION?CATALOG.find(r=>r.id===a.ruleId)?.title:undefined;
  return `${title??a.ruleId} · ${a.scope}`;
}
