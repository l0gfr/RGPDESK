import { describe, expect, it } from "vitest";
import { assertWorkspace, projectShare, putActivity, piaOpenPoints, reviseWorkspace } from "@rgpdesk/privacy-core";
import { packageFiles } from "@rgpdesk/privacy-verifier";
import { createDemoWorkspace } from "./demo";
import { DemoSession } from "./demo-session";
import { decodeArchive } from "./persistence/crypto";

const at = "2026-09-22T12:00:00.000Z";
const later = "2026-09-22T12:05:00.000Z";
const id = () => crypto.randomUUID();
const practice = () => new DemoSession(id, at);
async function prepared(session: DemoSession) {
  const master = session.read();
  const register = projectShare(master, { profile: "article30-controller", recipient: "Comité fictif", scope: "Démonstration", activityIds: master.activities.filter((a) => a.role === "controller").map((a) => a.id), documentIds: [], reservations: ["Données fictives"], clientId: null }, id, later);
  return { master, register, ...await packageFiles(register) };
}

describe("isolated fictional practice workspace", () => {
  it("provides a linked valid example without legal or retention defaults or a favorable PIA decision", () => {
    const w = createDemoWorkspace(id, at);
    expect(() => assertWorkspace(w)).not.toThrow();
    expect(w.activities).toHaveLength(4);
    expect(w.activities.flatMap((a) => a.flows)).toHaveLength(7);
    expect(w.documents).toHaveLength(4);
    expect(w.actions).toHaveLength(3);
    expect(w.activities.filter((a) => a.role === "processor")).toHaveLength(1);
    for (const a of w.activities) if (a.role === "controller") for (const p of a.purposes) {
      expect(p.legalBasis.state).toBe("unknown");
      expect(p.retention.period.state).toBe("unknown");
      expect(p.retention.trigger.state).toBe("unknown");
    }
    const pia = w.impactAssessments[0]!;
    expect(pia.content.alternatives).toHaveLength(2);
    expect(pia.content.risks).toHaveLength(3);
    expect(pia.content.measures).toHaveLength(3);
    expect(pia.content.screeningDecision).toBe("unknown");
    expect(pia.reviews[0]!.outcome).toBe("rework");
    expect(piaOpenPoints(pia.content).length).toBeGreaterThan(0);
  });
  it("uses fresh identifiers and never mutates a previous opening", () => {
    const first = practice(); const second = practice();
    expect(first.read().id).not.toBe(second.read().id);
    const leaked = first.read(); leaked.organization.name = "Modified returned copy";
    expect(first.read().organization.name).toContain("Sillage");
    const w = first.read(); const a = w.activities[0]!; a.title = "Changed fictional activity";
    first.save(putActivity(w, a, w.revision, later));
    expect(second.read().activities[0]!.title).toContain("Recrutement");
    expect(() => first.save(w)).toThrow("CONFLICT");
  });
  it("keeps schema, history and revision invariants in practice mode", () => {
    const d = practice(); const w = d.read();
    const next = reviseWorkspace(w, w.revision, later, { scope: { state: "unknown" } });
    next.createdAt = later;
    expect(() => d.save(next)).toThrow("INVALID");
    const altered = structuredClone(w); altered.revision++; altered.updatedAt = later;
    altered.impactAssessments[0]!.reviews[0]!.reason = "Rewritten history";
    expect(() => d.save(altered)).toThrow("INVALID");
  });
  it("uses the whitelist projection and retains an immutable delivery in memory", async () => {
    const d = practice(); const p = await prepared(d);
    const exported = JSON.stringify(p.files);
    for (const excluded of ["NOTE INTERNE", "EXERCICE /", "Responsable du scénario", p.master.id, p.master.impactAssessments[0]!.id]) expect(exported).not.toContain(excluded);
    await d.deliver(p.master.id, p.master.revision, p.register, p.files);
    const original = d.files(p.register.id);
    p.files["report.html"] = "Caller alteration";
    expect(d.files(p.register.id)).toEqual(original);
    const w = d.read(); const a = w.activities[0]!; a.title = "Later title";
    d.save(putActivity(w, a, w.revision, later));
    expect(d.files(p.register.id)).toEqual(original);
    await expect(d.deliver(p.master.id, p.master.revision, p.register, original)).rejects.toThrow("CONFLICT");
  });
  it("refuses corrupt exports and cannot resurrect a cleared session across an async boundary", async () => {
    const d = practice(); const p = await prepared(d);
    await expect(d.deliver(p.master.id, p.master.revision, p.register, { ...p.files, "report.html": "Altered" })).rejects.toThrow();
    expect(d.read().deliveries).toHaveLength(0);
    const pending = d.deliver(p.master.id, p.master.revision, p.register, p.files);
    d.clear();
    await expect(pending).rejects.toThrow("LOCKED");
    expect(() => d.read()).toThrow("LOCKED");
    expect(() => d.files(p.register.id)).toThrow("LOCKED");
  });
  it("creates a real encrypted backup with a user-chosen phrase and its historical snapshots", async () => {
    const d = practice(); const p = await prepared(d);
    await d.deliver(p.master.id, p.master.revision, p.register, p.files);
    const phrase = "Fictional demonstration backup phrase 2026!";
    const backup = await d.backup(phrase);
    expect(backup).not.toContain("Sillage");
    expect(JSON.parse(backup).envelope.iterations).toBe(600_000);
    const restored = await decodeArchive(backup, phrase);
    expect(restored.master).toEqual(d.read());
    expect(restored.snapshots[0]!.files).toEqual(p.files);
    await expect(decodeArchive(backup, "Incorrect fictional phrase 2026!")).rejects.toThrow("CRYPTO");
    const pending = d.backup(phrase); d.clear();
    await expect(pending).rejects.toThrow("LOCKED");
  });
});
