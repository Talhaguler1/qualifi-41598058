// The summary a business chooses to take to its bank ("Karnemi bankama göster").
// The business owns it: no customer names, no raw messages, only aggregates it can explain.

import type { BusinessDataset } from "./business";
import { addDays, diffDays } from "./dates";
import { payerProfile, snapshot, weeklyForecast } from "./forecast";
import { tightestWeek } from "./agent";

export interface BankShareSummary {
  tenant: string;
  company: BusinessDataset["company"];
  asOf: string;
  customers: number;
  openReceivables: number;
  /** Open receivables by the payer's grade (A punctual … D risky), in TL. */
  byGrade: Record<"A" | "B" | "C" | "D" | "-", number>;
  topCustomerShare: number;
  aging: { current: number; d1_30: number; d31_60: number; d60plus: number };
  medianDelayNow: number;
  medianDelayBefore: number;
  promises: { total: number; kept: number };
  instruments: { open: number; openAmount: number; dueLast12m: number; bouncedLast12m: number };
  outlook: { tightestWeek: string; tightestLow: number; endBase: number; endLow: number; endHigh: number };
  notShared: string[];
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)] ?? 0;
};

export function bankShareSummary(dataset: BusinessDataset, asOf: string): BankShareSummary {
  const snap = snapshot(dataset, asOf);
  const open = snap.receivables.filter((r) => r.paidDate === null);
  const openTotal = open.reduce((s, r) => s + r.amount, 0);

  const byGrade: BankShareSummary["byGrade"] = { A: 0, B: 0, C: 0, D: 0, "-": 0 };
  const byCustomer = new Map<string, number>();
  for (const r of open) byCustomer.set(r.customerId, (byCustomer.get(r.customerId) ?? 0) + r.amount);
  for (const [id, amount] of byCustomer) byGrade[payerProfile(snap, id).grade] += amount;

  const aging = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 };
  for (const r of open) {
    const late = diffDays(asOf, r.dueDate);
    if (late <= 0) aging.current += r.amount;
    else if (late <= 30) aging.d1_30 += r.amount;
    else if (late <= 60) aging.d31_60 += r.amount;
    else aging.d60plus += r.amount;
  }

  const paid = snap.receivables.filter((r) => r.paidDate !== null && (r.kind === "invoice" || r.kind === "contract_installment"));
  const delaysBetween = (from: string, to: string) => paid.filter((r) => (r.paidDate as string) > from && (r.paidDate as string) <= to).map((r) => diffDays(r.paidDate as string, r.dueDate));

  const promiseMsgs = snap.chats.filter((m) => m.promiseDate && m.promiseDate <= asOf);
  const kept = promiseMsgs.filter((m) => {
    const r = snap.receivables.find((x) => x.id === m.receivableId);
    return r?.paidDate && diffDays(r.paidDate, m.promiseDate as string) <= 2;
  }).length;

  const instruments = snap.receivables.filter((r) => r.kind === "cheque" || r.kind === "note");
  const yearAgo = addDays(asOf, -365);
  const dueLastYear = instruments.filter((r) => r.dueDate > yearAgo && r.dueDate <= asOf);

  const weeks = weeklyForecast(snap);
  const tight = tightestWeek(weeks);
  const end = weeks.at(-1);

  return {
    tenant: dataset.tenant,
    company: dataset.company,
    asOf,
    customers: byCustomer.size,
    openReceivables: openTotal,
    byGrade,
    topCustomerShare: openTotal ? Math.max(...byCustomer.values()) / openTotal : 0,
    aging,
    medianDelayNow: median(delaysBetween(addDays(asOf, -90), asOf)),
    medianDelayBefore: median(delaysBetween(addDays(asOf, -180), addDays(asOf, -90))),
    promises: { total: promiseMsgs.length, kept },
    instruments: {
      open: instruments.filter((r) => r.paidDate === null && r.dueDate >= asOf).length,
      openAmount: instruments.filter((r) => r.paidDate === null && r.dueDate >= asOf).reduce((s, r) => s + r.amount, 0),
      dueLast12m: dueLastYear.length,
      bouncedLast12m: dueLastYear.filter((r) => r.paidDate === null).length,
    },
    outlook: {
      tightestWeek: tight.weekStart,
      tightestLow: tight.balanceLow,
      endBase: end?.balanceBase ?? 0,
      endLow: end?.balanceLow ?? 0,
      endHigh: end?.balanceHigh ?? 0,
    },
    notShared: ["Müşteri isimleri ve vergi numaraları", "WhatsApp mesajlarının metni", "Tek tek fatura ve çek bilgileri", "Banka hesap hareketleri"],
  };
}
