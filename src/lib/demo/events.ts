// Reading a customer's chat message and turning it into a change in the forecast: the core
// QualiFi moment ("we'll pay 2 weeks later" → the invoice date moves → the cash line bends).
// Rule based on purpose: the demo must be instant, offline and explainable.

import { addDays, diffDays, formatDateTr, maxDate } from "./dates";
import { expectedInflows, weeklyForecast, type ExpectedInflow, type ExtraFlow, type ForecastWeek, type Snapshot } from "./forecast";
import { L } from "./i18n";
import type { Customer, Receivable } from "./business";

export type ChatEventKind = "delay" | "paid" | "split" | "date";

export interface ChatEvent {
  id: string;
  text: string;
  kind: ChatEventKind;
  customer: Customer;
  receivable: Receivable;
  /** Expected payment date before the message. */
  from: string;
  /** Expected payment date after the message (for a split: the first half). */
  to: string;
  /** For a split: when the second half arrives. */
  secondTo?: string;
  amount: number;
  /** True when the customer was not named and the agent assumed the latest conversation. */
  assumedCustomer: boolean;
}

const NUMBER_WORDS: Record<string, number> = { bir: 1, iki: 2, üç: 3, uc: 3, dört: 4, dort: 4, beş: 5, on: 10, one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, a: 1 };

function lower(text: string): string {
  return text.toLocaleLowerCase("tr");
}

/** The customer named in the text (by the distinctive first word of the company name). */
function findCustomer(snap: Snapshot, text: string, open: ExpectedInflow[]): Customer | null {
  const t = lower(text);
  const withOpen = new Set(open.map((i) => i.customer.id));
  const named = snap.dataset.customers.filter((c) => {
    const word = lower(c.name.split(" ")[0] ?? "");
    return word.length >= 3 && new RegExp(`(^|[^a-zçğıöşü])${word}`, "u").test(t);
  });
  const ranked = named
    .filter((c) => withOpen.has(c.id))
    .map((c) => ({ c, sum: open.filter((i) => i.customer.id === c.id).reduce((s, i) => s + i.receivable.amount, 0) }))
    .sort((a, b) => b.sum - a.sum);
  return ranked[0]?.c ?? null;
}

/** The customer of the latest chat about a still-open receivable: who "they" most likely are. */
function latestConversationCustomer(snap: Snapshot, open: ExpectedInflow[]): Customer | null {
  const openIds = new Set(open.map((i) => i.receivable.id));
  const last = [...snap.chats].reverse().find((m) => m.from === "customer" && m.receivableId && openIds.has(m.receivableId));
  return last ? (snap.dataset.customers.find((c) => c.id === last.customerId) ?? null) : null;
}

function nextWeekday(from: string, weekday: number): string {
  const d = new Date(`${from}T00:00:00Z`).getUTCDay();
  const ahead = ((weekday - d + 7) % 7) || 7;
  return addDays(from, ahead);
}

function endOfMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

/** Days of delay in phrases like "2 hafta sonra", "15 gün", "two weeks later", "next month". */
function delayDays(t: string): number | null {
  const m = t.match(/(\d+|bir|iki|üç|uc|dört|dort|beş|on|one|two|three|four|five|ten|a)\s*(gün|gun|hafta|ay|days?|weeks?|months?)\b/u);
  if (m) {
    const n = /^\d+$/.test(m[1] ?? "") ? Number(m[1]) : (NUMBER_WORDS[m[1] ?? ""] ?? 1);
    const unit = m[2] ?? "";
    return n * (/hafta|week/.test(unit) ? 7 : /^ay$|month/.test(unit) ? 30 : 1);
  }
  if (/haftaya|gelecek hafta|next week/.test(t)) return 7;
  if (/gelecek ay|önümüzdeki ay|next month/.test(t)) return 30;
  return null;
}

/** Reads one message. Returns null when it is not about a payment. */
export function readChatMessage(snap: Snapshot, text: string, id = `ev-${Date.now()}`): ChatEvent | null {
  const t = lower(text);
  const open = expectedInflows(snap).filter((i) => !i.atRisk && i.receivable.kind !== "cheque" && i.receivable.kind !== "note");
  if (!open.length) return null;

  const paid = /ödedik|ödedim|ödendi|ödemeyi yaptık|gönderdik|yatırdık|havale (yaptık|ettik|edildi)|eft (yaptık|ettik)|\bpaid\b|we('ve| have)? (sent|transferred)|payment (was )?sent/.test(t);
  const split = /ikiye|iki taksit|iki parça|yarısı|yarısını|bölebilir|bölelim|taksitle|split|two (payments|instalments|installments|parts)|\bhalf\b/.test(t);
  const days = delayDays(t);
  const friday = /cuma|friday/.test(t);
  const monthEnd = /ay sonu|ay sonunda|end of (the )?month/.test(t);
  const late = /geç|gecik|ertele|sonra|later|delay|postpone|push/.test(t);
  if (!paid && !split && days === null && !friday && !monthEnd && !late) return null;

  const named = findCustomer(snap, text, open);
  const customer = named ?? latestConversationCustomer(snap, open) ?? open[0]!.customer;
  const target = open
    .filter((i) => i.customer.id === customer.id)
    .sort((a, b) => b.receivable.amount - a.receivable.amount)[0];
  if (!target) return null;
  const from = target.expected;
  const base = maxDate(from, addDays(snap.asOf, 1));
  const r = target.receivable;

  let kind: ChatEventKind;
  let to: string;
  let secondTo: string | undefined;
  if (paid) {
    kind = "paid";
    to = addDays(snap.asOf, 1);
  } else if (split) {
    kind = "split";
    to = addDays(snap.asOf, 3);
    secondTo = addDays(base, days ?? 30);
  } else if (friday) {
    kind = "date";
    to = nextWeekday(snap.asOf, 5);
  } else if (monthEnd) {
    kind = "date";
    to = maxDate(endOfMonth(snap.asOf), addDays(snap.asOf, 3));
  } else {
    kind = "delay";
    to = addDays(base, days ?? 14);
  }
  return { id, text, kind, customer, receivable: r, from, to, ...(secondTo ? { secondTo } : {}), amount: r.amount, assumedCustomer: !named };
}

/** The forecast inputs that reflect a list of processed messages. */
export function eventAdjustments(events: ChatEvent[]): { adjust: (i: ExpectedInflow) => ExpectedInflow; extra: ExtraFlow[] } {
  const latest = new Map<string, ChatEvent>();
  for (const e of events) latest.set(e.receivable.id, e);
  const extra: ExtraFlow[] = [];
  for (const e of latest.values()) {
    if (e.kind === "split" && e.secondTo) extra.push({ date: e.secondTo, amount: e.amount - Math.round(e.amount / 2), label: "Kalan ödeme" });
  }
  const adjust = (i: ExpectedInflow): ExpectedInflow => {
    const e = latest.get(i.receivable.id);
    if (!e) return i;
    if (e.kind === "split") {
      const half = Math.round(e.amount / 2);
      return { ...i, receivable: { ...i.receivable, amount: half }, expected: e.to, optimistic: e.to, pessimistic: addDays(e.to, 3) };
    }
    const spread = e.kind === "paid" ? 0 : Math.max(0, diffDays(i.pessimistic, i.expected));
    return { ...i, expected: e.to, optimistic: e.to, pessimistic: addDays(e.to, spread) };
  };
  return { adjust, extra };
}

export function forecastWithEvents(snap: Snapshot, events: ChatEvent[]): ForecastWeek[] {
  if (!events.length) return weeklyForecast(snap);
  const { adjust, extra } = eventAdjustments(events);
  return weeklyForecast(snap, 8, adjust, extra);
}

export interface Advice {
  id: string;
  kind: "remind" | "pull" | "defer" | "done";
  title: string;
  detail: string;
}

export interface EventOutcome {
  event: ChatEvent;
  before: ForecastWeek[];
  after: ForecastWeek[];
  /** Index of the week the agent warns about (lowest downside balance after the change). */
  tightIndex: number;
  /** True when that week is now dangerously tight (downside below a month's buffer or below zero). */
  warning: boolean;
  summary: string;
  advice: Advice[];
}

/** What changed, why it matters, and what to do: the agent's reply to one message. */
export function explainEvent(snap: Snapshot, previous: ChatEvent[], event: ChatEvent): EventOutcome {
  const before = forecastWithEvents(snap, previous);
  const after = forecastWithEvents(snap, [...previous, event]);
  const tightIndex = after.reduce((min, w, i, all) => (w.balanceLow < all[min]!.balanceLow ? i : min), 0);
  const tight = after[tightIndex]!;
  const monthlyCost = snap.plannedExpenses.filter((e) => e.date <= addDays(snap.asOf, 30)).reduce((s, e) => s + e.amount, 0);
  const beforeTight = before.reduce((m, w) => Math.min(m, w.balanceLow), Infinity);
  // Warn only when this message makes the tightest point worse and it is genuinely thin (or below zero).
  const worse = tight.balanceLow < beforeTight - 1 || tight.balanceBase < (before[tightIndex]?.balanceBase ?? tight.balanceBase) - 1;
  const warning = event.kind !== "paid" && worse && (tight.balanceLow < 0 || tight.balanceLow < monthlyCost * 0.25);
  const name = event.customer.name;
  const days = diffDays(event.to, event.from);

  const summary =
    event.kind === "paid"
      ? L(`${name} ödediğini yazdı. ${event.receivable.id} tahsil edildi olarak işaretlendi, hatırlatmalar durdu.`, `${name} says they paid. ${event.receivable.id} is marked as collected and reminders are stopped.`)
      : event.kind === "split"
        ? L(
            `${name} ödemeyi ikiye bölmek istiyor. ${event.receivable.id} için ilk yarı ${formatDateTr(event.to)}, kalan yarı ${formatDateTr(event.secondTo as string)} tarihine taşındı.`,
            `${name} wants to split the payment. For ${event.receivable.id}, the first half moved to ${formatDateTr(event.to)} and the rest to ${formatDateTr(event.secondTo as string)}.`,
          )
        : L(
            `${name} ödemeyi ${days > 0 ? `${days} gün ertelediğini` : "yeni bir tarihe aldığını"} yazdı. ${event.receivable.id} için beklenen tarih ${formatDateTr(event.from)} → ${formatDateTr(event.to)}.`,
            `${name} says the payment ${days > 0 ? `will be ${days} days later` : "has a new date"}. ${event.receivable.id} is now expected on ${formatDateTr(event.to)} instead of ${formatDateTr(event.from)}.`,
          );

  const advice: Advice[] = [];
  if (event.kind === "paid") {
    advice.push({ id: "done", kind: "done", title: L("Banka hareketiyle eşleştir", "Match it to the bank transaction"), detail: L("Para hesaba düşünce ajan kaydı otomatik kapatır; düşmezse yarın size sorar.", "When the money lands the agent closes the record; if it does not, it asks you tomorrow.") });
  } else {
    advice.push({
      id: "remind",
      kind: "remind",
      title: L(`${name} için tarih teyidi iste`, `Ask ${name} to confirm the date`),
      detail: L(`Taslak hazır: "${formatDateTr(event.to)} tarihini teyit eder misiniz?" Siz onaylamadan gitmez.`, `Draft ready: "Could you confirm ${formatDateTr(event.to)}?" Nothing is sent without your approval.`),
    });
    if (warning) {
      const pull = expectedInflows(snap)
        .filter((i) => !i.atRisk && i.customer.id !== event.customer.id && i.expected >= tight.weekStart && i.receivable.dueDate < tight.weekStart)
        .sort((a, b) => b.receivable.amount - a.receivable.amount)
        .slice(0, 2);
      if (pull.length) {
        const sum = pull.reduce((s, i) => s + i.receivable.amount, 0);
        advice.push({
          id: "pull",
          kind: "pull",
          title: L("Vadesi gelmiş tahsilatları öne çek", "Pull forward collections that are already due"),
          detail: L(`${pull.map((i) => i.customer.name).join(" ve ")}: toplam ${fmtMoney(sum)}. Önce bunları arayın.`, `${pull.map((i) => i.customer.name).join(" and ")}: ${fmtMoney(sum)} in total. Call these first.`),
        });
      }
      const defer = snap.plannedExpenses
        .filter((e) => e.date >= tight.weekStart && e.date < addDays(tight.weekStart, 7) && e.label === "Tedarikçi ödemesi")
        .sort((a, b) => b.amount - a.amount)[0];
      if (defer) {
        advice.push({
          id: "defer",
          kind: "defer",
          title: L("Bir tedarikçi ödemesini 1 hafta kaydır", "Move one supplier payment by a week"),
          detail: L(`${formatDateTr(defer.date)} tarihli ${fmtMoney(defer.amount)} ödeme, sıkışan haftayı rahatlatır.`, `The ${fmtMoney(defer.amount)} payment on ${formatDateTr(defer.date)} would ease the tight week.`),
        });
      }
    }
  }
  return { event, before, after, tightIndex, warning, summary, advice: advice.slice(0, 3) };
}

// Local money formatter (avoids a cycle with agent.ts, which imports forecast helpers).
function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return L(`₺${(abs / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} mn`, `₺${(abs / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`);
  if (abs >= 10_000) return L(`₺${Math.round(abs / 1000).toLocaleString("tr-TR")} bin`, `₺${Math.round(abs / 1000).toLocaleString("en-US")}K`);
  return `₺${Math.round(abs).toLocaleString(L("tr-TR", "en-US"))}`;
}

/** The customer whose delay matters most: the largest invoice expected in the tightest week. */
export function pivotalCustomer(snap: Snapshot): Customer | null {
  const weeks = weeklyForecast(snap);
  const tight = weeks.reduce((m, w) => (w.balanceLow < m.balanceLow ? w : m), weeks[0]!);
  const end = addDays(tight.weekStart, 7);
  const hit = expectedInflows(snap)
    .filter((i) => !i.atRisk && i.receivable.kind === "invoice" && i.expected >= tight.weekStart && i.expected < end)
    .sort((a, b) => b.receivable.amount - a.receivable.amount)[0];
  return hit?.customer ?? null;
}

/** One-click sample messages for the demo (TR originals are what the agent reads). */
export function sampleMessages(customerName: string, delayCustomerName = customerName): { label: string; text: string }[] {
  const first = customerName.split(" ")[0] ?? customerName;
  const late = delayCustomerName.split(" ")[0] ?? delayCustomerName;
  return [
    { label: L("“2 hafta sonra ödeyeceğiz”", "“We'll pay in 2 weeks”"), text: L(`${late}: Merhaba, ödemeyi 2 hafta sonra yapabileceğiz, kusura bakmayın.`, `${late}: Hi, we'll be able to pay in 2 weeks, sorry about that.`) },
    { label: L("“Bugün ödedik”", "“Paid today”"), text: L(`${first}: Bugün havale yaptık, dekontu ekledim.`, `${first}: We paid today, the receipt is attached.`) },
    { label: L("“İkiye bölebilir miyiz?”", "“Can we split it?”"), text: L(`${first}: Ödemeyi ikiye bölebilir miyiz? Yarısını bu hafta, kalanını ay sonunda.`, `${first}: Can we split the payment into two? Half this week, the rest next month.`) },
    { label: L("“Cuma gönderiyoruz”", "“Sending on Friday”"), text: L(`${first}: Cuma günü gönderiyoruz.`, `${first}: We're sending it on Friday.`) },
  ];
}
