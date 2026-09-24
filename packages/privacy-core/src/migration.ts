import validateV9 from "./generated/master-v9-validator.js";
import validateV8 from "./generated/master-v8-validator.js";
import validateV7 from "./generated/master-v7-validator.js";
import validateV6 from "./generated/master-v6-validator.js";
import validateV5 from "./generated/master-v5-validator.js";
import validateV4 from "./generated/master-v4-validator.js";
import validateV3 from "./generated/master-v3-validator.js";
import validateV2 from "./generated/master-v2-validator.js";
import validateV1 from "./generated/master-validator.js";
import { createActivityReview, createActivityAnalysis, unknown, type Workspace } from "./model";
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
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v2") {
    if (!validateV2(value)) throw new PrivacyError("INVALID");
    const old = value as unknown as Workspace;
    value = { ...old, format: "rgpd-master-v3",
      activities: old.activities.map((activity) => ({ ...activity, analysis: createActivityAnalysis(), flows: [] })),
      documents: old.documents.map((document) => ({ ...document, contractReview: null })),
    };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v3") {
    if (!validateV3(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v4", impactAssessments: [] };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v4") {
    if (!validateV4(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v5", dpoCases: [], piaPublications: [] };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v5") {
    if (!validateV5(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v6" };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v6") {
    if (!validateV6(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v7" };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v7") {
    if (!validateV7(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v8" };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v8") {
    if (!validateV8(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v9" };
  }
  if (value && typeof value === "object" && "format" in value && value.format === "rgpd-master-v9") {
    if (!validateV9(value)) throw new PrivacyError("INVALID");
    value = { ...value, format: "rgpd-master-v10" };
  }
  assertWorkspace(value);
  return value;
}
