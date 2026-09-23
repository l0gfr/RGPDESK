import { describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { recordPiaReview, putDocument } from "@rgpdesk/privacy-core";
import { createDemoWorkspace } from "./demo";
import { createFilingKit, FILING_FOLDERS, suggestedDocumentPath } from "./document-filing";
import { fingerprintDocument, MAX_DOCUMENT_BYTES } from "./document-fingerprint";
import { searchWorkspace } from "./search";
import { encodeBackup, decodeBackup } from "./persistence/crypto";
const at="2026-09-23T12:00:00.000Z";
const demo=()=>createDemoWorkspace(()=>crypto.randomUUID(),at);
const abc="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
describe("local document organization",()=>{
  it("creates only static empty folders and instructions, without business input",async()=>{
    const zip=await JSZip.loadAsync(await createFilingKit());
    expect(Object.values(zip.files).filter(f=>!f.dir).map(f=>f.name)).toEqual(["Mission-client/LIRE-MOI.txt"]);
    for(const f of FILING_FOLDERS) expect(zip.files[`Mission-client/${f.path}/`]?.dir).toBe(true);
    const readme=await zip.file("Mission-client/LIRE-MOI.txt")!.async("string");
    expect(readme).toContain("ne contient aucune pièce originale"); expect(readme).not.toMatch(/veracrypt/i);
  });
  it("suggests inert relative locations and leaves the existing location untouched",()=>{
    const d=demo().documents[0]!; d.documentCode="DOC-0042";d.title="../../<img src=x> \u202e secret";d.version="/../v1";
    const old=d.internalRef;const p=suggestedDocumentPath(d,FILING_FOLDERS[2].path);
    expect(p).toMatch(/^03_Contrats-et-prestataires\/DOC-0042_[a-zA-Z0-9-]+_v1\.ext$/);
    expect(d.internalRef).toBe(old);expect(suggestedDocumentPath(d,"../other")).toBe("");
  });
  it("finds the saved document by its code without indexing fingerprints",()=>{
    const w=demo();w.documents[0]!.documentCode="DOC-0042";w.documents[0]!.fingerprint={algorithm:"SHA-256",sha256:abc,bytes:3,capturedAt:at,version:w.documents[0]!.version};
    expect(searchWorkspace(w,"DOC-0042").results.map(r=>r.id)).toEqual([w.documents[0]!.id]);expect(searchWorkspace(w,abc).total).toBe(0);
  });
  it("freezes a fingerprint in a human review when the current document changes",()=>{
    let w=demo();const pia=w.impactAssessments[0]!;const doc=w.documents.find(d=>d.activityIds.includes(pia.activityId))!;
    w=putDocument(w,{...doc,documentCode:"DOC-0001",fingerprint:{algorithm:"SHA-256",sha256:abc,bytes:3,capturedAt:at,version:doc.version}},at);
    w=recordPiaReview(w,pia.id,{id:crypto.randomUUID(),author:"Auteur fictif",outcome:"rework",reason:"Examen fictif"},w.revision,at);
    const review=JSON.stringify(w.impactAssessments[0]!.reviews.at(-1));
    expect(review).toContain(abc);
    const next=putDocument(w,{...w.documents.find(d=>d.id===doc.id)!,version:"v2",fingerprint:{algorithm:"SHA-256",sha256:"b".repeat(64),bytes:4,capturedAt:at,version:"v2"}},at);
    expect(JSON.stringify(next.impactAssessments[0]!.reviews.at(-1))).toBe(review);
  });
  it("round trips optional metadata in a real encrypted backup and preserves historical references",async()=>{
    const w=demo();const history=JSON.stringify(w.impactAssessments.map(p=>p.reviews));
    w.documents[0]!.documentCode="DOC-0042";w.documents[0]!.fingerprint={algorithm:"SHA-256",sha256:abc,bytes:3,capturedAt:at,version:w.documents[0]!.version};
    const encoded=await encodeBackup(w,"Long fictional phrase for filing 2026");
    for(const s of [abc,"DOC-0042",w.documents[0]!.internalRef]) if(s)expect(encoded).not.toContain(s);
    const restored=await decodeBackup(encoded,"Long fictional phrase for filing 2026");expect(restored).toEqual(w);expect(JSON.stringify(restored.impactAssessments.map(p=>p.reviews))).toBe(history);
  });
});
describe("bounded WebCrypto fingerprint",()=>{
  it("uses SHA-256 for known bytes and the empty file",async()=>{
    expect(await fingerprintDocument(new Blob(["abc"]),new AbortController().signal)).toEqual({sha256:abc,bytes:3});
    expect((await fingerprintDocument(new Blob([]),new AbortController().signal)).sha256).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
  it("rejects oversized input before reading and sanitizes read failures",async()=>{
    const large=new Blob([new Uint8Array(MAX_DOCUMENT_BYTES+1)]);const read=vi.spyOn(large,"arrayBuffer");
    await expect(fingerprintDocument(large,new AbortController().signal)).rejects.toThrow("LIMIT");expect(read).not.toHaveBeenCalled();
    const bad=new Blob(["abc"]);vi.spyOn(bad,"arrayBuffer").mockRejectedValue(new Error("PRIVATE_FILENAME"));
    await expect(fingerprintDocument(bad,new AbortController().signal)).rejects.toThrow(/^READ$/);
  });
  it("discards a result after cancellation during reading and clears its owned bytes",async()=>{
    const task=new AbortController(), file=new Blob(["abc"]), bytes=new TextEncoder().encode("abc");
    vi.spyOn(file,"arrayBuffer").mockImplementation(async()=>{task.abort();return bytes.buffer;});
    await expect(fingerprintDocument(file,task.signal)).rejects.toThrow("CANCELLED");expect([...bytes]).toEqual([0,0,0]);
    await expect(fingerprintDocument(file,task.signal)).rejects.toThrow("CANCELLED");
  });
  it("discards a real digest if the task is cancelled while WebCrypto is running",async()=>{
    const task=new AbortController();const digest=crypto.subtle.digest.bind(crypto.subtle);
    const spy=vi.spyOn(crypto.subtle,"digest").mockImplementation(async(algorithm,data)=>{const result=await digest(algorithm,data);task.abort();return result;});
    try{await expect(fingerprintDocument(new Blob(["abc"]),task.signal)).rejects.toThrow("CANCELLED");}finally{spy.mockRestore();}
  });
});
