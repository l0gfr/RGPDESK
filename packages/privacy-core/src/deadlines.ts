import { PrivacyError } from "./validation";
import type { RightsTiming } from "./dpo-model";

export function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validInstant(value: string): boolean {
  const d = new Date(value);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(d.getTime()) && d.toISOString() === value;
}
export function addCalendarMonths(day: string, months: number): string {
  if (!validDay(day) || !Number.isInteger(months) || months < 1 || months > 3) throw new PrivacyError("INVALID");
  const d = new Date(`${day}T00:00:00.000Z`), original = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(d.getTime()); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
  d.setUTCDate(Math.min(original, last.getUTCDate()));
  const result = d.toISOString().slice(0, 10);
  if (!validDay(result)) throw new PrivacyError("INVALID");
  return result;
}
function nextWorkingDay(day: string, holidays: string[]): string {
  if (holidays.length > 60 || holidays.some((d) => !validDay(d))) throw new PrivacyError("INVALID");
  const d = new Date(`${day}T00:00:00.000Z`);
  for (let i = 0; i < 90; i++) {
    const value = d.toISOString().slice(0, 10);
    if (![0, 6].includes(d.getUTCDay()) && !holidays.includes(value)) return value;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  throw new PrivacyError("INVALID");
}
// Article 12 general profile only. No inferred national holidays or suspension.
export function rightsDeadline(t: RightsTiming): { initial: string | null; due: string | null; mode: "unknown" | "general" | "manual" } {
  if (t.manualDue && t.manualReason.state === "documented") {
    if (!validDay(t.manualDue)) throw new PrivacyError("INVALID");
    return { initial: null, due: t.manualDue, mode: "manual" };
  }
  if (t.regime !== "general" || !t.receivedOn || !t.calendarConfirmed) return { initial: null, due: null, mode: "unknown" };
  const initial = nextWorkingDay(addCalendarMonths(t.receivedOn, 1), t.holidays);
  if (![0, 1, 2].includes(t.extensionMonths)) throw new PrivacyError("INVALID");
  if (t.extensionMonths && (t.extensionReason.state !== "documented" || !t.extensionNotifiedOn || !validDay(t.extensionNotifiedOn)
    || t.extensionNotifiedOn < t.receivedOn || t.extensionNotifiedOn > initial)) return { initial, due: initial, mode: "general" };
  return { initial, due: t.extensionMonths ? nextWorkingDay(addCalendarMonths(t.receivedOn, 1 + t.extensionMonths), t.holidays) : initial, mode: "general" };
}
export function breachDeadline(awareness: string | null, role: "unknown" | "controller" | "processor"): string | null {
  if (role !== "controller" || !awareness) return null;
  const d = new Date(awareness);
  if (!validInstant(awareness)) throw new PrivacyError("INVALID");
  return new Date(d.getTime() + 72 * 60 * 60 * 1000).toISOString();
}
