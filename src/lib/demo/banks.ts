// Multi-bank view, quote requests and the relationship manager's assistant (banker feedback,
// 18 Nov 2026). All banks are fictional ("Banka A/B/C"); no real bank or product name is used.

import { addDays, formatDateTr } from "./dates";
import { createRng } from "./rng";
import { commitmentStatus, firmRisk, type Firm } from "./bank";
import { L } from "./i18n";

export type BankProductKind = "account" | "revolving" | "instalment" | "cheque_discount" | "factoring" | "card";

export interface BankProduct {
  id: string;
  bank: string;
  kind: BankProductKind;
  /** Account balance, or used amount for credit products. */
  amount: number;
  /** Credit limit (credit products only). */
  limit?: number;
  /** Rate (monthly %, credit products only). */
  rate?: number;
  /** Next due date (instalments) */
  nextDue?: string;
  nextAmount?: number;
}

export const DEMO_BANKS = ["Banka A", "Banka B", "Banka C"] as const;

export function productName(kind: BankProductKind): string {
  return {
    account: L("Vadesiz hesap", "Current account"),
    revolving: L("Rotatif kredi", "Revolving credit"),
    instalment: L("Taksitli ticari kredi", "Instalment business loan"),
    cheque_discount: L("Çek iskontosu", "Cheque discounting"),
    factoring: L("Faktoring", "Factoring"),
    card: L("Şirket kartı", "Business card"),
  }[kind];
}

/** One business's products across three fictional banks (deterministic per tenant). */
export function businessBankProducts(tenant: string, asOf: string, mainBalance: number): BankProduct[] {
  const rng = createRng(`banks-${tenant}`);
  const r = (min: number, max: number, step = 10_000) => Math.round(rng.amount(min, max, step));
  return [
    { id: "a-acc", bank: "Banka A", kind: "account", amount: mainBalance },
    { id: "a-rev", bank: "Banka A", kind: "revolving", amount: r(300_000, 700_000), limit: 1_500_000, rate: 3.9 },
    { id: "b-acc", bank: "Banka B", kind: "account", amount: r(150_000, 450_000) },
    { id: "b-ins", bank: "Banka B", kind: "instalment", amount: r(1_200_000, 2_200_000), rate: 3.6, nextDue: addDays(asOf, 9), nextAmount: r(140_000, 210_000) },
    { id: "c-acc", bank: "Banka C", kind: "account", amount: r(40_000, 160_000) },
    { id: "c-card", bank: "Banka C", kind: "card", amount: r(60_000, 140_000), limit: 250_000, nextDue: addDays(asOf, 16), nextAmount: r(60_000, 140_000) },
  ];
}

export interface BankTotals {
  cash: number;
  creditUsed: number;
  creditLimit: number;
  nextDue: { date: string; amount: number; bank: string } | null;
}

export function bankTotals(products: BankProduct[]): BankTotals {
  const cash = products.filter((p) => p.kind === "account").reduce((s, p) => s + p.amount, 0);
  const credit = products.filter((p) => p.kind !== "account");
  const due = products.filter((p) => p.nextDue).sort((a, b) => (a.nextDue as string).localeCompare(b.nextDue as string))[0];
  return {
    cash,
    creditUsed: credit.reduce((s, p) => s + p.amount, 0),
    creditLimit: credit.reduce((s, p) => s + (p.limit ?? p.amount), 0),
    nextDue: due ? { date: due.nextDue as string, amount: due.nextAmount ?? 0, bank: due.bank } : null,
  };
}

export interface Quote {
  bank: string;
  product: BankProductKind;
  amount: number;
  /** Monthly rate in %. */
  rate: number;
  fee: number;
  termDays: number;
  /** Hours to funds. */
  speedHours: number;
  totalCost: number;
}

/**
 * Simulated answers to a quote request for a cash need. In the real product this is a request
 * the business sends with its consent; QualiFi does not broker credit (legal review pending).
 */
export function requestQuotes(tenant: string, amount: number, termDays = 60): Quote[] {
  const rng = createRng(`quotes-${tenant}-${amount}`);
  const offers: Array<[string, BankProductKind, number, number, number]> = [
    ["Banka A", "revolving", 3.75 + rng.next() * 0.3, 0.004, 4],
    ["Banka B", "cheque_discount", 3.45 + rng.next() * 0.3, 0.006, 24],
    ["Banka C", "factoring", 3.3 + rng.next() * 0.35, 0.009, 48],
  ];
  return offers
    .map(([bank, product, rate, feeRate, speedHours]) => {
      const fee = Math.round(amount * feeRate);
      const interest = Math.round(amount * (rate / 100) * (termDays / 30));
      return { bank, product, amount, rate: Math.round(rate * 100) / 100, fee, termDays, speedHours, totalCost: interest + fee };
    })
    .sort((a, b) => a.totalCost - b.totalCost);
}

export interface OfferFromBank {
  bank: string;
  product: BankProductKind;
  amount: number;
  rate: number;
  at: string;
}

// ---------- Relationship manager's assistant ----------

export interface ProductSuggestion {
  product: BankProductKind | "restructure" | "export";
  title: string;
  why: string;
}

/** A proactive, explainable product idea for the relationship manager (generic product names). */
export function suggestProduct(firm: Firm, asOf: string): ProductSuggestion {
  const risk = firmRisk(firm, asOf);
  const visible = firm.signals.filter((s) => s.date <= asOf);
  const stress = visible.some((s) => s.type === "stress" || s.type === "deferral");
  const broken = firm.commitments.filter((c) => commitmentStatus(c, asOf) === "broken").length;
  // Most urgent first: a firm already missing commitments needs a plan, not a new product.
  if (broken >= 2 || (broken >= 1 && stress && risk.score >= 75)) {
    return {
      product: "restructure",
      title: L("Ödeme planı görüşmesi", "Payment plan conversation"),
      why: L("Nakit sıkışıklığı işareti ve tutulmayan taahhüt var; erken yapılandırma takibi azaltır.", "Cash-stress signals and a broken commitment: an early restructuring talk reduces follow-up later."),
    };
  }
  if (visible.some((s) => s.type === "positive" && /ihracat|export/i.test(s.text))) {
    return { product: "export", title: L("İhracat finansmanı", "Export finance"), why: L("Yeni ihracat siparişi mesajı var; sipariş öncesi finansman ihtiyacı doğabilir.", "A new export order was mentioned; pre-shipment finance may be needed.") };
  }
  if (risk.delayChange > 3) {
    return {
      product: "factoring",
      title: L("Faktoring / alacak finansmanı", "Factoring / receivables finance"),
      why: L(`Müşterilerinden tahsil süresi 3 ayda ${risk.delayChange} gün uzadı; alacakları bugüne çekmek nakit açığını kapatır.`, `Its customers pay ${risk.delayChange} days slower than 3 months ago; financing receivables closes the cash gap.`),
    };
  }
  if (stress) {
    return {
      product: "revolving",
      title: L("Kısa vadeli nakit desteği", "Short-term cash support"),
      why: L("Mesajlarda geçici nakit sıkışıklığı var ama taahhütler tutuluyor; kısa vadeli limit işletmeyi rahatlatır.", "Messages show a temporary cash squeeze while commitments are kept; a short-term line would ease it."),
    };
  }
  if (firm.topCustomerShare > 0.4) {
    return { product: "cheque_discount", title: L("Çek iskontosu", "Cheque discounting"), why: L("Gelirin büyük kısmı tek alıcıdan; vadeli çekleri iskonto ederek nakdi dengeleyebilir.", "Most revenue comes from one buyer; discounting post-dated cheques smooths cash.") };
  }
  return { product: "revolving", title: L("Limit artışı / rotatif kredi", "Limit increase / revolving credit"), why: L("Tahsilatları düzenli ve risk düşük; büyüme için limit görüşmesi uygun.", "Collections are steady and risk is low; a good time to discuss a larger limit.") };
}

/** What the AI model is allowed to see: identifiers masked, only aggregates and quotes. */
export function maskedView(firm: Firm, asOf: string) {
  const risk = firmRisk(firm, asOf);
  const mask = (text: string) => text.replace(/\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ (Bey|Hanım)\b/g, "*** $1");
  return {
    id: firm.id,
    name: `${firm.name.slice(0, 1)}*** ${firm.name.split(" ").slice(-2).join(" ")}`,
    taxNo: "*** *** ** 41",
    sector: firm.sector,
    loanBand: firm.loanAmount >= 10_000_000 ? "10 mn+" : firm.loanAmount >= 2_000_000 ? "2–10 mn" : "< 2 mn",
    delayNow: risk.delayNow,
    delayChange: risk.delayChange,
    messages: firm.signals.filter((s) => s.date <= asOf).slice(-3).map((s) => ({ date: formatDateTr(s.date), type: s.type, text: mask(s.text) })),
  };
}

/** Totals of the business's products at other banks, as the business chooses to share them. */
export function otherBanksSummary(tenant: string, asOf: string, viewerBank = "Banka A") {
  const products = businessBankProducts(tenant, asOf, 0).filter((p) => p.bank !== viewerBank && p.kind !== "account");
  const due = products.filter((p) => p.nextDue).sort((a, b) => (a.nextDue as string).localeCompare(b.nextDue as string))[0];
  return {
    banks: new Set(products.map((p) => p.bank)).size,
    creditUsed: products.reduce((s, p) => s + p.amount, 0),
    nextDue: due?.nextDue ?? null,
  };
}
