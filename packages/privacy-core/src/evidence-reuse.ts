import { reviseWorkspace } from "./commands";
import { reviewTargets } from "./workbench";
import type { DocumentFingerprint, EvidenceReference, Workspace } from "./model";
import { assertWorkspace, PrivacyError } from "./validation";
/** This is byte identity within this vault only, never an authenticity judgment. */
export function matchingReferences(documents: EvidenceReference[], fingerprint: DocumentFingerprint, exceptId = ""): EvidenceReference[] {
  return documents.filter(d=>d.id!==exceptId && d.fingerprint?.sha256===fingerprint.sha256 && d.fingerprint.bytes===fingerprint.bytes);
}
/** Link an existing version to explicitly selected current questions, in one guarded revision. */
export function citeEvidence(w: Workspace, documentId: string, keys: string[], locator: string, meaning: string, revision: number, at: string): Workspace {
  assertWorkspace(w);
  if (!keys.length || keys.length>20 || new Set(keys).size!==keys.length || !locator.trim() || !meaning.trim()) throw new PrivacyError("INVALID");
  const next=structuredClone(w), doc=next.documents.find(d=>d.id===documentId);
  if (!doc || !doc.version.trim()) throw new PrivacyError("INVALID");
  const rows=reviewTargets(next), selected=keys.map(k=>rows.find(r=>r.key===k));
  if(selected.some(r=>!r || r.key.startsWith('document/') && !r.key.startsWith(`document/${documentId}/`))) throw new PrivacyError("INVALID");
  const linked=new Set(doc.activityIds);
  for(const target of selected){
    target!.activityIds.forEach(id=>linked.add(id));
    const citations=target!.note.citations ?? [];
    if(citations.some(c=>c.documentId===documentId && c.locator===locator.trim())) throw new PrivacyError("COLLISION");
    target!.note.citations=[...citations,{documentId,version:doc.version,locator:locator.trim(),meaning:meaning.trim()}];
  }
  if(linked.size!==doc.activityIds.length){doc.activityIds=[...linked];doc.status='declared';doc.reviewedAt=null;doc.reviewedRevision=null;}
  return reviseWorkspace(w,revision,at,{documents:next.documents,activities:next.activities,impactAssessments:next.impactAssessments,dpoCases:next.dpoCases});
}
