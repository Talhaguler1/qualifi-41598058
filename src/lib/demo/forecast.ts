// QualiFi's core logic, kept explainable: every number traces back to a customer's
// own payment history. Works the same for mock demo data and uploaded data.

import type { BusinessDataset, ChatMessage, Customer, Expense, Receivable } from "./business";
import { addDays, delayPhrase, diffDays, formatDateTr, maxDate } from "./dates";
import { L, isEnglish } from "./i18n";

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
      if (r.kind === "cheque" || r.kind === "note") {
        // Cheques clear on the due date via clearing (takas) or bounce; notes may slip a few days.
        const label = r.kind === "cheque" ? L("Çek", "Cheque") : L("Senet", "Promissory note");
        const risky = p.grade === "C" || p.grade === "D";
        if (overdueDays > 0) {
          return {
            receivable: r,
            customer,
            expected: addDays(snap.asOf, 30),
            optimistic: addDays(snap.asOf, 14),
            pessimistic: addDays(snap.asOf, 60),
            atRisk: true,
            reason: L(
              `${label} ${formatDateTr(r.dueDate)} vadesinde ödenmedi (${r.kind === "cheque" ? "karşılıksız" : "protesto riski"}); tahmine dahil edilmedi.`,
              `${label} due ${formatDateTr(r.dueDate)} was not paid (${r.kind === "cheque" ? "bounced" : "protest risk"}); left out of the forecast.`,
            ),
          };
        }
        const expected = maxDate(r.kind === "cheque" ? r.dueDate : addDays(r.dueDate, 2), tomorrow);
        return {
          receivable: r,
          customer,
          expected,
          optimistic: maxDate(r.dueDate, tomorrow),
          pessimistic: risky ? addDays(r.dueDate, 30) : addDays(expected, r.kind === "cheque" ? 1 : 7),
          atRisk: false,
          reason: L(
            `${label} vadesi ${formatDateTr(r.dueDate)}${r.kind === "cheque" ? "; takas günü tahsil edilir" : ""}.${risky ? " Keşidecinin ödeme notu düşük, karşılıksız kalma riski var." : ""}`,
            `${label} due ${formatDateTr(r.dueDate)}${r.kind === "cheque" ? "; collected on the clearing day" : ""}.${risky ? " The drawer has a low payer grade, so it may bounce." : ""}`,
          ),
        };
      }
      // A promise in the chat is used when it is still ahead of us.
      const promise = snap.chats
        .filter((m) => m.receivableId === r.id && m.promiseDate && m.promiseDate > snap.asOf)
        .at(-1)?.promiseDate;
      let expected = maxDate(addDays(r.dueDate, p.medianDelay), tomorrow);
      let reason = p.paidCount
        ? L(`Vade ${formatDateTr(r.dueDate)}; bu müşteri genelde ${delayPhrase(p.medianDelay)} ödüyor.`, `Due ${formatDateTr(r.dueDate)}; this customer usually pays ${delayPhrase(p.medianDelay)}.`)
        : L("Ödeme geçmişi yok; vade tarihi esas alındı.", "No payment history; the due date is used.");
      if (overdueDays > 0 && expected <= addDays(snap.asOf, 3)) {
        expected = addDays(snap.asOf, Math.max(7, p.p75Delay - overdueDays));
        reason = L(
          `Vadesi ${overdueDays} gün geçti; geçmişine göre ${diffDays(expected, snap.asOf)} gün içinde bekleniyor.`,
          `${overdueDays} days overdue; based on its history, expected within ${diffDays(expected, snap.asOf)} days.`,
        );
      }
      if (promise) {
        // Promise breakers' promises are discounted by their usual slip.
        const slip = p.grade === "C" || p.grade === "D" ? Math.max(0, p.medianDelay - 7) : 0;
        expected = addDays(promise, slip);
        reason = slip
          ? L(`Mesajda ${formatDateTr(promise)} için söz verdi; sözlerini genelde ${slip} gün kaçırıyor.`, `Promised ${formatDateTr(promise)} in a message; usually misses promises by ${slip} days.`)
          : L(`Mesajda ${formatDateTr(promise)} tarihinde ödeme sözü verdi.`, `Promised payment for ${formatDateTr(promise)} in a message.`);
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
/** A one-off cash movement added on top of the data (positive = money in), e.g. a new project. */
export interface ExtraFlow {
  date: string;
  amount: number;
  label: string;
}

export function weeklyForecast(snap: Snapshot, weeks = 8, adjust?: (inflow: ExpectedInflow) => ExpectedInflow, extra: ExtraFlow[] = []): ForecastWeek[] {
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
    const extraIn = extra.filter((f) => f.amount > 0 && within(f.date)).reduce((s, f) => s + f.amount, 0);
    const extraOut = extra.filter((f) => f.amount < 0 && within(f.date)).reduce((s, f) => s - f.amount, 0);
    const outflow = snap.plannedExpenses.filter((e) => within(e.date)).reduce((s, e) => s + e.amount, 0) + extraOut;
    base += inflowBase + extraIn - outflow;
    low += inflowLow + extraIn - outflow;
    high += inflowHigh + extraIn - outflow;
    result.push({ weekStart: from, inflowBase: inflowBase + extraIn, inflowLow: inflowLow + extraIn, inflowHigh: inflowHigh + extraIn, outflow, balanceBase: base, balanceLow: low, balanceHigh: high });
  }
  return result;
}

export interface AgentAction {
  id: string;
  kind: "reminder" | "promise_check" | "escalate" | "instrument_check";
  customer: Customer;
  receivable: Receivable;
  dueInDays: number;
  reason: string;
  draftMessage: string;
}

const fmt = (n: number) => (isEnglish() ? `TRY ${n.toLocaleString("en-US")}` : `${n.toLocaleString("tr-TR")} TL`);

/** What the agent proposes today. Nothing is sent automatically; the user approves each message. */
export function agentActions(snap: Snapshot, limit = 12): AgentAction[] {
  const actions: AgentAction[] = [];
  for (const inflow of expectedInflows(snap)) {
    const r = inflow.receivable;
    const p = payerProfile(snap, r.customerId);
    const dueInDays = diffDays(r.dueDate, snap.asOf);
    const brokenPromise = snap.chats.find((m) => m.receivableId === r.id && m.promiseDate && m.promiseDate <= snap.asOf);
    const instrument = r.kind === "cheque" || r.kind === "note";
    const label = r.kind === "cheque" ? L("çek", "cheque") : L("senet", "promissory note");
    if (instrument && dueInDays < 0 && dueInDays >= -21) {
      actions.push({
        id: `bounced-${r.id}`,
        kind: "escalate",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: L(`${formatDateTr(r.dueDate)} vadeli ${label} ödenmedi. Karşılıksız ${label} için hemen görüşme önerilir.`, `The ${label} due ${formatDateTr(r.dueDate)} was not paid. Call about the bounced ${label} right away.`),
        draftMessage: L(
          `Merhaba, ${formatDateTr(r.dueDate)} vadeli ${fmt(r.amount)} tutarlı ${label} ödenmedi. Bugün bir ödeme planı konuşabilir miyiz?`,
          `Hello, the ${fmt(r.amount)} ${label} due ${formatDateTr(r.dueDate)} was not paid. Could we agree a payment plan today?`,
        ),
      });
      continue;
    }
    if (instrument && dueInDays >= 0 && dueInDays <= 10 && (p.grade === "C" || p.grade === "D")) {
      actions.push({
        id: `instrument-${r.id}`,
        kind: "instrument_check",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: L(
          `${label.charAt(0).toUpperCase() + label.slice(1)} ${dueInDays} gün sonra vadede; keşidecinin ödemeleri gecikiyor, karşılıksız riski var.`,
          `${label.charAt(0).toUpperCase() + label.slice(1)} due in ${dueInDays} days; the drawer is paying late, so it may bounce.`,
        ),
        draftMessage: L(
          `Merhaba, ${formatDateTr(r.dueDate)} vadeli ${fmt(r.amount)} tutarlı ${label} için hesabınızda karşılık bulunacağını teyit edebilir misiniz? Teşekkürler.`,
          `Hello, could you confirm there will be funds in your account for the ${fmt(r.amount)} ${label} due ${formatDateTr(r.dueDate)}? Thank you.`,
        ),
      });
      continue;
    }
    if (instrument) continue;
    if (brokenPromise) {
      actions.push({
        id: `promise-${r.id}`,
        kind: "promise_check",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: L(`${formatDateTr(brokenPromise.promiseDate as string)} tarihinde ödeme sözü vermişti, ödeme gelmedi.`, `Promised to pay on ${formatDateTr(brokenPromise.promiseDate as string)}; the payment has not arrived.`),
        draftMessage: L(
          `Merhaba, ${r.id} numaralı ${fmt(r.amount)} tutarlı ödeme için ${formatDateTr(brokenPromise.promiseDate as string)} tarihini konuşmuştuk ama henüz ulaşmadı. Bugün gönderebilecek misiniz?`,
          `Hello, we agreed on ${formatDateTr(brokenPromise.promiseDate as string)} for the ${fmt(r.amount)} payment on ${r.id}, but it hasn't arrived yet. Could you send it today?`,
        ),
      });
    } else if (dueInDays < -30 && (p.grade === "D" || inflow.atRisk)) {
      actions.push({
        id: `escalate-${r.id}`,
        kind: "escalate",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: L(`Vadesi ${-dueInDays} gün geçti ve müşterinin ödemeleri yavaşlıyor. Telefonla görüşme önerilir.`, `${-dueInDays} days overdue and the customer is paying more slowly. A phone call is recommended.`),
        draftMessage: L(
          `Merhaba, ${r.id} numaralı ${fmt(r.amount)} tutarlı faturanın vadesi ${-dueInDays} gün önce doldu. Bir ödeme planı konuşmak için bu hafta kısa bir görüşme yapabilir miyiz?`,
          `Hello, invoice ${r.id} for ${fmt(r.amount)} fell due ${-dueInDays} days ago. Could we have a short call this week to agree a payment plan?`,
        ),
      });
    } else if (dueInDays >= 0 && dueInDays <= 7 && p.grade !== "A" && p.grade !== "-") {
      actions.push({
        id: `reminder-${r.id}`,
        kind: "reminder",
        customer: inflow.customer,
        receivable: r,
        dueInDays,
        reason: L(`${dueInDays} gün sonra vadesi doluyor; bu müşteri genelde ${delayPhrase(p.medianDelay)} ödüyor.`, `Due in ${dueInDays} days; this customer usually pays ${delayPhrase(p.medianDelay)}.`),
        draftMessage: L(
          `Merhaba, ${formatDateTr(r.dueDate)} vadeli ${r.id} numaralı ${fmt(r.amount)} tutarlı faturamızı hatırlatmak isteriz. Ödeme tarihini teyit edebilir misiniz? Teşekkürler.`,
          `Hello, a friendly reminder about invoice ${r.id} for ${fmt(r.amount)}, due ${formatDateTr(r.dueDate)}. Could you confirm the payment date? Thank you.`,
        ),
      });
    }
  }
  const order = { promise_check: 0, escalate: 1, instrument_check: 2, reminder: 3 } as const;
  // At most 3 of each kind, so the queue shows the agent's different jobs side by side.
  const perKind: Record<string, number> = {};
  return actions
    .sort((a, b) => order[a.kind] - order[b.kind] || b.receivable.amount - a.receivable.amount)
    .filter((a) => (perKind[a.kind] = (perKind[a.kind] ?? 0) + 1) <= 3)
    .slice(0, limit);
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

export type PredictionOutcome = "on_time" | "late" | "early" | "unpaid";

export interface PredictionCheck {
  receivable: Receivable;
  customer: Customer;
  expected: string;
  paidDate: string | null;
  /** Days between QualiFi's expected date and the real payment (null if unpaid). */
  errorDays: number | null;
  outcome: PredictionOutcome;
}

export interface PromiseCheck {
  message: ChatMessage;
  customer: Customer;
  amount: number;
  paidDate: string | null;
  outcome: "kept" | "late" | "broken";
}

export interface Scorecard {
  from: string;
  to: string;
  predictions: PredictionCheck[];
  paid: number;
  /** Mean absolute error in days among paid items: QualiFi vs. "pays on the due date". */
  avgErrorQualifi: number;
  avgErrorDueDate: number;
  promises: PromiseCheck[];
}

/**
 * Checks predictions made on `from` against what had happened by `to`: only
 * outcomes that are already known on `to` are judged, never future weeks.
 */
export function scorecard(dataset: BusinessDataset, from: string, to: string): Scorecard {
  const predictions: PredictionCheck[] = expectedInflows(snapshot(dataset, from))
    .filter((i) => !i.atRisk && i.expected > from && i.expected <= to)
    .map((i) => {
      const real = dataset.receivables.find((r) => r.id === i.receivable.id);
      const paidDate = real?.paidDate && real.paidDate <= to ? real.paidDate : null;
      const errorDays = paidDate ? diffDays(paidDate, i.expected) : null;
      const outcome: PredictionOutcome = errorDays === null ? "unpaid" : errorDays > 3 ? "late" : errorDays < -3 ? "early" : "on_time";
      return { receivable: i.receivable, customer: i.customer, expected: i.expected, paidDate, errorDays, outcome };
    });
  const paid = predictions.filter((p) => p.paidDate);
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + Math.abs(x), 0) / xs.length) * 10) / 10 : 0);
  const customers = new Map(dataset.customers.map((c) => [c.id, c]));
  const promises: PromiseCheck[] = dataset.chats
    .filter((m) => m.promiseDate && m.date <= to && (m.promiseDate as string) > from && (m.promiseDate as string) <= to)
    .map((m) => {
      const r = dataset.receivables.find((x) => x.id === m.receivableId);
      const paidDate = r?.paidDate && r.paidDate <= to ? r.paidDate : null;
      const outcome = !paidDate ? "broken" : diffDays(paidDate, m.promiseDate as string) > 2 ? "late" : "kept";
      return { message: m, customer: customers.get(m.customerId) as Customer, amount: r?.amount ?? 0, paidDate, outcome };
    });
  return {
    from,
    to,
    predictions,
    paid: paid.length,
    avgErrorQualifi: mean(paid.map((p) => p.errorDays as number)),
    avgErrorDueDate: mean(paid.map((p) => diffDays(p.paidDate as string, p.receivable.dueDate))),
    promises,
  };
}
