import { assertBackup, assertWorkspace, migrateWorkspace, parseBoundedJson, canonicalJson, PrivacyError, MAX_BACKUP_BYTES, MAX_MASTER_BYTES, utf8Size, type PrivacyBackup, type PrivacyEnvelope, type Workspace, type DeliveryRecord } from "@rgpdesk/privacy-core";
import { validateBackupV2 } from "@rgpdesk/privacy-core";
import { verifyFiles } from "@rgpdesk/privacy-verifier";
import { decryptLocalPayloadBatch, encryptLocalPayloadBatch } from "../../../lib/local-encryption";

export interface DeliverySnapshot { format: "rgpd-snapshot-v1"; id: string; workspaceId: string; revision: number; files: Record<string, string> }
export const MAX_SNAPSHOT_BYTES = 512 * 1024;
type EntryKind = "master" | "backup" | `snapshot:${string}`;
export const contextFor = (id: string, revision: number, kind: EntryKind): string => `rgpdesk:envelope-v1:${id}:${kind}:${revision}`;
function checkEnvelope(envelope: unknown, id: string, revision: number, kind: EntryKind): asserts envelope is PrivacyEnvelope {
  const container = { format: "rgpd-backup-v2", workspaceId: id, revision, envelope };
  if (!validateBackupV2(container)) throw new PrivacyError("INVALID");
  const checked = envelope as PrivacyEnvelope;
  if (checked.aad !== contextFor(id, revision, kind)) throw new PrivacyError("CRYPTO");
  try {
    for (const [value, length] of [[checked.salt, 16], [checked.iv, 12]] as const) if (atob(value).length !== length || btoa(atob(value)) !== value) throw new PrivacyError("CRYPTO");
    if (btoa(atob(checked.ciphertext)) !== checked.ciphertext) throw new PrivacyError("CRYPTO");
  } catch { throw new PrivacyError("CRYPTO"); }
}
async function seal(value: unknown, phrase: string, id: string, revision: number, kind: EntryKind): Promise<PrivacyEnvelope> {
  const [envelope] = await encryptLocalPayloadBatch([{ aad: contextFor(id, revision, kind), value }], phrase);
  checkEnvelope(envelope, id, revision, kind); return envelope;
}
async function unseal(envelope: unknown, phrase: string, id: string, revision: number, kind: EntryKind): Promise<unknown> {
  checkEnvelope(envelope, id, revision, kind);
  try {
    const [value] = await decryptLocalPayloadBatch<unknown>([envelope], phrase);
    return parseBoundedJson(JSON.stringify(value), kind === "backup" ? 8 * 1024 * 1024 : kind === "master" ? MAX_MASTER_BYTES : MAX_SNAPSHOT_BYTES);
  } catch { throw new PrivacyError("CRYPTO"); }
}
export async function sealMaster(master: Workspace, phrase: string): Promise<PrivacyEnvelope> {
  assertWorkspace(master); return seal(master, phrase, master.id, master.revision, "master");
}
export async function openMaster(envelope: unknown, phrase: string, id: string, revision: number): Promise<Workspace> {
  const value = migrateWorkspace(await unseal(envelope, phrase, id, revision, "master"));
  if (value.id !== id || value.revision !== revision) throw new PrivacyError("CRYPTO"); return value;
}
export async function assertSnapshot(value: unknown, receipt: DeliveryRecord): Promise<DeliverySnapshot> {
  if (!value || typeof value !== "object" || Object.keys(value).sort().join(",") !== "files,format,id,revision,workspaceId") throw new PrivacyError("INVALID");
  const snapshot = value as DeliverySnapshot;
  if (snapshot.format !== "rgpd-snapshot-v1" || snapshot.id !== receipt.id || snapshot.workspaceId !== receipt.workspaceId || snapshot.revision !== receipt.revision) throw new PrivacyError("INVALID");
  if (utf8Size(JSON.stringify(snapshot)) > MAX_SNAPSHOT_BYTES) throw new PrivacyError("LIMIT");
  const result = await verifyFiles(snapshot.files);
  if (result.register.id !== receipt.id || result.manifestHash !== receipt.manifestHash || result.register.profile !== receipt.profile
    || result.register.recipient !== receipt.recipient || result.register.catalogVersion !== receipt.catalogVersion || result.register.createdAt !== receipt.createdAt) throw new PrivacyError("INVALID");
  return snapshot;
}
export async function sealSnapshot(snapshot: DeliverySnapshot, receipt: DeliveryRecord, phrase: string): Promise<PrivacyEnvelope> {
  await assertSnapshot(snapshot, receipt); return seal(snapshot, phrase, receipt.workspaceId, receipt.revision, `snapshot:${receipt.id}`);
}
export async function openSnapshot(envelope: unknown, receipt: DeliveryRecord, phrase: string): Promise<DeliverySnapshot> {
  return assertSnapshot(await unseal(envelope, phrase, receipt.workspaceId, receipt.revision, `snapshot:${receipt.id}`), receipt);
}
export async function encodeBackup(master: Workspace, phrase: string, snapshots: DeliverySnapshot[] = []): Promise<string> {
  assertWorkspace(master);
  if (master.deliveries.length !== snapshots.length) throw new PrivacyError("INVALID");
  const checked = await Promise.all(master.deliveries.map((r, i) => assertSnapshot(snapshots[i], r)));
  const inventory = [{ kind: "master", id: master.id, revision: master.revision }, ...checked.map((s) => ({ kind: "snapshot", id: s.id, revision: s.revision }))];
  const payload = { format: "rgpd-backup-payload-v2", inventory, master, snapshots: checked };
  if (utf8Size(JSON.stringify(payload)) > 8 * 1024 * 1024) throw new PrivacyError("LIMIT");
  const backup = { format: "rgpd-backup-v2", workspaceId: master.id, revision: master.revision, envelope: await seal(payload, phrase, master.id, master.revision, "backup") };
  if (!validateBackupV2(backup)) throw new PrivacyError("INVALID");
  const text = JSON.stringify(backup); if (utf8Size(text) > MAX_BACKUP_BYTES) throw new PrivacyError("LIMIT"); return text;
}
export async function decodeArchive(text: string, phrase: string): Promise<{ master: Workspace; snapshots: DeliverySnapshot[] }> {
  const input = parseBoundedJson(text, MAX_BACKUP_BYTES);
  if (!validateBackupV2(input)) assertBackup(input);
  const backup = input as PrivacyBackup;
  const value = await unseal(backup.envelope, phrase, backup.workspaceId, backup.revision, "backup");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PrivacyError("INVALID");
  const payload = value as Record<string, unknown>;
  const legacy = backup.format === "rgpd-backup-v1";
  if (Object.keys(payload).sort().join(",") !== (legacy ? "format,inventory,master" : "format,inventory,master,snapshots") || payload.format !== (legacy ? "rgpd-backup-payload-v1" : "rgpd-backup-payload-v2")) throw new PrivacyError("INVALID");
  const master = migrateWorkspace(payload.master);
  if (master.id !== backup.workspaceId || master.revision !== backup.revision) throw new PrivacyError("INVALID");
  const snapshots = legacy ? [] : payload.snapshots;
  if (!Array.isArray(snapshots) || snapshots.length !== master.deliveries.length) throw new PrivacyError("INVALID");
  const checked = await Promise.all(master.deliveries.map((r, i) => assertSnapshot(snapshots[i], r)));
  const inventory = [{ kind: "master", id: master.id, revision: master.revision }, ...checked.map((s) => ({ kind: "snapshot", id: s.id, revision: s.revision }))];
  if (canonicalJson(payload.inventory) !== canonicalJson(inventory)) throw new PrivacyError("INVALID");
  return { master, snapshots: checked };
}
export async function decodeBackup(text: string, phrase: string): Promise<Workspace> { return (await decodeArchive(text, phrase)).master; }
