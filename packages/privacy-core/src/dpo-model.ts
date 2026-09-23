import { createReviewNotes, unknown, type Knowledge, type ReviewNote, type Workspace } from "./model";
import type { PiaContext } from "./pia-model";

export const DPO_METHOD = "dpo-2026-09-23.1" as const;
export const DPO_QUESTIONS = {
  security: ["scope", "event", "threats", "impact", "likelihood", "measures", "residual", "decision"],
  interest: ["interest", "necessity", "balance", "safeguards", "decision"],
  transfer: ["scope", "actors", "instrument", "country", "measures", "implementation", "decision"],
  rights: ["request", "identity", "scope", "search", "exceptions", "response", "dispatch"],
  breach: ["facts", "scope", "consequences", "containment", "authority", "people", "followup"],
} as const;
export type DpoKind = keyof typeof DPO_QUESTIONS;
export interface RightsTiming {
  receivedOn: string | null; regime: "unknown" | "general" | "special";
  calendarConfirmed: boolean; holidays: string[];
  extensionMonths: 0 | 1 | 2; extensionReason: Knowledge; extensionNotifiedOn: string | null;
  manualDue: string | null; manualReason: Knowledge;
}
export interface DpoContent {
  notes: ReviewNote[]; reviewDue: string | null;
  rights: RightsTiming;
  breach: { detectedAt: string | null; awarenessAt: string | null; role: "unknown" | "controller" | "processor" };
}
export interface DpoContext { organization: Workspace["organization"]; activities: PiaContext[] }
export interface DpoEvent { id: string; at: string; author: string; description: string; evidence: Knowledge }
export interface DpoReview {
  id: string; at: string; revision: number; author: string;
  outcome: "reviewed" | "rework" | "closed"; reason: string; content: DpoContent; context: DpoContext;
}
export interface DpoCase {
  id: string; workspaceId: string; kind: DpoKind; title: string; owner: string;
  activityIds: string[]; purposeId: string | null; methodVersion: typeof DPO_METHOD;
  content: DpoContent; events: DpoEvent[]; reviews: DpoReview[];
}
export interface PiaPublication {
  id: string; workspaceId: string; piaId: string; revision: number; createdAt: string;
  recipient: string; scope: string; reservations: string; sourceLabel: string;
  rows: { section: string; label: string; value: string }[];
}
export function createDpoCase(workspaceId: string, id: string, kind: DpoKind): DpoCase {
  return { id, workspaceId, kind, title: "Dossier à décrire", owner: "", activityIds: [], purposeId: null,
    methodVersion: DPO_METHOD, events: [], reviews: [], content: {
      notes: createReviewNotes(DPO_QUESTIONS[kind]), reviewDue: null,
      rights: { receivedOn: null, regime: "unknown", calendarConfirmed: false, holidays: [], extensionMonths: 0, extensionReason: unknown(), extensionNotifiedOn: null, manualDue: null, manualReason: unknown() },
      breach: { detectedAt: null, awarenessAt: null, role: "unknown" },
    } };
}
