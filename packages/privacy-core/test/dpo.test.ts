import { describe, it, expect } from "vitest";
import { createWorkspace, createActivity, createPurpose, createDpoCase, putDpoCase, recordDpoReview, appendDpoEvent, reviseWorkspace, assertWorkspace, migrateWorkspace, knowledge, unknown, dpoChanges, addCalendarMonths, rightsDeadline, breachDeadline, type DpoKind } from "../src/index";
let seq = 8000;
const id = () => `00000000-0000-4000-8000-${String(seq++).padStart(12, "0")}`;
const now = "2026-09-23T10:00:00.000Z";
function fixture(kind: DpoKind = "interest") {
  let master = createWorkspace(id(), "DPO fictif", now);
  const activity = createActivity(master.id, id(), "controller");
  if (activity.role !== "controller") throw new Error("fixture");
  activity.purposes = [createPurpose(id())]; master.activities = [activity];
  const item = createDpoCase(master.id, id(), kind); item.activityIds = [activity.id];
  if (kind === "interest") item.purposeId = activity.purposes[0]!.id;
  master = putDpoCase(master, item, master.revision, now);
  return { master, item, activity };
}
describe("DPO dossier integrity", () => {
  it("migrates v4 in memory without changing IDs, contents, revision or input", () => {
    const { master } = fixture(); const legacy = JSON.parse(JSON.stringify(master));
    legacy.format = "rgpd-master-v4"; delete legacy.dpoCases; delete legacy.piaPublications;
    const original = JSON.stringify(legacy); const next = migrateWorkspace(legacy);
    expect(next).toEqual({ ...legacy, format: "rgpd-master-v8", dpoCases: [], piaPublications: [] });
    expect(JSON.stringify(legacy)).toBe(original);
    expect(() => migrateWorkspace({ ...legacy, dpoCases: [] })).toThrow("INVALID");
  });
  it.each(["interest", "transfer", "rights", "breach", "security"] as const)("starts %s without legal outcomes or hidden timing assumptions", (kind) => {
    const { master, item } = fixture(kind); assertWorkspace(master);
    expect(item.reviews).toEqual([]); expect(item.content.rights.regime).toBe("unknown");
    expect(item.content.breach.role).toBe("unknown");
    item.content.notes.forEach((n) => expect(n.assessment).toEqual(unknown()));
  });
  it("allows one interest dossier per controller purpose and forbids losing its source", () => {
    const { master, item, activity } = fixture();
    expect(() => putDpoCase(master, { ...item, id: id() }, master.revision, now)).toThrow("INVALID");
    expect(() => putDpoCase(master, { ...item, purposeId: id() }, master.revision, now)).toThrow("INVALID");
    const changed = structuredClone(activity); changed.purposes = [];
    expect(() => reviseWorkspace(master, master.revision, now, { activities: [changed] })).toThrow("INVALID");
    expect(() => reviseWorkspace(master, master.revision, now, { activities: [createActivity(master.id, activity.id, "processor")] })).toThrow("INVALID");
  });
  it("preserves review snapshots and detects only relevant context changes", () => {
    let { master, item, activity } = fixture();
    master = recordDpoReview(master, item.id, { id: id(), author: "DPO fictif", outcome: "rework", reason: "Complément attendu" }, master.revision, now);
    item = master.dpoCases[0]!; const history = JSON.stringify(item.reviews);
    expect(dpoChanges(master, item)).toEqual([]);
    master = reviseWorkspace(master, master.revision, now, { scope: knowledge("Autre périmètre général") });
    // Scope and jurisdiction are part of the linked activity's captured context.
    expect(dpoChanges(master, item)).toContain("Cadre de la mission : changement à examiner");
    const changed = structuredClone(activity); changed.title = "Titre modifié";
    master = reviseWorkspace(master, master.revision, now, { activities: [changed] });
    expect(dpoChanges(master, item).join()).toContain("Cadre de la mission");
    expect(JSON.stringify(item.reviews)).toBe(history);
    const forged = structuredClone(item); forged.reviews[0]!.reason = "Réécriture";
    expect(() => putDpoCase(master, forged, master.revision, now)).toThrow("INVALID");
    expect(() => reviseWorkspace(master, master.revision, now, { dpoCases: [] })).toThrow("INVALID");
    const staleReview = structuredClone(item); staleReview.reviews.push({ ...structuredClone(item.reviews[0]!), id: id(), revision: master.revision + 1 });
    expect(() => reviseWorkspace(master, master.revision, now, { dpoCases: [staleReview] })).toThrow("INVALID");
  });
  it("keeps events append-only and refuses conflicts, future or invalid events", () => {
    let { master, item } = fixture("breach");
    const event = { id: id(), at: now, author: "Fictif", description: "Fait déclaré", evidence: knowledge("Référence fictive") };
    master = appendDpoEvent(master, item.id, event, master.revision, now);
    expect(() => appendDpoEvent(master, item.id, { ...event, id: id() }, master.revision - 1, now)).toThrow("CONFLICT");
    expect(() => appendDpoEvent(master, item.id, { ...event, id: id(), at: "2030-01-01T00:00:00.000Z" }, master.revision, now)).toThrow("INVALID");
    const changed = structuredClone(master.dpoCases[0]!); changed.events[0]!.description = "Correction cachée";
    expect(() => reviseWorkspace(master, master.revision, now, { dpoCases: [changed] })).toThrow("INVALID");
  });
  it("rejects unsupported or normalized breach instants before they can enter the vault", () => {
    for (const instant of ["2026-12-31T23:59:60.000Z", "2026-02-30T12:00:00.000Z", "2026-09-23T12:00:00+02:00"]) {
      const { master } = fixture("breach"); master.dpoCases[0]!.content.breach.awarenessAt = instant;
      expect(() => assertWorkspace(master)).toThrow("INVALID");
    }
  });
  it("rejects foreign fields, duplicate questions, foreign timing, unknown methods and excessive data", () => {
    for (const mutate of [
      (m: ReturnType<typeof fixture>["master"]) => { Object.assign(m.dpoCases[0]!, { remoteUrl: "https://example.invalid" }); },
      (m: ReturnType<typeof fixture>["master"]) => { m.dpoCases[0]!.content.notes[1]!.questionId = "interest"; },
      (m: ReturnType<typeof fixture>["master"]) => { m.dpoCases[0]!.content.rights.regime = "general"; },
      (m: ReturnType<typeof fixture>["master"]) => { Object.assign(m.dpoCases[0]!, { methodVersion: "future" }); },
      (m: ReturnType<typeof fixture>["master"]) => { m.dpoCases[0]!.content.notes[0]!.facts = knowledge("x".repeat(4001)); },
    ]) { const { master } = fixture(); mutate(master); expect(() => assertWorkspace(master)).toThrow("INVALID"); }
  });
});
describe("explicit deadline profiles", () => {
  it("uses calendar months including leap years rather than thirty days", () => {
    expect(addCalendarMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addCalendarMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addCalendarMonths("2026-11-30", 3)).toBe("2027-02-28");
    expect(() => addCalendarMonths("2026-02-30", 1)).toThrow("INVALID");
    expect(() => addCalendarMonths("2026-01-31", 4)).toThrow("INVALID");
  });
  it("requires the chosen general regime and verified holiday calendar", () => {
    const t = createDpoCase(id(), id(), "rights").content.rights; t.receivedOn = "2026-01-31";
    expect(rightsDeadline(t).due).toBeNull(); t.regime = "general";
    expect(rightsDeadline(t).due).toBeNull(); t.calendarConfirmed = true; t.holidays = ["2026-03-02"];
    expect(rightsDeadline(t).due).toBe("2026-03-03");
    t.regime = "special"; expect(rightsDeadline(t).due).toBeNull();
    t.manualDue = "2026-02-20"; t.manualReason = knowledge("Examen humain du régime spécial");
    expect(rightsDeadline(t)).toEqual({ initial: null, due: "2026-02-20", mode: "manual" });
  });
  it("keeps the original deadline until a justified timely extension is declared", () => {
    const t = createDpoCase(id(), id(), "rights").content.rights;
    Object.assign(t, { receivedOn: "2026-03-05", regime: "general", calendarConfirmed: true, extensionMonths: 2 });
    expect(rightsDeadline(t).due).toBe("2026-04-06");
    t.extensionReason = knowledge("Nombre et complexité examinés"); t.extensionNotifiedOn = "2026-04-07";
    expect(rightsDeadline(t).due).toBe("2026-04-06");
    t.extensionNotifiedOn = "2026-04-03"; expect(rightsDeadline(t).due).toBe("2026-06-05");
  });
  it("uses elapsed 72h across DST only for controllers with a known awareness instant", () => {
    expect(breachDeadline(null, "controller")).toBeNull();
    expect(breachDeadline("2026-10-24T12:00:00.000Z", "processor")).toBeNull();
    expect(breachDeadline("2026-10-24T12:00:00.000Z", "controller")).toBe("2026-10-27T12:00:00.000Z");
    expect(() => breachDeadline("2026-10-24T12:00:00+02:00", "controller")).toThrow("INVALID");
  });
});
