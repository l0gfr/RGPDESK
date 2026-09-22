import { describe, expect, it } from "vitest";
import { PrivacyError } from "@rgpdesk/privacy-core";
import { VaultInventory, type InventoryState } from "./inventory";
const one = [{ id: "opaque-one", revision: 1 }];
const two = [...one, { id: "opaque-two", revision: 2 }];
describe("locked vault inventory", () => {
  it("distinguishes a pending read from an empty inventory and reloads additions", async () => {
    const states: InventoryState[] = []; let records = one;
    const inventory = new VaultInventory(async () => records, (s) => states.push(s));
    const first = inventory.refresh(); expect(states.at(-1)?.status).toBe("loading"); await first;
    expect(states.at(-1)).toEqual({ status: "ready", items: one, epochChanged: false });
    records = two; await inventory.refresh(); expect(states.at(-1)?.items).toEqual(two);
  });
  it("a storage failure keeps the last known list and never reports an empty success", async () => {
    const states: InventoryState[] = []; let fail = false;
    const inventory = new VaultInventory(async () => { if (fail) throw new Error("PRIVATE_ERROR"); return two; }, (s) => states.push(s));
    await inventory.refresh(); fail = true; await inventory.refresh();
    expect(states.at(-1)).toEqual({ status: "error", items: two, epochChanged: false });
    expect(JSON.stringify(states)).not.toContain("PRIVATE_ERROR");
  });
  it("an older empty result cannot replace a newer inventory", async () => {
    let finish: ((value: typeof one) => void) | undefined; let calls = 0; const states: InventoryState[] = [];
    const inventory = new VaultInventory(() => ++calls === 1 ? new Promise((r) => finish = r) : Promise.resolve(two), (s) => states.push(s));
    const old = inventory.refresh(); await inventory.refresh(); finish!([]); await old;
    expect(states.at(-1)?.items).toEqual(two);
  });
  it("epoch changes fail closed and disposal suppresses asynchronous results", async () => {
    const states: InventoryState[] = [];
    const inventory = new VaultInventory(async () => { throw new PrivacyError("EPOCH"); }, (s) => states.push(s));
    await inventory.refresh(); expect(states.at(-1)?.epochChanged).toBe(true);
    const reading = inventory.refresh(); inventory.dispose(); await reading;
    expect(states.at(-1)?.status).toBe("loading");
  });
});
