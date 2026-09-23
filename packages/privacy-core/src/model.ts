import type { DpoCase, PiaPublication } from "./dpo-model";
import type { ImpactAssessment } from "./pia-model";
export type Knowledge = { state: "unknown" } | { state: "documented"; value: string };
export interface Entity { id: string; workspaceId: string; name: string }
export interface Party extends Entity { contact: Knowledge }
export interface System extends Entity { description: Knowledge }
export interface Purpose {
  id: string;
  description: Knowledge;
  legalBasis: Knowledge;
  retention: { period: Knowledge; trigger: Knowledge };
}
export interface ActivityReview {
  article9: Knowledge; article10: Knowledge;
  transferStatus: "unknown" | "none-reviewed" | "identified";
  collection: "unknown" | "direct" | "indirect" | "both";
  subcontractorIds: string[];
}
export const ANALYSIS_QUESTIONS = ["objective", "lawfulness", "effectiveness", "alternatives", "minimisation", "rights", "safeguards", "conclusion"] as const;
export const CONTRACT_QUESTIONS = ["scope", "instructions", "confidentiality", "security", "subprocessors", "rights", "assistance", "termination", "audit", "unlawful", "guarantees"] as const;
export interface EvidenceCitation { documentId: string; version: string; locator: string; meaning: string }
export interface ReviewNote {
  citations?: EvidenceCitation[];
  questionId: string;
  facts: Knowledge; evidence: Knowledge; objections: Knowledge; assessment: Knowledge; followUp: Knowledge;
}
export interface ActivityAnalysis {
  methodVersion: "necessity-2026-09-22.1";
  operations: Knowledge; access: Knowledge; notes: ReviewNote[];
}
export type FlowReference = `party:${string}` | `system:${string}` | "subjects";
export interface DataFlow {
  sourceRef?: FlowReference; destinationRef?: FlowReference; dataFromActivity?: boolean;
  id: string;
  source: Knowledge; destination: Knowledge; operation: Knowledge;
  data: Knowledge; channel: Knowledge; location: Knowledge; access: Knowledge;
}
export interface ContractReview { methodVersion: "article28-2026-09-22.1"; notes: ReviewNote[] }
interface ActivityBase {
  interviewQuestions?: string[];
  analysis: ActivityAnalysis;
  flows: DataFlow[];
  review: ActivityReview;
  id: string;
  workspaceId: string;
  title: string;
  status: "draft" | "active" | "archived";
  systemIds: string[];
  participantIds: string[];
  dataCategories: Knowledge;
  dataSubjects: Knowledge;
  recipients: Knowledge;
  transfers: Knowledge;
  securityMeasures: Knowledge;
  internalNotes: string;
}
export interface ControllerActivity extends ActivityBase {
  role: "controller";
  purposes: Purpose[];
}
export interface ProcessorActivity extends ActivityBase {
  role: "processor";
  controllerIds: string[];
  operations: Knowledge;
  instructions: Knowledge;
}
export type Activity = ControllerActivity | ProcessorActivity;
export type WorkCheckpoint = {kind: "activity"; id: string; section: "record" | "analysis" | "flows" | "evidence" | "interview"; step: number}
  | {kind: "pia"; id: string; step: number}
  | {kind: "dpo"; id: string; section: "scope" | "analysis" | "events" | "review"}
  | {kind: "document" | "party" | "system"; id: string};
export interface CitationReview {
  target: string; documentId: string; locator: string; meaning: string;
  fromVersion: string; toVersion: string; before: Knowledge; after: Knowledge;
  outcome: "maintained" | "revised"; author: string; reason: string; at: string; revision: number;
}
export interface Workspace {
  workCheckpoint?: WorkCheckpoint;
  citationReviews?: CitationReview[];
  format: "rgpd-master-v6";
  impactAssessments: ImpactAssessment[];
  dpoCases: DpoCase[];
  piaPublications: PiaPublication[];
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  language: "fr";
  jurisdiction: Knowledge;
  scope: Knowledge;
  organization: { name: string; contact: Knowledge; dpo: Knowledge; representatives: Knowledge };
  parties: Party[];
  systems: System[];
  activities: Activity[];
  documents: EvidenceReference[];
  decisions: Decision[];
  actions: DocumentaryAction[];
  imports: ImportRecord[];
  deliveries: DeliveryRecord[];
}
export const unknown = (): Knowledge => ({ state: "unknown" });
export const knowledge = (value: string): Knowledge => value.trim() ? { state: "documented", value: value.trim() } : unknown();
export const knowledgeText = (value: Knowledge): string => value.state === "documented" ? value.value : "";

export interface EvidenceReference {
  contractReview: ContractReview | null;
  id: string; workspaceId: string; title: string;
  category: "contract" | "notice" | "policy" | "analysis" | "other";
  activityIds: string[]; purposeIds: string[]; partyIds: string[];
  scope: string; version: string; declaredAuthor: string; internalRef: string;
  publicReference: string; reservations: string; sensitivity: "internal" | "restricted";
  status: "declared" | "reviewed"; reviewedRevision: number | null;
  reviewedAt: string | null; reviewDue: string | null;
  audience: string; channel: string; availability: Knowledge;
}
export interface Decision {
  id: string; workspaceId: string; ruleId: string; activityId: string | null;
  author: string; justification: string; conclusion: string; createdAt: string;
  revision: number; catalogVersion: string;
}
export interface DocumentaryAction {
  id: string; workspaceId: string; findingKey: string; ruleId: string; activityId: string | null;
  scope: string; owner: string; due: string | null; createdAt: string;
  catalogVersion: string; reviewedRevision: number;
  closure: null | { at: string; author: string; justification: string };
}
export interface ImportRecord {
  id: string; workspaceId: string; at: string; revision: number;
  encoding: "utf-8" | "windows-1252"; delimiter: "," | ";" | "\t";
  mapping: { column: number; field: string }[];
  acceptedRows: number[]; rejectedRows: { row: number; reason: "columns" | "role" | "title" | "invalid" }[];
  ignoredColumns: number[]; ignoredCells: { row: number; column: number; reason: "role-incompatible" }[]; activityIds: string[];
}
export type ShareProfile = "article30-controller" | "article30-processor" | "internal-review" | "client-excerpt";
export interface DeliveryRecord {
  id: string; workspaceId: string; revision: number; createdAt: string;
  profile: ShareProfile; recipient: string; catalogVersion: string;
  manifestHash: string;
}
export const createActivityReview = (): ActivityReview => ({
  article9: unknown(), article10: unknown(), transferStatus: "unknown", collection: "unknown", subcontractorIds: [],
});

export const createReviewNotes = (questions: readonly string[]): ReviewNote[] => questions.map((questionId) => ({
  questionId, facts: unknown(), evidence: unknown(), objections: unknown(), assessment: unknown(), followUp: unknown(),
}));
export const createActivityAnalysis = (): ActivityAnalysis => ({
  methodVersion: "necessity-2026-09-22.1", operations: unknown(), access: unknown(), notes: createReviewNotes(ANALYSIS_QUESTIONS),
});
export const createContractReview = (): ContractReview => ({ methodVersion: "article28-2026-09-22.1", notes: createReviewNotes(CONTRACT_QUESTIONS) });
export const createDataFlow = (id: string): DataFlow => ({
  id, source: unknown(), destination: unknown(), operation: unknown(), data: unknown(), channel: unknown(), location: unknown(), access: unknown(),
});
