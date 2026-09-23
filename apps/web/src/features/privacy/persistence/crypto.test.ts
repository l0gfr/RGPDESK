import { describe, expect, it } from "vitest";
import { createDpoCase, putDpoCase, recordDpoReview, projectPiaPublication, recordPiaPublication, createWorkspace, createActivity, createImpactAssessment, createPiaRisk, knowledge, recordPiaReview, putImpactAssessment, MAX_BACKUP_BYTES } from "@rgpdesk/privacy-core";
import { encryptLocalPayloadBatch } from "../../../lib/local-encryption";
import { contextFor, decodeBackup, encodeBackup, openMaster, sealMaster } from "./crypto";

const phrase = "Fictional vault phrase 2026 correct";
const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const fixture = () => createWorkspace(id, "NEVER_LEAK_ORGANIZATION_FICTIONAL_7D31", "2026-09-22T10:00:00.000Z");

describe("privacy adapter with real WebCrypto", () => {
  it("round trips with upstream PBKDF2 cost, random salt and IV, and no plaintext metadata", async () => {
    const first = await sealMaster(fixture(), phrase);
    const second = await sealMaster(fixture(), phrase);
    expect(first.iterations).toBe(600_000);
    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
    expect(JSON.stringify(first)).not.toContain("NEVER_LEAK");
    expect(await openMaster(first, phrase, id, 1)).toEqual(fixture());
  });

  it("rejects wrong phrase and altered ciphertext", async () => {
    const envelope = await sealMaster(fixture(), phrase);
    await expect(openMaster(envelope, "Wrong fictional phrase 2026", id, 1)).rejects.toThrow("CRYPTO");
    const bytes = Uint8Array.from(atob(envelope.ciphertext), (c) => c.charCodeAt(0));
    bytes[0]! ^= 1;
    await expect(openMaster({ ...envelope, ciphertext: btoa(String.fromCharCode(...bytes)) }, phrase, id, 1)).rejects.toThrow("CRYPTO");
  });

  it("rejects an authentic envelope substituted across workspace, revision or entry kind", async () => {
    const envelope = await sealMaster(fixture(), phrase);
    await expect(openMaster(envelope, phrase, other, 1)).rejects.toThrow("CRYPTO");
    await expect(openMaster(envelope, phrase, id, 2)).rejects.toThrow("CRYPTO");
    const backup = JSON.parse(await encodeBackup(fixture(), phrase));
    await expect(openMaster(backup.envelope, phrase, id, 1)).rejects.toThrow("CRYPTO");
  });

  it("rejects forged clear AAD even when changed to match the destination", async () => {
    const envelope = await sealMaster(fixture(), phrase);
    await expect(openMaster({ ...envelope, aad: contextFor(other, 1, "master") }, phrase, other, 1)).rejects.toThrow("CRYPTO");
  });

  it("validates authenticated plaintext instead of trusting a generic type", async () => {
    for (const value of [{ ...fixture(), score: 100 }, { ...fixture(), id: other }, { ...fixture(), revision: 2 }]) {
      const [envelope] = await encryptLocalPayloadBatch([{ aad: contextFor(id, 1, "master"), value }], phrase);
      await expect(openMaster(envelope, phrase, id, 1)).rejects.toThrow();
    }
  });

  it("round trips a full backup with encrypted inventory", async () => {
    const encoded = await encodeBackup(fixture(), phrase);
    expect(encoded).not.toContain("inventory");
    expect(encoded).not.toContain("NEVER_LEAK");
    expect(await decodeBackup(encoded, phrase)).toEqual(fixture());
  });

  it("rejects incomplete, extra or inconsistent authenticated inventories", async () => {
    for (const inventory of [[], [{ kind: "master", id: other, revision: 1 }], [{ kind: "master", id, revision: 1, extra: true }]]) {
      const [envelope] = await encryptLocalPayloadBatch([{ aad: contextFor(id, 1, "backup"), value: { format: "rgpd-backup-payload-v1", inventory, master: fixture() } }], phrase);
      await expect(decodeBackup(JSON.stringify({ format: "rgpd-backup-v1", workspaceId: id, revision: 1, envelope }), phrase)).rejects.toThrow("INVALID");
    }
  });

  it("rejects truncated, oversized, unknown and weakened formats before decryption", async () => {
    const encoded = await encodeBackup(fixture(), phrase);
    await expect(decodeBackup(encoded.slice(0, -1), phrase)).rejects.toThrow("INVALID");
    await expect(decodeBackup(" ".repeat(MAX_BACKUP_BYTES + 1), phrase)).rejects.toThrow("LIMIT");
    const backup = JSON.parse(encoded);
    for (const patch of [{ format: "proofpack-v3" }, { extra: "ignored?" }, { envelope: { ...backup.envelope, iterations: 310_000 } }, { envelope: { ...backup.envelope, iterations: 10_000_000 } }]) {
      await expect(decodeBackup(JSON.stringify({ ...backup, ...patch }), phrase)).rejects.toThrow("INVALID");
    }
  });
});

describe("AIPD schema evolution with real WebCrypto", () => {
  it("opens the exact historical v3 envelope then backs up and restores v5 with frozen reviews", async () => {
    const original = fixture(); original.activities.push(createActivity(original.id, other, "controller"));
    original.activities[0]!.analysis.notes[0]!.facts = knowledge("PRIVATE_EXISTING_V3_NOTE");
    const legacy = JSON.parse(JSON.stringify(original)); legacy.format = "rgpd-master-v3"; delete legacy.impactAssessments; delete legacy.dpoCases; delete legacy.piaPublications;
    const legacyBytes = JSON.stringify(legacy);
    const [envelope] = await encryptLocalPayloadBatch([{ aad: contextFor(id, 1, "master"), value: legacy }], phrase);
    let next = await openMaster(envelope, phrase, id, 1);
    expect(next.format).toBe("rgpd-master-v5"); expect(next.activities).toEqual(original.activities);
    const pia = createImpactAssessment(id, next.activities[0]!, "00000000-0000-4000-8000-000000000003");
    const risk = createPiaRisk("00000000-0000-4000-8000-000000000004"); risk.rights = knowledge("PRIVATE_PIA_RIGHTS"); pia.content.risks.push(risk);
    next = putImpactAssessment(next, pia, next.revision, next.updatedAt);
    next = recordPiaReview(next, pia.id, { id: "00000000-0000-4000-8000-000000000005", author: "Fictif", reason: "Réexamen fictif", outcome: "rework" }, next.revision, next.updatedAt);
    const backup = await encodeBackup(next, phrase); expect(backup).not.toContain("PRIVATE_");
    expect(await decodeBackup(backup, phrase)).toEqual(next);
    expect(JSON.stringify(legacy)).toBe(legacyBytes);
    expect(await openMaster(envelope, phrase, id, 1)).toEqual(original);
  });
});

describe("DPO v5 encrypted recovery", () => {
  it("preserves all new dossiers, reviews and frozen AIPD publications in a real encrypted backup", async () => {
    let master = fixture(); master.activities.push(createActivity(master.id, other, "controller"));
    const pia = createImpactAssessment(master.id, master.activities[0]!, crypto.randomUUID());
    master = putImpactAssessment(master, pia, master.revision, master.updatedAt);
    for (const kind of ["transfer", "rights", "breach"] as const) {
      const item = createDpoCase(master.id, crypto.randomUUID(), kind); item.activityIds = [other];
      item.content.notes[0]!.facts = knowledge("NEVER_LEAK_DPO_CASE");
      master = putDpoCase(master, item, master.revision, master.updatedAt);
      master = recordDpoReview(master, item.id, { id: crypto.randomUUID(), author: "Auteur fictif", outcome: "rework", reason: "NEVER_LEAK_REVIEW" }, master.revision, master.updatedAt);
    }
    const p = projectPiaPublication(master, { piaId: pia.id, reviewId: null, sections: ["context"], recipient: "NEVER_LEAK_RECIPIENT", scope: "Restitution fictive", reservations: "" }, crypto.randomUUID(), master.updatedAt);
    master = recordPiaPublication(master, p, master.revision, master.updatedAt);
    const backup = await encodeBackup(master, phrase);
    expect(backup).not.toContain("NEVER_LEAK"); expect(await decodeBackup(backup, phrase)).toEqual(master);
    await expect(decodeBackup(backup, "Wrong fictional passphrase 2026!")).rejects.toThrow("CRYPTO");
  });
});
