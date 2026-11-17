// QualiFi's core logic, kept explainable: every number traces back to a customer's
// own payment history. Works the same for mock demo data and uploaded data.

import type { BusinessDataset, ChatMessage, Customer, Expense, Receivable } from "./business";
import { addDays, diffDays, maxDate } from "./dates";

/** What is known on `asOf`: nothing dated later exists yet. */
export interface Snapshot {
  asOf: string;
  dataset: BusinessDataset;
  receivables: Receivable[]; // issued by asOf; paidDate cleared if paid later
  pastExpenses: Expense[];
  plannedExpenses: Expense[];
  chats: ChatMessage[];
}

export function snapshot(dataset: BusinessDataset, asOf: string): Snapshot {
  return {
    asOf,
    dataset,
    receivables: dataset.receivables
      .filter((r) => r.issueDate <= asOf)
      .map((r) => (r.paidDate !== null && r.paidDate <= asOf ? r : { ...r, paidDate: null })),
    pastExpenses: dataset.expenses.filter((e) => e.date <= asOf),
    plannedExpenses: dataset.expenses.filter((e) => e.date > asOf),
    chats: dataset.chats.filter((m) => m.date <= asOf),
  };
}

export interface PayerProfile {
  customerId: string;
  paidCount: number;
  /** Days late at the median payment (negative = early). */
  medianDelay: number;
  p25Delay: number;
  p75Delay: number;
  onTimeRate: number | null;
  openAmount: number;
  overdueAmount: number;
  /** Median delay of the last 3 payments minus the earlier ones; positive = getting slower. */
  trend: number;
  grade: "A" | "B" | "C" | "D" | "-";
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? a;
  return Math.round(a + (b - a) * (pos - lo));
}

export function payerProfile(snap: Snapshot, customerId: string): PayerProfile {
  const mine = snap.receivables.filter((r) => r.customerId === customerId);
  const paid = mine.filter((r) => r.paidDate !== null).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const delays = paid.map((r) => diffDays(r.paidDate as string, r.dueDate));
  const sorted = [...delays].sort((a, b) => a - b);
  const open = mine.filter((r) => r.paidDate === null);
  const recent = delays.slice(-3).sort((a, b) => a - b);
  const earlier = delays.slice(0, -3).sort((a, b) => a - b);
  const onTimeRate = delays.length ? delays.filter((d) => d <= 3).length / delays.length : null;
  const medianDelay = quantile(sorted, 0.5);
  const overdueAmount = open.filter((r) => r.dueDate < snap.asOf).reduce((s, r) => s + r.amount, 0);
  const longOverdue = open.some((r) => diffDays(snap.asOf, r.dueDate) > 45);
  let grade: PayerProfile["grade"] = "-";
  if (delays.length > 0) {
    if (longOverdue || medianDelay > 25) grade = "D";
    else if (medianDelay > 10) grade = "C";
    else if (medianDelay > 3 || (onTimeRate ?? 1) < 0.7) grade = "B";
    else grade = "A";
  } else if (longOverdue) grade = "D";
  return {
    customerId,
    paidCount: paid.length,
    medianDelay,
    p25Delay: quantile(sorted, 0.25),
    p75Delay: quantile(sorted, 0.75),
    onTimeRate,
    openAmount: open.reduce((s, r) => s + r.amount, 0),
    overdueAmount,
    trend: recent.length && earlier.length ? quantile(recent, 0.5) - quantile(earlier, 0.5) : 0,
    grade,
  };
}

export interface ExpectedInflow {
  receivable: Receivable;
  customer: Customer;
  expected: string;
  optimistic: string;
  pessimistic: string;
  /** Long overdue with a payer that has stopped paying: left out of the base case. */
  atRisk: boolean;
  reason: string;
}

export function expectedInflows(snap: Snapshot): ExpectedInflow[] {
  const customers = new Map(snap.dataset.customers.map((c) => [c.id, c]));
  const profiles = new Map<string, PayerProfile>();
  const profileOf = (id: string) => {
    let p = profiles.get(id);
    if (!p) profiles.set(id, (p = payerProfile(snap, id)));
    return p;
  };
  const tomorrow = addDays(snap.asOf, 1);
  return snap.receivables
    .filter((r) => r.paidDate === null)
    .map((r) => {
      const p = profileOf(r.customerId);
      const customer = customers.get(r.customerId) as Customer;
      const overdueDays = diffDays(snap.asOf, r.dueDate);
      const atRisk = overdueDays > 45 && (p.grade === "D" || p.paidCount === 0);
      // A promise in the chat is used when it is still ahead of us.
      const promise = snap.chats
        .filter((m) => m.receivableId === r.id && m.promiseDate && m.promiseDate > snap.asOf)
        .at(-1)?.promiseDate;
      let expected = maxDate(addDays(r.dueDate, p.medianDelay), tomorrow);
      let reason = p.paidCount
        ? `Vade ${r.dueDate}; bu müşteri ortanca ${p.medianDelay} gün ${p.medianDelay >= 0 ? "geç" : "erken"} ödüyor.`
        : "Ödeme geçmişi yok; vade tarihi esas alındı.";
      if (overdueDays > 0 && expected <= addDays(snap.asOf, 3)) {
        expected = addDays(snap.asOf, Math.max(7, p.p75Delay - overdueDays));
        reason = `Vadesi ${overdueDays} gün geçti; geçmişine göre ${diffDays(expected, snap.asOf)} gün içinde bekleniyor.`;
      }
      if (promise) {
        // Promise breakers' promises are discounted by their usual slip.
        const slip = p.grade === "C" || p.grade === "D" ? Math.max(0, p.medianDelay - 7) : 0;
        expected = addDays(promise, slip);
        reason = slip ? `Mesajda ${promise} sözü verdi; sözlerini genelde ${slip} gün kaçırıyor.` : `Mesajda ${promise} tarihinde ödeme sözü verdi.`;
      }
      return {
        receivable: r,
        customer,
        expected,
        optimistic: maxDate(addDays(r.dueDate, Math.min(p.p25Delay, p.medianDelay)), tomorrow),
        pessimistic: maxDate(addDays(r.dueDate, Math.max(p.p75Delay, p.medianDelay) + (p.trend > 0 ? p.trend : 0)), addDays(expected, 3)),
        atRisk,
        reason,
      };
    });
}

export interface ForecastWeek {
  weekStart: string;
  inflowBase: number;
  inflowLow: number;
  inflowHigh: number;
  outflow: number;
  balanceBase: number;
  balanceLow: number;
  balanceHigh: number;
}

export function currentBalance(snap: Snapshot): number {
  const paidIn = snap.receivables.reduce((s, r) => s + (r.paidDate ? r.amount : 0), 0);
  const paidOut = snap.pastExpenses.reduce((s, e) => s + e.amount, 0);
  return snap.dataset.openingBalance + paidIn - paidOut;
}

/** Weekly cash outlook: base case plus an optimistic–pessimistic range. */
export function weeklyForecast(snap: Snapshot, weeks = 8, adjust?: (inflow: ExpectedInflow) => ExpectedInflow): ForecastWeek[] {
  const inflows = adjust ? expectedInflows(snap).map(adjust) : expectedInflows(snap);
  const start = addDays(snap.asOf, 1);
  const result: ForecastWeek[] = [];
  let base = currentBalance(snap);
  let low = base;
  let high = base;
  for (let w = 0; w < weeks; w++) {
    const from = addDays(start, w * 7);
    const to = addDays(from, 7);
    const within = (d: string) => d >= from && d < to;
    const inflowBase = inflows.filter((i) => !i.atRisk && within(i.expected)).reduce((s, i) => s + i.receivable.amount, 0);
    const inflowLow = inflows.filter((i) => !i.atRisk && within(i.pessimistic)).reduce((s, i) => s + i.receivable.amount, 0);
    const inflowHigh = inflows.filter((i) => within(i.optimistic)).reduce((s, i) => s + i.receivable.amount, 0);
    const outflow = snap.plannedExpenses.filter((e) => within(e.date)).reduce((s, e) => s + e.amount, 0);
    base += inflowBase - outflow;
    low += inflowLow - outflow;
    high += inflowHigh - outflow;
    result.push({ weekStart: from, inflowBase, inflowLow, inflowHigh, outflow, balanceBase: base, balanceLow: low, balanceHigh: high });
  }
  return result;
}

export interface AgentAction {
  id: string;
  kind: "reminder" | "promise_check" | "escalate";
  customer: Customer;
  receivable: Receivable;
  dueInDays: number;
  reason: string;
  draftMessage: string;
}

const fmt = (n: number) => `${n.toLocaleString("tr-TR")} TL`;

/** What the agent proposes today. Nothing is sent automatically; the user approves each message. */
export function agentActions(snap: Snapshot, limit = 12): AgentAction[] {
  const actions: AgentAction[] = [];
  for (const inflow of expectedInflows(snap)) {
    const r = inflow.receivable;
    const p = payerProfile(snap, r.customerId);
    const dueInDays = diffDays(r.dueDate, snap.asOf);
    const brokenPromise = snap.chats.find((m) => m.receivableId === r.id && m.promiseDate && m.promiseDate <= snap.asOf);
    const name = inflow.customer.name;
    if (brokenPromise) {
      actions.push({
        id: `promise-${r.id}`,
        kind: "promise_check",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: `${brokenPromise.promiseDate} tarihinde ödeme sözü vermişti, ödeme gelmedi.`,
        draftMessage: `Merhaba, ${r.id} numaralı ${fmt(r.amount)} tutarlı ödeme için ${brokenPromise.promiseDate} tarihini konuşmuştuk ama henüz ulaşmadı. Bugün gönderebilecek misiniz?`,
      });
    } else if (dueInDays < -30 && (p.grade === "D" || inflow.atRisk)) {
      actions.push({
        id: `escalate-${r.id}`,
        kind: "escalate",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: `Vadesi ${-dueInDays} gün geçti ve müşterinin ödemeleri yavaşlıyor. Telefonla görüşme önerilir.`,
        draftMessage: `Merhaba, ${r.id} numaralı ${fmt(r.amount)} tutarlı faturanın vadesi ${-dueInDays} gün önce doldu. Bir ödeme planı konuşmak için bu hafta kısa bir görüşme yapabilir miyiz?`,
      });
    } else if (dueInDays >= 0 && dueInDays <= 7 && p.grade !== "A" && p.grade !== "-") {
      actions.push({
        id: `reminder-${r.id}`,
        kind: "reminder",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: `${dueInDays} gün sonra vadesi doluyor; bu müşteri genelde ${p.medianDelay} gün geç ödüyor.`,
        draftMessage: `Merhaba, ${r.dueDate} vadeli ${r.id} numaralı ${fmt(r.amount)} tutarlı faturamızı hatırlatmak isteriz. Ödeme tarihini teyit edebilir misiniz? Teşekkürler.`,
      });
    }
  }
  const order = { promise_check: 0, escalate: 1, reminder: 2 } as const;
  return actions.sort((a, b) => order[a.kind] - order[b.kind] || b.receivable.amount - a.receivable.amount).slice(0, limit);
}

/** How well the outlook made on `from` predicted the money that actually arrived before `to`. */
export function forecastAccuracy(dataset: BusinessDataset, from: string, to: string) {
  const predicted = expectedInflows(snapshot(dataset, from))
    .filter((i) => !i.atRisk && i.expected < to)
    .reduce((s, i) => s + i.receivable.amount, 0);
  const actual = dataset.receivables
    .filter((r) => r.issueDate <= from && r.paidDate !== null && r.paidDate > from && r.paidDate < to)
    .reduce((s, r) => s + r.amount, 0);
  return { from, to, predicted, actual, errorRate: actual ? Math.abs(predicted - actual) / actual : 0 };
}
