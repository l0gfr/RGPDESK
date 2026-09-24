import { assertWorkspace, canonicalJson, PrivacyError, reviseWorkspace, type Workspace, type SharedRegister } from "@rgpdesk/privacy-core";
import { verifyFiles } from "@rgpdesk/privacy-verifier";
import { assertSnapshot, encodeBackup, type DeliverySnapshot } from "./persistence/crypto";
import { createReferenceWorkspace } from "./reference-cases";
import { createDemoWorkspace } from "./demo";

/** Volatile practice session. No database, browser storage, network or fixed password. */
export class DemoSession {
  private workspace: Workspace | null;
  private snapshots: DeliverySnapshot[] = [];
  constructor(id: () => string, at: string, caseId?: string) { this.workspace = caseId ? createReferenceWorkspace(caseId, id, at) : createDemoWorkspace(id, at); }
  read(): Workspace {
    if (!this.workspace) throw new PrivacyError("LOCKED");
    return structuredClone(this.workspace);
  }
  save(next: Workspace): Workspace {
    const previous = this.read();
    assertWorkspace(next);
    if (next.id !== previous.id || next.revision !== previous.revision + 1) throw new PrivacyError("CONFLICT");
    const { organization, scope, jurisdiction, parties, systems, activities, documents, decisions, actions, imports, deliveries, impactAssessments, dpoCases, piaPublications } = next;
    const checked = reviseWorkspace(previous, previous.revision, next.updatedAt, { organization, scope, jurisdiction, parties, systems, activities, documents, decisions, actions, imports, deliveries, impactAssessments, dpoCases, piaPublications, ...(next.collections ? {collections:next.collections} : {}), ...(next.workCheckpoint ? {workCheckpoint:next.workCheckpoint} : {}), ...(next.citationReviews ? {citationReviews:next.citationReviews} : {}) });
    if (canonicalJson(checked) !== canonicalJson(next) || canonicalJson(deliveries) !== canonicalJson(previous.deliveries)) throw new PrivacyError("INVALID");
    this.workspace = structuredClone(checked);
    return this.read();
  }
  async deliver(workspaceId: string, revision: number, register: SharedRegister, files: Record<string, string>): Promise<Workspace> {
    const current = this.read();
    if (current.id !== workspaceId || current.revision !== revision) throw new PrivacyError("CONFLICT");
    const frozenRegister = structuredClone(register); const frozenFiles = structuredClone(files);
    const verified = await verifyFiles(frozenFiles);
    if (canonicalJson(verified.register) !== canonicalJson(frozenRegister)) throw new PrivacyError("INVALID");
    if (this.read().revision !== revision) throw new PrivacyError("CONFLICT");
    const receipt = { id: frozenRegister.id, workspaceId, revision, createdAt: frozenRegister.createdAt, profile: frozenRegister.profile, recipient: frozenRegister.recipient, catalogVersion: frozenRegister.catalogVersion, manifestHash: verified.manifestHash };
    const snapshot: DeliverySnapshot = { format: "rgpd-snapshot-v1", id: receipt.id, workspaceId, revision, files: frozenFiles };
    await assertSnapshot(snapshot, receipt);
    if (this.read().revision !== revision) throw new PrivacyError("CONFLICT");
    const next = reviseWorkspace(current, revision, receipt.createdAt, { deliveries: [...current.deliveries, receipt] });
    this.snapshots.push(snapshot);
    this.workspace = next;
    return this.read();
  }
  files(id: string): Record<string, string> {
    this.read();
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) throw new PrivacyError("INVALID");
    return structuredClone(snapshot.files);
  }
  async backup(phrase: string): Promise<string> {
    const current = this.read();
    const result = await encodeBackup(current, phrase, structuredClone(this.snapshots));
    if (this.read().revision !== current.revision) throw new PrivacyError("CONFLICT");
    return result;
  }
  clear() { this.workspace = null; this.snapshots = []; }
}
