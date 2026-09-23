import { describe, expect, it } from "vitest";
import { assertWorkspace, createWorkspace, createActivity, unknown, putDocument, putActivity, nextDocumentCode, migrateWorkspace, projectShare, type EvidenceReference } from "../src/index";
import validateV6 from "../src/generated/master-v6-validator.js";
const at = "2026-09-23T12:00:00.000Z";
const hash = "a".repeat(64);
function fixture() {
  const w = createWorkspace(crypto.randomUUID(), "Organisation fictive", at);
  const activity = createActivity(w.id, crypto.randomUUID(), "controller"); activity.title = "Activité fictive";
  const doc: EvidenceReference = { id:crypto.randomUUID(),workspaceId:w.id,title:"Référence fictive",category:"other",contractReview:null,activityIds:[activity.id],purposeIds:[],partyIds:[],scope:"Périmètre fictif",version:"v1",declaredAuthor:"",internalRef:"LOCAL_PRIVATE_PATH",publicReference:"Référence publique",reservations:"",sensitivity:"internal",status:"declared",reviewedRevision:null,reviewedAt:null,reviewDue:null,audience:"",channel:"",availability:unknown() };
  return putDocument(putActivity(w,activity,w.revision,at),doc,at);
}
const fingerprint = () => ({algorithm:"SHA-256" as const,sha256:hash,bytes:3,capturedAt:at,version:"v1"});
describe("document organization without binary storage", () => {
  it("migrates v6 without altering the source, revision, IDs or historical arrays", () => {
    const w=fixture(), old={...w,format:"rgpd-master-v6"}; const before=JSON.stringify(old);
    expect(validateV6(old)).toBe(true);
    const migrated=migrateWorkspace(old);
    expect(migrated).toEqual({...old,format:"rgpd-master-v7"}); expect(JSON.stringify(old)).toBe(before);
    expect(validateV6({...old,documents:[{...w.documents[0]!,documentCode:"DOC-0001"}]})).toBe(false);
  });
  it("allocates and retains mission-local references across edits and rejects reuse", () => {
    const w=fixture(), doc={...w.documents[0]!,documentCode:nextDocumentCode(w.documents)};
    const saved=putDocument(w,doc,at); expect(doc.documentCode).toBe("DOC-0001");
    const edited=putDocument(saved,{...doc,title:"Titre changé",internalRef:"Nouvel emplacement"},at);
    expect(edited.documents[0]!.documentCode).toBe("DOC-0001"); expect(nextDocumentCode(edited.documents)).toBe("DOC-0002");
    expect(()=>putDocument(edited,{...doc,documentCode:"DOC-0002"},at)).toThrow("INVALID");
    expect(()=>putDocument(edited,{...doc,id:crypto.randomUUID()},at)).toThrow("INVALID");
    expect(()=>nextDocumentCode([{...doc,documentCode:"DOC-999999"}])).toThrow("LIMIT");
  });
  it("strictly validates optional metadata, byte limits and timestamps", () => {
    const w=fixture(); const doc={...w.documents[0]!,documentCode:"DOC-0001",fingerprint:fingerprint()};
    expect(()=>putDocument(w,doc,at)).not.toThrow();
    const bad = [ {documentCode:"DOC-0000"}, {documentCode:"../x"}, {fingerprint:{...fingerprint(),filename:"PRIVATE"}}, {fingerprint:{...fingerprint(),sha256:"A".repeat(64)}}, {fingerprint:{...fingerprint(),bytes:20971521}}, {fingerprint:{...fingerprint(),bytes:-1}}, {fingerprint:{...fingerprint(),bytes:1.5}}, {fingerprint:{...fingerprint(),algorithm:"SHA-1"}}, {fingerprint:{...fingerprint(),capturedAt:"2027-01-01T00:00:00.000Z"}} ];
    for(const patch of bad) expect(()=>assertWorkspace({...w,documents:[{...doc,...patch}]})).toThrow("INVALID");
    expect(()=>putDocument(w,{...doc,fingerprint:{...fingerprint(),version:"v0"}},at)).toThrow("INVALID");
  });
  it("does not silently replace a baseline and requires a distinct declared version", () => {
    const w=fixture(), doc={...w.documents[0]!,fingerprint:fingerprint()}; const saved=putDocument(w,doc,at);
    expect(()=>putDocument(saved,{...doc,fingerprint:{...fingerprint(),sha256:"b".repeat(64)}},at)).toThrow("INVALID");
    expect(()=>putDocument(saved,{...doc,fingerprint:undefined},at)).toThrow("INVALID");
    expect(()=>putDocument(saved,{...doc,version:"v2"},at)).not.toThrow();
    const next=putDocument(saved,{...doc,version:"v2",fingerprint:{...fingerprint(),sha256:"b".repeat(64),version:"v2"}},at);
    expect(next.documents[0]!.fingerprint?.version).toBe("v2"); expect(saved.documents[0]!.fingerprint).toEqual(fingerprint());
  });
  it("keeps code, path and fingerprint outside the share whitelist", () => {
    const w=fixture(); w.documents[0]!.documentCode="DOC-0042"; w.documents[0]!.fingerprint=fingerprint();
    const shared=projectShare(w,{profile:"internal-review",recipient:"Destinataire fictif",scope:"Extrait",reservations:[],activityIds:w.activities.map(a=>a.id),documentIds:w.documents.map(d=>d.id),clientId:null},()=>crypto.randomUUID(),at);
    const text=JSON.stringify(shared); expect(text).toContain("Référence publique");
    for(const marker of ["DOC-0042",hash,"LOCAL_PRIVATE_PATH","fingerprint","documentCode"]) expect(text).not.toContain(marker);
  });
});
