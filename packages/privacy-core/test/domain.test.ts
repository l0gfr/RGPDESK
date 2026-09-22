import { describe, expect, it } from "vitest";
import { assertWorkspace, createActivity, createPurpose, createWorkspace, knowledge, parseBoundedJson, putActivity, putParty, putSystem, reviseWorkspace, unknown, utf8Size } from "../src/index";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const now = "2026-09-22T10:00:00.000Z";
const fixture = () => createWorkspace(id(1), "Association fictive des Alizés", now);

describe("RGPD master boundary", () => {
  it("starts with explicit unknowns and no inferred legal position", () => {
    const master = fixture();
    expect(master.jurisdiction).toEqual(unknown());
    expect(master.scope).toEqual(unknown());
    expect(master.activities).toEqual([]);
    const purpose = createPurpose(id(3));
    expect(purpose.legalBasis.state).toBe("unknown");
    expect(purpose.retention.period.state).toBe("unknown");
    expect(knowledge("   ")).toEqual(unknown());
  });

  it("saves incomplete controller and processor drafts in the same workspace", () => {
    const master = fixture();
    const controller = createActivity(master.id, id(2), "controller");
    const first = putActivity(master, controller, 1, now);
    const second = putActivity(first, createActivity(master.id, id(3), "processor"), 2, now);
    expect(second.activities.map((item) => item.role)).toEqual(["controller", "processor"]);
    expect(second.activities[1]).not.toHaveProperty("purposes");
    expect(master.activities).toEqual([]);
  });

  it("keeps purposes separate from means and parties", () => {
    let master = fixture();
    master = putParty(master, { id: id(2), workspaceId: master.id, name: "Client fictif", contact: unknown() }, 1, now);
    master = putSystem(master, { id: id(3), workspaceId: master.id, name: "Outil fictif", description: unknown() }, 2, now);
    const controller = createActivity(master.id, id(4), "controller");
    if (controller.role !== "controller") throw new Error("fixture");
    controller.purposes = [createPurpose(id(5)), createPurpose(id(6))];
    controller.purposes[0]!.legalBasis = knowledge("Analyse déclarée de la finalité A");
    controller.systemIds = [id(3)];
    controller.participantIds = [id(2)];
    master = putActivity(master, controller, 3, now);
    assertWorkspace(master);
    expect(controller.purposes[1]!.legalBasis.state).toBe("unknown");
  });

  it("rejects a processor carrying controller fields or a silent role conversion", () => {
    const master = fixture();
    const processor = createActivity(master.id, id(2), "processor");
    expect(() => putActivity(master, { ...processor, purposes: [] } as never, 1, now)).toThrow("INVALID");
    const first = putActivity(master, processor, 1, now);
    expect(() => putActivity(first, createActivity(master.id, id(2), "controller"), 2, now)).toThrow("INVALID");
  });

  it("rejects cross-workspace ownership and dangling, duplicate or wrong-type links", () => {
    const master = fixture();
    expect(() => putActivity(master, createActivity(id(99), id(2), "processor"), 1, now)).toThrow("INVALID");
    const processor = createActivity(master.id, id(2), "processor");
    expect(() => putActivity(master, { ...processor, systemIds: [id(9)] }, 1, now)).toThrow("INVALID");
    const withSystem = putSystem(master, { id: id(3), workspaceId: master.id, name: "Système fictif", description: unknown() }, 1, now);
    expect(() => putActivity(withSystem, { ...processor, participantIds: [id(3)] }, 2, now)).toThrow("INVALID");
    expect(() => putActivity(withSystem, { ...processor, systemIds: [id(3), id(3)] }, 2, now)).toThrow("INVALID");
  });

  it("rejects duplicate identifiers across entity kinds and purposes", () => {
    let master = fixture();
    master = putSystem(master, { id: id(2), workspaceId: master.id, name: "Système fictif", description: unknown() }, 1, now);
    expect(() => putParty(master, { id: id(2), workspaceId: master.id, name: "Client fictif", contact: unknown() }, 2, now)).toThrow("INVALID");
    const activity = createActivity(master.id, id(3), "controller");
    if (activity.role === "controller") activity.purposes = [createPurpose(id(2))];
    expect(() => putActivity(master, activity, 2, now)).toThrow("INVALID");
  });

  it("rejects unknown format, fields, impossible dates and ambiguous knowledge", () => {
    for (const patch of [{ format: "proofpack-v3" }, { score: 100 }, { updatedAt: "2026-02-30T10:00:00.000Z" }, { scope: { state: "unknown", value: "yes" } }, { scope: { state: "documented", value: " " } }]) {
      expect(() => assertWorkspace({ ...fixture(), ...patch })).toThrow("INVALID");
    }
  });

  it("rejects stale command revisions and backwards timestamps", () => {
    expect(() => reviseWorkspace(fixture(), 0, now, {})).toThrow("CONFLICT");
    expect(() => reviseWorkspace(fixture(), 1, "2026-09-20T10:00:00.000Z", {})).toThrow("INVALID");
    expect(() => reviseWorkspace(fixture(), 1, now, { id: id(99) } as never)).toThrow("INVALID");
    expect(() => reviseWorkspace(fixture(), 1, now, { createdAt: now } as never)).toThrow("INVALID");
  });

  it("rejects hostile control and bidi characters, permits inert markup as text", () => {
    for (const name of ["Nom\u202e", "Nom\u0000", "Nom\u2066"]) expect(() => createWorkspace(id(1), name, now)).toThrow("INVALID");
    const master = createWorkspace(id(1), '<img src=x onerror="alert(1)">', now);
    assertWorkspace(master);
  });

  it("bounds collections and UTF-8 document size", () => {
    const master = fixture();
    const activities = Array.from({ length: 201 }, (_, i) => createActivity(master.id, id(i + 2), "processor"));
    expect(() => assertWorkspace({ ...master, activities })).toThrow("INVALID");
    const large = activities.slice(0, 200).map((activity) => ({ ...activity, internalNotes: "é".repeat(4000), securityMeasures: knowledge("é".repeat(4000)) }));
    expect(() => assertWorkspace({ ...master, activities: large })).toThrow("LIMIT");
    expect(utf8Size("aé😀")).toBe(7);
  });

  it("bounds JSON before parsing and never echoes parser contents", () => {
    expect(() => parseBoundedJson("[".repeat(25) + "]".repeat(25))).toThrow("LIMIT");
    expect(() => parseBoundedJson('"éé"', 4)).toThrow("LIMIT");
    expect(() => parseBoundedJson('{"PRIVATE_CANARY"')).toThrow(/^INVALID$/);
  });

  it("archives without deleting the activity or its references", () => {
    const master = fixture();
    const activity = createActivity(master.id, id(2), "controller");
    const next = putActivity(master, { ...activity, status: "archived" }, 1, now);
    expect(next.activities).toHaveLength(1);
    expect(next.activities[0]!.status).toBe("archived");
  });
});
