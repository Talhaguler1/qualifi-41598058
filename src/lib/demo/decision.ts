// Decision summary for the demo business: cost of delay, 30-day coverage and financing need,
// plus turning a promise taken on the phone into the same event a WhatsApp message creates.

import { diffDays, maxDate } from "./dates";
import { eventAdjustments, type ChatEvent } from "./events";
import { expectedInflows, type ForecastWeek, type Snapshot } from "./forecast";

export interface DemoDecision {
  /** Interest-equivalent cost of every expected collection that arrives after its due date. */
  delayCost: number;
  /** What one more day of the already-overdue amount costs. */
  delayPerDay: number;
  lateItems: number;
  /** Expected collections ÷ payments in the next 4 weeks (base and downside). */
  coverage: number | null;
  coverageLow: number | null;
  inflow30: number;
  outflow30: number;
  /** Deepest downside shortfall in the 8-week forecast, if any. */
  need: { amount: number; weekStart: string } | null;
}

export function demoDecision(
  snap: Snapshot,
  weeks: ForecastWeek[],
  events: ChatEvent[],
  annualRate: number,
): DemoDecision {
  const daily = Math.max(0, annualRate) / 365;
  const { adjust } = eventAdjustments(events);
  let delayCost = 0;
  let delayPerDay = 0;
  let lateItems = 0;
  for (const raw of expectedInflows(snap)) {
    if (raw.atRisk) continue;
    const due = raw.receivable.dueDate;
    const arrives = maxDate(adjust(raw).expected, snap.asOf);
    const days = diffDays(arrives, due);
    if (days <= 0) continue;
    delayCost += raw.receivable.amount * days * daily;
    if (due < snap.asOf) delayPerDay += raw.receivable.amount * daily;
    lateItems += 1;
  }
  const four = weeks.slice(0, 4);
  const inflow30 = four.reduce((s, w) => s + w.inflowBase, 0);
  const inflowLow = four.reduce((s, w) => s + w.inflowLow, 0);
  const outflow30 = four.reduce((s, w) => s + w.outflow, 0);
  let worst: ForecastWeek | null = null;
  for (const w of weeks)
    if (w.balanceLow < 0 && (!worst || w.balanceLow < worst.balanceLow)) worst = w;
  return {
    delayCost,
    delayPerDay,
    lateItems,
    coverage: outflow30 > 0 ? inflow30 / outflow30 : null,
    coverageLow: outflow30 > 0 ? inflowLow / outflow30 : null,
    inflow30,
    outflow30,
    need: worst ? { amount: -worst.balanceLow, weekStart: worst.weekStart } : null,
  };
}

export type PromiseChannel = "phone" | "in_person" | "whatsapp" | "email";

/** Receivables a promise can be recorded against: open, expected, not a cheque or note. */
export function promiseTargets(snap: Snapshot) {
  return expectedInflows(snap)
    .filter((i) => !i.atRisk && i.receivable.kind !== "cheque" && i.receivable.kind !== "note")
    .sort((a, b) => b.receivable.amount - a.receivable.amount);
}

/** A promise given on the phone or in person becomes the same date-moving event a message would. */
export function promiseEvent(
  snap: Snapshot,
  receivableId: string,
  date: string,
  text: string,
  id: string,
  source?: string,
): ChatEvent | null {
  const target = promiseTargets(snap).find((i) => i.receivable.id === receivableId);
  if (!target || !date) return null;
  return {
    id,
    text,
    kind: "date",
    customer: target.customer,
    receivable: target.receivable,
    from: target.expected,
    to: date,
    amount: target.receivable.amount,
    assumedCustomer: false,
    ...(source ? { source } : {}),
  };
}
