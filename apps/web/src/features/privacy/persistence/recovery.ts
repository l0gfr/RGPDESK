import { canonicalJson, validateRecoveryDraft, validateRecoveryDraftV1, parseBoundedJson, PrivacyError, type Activity, type Workspace, type DpoCase, type DpoReview, type ImpactAssessment, type PiaReview, type EvidenceReference, type Party, type System } from "@rgpdesk/privacy-core";
export type RecoveryForm =
 | {kind:'activity';draft:Activity;documentIds:string[];section:'record'|'analysis'|'flows'|'evidence'|'interview';step:number}
 | {kind:'dpo';draft:DpoCase;step:'scope'|'analysis'|'events'|'review';reviewAuthor:string;reviewReason:string;eventAt:string;eventAuthor:string;eventText:string;eventEvidence:string;outcome:DpoReview['outcome']}
 | {kind:'pia';draft:ImpactAssessment;step:number;author:string;reason:string;outcome:PiaReview['outcome']}
 | {kind:'document';draft:EvidenceReference;due:string}
 | {kind:'organization';draft:Pick<Workspace,'organization'|'scope'|'jurisdiction'>}
 | {kind:'party';draft:Party} | {kind:'system';draft:System}
 | {kind:'actions';selectedKey:string;owner:string;due:string;closing:string;author:string;justification:string;showDecision:boolean;decisionRule:string;decisionActivity:string;conclusion:string}
 | {kind:'request-prepare';recipient:string;due:string;owner:string;selected:string[]}
 | {kind:'request-reply';requestId:string;itemId:string;replyId:string;mode:'reply'|'apply'|'close';text:string;author:string;documentIds:string[];field:string}
 | {kind:'evidence-links';documentId:string;keys:string[];locator:string;meaning:string}
 | {kind:'reexamination';selected:string;locator:string;documentId:string;author:string;reason:string;assessment:string;outcome:'maintained'|'revised'};
export interface RecoveryDraft {format:'rgpd-draft-v1'|'rgpd-draft-v2';workspaceId:string;revision:number;id:string;sequence:number;updatedAt:string;form:RecoveryForm}
export interface RecoveryReceipt {id:string;sequence:number}
export interface RecoveryGuard {getRecovery:()=>RecoveryForm|null;restoreRecovery:(form:RecoveryForm)=>void|Promise<void>}
export const MAX_DRAFT_BYTES=1024*1024;
export function parseRecovery(value:unknown):RecoveryDraft {
  const bounded=parseBoundedJson(JSON.stringify(value),MAX_DRAFT_BYTES);
  if(!(bounded && typeof bounded === 'object' && 'format' in bounded && bounded.format === 'rgpd-draft-v1' ? validateRecoveryDraftV1(bounded) : validateRecoveryDraft(bounded)))throw new PrivacyError('INVALID');
  const d=bounded as RecoveryDraft;
  if('draft' in d.form&&'workspaceId' in d.form.draft&&d.form.draft.workspaceId!==d.workspaceId)throw new PrivacyError('INVALID');
  return d;
}
export const RECOVERY_LABELS={'request-prepare':'Demande aux métiers','request-reply':'Réponse ou relecture de demande','evidence-links':'Liens vers une preuve',activity:'Fiche de traitement',dpo:'Dossier DPO',pia:'Étude AIPD',document:'Référence documentaire',organization:'Organisation',party:'Intervenant',system:'Système',actions:'Action ou décision à consigner',reexamination:'Relecture de preuve'};
export function recoveryTitle(f:RecoveryForm):string {
  return 'draft' in f&&'title' in f.draft ? f.draft.title : 'draft' in f&&'name' in f.draft ? f.draft.name : RECOVERY_LABELS[f.kind];
}
export function recoveryKey(f:RecoveryForm):string {return f.kind+('draft' in f&&'id' in f.draft?':'+f.draft.id:'');}
export function recoveryContent(f:RecoveryForm):string {return canonicalJson(f);}
