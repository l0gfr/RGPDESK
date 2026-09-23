import {describe,it,expect,vi} from "vitest";
import {createWorkspace,MAX_BACKUP_BYTES} from "@rgpdesk/privacy-core";
import {encodeBackup} from "./crypto";
import {inspectBackup} from "./backup-check";
const phrase="Fictitious backup phrase 2026 secure";
const w=createWorkspace("00000000-0000-4000-8000-000000000001","Fictif","2026-09-23T10:00:00.000Z");
describe("read-only backup verification with real crypto",()=>{
 it("returns a bounded summary and cannot write through storage",async()=>{const text=await encodeBackup(w,phrase);const summary=await inspectBackup({size:text.length,text:async()=>text},phrase,new AbortController().signal);expect(summary).toEqual({workspaceId:w.id,name:"Fictif",revision:1,updatedAt:w.updatedAt,activities:0,dossiers:0,studies:0,deliveries:0});expect(summary).not.toHaveProperty("master");expect(summary).not.toHaveProperty("phrase");});
 it("rejects wrong phrases, invalid data and oversize before reading the file",async()=>{const text=await encodeBackup(w,phrase);await expect(inspectBackup({size:text.length,text:async()=>text},"Wrong fictional phrase",new AbortController().signal)).rejects.toThrow();const read=vi.fn();await expect(inspectBackup({size:MAX_BACKUP_BYTES+1,text:read},phrase,new AbortController().signal)).rejects.toThrow("LIMIT");expect(read).not.toHaveBeenCalled();await expect(inspectBackup({size:2,text:async()=>"{}"},phrase,new AbortController().signal)).rejects.toThrow();});
 it("withholds results when locking before read, during read or during decryption",async()=>{const text=await encodeBackup(w,phrase);for(const phase of[0,1,2]){const c=new AbortController();if(phase===0)c.abort();const file={size:text.length,text:async()=>{if(phase===1)c.abort();return text;}};const p=inspectBackup(file,phrase,c.signal);if(phase===2){await Promise.resolve();c.abort();}await expect(p).rejects.toThrow("LOCKED");}});
});
