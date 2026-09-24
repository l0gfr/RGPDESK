import type { SharedActivity } from "./share";
export type ProgressState = "documented" | "partial" | "missing";
export interface ProgressPoint { label: string; icon: string; step: number; documented: number; total: number; state: ProgressState }
export const PROGRESS_STATES: Record<ProgressState, {label:string;plural:string;symbol:string}>;
export const PROGRESS_NOTE: string;
export function activityProgress(activity: SharedActivity): ProgressPoint[];
export function registerProgress(activities: SharedActivity[]): { rows: {title:string;checkpoints:ProgressPoint[]}[]; counts:Record<ProgressState,number>; total:number };
