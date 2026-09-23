import type { EvidenceReference } from "./model";
import { PrivacyError } from "./validation";

/** A mission-local reference, persisted only by an explicit document save. */
export function nextDocumentCode(documents: EvidenceReference[]): string {
  const next = Math.max(0, ...documents.map(d => d.documentCode ? Number(d.documentCode.slice(4)) : 0)) + 1;
  if (!Number.isSafeInteger(next) || next > 999999) throw new PrivacyError("LIMIT");
  return `DOC-${String(next).padStart(4, "0")}`;
}

/** Retain allocated codes and require a new declared version to replace a fingerprint. */
export function assertDocumentHistory(before: EvidenceReference[], after: EvidenceReference[]): void {
  for (const doc of after) {
    if (doc.fingerprint && !before.find(d => d.id === doc.id)?.fingerprint && doc.fingerprint.version !== doc.version) throw new PrivacyError("INVALID");
  }
  for (const old of before) {
    const next = after.find(d => d.id === old.id);
    if (old.documentCode && next?.documentCode !== old.documentCode) throw new PrivacyError("INVALID");
    if (!old.fingerprint) continue;
    const a = old.fingerprint, b = next?.fingerprint;
    if (!b) throw new PrivacyError("INVALID");
    const changed = a.sha256 !== b.sha256 || a.bytes !== b.bytes || a.capturedAt !== b.capturedAt || a.version !== b.version;
    if (changed && (b.version === a.version || b.version !== next?.version)) throw new PrivacyError("INVALID");
  }
}
