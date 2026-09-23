import { MAX_BACKUP_BYTES, PrivacyError } from "@rgpdesk/privacy-core";
import { decodeArchive } from "./crypto";
/** Read-only: no vault, storage adapter, persistence request or restoration. */
export async function inspectBackup(file: Pick<File,"size"|"text">, phrase: string, signal: AbortSignal) {
  const current=()=>{if(signal.aborted)throw new PrivacyError("LOCKED");};
  current(); if(file.size>MAX_BACKUP_BYTES)throw new PrivacyError("LIMIT");
  const text=await file.text(); current();
  const {master,snapshots}=await decodeArchive(text,phrase); current();
  return {workspaceId:master.id,name:master.organization.name,revision:master.revision,updatedAt:master.updatedAt,activities:master.activities.length,dossiers:master.dpoCases.length,studies:master.impactAssessments.length,deliveries:snapshots.length};
}
