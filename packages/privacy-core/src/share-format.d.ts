import type { SharedRegister } from "./share";
export const SHARE_LIMITATION: string;
export const SHARE_FILES: string[];
export const PROFILE_LABELS: Record<SharedRegister["profile"], string>;
export const COVERAGE_LABELS: Record<SharedRegister["coverage"], string>;
export function canonicalJson(value: unknown): string;
export function shareCoverage(value: SharedRegister): SharedRegister["coverage"];
export function assertShare(value: unknown): asserts value is SharedRegister;
export function csvCell(input: string): string;
export function shareRows(value: SharedRegister): string[][];
export function renderShareFiles(value: SharedRegister): Record<string, string>;

export function renderLegacyShareFiles(value: SharedRegister): Record<string, string>;
