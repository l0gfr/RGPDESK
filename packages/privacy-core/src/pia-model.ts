import { createActivityAnalysis, createReviewNotes, unknown, type Activity, type ActivityAnalysis, type EvidenceReference, type Knowledge, type Party, type ReviewNote, type System, type Workspace } from "./model";

export const PIA_METHOD = "aipd-2026-09-22.1" as const;
export const PIA_CRITERIA = ["evaluation", "automated", "monitoring", "sensitive", "scale", "matching", "vulnerable", "innovation", "exclusion"] as const;
export const PIA_PRINCIPLES = ["scope", "governance", "lawfulness", "transparency", "rights", "processors", "transfers", "accuracy"] as const;
export type PiaAnswer = "unknown" | "yes" | "no";
export type PiaLevel = "unknown" | "1" | "2" | "3" | "4";
export interface PiaAlternative {
  id: string; description: Knowledge; purpose: Knowledge; effectiveness: Knowledge;
  impacts: Knowledge; evidence: Knowledge; choice: Knowledge;
}
export interface PiaRisk {
  id: string; title: string; event: Knowledge; people: Knowledge; rights: Knowledge;
  impacts: Knowledge; threats: Knowledge; supports: Knowledge; existingMeasures: Knowledge;
  initialSeverity: PiaLevel; initialLikelihood: PiaLevel; initialReason: Knowledge;
  residualSeverity: PiaLevel; residualLikelihood: PiaLevel; residualReason: Knowledge; residualHigh: PiaAnswer;
}
export interface PiaMeasure {
  id: string; riskIds: string[]; description: Knowledge; owner: Knowledge; due: string | null;
  status: "planned" | "implemented" | "verified"; evidence: Knowledge; effectiveness: Knowledge; failure: Knowledge;
}
export interface PiaContent {
  screening: { criterionId: string; answer: PiaAnswer; reason: Knowledge }[];
  applicability: Knowledge;
  screeningDecision: "unknown" | "required" | "voluntary" | "not-required";
  screeningReason: Knowledge;
  principles: ReviewNote[];
  necessity: ActivityAnalysis;
  alternatives: PiaAlternative[];
  evaluationMethod: Knowledge;
  risks: PiaRisk[]; measures: PiaMeasure[];
  dpoAdvice: Knowledge; peopleConsultation: Knowledge; authorityConsultation: Knowledge;
  monitoring: Knowledge; reviewDue: string | null;
}
export interface PiaContext {
  activity: Activity; organization: Workspace["organization"]; scope: Knowledge; jurisdiction: Knowledge;
  parties: Party[]; systems: System[]; documents: EvidenceReference[];
}
export interface PiaReview {
  id: string; at: string; revision: number; author: string;
  outcome: "rework" | "stop" | "refer-authority" | "proceed";
  reason: string; context: PiaContext; content: PiaContent;
}
export interface ImpactAssessment {
  // One shared study, first usable for risks alone; no duplicate risk inventory.
  scope?: "risks" | "aipd";
  id: string; workspaceId: string; activityId: string; methodVersion: typeof PIA_METHOD;
  content: PiaContent; reviews: PiaReview[];
}
export function createImpactAssessment(workspaceId: string, activity: Activity, id: string): ImpactAssessment {
  return { id, workspaceId, activityId: activity.id, methodVersion: PIA_METHOD, reviews: [], content: {
    screening: PIA_CRITERIA.map((criterionId) => ({ criterionId, answer: "unknown", reason: unknown() })),
    applicability: unknown(), screeningDecision: "unknown", screeningReason: unknown(),
    principles: createReviewNotes(PIA_PRINCIPLES), necessity: createActivityAnalysis(), alternatives: [],
    evaluationMethod: unknown(), risks: [], measures: [], dpoAdvice: unknown(), peopleConsultation: unknown(),
    authorityConsultation: unknown(), monitoring: unknown(), reviewDue: null,
  } };
}
export function createPiaAlternative(id: string): PiaAlternative {
  return { id, description: unknown(), purpose: unknown(), effectiveness: unknown(), impacts: unknown(), evidence: unknown(), choice: unknown() };
}
export function createPiaRisk(id: string): PiaRisk {
  return { id, title: "Scénario à décrire", event: unknown(), people: unknown(), rights: unknown(), impacts: unknown(), threats: unknown(), supports: unknown(), existingMeasures: unknown(), initialSeverity: "unknown", initialLikelihood: "unknown", initialReason: unknown(), residualSeverity: "unknown", residualLikelihood: "unknown", residualReason: unknown(), residualHigh: "unknown" };
}
export function createPiaMeasure(id: string): PiaMeasure {
  return { id, riskIds: [], description: unknown(), owner: unknown(), due: null, status: "planned", evidence: unknown(), effectiveness: unknown(), failure: unknown() };
}
