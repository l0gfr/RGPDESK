import validateV1 from "./generated/master-validator.js";
import { createActivityReview, unknown, type Workspace } from "./model";
import { assertWorkspace, PrivacyError } from "./validation";

// Explicit one-way, in-memory migration. Disk is only changed by a guarded save.
export function migrateWorkspace(value: unknown): Workspace {
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v1") {
    if (!validateV1(value)) throw new PrivacyError("INVALID");
    const old = value as unknown as Omit<Workspace, "format" | "documents" | "decisions" | "actions" | "imports" | "deliveries">;
    value = { ...old, format: "rgpd-master-v2", organization: { ...old.organization, representatives: unknown() },
      activities: old.activities.map((activity) => ({ ...activity, review: createActivityReview() })),
      documents: [], decisions: [], actions: [], imports: [], deliveries: [] };
  }
  assertWorkspace(value);
  return value;
}
