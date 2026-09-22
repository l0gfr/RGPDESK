import { PrivacyError } from "@rgpdesk/privacy-core";
import type { VaultItem } from "./vault";
export interface InventoryState { status: "loading" | "ready" | "error"; items: VaultItem[]; epochChanged: boolean }
/** Read-only inventory refresh. A failed read never becomes an empty success. */
export class VaultInventory {
  private generation = 0;
  private disposed = false;
  private items: VaultItem[] = [];
  constructor(private read: () => Promise<VaultItem[]>, private publish: (state: InventoryState) => void) {}
  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.publish({ status: "loading", items: this.items, epochChanged: false });
    try {
      const items = await this.read();
      if (this.disposed || generation !== this.generation) return;
      this.items = items;
      this.publish({ status: "ready", items, epochChanged: false });
    } catch (cause) {
      if (this.disposed || generation !== this.generation) return;
      this.publish({ status: "error", items: this.items, epochChanged: cause instanceof PrivacyError && cause.code === "EPOCH" });
    }
  }
  dispose() { this.disposed = true; this.generation++; this.items = []; }
}
