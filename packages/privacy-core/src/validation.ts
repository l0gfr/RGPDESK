import { assertWorkbench } from "./workbench";
import { assertLinkedFacts } from "./linked-facts";
import { assertDpoWorkspace } from "./dpo";
import { assertPiaWorkspace } from "./pia";
import validate from "./generated/master-v6-validator.js";
import { ANALYSIS_QUESTIONS, CONTRACT_QUESTIONS, type ReviewNote, type Workspace } from "./model";

export const MAX_MASTER_BYTES = 2 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export class PrivacyError extends Error {
  constructor(public readonly code: "INVALID" | "LIMIT" | "CONFLICT" | "LOCKED" | "EPOCH" | "COLLISION" | "CRYPTO" | "STORAGE") {
    super(code);
    this.name = "PrivacyError";
  }
}
export const utf8Size = (text: string): number => {
  let bytes = 0;
  for (const char of text) {
    const point = char.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
};

// Preflight before parsing or schema evaluation: bounded bytes, depth and nodes.
export function parseBoundedJson(text: string, maxBytes = MAX_MASTER_BYTES): unknown {
  if (text.length > maxBytes || utf8Size(text) > maxBytes) throw new PrivacyError("LIMIT");
  let depth = 0;
  let nodes = 0;
  let quoted = false;
  let escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") {
      if (++depth > 24 || ++nodes > 30_000) throw new PrivacyError("LIMIT");
    } else if (char === "}" || char === "]") depth--;
  }
  try { return JSON.parse(text) as unknown; } catch { throw new PrivacyError("INVALID"); }
}

export function assertWorkspace(value: unknown): asserts value is Workspace {
  if (!validate(value)) throw new PrivacyError("INVALID");
  const master = value as Workspace;
  if (master.updatedAt < master.createdAt) throw new PrivacyError("INVALID");
  const seen = new Set<string>([master.id]);
  const partyIds = new Set(master.parties.map((party) => party.id));
  const systemIds = new Set(master.systems.map((system) => system.id));
  const registerId = (id: string) => {
    if (seen.has(id)) throw new PrivacyError("INVALID");
    seen.add(id);
  };
  const links = (ids: string[], allowed: Set<string>) => {
    if (new Set(ids).size !== ids.length || ids.some((id) => !allowed.has(id))) throw new PrivacyError("INVALID");
  };
  for (const entity of [...master.parties, ...master.systems, ...master.activities]) {
    registerId(entity.id);
    if (entity.workspaceId !== master.id) throw new PrivacyError("INVALID");
  }
  const activityIds = new Set(master.activities.map((a) => a.id));
  const purposeIds = new Set(master.activities.flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : []));
  const checkNotes = (notes: ReviewNote[], expected: readonly string[]) => {
    const ids = new Set(notes.map((note) => note.questionId));
    if (ids.size !== expected.length || expected.some((id) => !ids.has(id))) throw new PrivacyError("INVALID");
  };
  for (const activity of master.activities) {
    checkNotes(activity.analysis.notes, ANALYSIS_QUESTIONS);
    for (const flow of activity.flows) registerId(flow.id);
    links(activity.review.subcontractorIds, partyIds);
    links(activity.systemIds, systemIds);
    links(activity.participantIds, partyIds);
    if (activity.role === "processor") links(activity.controllerIds, partyIds);
    else for (const purpose of activity.purposes) registerId(purpose.id);
  }
  const actionKeys = new Set<string>();
  for (const entity of [...master.documents, ...master.decisions, ...master.actions, ...master.imports, ...master.deliveries]) {
    registerId(entity.id);
    if (entity.workspaceId !== master.id) throw new PrivacyError("INVALID");
  }
  for (const doc of master.documents) {
    if (doc.contractReview) {
      if (doc.category !== "contract") throw new PrivacyError("INVALID");
      checkNotes(doc.contractReview.notes, CONTRACT_QUESTIONS);
    }
    links(doc.activityIds, activityIds); links(doc.purposeIds, purposeIds); links(doc.partyIds, partyIds);
    const scopedPurposes = new Set(master.activities.filter((a) => doc.activityIds.includes(a.id)).flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : []));
    links(doc.purposeIds, scopedPurposes);
    if ((doc.status === "reviewed") !== (doc.reviewedAt !== null && doc.reviewedRevision !== null)
      || (doc.status === "declared" && (doc.reviewedAt !== null || doc.reviewedRevision !== null))
      || (doc.reviewedAt && doc.reviewedAt > master.updatedAt)
      || (doc.reviewedRevision && doc.reviewedRevision > master.revision)) throw new PrivacyError("INVALID");
  }
  for (const item of [...master.decisions, ...master.actions]) {
    if (item.activityId !== null && !activityIds.has(item.activityId)) throw new PrivacyError("INVALID");
    if (item.createdAt > master.updatedAt) throw new PrivacyError("INVALID");
  }
  for (const decision of master.decisions) if (decision.revision > master.revision) throw new PrivacyError("INVALID");
  for (const action of master.actions) {
    if (actionKeys.has(action.findingKey) || !action.findingKey.startsWith(action.ruleId + ":")
      || action.reviewedRevision > master.revision
      || (action.closure && (action.closure.at < action.createdAt || action.closure.at > master.updatedAt))) throw new PrivacyError("INVALID");
    actionKeys.add(action.findingKey);
  }
  for (const record of master.imports) {
    links(record.activityIds, activityIds);
    if (record.activityIds.length !== record.acceptedRows.length || record.at > master.updatedAt || record.revision > master.revision
      || new Set([...record.acceptedRows, ...record.rejectedRows.map((row) => row.row)]).size !== record.acceptedRows.length + record.rejectedRows.length
      || new Set(record.mapping.map((m) => m.column)).size !== record.mapping.length
      || new Set(record.mapping.map((m) => m.field)).size !== record.mapping.length) throw new PrivacyError("INVALID");
  }
  for (const record of master.deliveries) if (record.createdAt > master.updatedAt || record.revision >= master.revision) throw new PrivacyError("INVALID");
  assertLinkedFacts(master);
  assertWorkbench(master);
  assertPiaWorkspace(master, registerId);
  assertDpoWorkspace(master, registerId);
  // A saved document must also remain readable by the bounded parser.
  parseBoundedJson(JSON.stringify(master));
}

export function parseWorkspace(text: string): Workspace {
  const value = parseBoundedJson(text);
  assertWorkspace(value);
  return value;
}
