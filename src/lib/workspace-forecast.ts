// Small, honest cash outlook for an empty account built only from what the user uploaded.
// No payment history yet, so it uses due dates; items needing review or already overdue
// are left out of the cautious line.

import { addDays, diffDays } from "./demo/dates";

export interface WorkspaceCommitment {
  id: string;
  counterparty: string;
  direction: string; // "in" | "out"
  amount: number;
  due_date: string | null;
  kind: string;
  status: string; // "open" | "paid"
  needs_review: boolean;
  /** ISO code from extraction; missing means TRY. */
  currency?: string | null;
}

/** Only Turkish lira amounts are added up; other currencies are listed separately, never converted silently. */
export function isLira(c: Pick<WorkspaceCommitment, "currency">): boolean {
  const cur = (c.currency ?? "TRY").trim().toUpperCase();
  return cur === "TRY" || cur === "TL" || cur === "";
}

/**
 * Items that look like the same money seen in two documents (same direction, amount, currency
 * and due date). The first one stays; the rest are flagged for the user to remove.
 */
export function possibleDuplicates(items: WorkspaceCommitment[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const c of items) {
    if (c.status === "paid" || !c.due_date) continue;
    const key = `${c.direction}|${Math.round(c.amount)}|${(c.currency ?? "TRY").toUpperCase()}|${c.due_date}`;
    if (seen.has(key)) dup.add(c.id);
    else seen.add(key);
  }
  return dup;
}

export interface WorkspaceWeek {
  weekStart: string;
  inflow: number;
  inflowSure: number;
  outflow: number;
  balance: number;
  balanceCautious: number;
}

export interface WorkspaceOutlook {
  weeks: WorkspaceWeek[];
  undated: WorkspaceCommitment[];
  overdue: WorkspaceCommitment[];
  /** Open items in other currencies, left out of every total. */
  foreign: WorkspaceCommitment[];
  /** Possible repeats, left out of every total until the user decides. */
  duplicates: Set<string>;
  openIn: number;
  openOut: number;
}

export function workspaceOutlook(items: WorkspaceCommitment[], startBalance: number, asOf: string, weeks = 8): WorkspaceOutlook {
  const duplicates = possibleDuplicates(items);
  const openAll = items.filter((c) => c.status !== "paid");
  const foreign = openAll.filter((c) => !isLira(c));
  const open = openAll.filter((c) => isLira(c) && !duplicates.has(c.id));
  const undated = open.filter((c) => !c.due_date);
  const dated = open.filter((c) => c.due_date);
  const overdue = dated.filter((c) => c.direction === "in" && (c.due_date as string) < asOf);
  // An overdue receivable is assumed to arrive a week from today in the base line.
  const when = (c: WorkspaceCommitment) => (c.direction === "in" && (c.due_date as string) < asOf ? addDays(asOf, 7) : (c.due_date as string));
  const start = addDays(asOf, 1);
  const result: WorkspaceWeek[] = [];
  let balance = startBalance;
  let cautious = startBalance;
  for (let w = 0; w < weeks; w++) {
    const from = addDays(start, w * 7);
    const to = addDays(from, 7);
    const inWeek = dated.filter((c) => {
      const d = when(c);
      return d >= from && d < to;
    });
    const inflowItems = inWeek.filter((c) => c.direction === "in");
    const inflow = inflowItems.reduce((s, c) => s + c.amount, 0);
    const inflowSure = inflowItems.filter((c) => !c.needs_review && !overdue.includes(c)).reduce((s, c) => s + c.amount, 0);
    const outflow = inWeek.filter((c) => c.direction === "out").reduce((s, c) => s + c.amount, 0);
    balance += inflow - outflow;
    cautious += inflowSure - outflow;
    result.push({ weekStart: from, inflow, inflowSure, outflow, balance, balanceCautious: cautious });
  }
  return {
    weeks: result,
    undated,
    overdue,
    foreign,
    duplicates,
    openIn: open.filter((c) => c.direction === "in").reduce((s, c) => s + c.amount, 0),
    openOut: open.filter((c) => c.direction === "out").reduce((s, c) => s + c.amount, 0),
  };
}

export type PromiseChannel = "phone" | "in_person" | "whatsapp" | "email" | "other";
export const CHANNEL_LABEL: Record<PromiseChannel, string> = {
  phone: "Telefonda",
  in_person: "Yüz yüze",
  whatsapp: "WhatsApp'ta",
  email: "E-postada",
  other: "Başka yoldan",
};

/** A payment promise recorded by hand (kept on this device until the schema stores it). */
export interface PromiseLog {
  commitmentId: string;
  channel: PromiseChannel;
  note: string;
  /** Due date before this promise; null when the promise created the item. */
  oldDue: string | null;
  newDue: string;
  recordedAt: string;
}

export interface DelayCost {
  /** Interest-equivalent cost of every day the money is later than first agreed. */
  total: number;
  /** What one more day of the current overdue amount costs. */
  perDay: number;
  items: number;
}

/**
 * Cost of late money at the owner's own borrowing rate: amount × days later than first agreed
 * × annual rate / 365. Counts overdue days and days pushed by recorded promises.
 */
export function delayCost(items: WorkspaceCommitment[], logs: PromiseLog[], asOf: string, annualRate: number): DelayCost {
  const daily = Math.max(0, annualRate) / 365;
  const duplicates = possibleDuplicates(items);
  let total = 0;
  let perDay = 0;
  let count = 0;
  for (const c of items) {
    if (c.direction !== "in" || c.status === "paid" || !c.due_date || !isLira(c) || duplicates.has(c.id)) continue;
    const firstDue = logs
      .filter((l) => l.commitmentId === c.id && l.oldDue)
      .map((l) => l.oldDue as string)
      .reduce((min, d) => (d < min ? d : min), c.due_date);
    const end = c.due_date < asOf ? asOf : c.due_date;
    const days = diffDays(end, firstDue);
    if (days <= 0) continue;
    total += c.amount * days * daily;
    if (c.due_date < asOf) perDay += c.amount * daily;
    count += 1;
  }
  return { total, perDay, items: count };
}

export interface Coverage {
  inflow: number;
  inflowSure: number;
  outflow: number;
  /** Expected collections ÷ payments due; null when nothing is due. */
  ratio: number | null;
  ratioSure: number | null;
}

/** How much of the payments due in the first N weeks the expected collections cover. */
export function coverage(outlook: WorkspaceOutlook, weeks = 4): Coverage {
  const slice = outlook.weeks.slice(0, weeks);
  const inflow = slice.reduce((s, w) => s + w.inflow, 0);
  const inflowSure = slice.reduce((s, w) => s + w.inflowSure, 0);
  const outflow = slice.reduce((s, w) => s + w.outflow, 0);
  return { inflow, inflowSure, outflow, ratio: outflow > 0 ? inflow / outflow : null, ratioSure: outflow > 0 ? inflowSure / outflow : null };
}

/** Deepest cautious shortfall in the outlook; null when the cautious line never goes below zero. */
export function financingNeed(outlook: WorkspaceOutlook): { amount: number; weekStart: string } | null {
  let worst: WorkspaceWeek | null = null;
  for (const w of outlook.weeks) if (w.balanceCautious < 0 && (!worst || w.balanceCautious < worst.balanceCautious)) worst = w;
  return worst ? { amount: -worst.balanceCautious, weekStart: worst.weekStart } : null;
}

export function daysLate(dueDate: string, asOf: string): number {
  return diffDays(asOf, dueDate);
}

export const KIND_BY_EXTENSION: Record<string, "contract" | "invoice_image" | "spreadsheet" | "whatsapp"> = {
  pdf: "contract",
  png: "invoice_image",
  jpg: "invoice_image",
  jpeg: "invoice_image",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  txt: "whatsapp",
};

export const FILE_KIND_LABEL = { contract: "Sözleşme", invoice_image: "Fatura görseli", spreadsheet: "Excel / CSV", whatsapp: "WhatsApp sohbeti" } as const;
