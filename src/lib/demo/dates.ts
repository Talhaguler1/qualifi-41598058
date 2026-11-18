// ISO date helpers (YYYY-MM-DD) in UTC, so results never shift by time zone.

import { L, isEnglish } from "./i18n";

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
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "3 gün geç", "2 gün erken" or "vadesinde": never a minus sign next to "erken". */
export function delayPhrase(days: number): string {
  const n = Math.abs(days);
  if (days > 0) return L(`${days} gün geç`, `${n} ${n === 1 ? "day" : "days"} late`);
  if (days < 0) return L(`${-days} gün erken`, `${n} ${n === 1 ? "day" : "days"} early`);
  return L("vadesinde", "on the due date");
}

export function formatDateTr(iso: string): string {
  const months = isEnglish() ? MONTHS_EN : MONTHS_TR;
  return `${Number(iso.slice(8, 10))} ${months.at(Number(iso.slice(5, 7)) - 1) ?? ""} ${iso.slice(0, 4)}`;
}

/**
 * The dates a demo account can be viewed at. Data dated after the chosen date is
 * hidden, so moving forward "delivers" new invoices, payments and messages.
 */
/** The last one is the presentation day (24 Nov 2026), so the demo's "today" matches the room's. */
export const DEMO_DATES = ["2026-10-27", "2026-11-10", "2026-11-24"] as const;
export type DemoDate = (typeof DEMO_DATES)[number];
export const DEFAULT_DEMO_DATE: DemoDate = "2026-11-24";
export const DEMO_DATE_LABELS: Record<DemoDate, string> = {
  "2026-10-27": "4 hafta önce",
  "2026-11-10": "2 hafta önce",
  "2026-11-24": "Bugün · sunum günü",
};
const DEMO_DATE_LABELS_EN: Record<DemoDate, string> = {
  "2026-10-27": "4 weeks ago",
  "2026-11-10": "2 weeks ago",
  "2026-11-24": "Today · presentation day",
};
export const demoDateLabel = (d: DemoDate): string => (isEnglish() ? DEMO_DATE_LABELS_EN[d] : DEMO_DATE_LABELS[d]);

export function isDemoDate(value: unknown): value is DemoDate {
  return typeof value === "string" && (DEMO_DATES as readonly string[]).includes(value);
}

/** History starts a year before the first demo date; data runs past the last one. */
export const HISTORY_START = "2025-10-01";
export const DATA_END = "2027-01-31";
