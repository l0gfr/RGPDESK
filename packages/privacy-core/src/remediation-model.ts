import type { Knowledge, EvidenceCitation } from './model';
import type { PiaContext } from './pia-model';
export type CorrectionValue = Knowledge | string | string[] | {reference: string; description: Knowledge};
export interface CorrectionChange { key: string; label: string; before: CorrectionValue; after: CorrectionValue; basis: string }
export interface CorrectivePlan {
  title: string; priority: 'first' | 'next' | 'later'; reason: string; dependsOn: string[];
  preparedAt: string; preparedRevision: number; changes: CorrectionChange[];
  application: null | {revision: number; version: number; before: PiaContext; after: PiaContext; evidence: EvidenceCitation[]};
}
export interface CorrectiveDraft {
  kind: 'corrective'; mode: 'prepare' | 'complete' | 'abandon'; actionId: string; activityId: string;
  title: string; priority: '' | CorrectivePlan['priority']; reason: string; owner: string; due: string; dependsOn: string[];
  changes: CorrectionChange[]; author: string; justification: string; evidence: EvidenceCitation[];
}
