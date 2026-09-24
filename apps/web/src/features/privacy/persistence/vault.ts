import { parseRecovery, type RecoveryDraft, type RecoveryReceipt } from "./recovery";
import { sealRecovery, openRecovery } from "./crypto";
import { verifyFiles } from "@rgpdesk/privacy-verifier";
import Dexie, { liveQuery, type Table } from "dexie";
import { assertWorkspace, parseWorkspace, reviseWorkspace, canonicalJson, PrivacyError, type PrivacyEnvelope, type Workspace, type SharedRegister, type DeliveryRecord } from "@rgpdesk/privacy-core";
import { decodeArchive, encodeBackup, openMaster, sealMaster, sealSnapshot, openSnapshot, type DeliverySnapshot } from "./crypto";

export const PRIVACY_DB_NAME = "rgpdesk-vault-v1";
export const PRIVACY_CHANNEL = "rgpdesk-vault-events-v1";
interface StoredWorkspace { id: string; revision: number; format: "rgpd-envelope-v1"; envelope: PrivacyEnvelope }
interface StoredSnapshot { workspaceId: string; id: string; revision: number; envelope: PrivacyEnvelope }
interface StoredDraft {workspaceId:string;id:string;revision:number;sequence:number;envelope:PrivacyEnvelope}
interface Metadata { key: string; value: string }
export interface VaultSession { epoch: string; signal: AbortSignal }
export interface VaultItem { id: string; revision: number }

export function checkSession(session: VaultSession): void {
  if (session.signal.aborted) throw new PrivacyError("LOCKED");
}

export class PrivacyVault extends Dexie {
  private drafts!:Table<StoredDraft,[string,string]>;
  private snapshots!: Table<StoredSnapshot, [string, string]>;
  private records!: Table<StoredWorkspace, string>;
  private metadata!: Table<Metadata, string>;

  constructor() {
    super(PRIVACY_DB_NAME);
    this.version(1).stores({ records: "id", metadata: "key" });
    this.version(2).stores({ records: "id", metadata: "key", snapshots: "[workspaceId+id], workspaceId" });
    this.version(3).stores({ records: "id", metadata: "key", snapshots: "[workspaceId+id], workspaceId", drafts:"[workspaceId+id], workspaceId" });
  }

  async initialize(): Promise<string> {
    return this.transaction("rw", this.metadata, async () => {
      const epoch = await this.metadata.get("epoch");
      if (epoch) return epoch.value;
      const value = crypto.randomUUID();
      await this.metadata.add({ key: "epoch", value });
      return value;
    });
  }

  private async assertEpoch(session: VaultSession): Promise<void> {
    checkSession(session);
    if ((await this.metadata.get("epoch"))?.value !== session.epoch) throw new PrivacyError("EPOCH");
    checkSession(session);
  }

  async list(): Promise<VaultItem[]> {
    // Only opaque identifiers and revision counters leave this boundary while locked.
    return (await this.records.toArray()).map(({ id, revision }) => ({ id, revision }));
  }

  watchInventory(onChange: () => void) {
    return liveQuery(() => this.transaction("r", this.records, this.metadata, async () => ({
      epoch: (await this.metadata.get("epoch"))?.value,
      items: await this.list(),
    }))).subscribe({ next: onChange, error: onChange });
  }

  async listCurrent(expectedEpoch: string): Promise<VaultItem[]> {
    return this.transaction("r", this.records, this.metadata, async () => {
      if ((await this.metadata.get("epoch"))?.value !== expectedEpoch) throw new PrivacyError("EPOCH");
      return this.list();
    });
  }

  async assertCurrent(id: string, revision: number, session: VaultSession): Promise<void> {
    await this.transaction("r", this.records, this.metadata, async () => {
      await this.assertEpoch(session);
      if ((await this.records.get(id))?.revision !== revision) throw new PrivacyError("CONFLICT");
      checkSession(session);
    });
  }

  async unlock(id: string, phrase: string, session: VaultSession): Promise<Workspace> {
    await this.assertEpoch(session);
    const record = await this.records.get(id);
    if (!record || record.id !== id || record.format !== "rgpd-envelope-v1") throw new PrivacyError("INVALID");
    const master = await openMaster(record.envelope, phrase, id, record.revision);
    await this.assertCurrent(id, record.revision, session);
    return master;
  }

  private async commit(master: Workspace, phrase: string, expectedRevision: number | null, session: VaultSession, snapshots: DeliverySnapshot[] = [], draftReceipt?:RecoveryReceipt): Promise<void> {
    checkSession(session);
    assertWorkspace(master);
    // Snapshot the caller's document before asynchronous crypto can yield.
    master = parseWorkspace(JSON.stringify(master));
    if (expectedRevision !== null && master.revision !== expectedRevision + 1) throw new PrivacyError("CONFLICT");
    const newSnapshots: StoredSnapshot[] = [];
    for (const snapshot of snapshots) {
      const receipt = master.deliveries.find((r) => r.id === snapshot.id);
      if (!receipt) throw new PrivacyError("INVALID");
      const frozen = JSON.parse(JSON.stringify(snapshot)) as DeliverySnapshot;
      const encrypted = await sealSnapshot(frozen, receipt, phrase);
      await openSnapshot(encrypted, receipt, phrase);
      newSnapshots.push({ workspaceId: master.id, id: receipt.id, revision: receipt.revision, envelope: encrypted });
    }
    const envelope = await sealMaster(master, phrase);
    // Verify the exact produced envelope before its atomic write.
    await openMaster(envelope, phrase, master.id, master.revision);
    checkSession(session);
    let detach = () => {};
    try {
      await this.transaction("rw", this.records, this.metadata, this.snapshots, this.drafts, async () => {
        const transaction = Dexie.currentTransaction!;
        const cancel = () => transaction.abort();
        session.signal.addEventListener("abort", cancel, { once: true });
        detach = () => session.signal.removeEventListener("abort", cancel);
        await this.assertEpoch(session);
        const current = await this.records.get(master.id);
        if (expectedRevision === null ? Boolean(current) : current?.revision !== expectedRevision) {
          throw new PrivacyError(expectedRevision === null ? "COLLISION" : "CONFLICT");
        }
        if(draftReceipt){const d=await this.drafts.get([master.id,draftReceipt.id]);if(d?.sequence!==draftReceipt.sequence)throw new PrivacyError("CONFLICT");await this.drafts.delete([master.id,draftReceipt.id]);}
        const existing = await this.snapshots.where("workspaceId").equals(master.id).toArray();
        const all = [...existing, ...newSnapshots];
        if (new Set(all.map((s) => s.id)).size !== all.length || all.length !== master.deliveries.length
          || all.some((s) => !master.deliveries.some((r) => r.id === s.id && r.revision === s.revision))) throw new PrivacyError("INVALID");
        checkSession(session);
        for (const snapshot of newSnapshots) await this.snapshots.add(snapshot);
        await this.records.put({ id: master.id, revision: master.revision, format: "rgpd-envelope-v1", envelope });
        checkSession(session);
      });
    } finally { detach(); }
  }

  async create(master: Workspace, phrase: string, session: VaultSession): Promise<void> {
    if (master.revision !== 1) throw new PrivacyError("INVALID");
    await this.commit(master, phrase, null, session);
  }

  async save(master: Workspace, phrase: string, expectedRevision: number, session: VaultSession, draftReceipt?:RecoveryReceipt): Promise<void> {
    await this.commit(master, phrase, expectedRevision, session, [], draftReceipt);
  }

  async backup(master: Workspace, phrase: string, session: VaultSession): Promise<string> {
    const frozen = parseWorkspace(JSON.stringify(master));
    await this.assertCurrent(frozen.id, frozen.revision, session);
    const snapshots: DeliverySnapshot[] = [];
    const stored = await this.snapshots.where("workspaceId").equals(frozen.id).toArray();
    if (stored.length !== frozen.deliveries.length) throw new PrivacyError("INVALID");
    for (const receipt of frozen.deliveries) {
      const record = stored.find((r) => r.id === receipt.id);
      if (!record || record.revision !== receipt.revision) throw new PrivacyError("INVALID");
      snapshots.push(await openSnapshot(record.envelope, receipt, phrase)); checkSession(session);
    }
    const content = await encodeBackup(frozen, phrase, snapshots);
    await this.assertCurrent(frozen.id, frozen.revision, session);
    return content;
  }

  async restore(text: string, phrase: string, session: VaultSession): Promise<Workspace> {
    await this.assertEpoch(session);
    const { master, snapshots } = await decodeArchive(text, phrase);
    checkSession(session);
    await this.commit(master, phrase, null, session, snapshots);
    return master;
  }

  async deliver(master: Workspace, register: SharedRegister, files: Record<string, string>, expectedRevision: number, phrase: string, session: VaultSession): Promise<Workspace> {
    checkSession(session);
    if (master.revision !== expectedRevision) throw new PrivacyError("CONFLICT");
    // Freeze all caller-owned values before the first asynchronous boundary.
    const frozen = parseWorkspace(JSON.stringify(master));
    const frozenRegister = JSON.parse(JSON.stringify(register)) as SharedRegister;
    const frozenFiles = JSON.parse(JSON.stringify(files)) as Record<string, string>;
    await this.assertCurrent(frozen.id, expectedRevision, session);
    const verified = await verifyFiles(frozenFiles);
    if (canonicalJson(verified.register) !== canonicalJson(frozenRegister)) throw new PrivacyError("INVALID");
    const receipt: DeliveryRecord = { id: frozenRegister.id, workspaceId: frozen.id, revision: expectedRevision,
      createdAt: frozenRegister.createdAt, profile: frozenRegister.profile, recipient: frozenRegister.recipient,
      catalogVersion: frozenRegister.catalogVersion, manifestHash: verified.manifestHash };
    const next = reviseWorkspace(frozen, expectedRevision, frozenRegister.createdAt, { deliveries: [...frozen.deliveries, receipt] });
    const snapshot: DeliverySnapshot = { format: "rgpd-snapshot-v1", workspaceId: frozen.id, id: receipt.id, revision: expectedRevision, files: frozenFiles };
    await this.commit(next, phrase, expectedRevision, session, [snapshot]);
    return next;
  }

  async deliveryFiles(master: Workspace, id: string, phrase: string, session: VaultSession): Promise<Record<string, string>> {
    const frozen = parseWorkspace(JSON.stringify(master));
    await this.assertCurrent(frozen.id, frozen.revision, session);
    const receipt = frozen.deliveries.find((r) => r.id === id);
    const record = await this.snapshots.get([frozen.id, id]);
    if (!receipt || !record || receipt.revision !== record.revision) throw new PrivacyError("INVALID");
    const snapshot = await openSnapshot(record.envelope, receipt, phrase);
    await this.assertCurrent(frozen.id, frozen.revision, session);
    return snapshot.files;
  }

  async saveDraft(value: RecoveryDraft, phrase: string, expectedSequence: number | null, session: VaultSession): Promise<void> {
    checkSession(session);
    const draft = parseRecovery(value);
    if (draft.sequence !== (expectedSequence ?? 0) + 1) throw new PrivacyError("CONFLICT");
    await this.assertCurrent(draft.workspaceId, draft.revision, session);
    const envelope = await sealRecovery(draft, phrase);
    await openRecovery(envelope, phrase, draft.workspaceId, draft.revision, draft.id, draft.sequence);
    checkSession(session);
    let detach = () => {};
    try {
      await this.transaction("rw", this.records, this.metadata, this.drafts, async () => {
        const transaction = Dexie.currentTransaction!;
        const cancel = () => transaction.abort();
        session.signal.addEventListener("abort", cancel, { once: true });
        detach = () => session.signal.removeEventListener("abort", cancel);
        await this.assertEpoch(session);
        if ((await this.records.get(draft.workspaceId))?.revision !== draft.revision) throw new PrivacyError("CONFLICT");
        const previous = await this.drafts.get([draft.workspaceId, draft.id]);
        if (expectedSequence === null ? !!previous : previous?.sequence !== expectedSequence) throw new PrivacyError("CONFLICT");
        if (!previous && await this.drafts.where("workspaceId").equals(draft.workspaceId).count() >= 10) throw new PrivacyError("LIMIT");
        checkSession(session);
        await this.drafts.put({ workspaceId: draft.workspaceId, id: draft.id, revision: draft.revision, sequence: draft.sequence, envelope });
        checkSession(session);
      });
    } finally { detach(); }
  }

  async readDrafts(master: Workspace, phrase: string, session: VaultSession): Promise<RecoveryDraft[]> {
    await this.assertCurrent(master.id, master.revision, session);
    const rows = await this.drafts.where("workspaceId").equals(master.id).limit(11).toArray();
    if (rows.length > 10) throw new PrivacyError("LIMIT");
    const result: RecoveryDraft[] = [];
    for (const row of rows) {
      checkSession(session);
      result.push(await openRecovery(row.envelope, phrase, master.id, row.revision, row.id, row.sequence));
    }
    await this.assertCurrent(master.id, master.revision, session);
    return result;
  }

  async discardDraft(workspaceId: string, receipt: RecoveryReceipt, session: VaultSession): Promise<void> {
    let detach = () => {};
    try {
      await this.transaction("rw", this.metadata, this.drafts, async () => {
        const transaction = Dexie.currentTransaction!;
        const cancel = () => transaction.abort();
        session.signal.addEventListener("abort", cancel, { once: true });
        detach = () => session.signal.removeEventListener("abort", cancel);
        await this.assertEpoch(session);
        const draft = await this.drafts.get([workspaceId, receipt.id]);
        if (draft?.sequence !== receipt.sequence) throw new PrivacyError("CONFLICT");
        checkSession(session);
        await this.drafts.delete([workspaceId, receipt.id]);
        checkSession(session);
      });
    } finally { detach(); }
  }
  async wipe(expectedEpoch: string): Promise<void> {
    const epoch = crypto.randomUUID();
    await this.transaction("rw", this.records, this.metadata, this.snapshots, this.drafts, async () => {
      if ((await this.metadata.get("epoch"))?.value !== expectedEpoch) throw new PrivacyError("EPOCH");
      await this.drafts.clear();
      await this.records.clear();
      await this.snapshots.clear();
      await this.metadata.put({ key: "epoch", value: epoch });
    });
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(PRIVACY_CHANNEL);
      channel.postMessage({ type: "wipe" });
      channel.close();
    }
  }
}
