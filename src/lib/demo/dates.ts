// ISO date helpers (YYYY-MM-DD) in UTC, so results never shift by time zone.

const DAY = 86_400_000;

export const toTime = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);
export const fromTime = (time: number): string => new Date(time).toISOString().slice(0, 10);
export const addDays = (iso: string, days: number): string => fromTime(toTime(iso) + days * DAY);
export const diffDays = (later: string, earlier: string): number => Math.round((toTime(later) - toTime(earlier)) / DAY);
export const minDate = (a: string, b: string): string => (a < b ? a : b);
export const maxDate = (a: string, b: string): string => (a > b ? a : b);

/** First day of the month `offset` months after `iso`'s month. */
export function addMonths(iso: string, offset: number): string {
  const d = new Date(toTime(iso));
  return fromTime(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
}

/** Same month, given day (clamped to 28 so every month has it). */
export function withDay(iso: string, day: number): string {
  return `${iso.slice(0, 8)}${String(Math.min(day, 28)).padStart(2, "0")}`;
}

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;

export function formatDateTr(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS_TR.at(Number(iso.slice(5, 7)) - 1) ?? ""} ${iso.slice(0, 4)}`;
}

/**
 * The dates a demo account can be viewed at. Data dated after the chosen date is
 * hidden, so moving forward "delivers" new invoices, payments and messages.
 */
export const DEMO_DATES = ["2026-10-01", "2026-11-01", "2026-12-01"] as const;
export type DemoDate = (typeof DEMO_DATES)[number];
export const DEFAULT_DEMO_DATE: DemoDate = "2026-11-01";

/** History starts a year before the first demo date; data runs past the last one. */
export const HISTORY_START = "2025-10-01";
export const DATA_END = "2027-01-31";
