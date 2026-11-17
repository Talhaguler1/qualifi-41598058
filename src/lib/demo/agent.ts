// The QualiFi agent: what it noticed since the last look, what it concludes about
// cash, what it proposes, and answers to questions — all computed from the data,
// with numbers the user can trace. It never sends anything without approval.

import { firmRisk, commitmentStatus, type Firm } from "./bank";
import type { BusinessDataset } from "./business";
import { addDays, diffDays, formatDateTr } from "./dates";
import {
  agentActions,
  currentBalance,
  expectedInflows,
  payerProfile,
  snapshot,
  weeklyForecast,
  type ExpectedInflow,
  type ForecastWeek,
  type Snapshot,
} from "./forecast";

export const money = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}₺${(abs / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} mn`;
  if (abs >= 10_000) return `${sign}₺${Math.round(abs / 1000).toLocaleString("tr-TR")} bin`;
  return `${sign}₺${Math.round(abs).toLocaleString("tr-TR")}`;
};

export type AgentTool = "erp" | "muhasebe" | "banka" | "whatsapp" | "karne" | "tahmin" | "takip";

export interface AgentStep {
  id: string;
  tool: AgentTool;
  title: string;
  detail: string;
}

/** The agent's work log for one run, read in order like an agent doing its rounds. */
export function agentRun(dataset: BusinessDataset, asOf: string, since = addDays(asOf, -14)): AgentStep[] {
  const now = snapshot(dataset, asOf);
  const before = snapshot(dataset, since);
  const inRange = (d: string | null) => d !== null && d > since && d <= asOf;
  const orders = dataset.receivables.filter((r) => r.kind === "invoice" && inRange(r.issueDate));
  const contractNew = dataset.receivables.filter((r) => r.kind === "contract_installment" && inRange(r.issueDate));
  const payments = dataset.receivables.filter((r) => inRange(r.paidDate));
  const messages = dataset.chats.filter((m) => inRange(m.date));
  const promises = messages.filter((m) => m.promiseDate);
  const stress = messages.filter((m) => m.from === "customer" && /zor|süre rica|aksadı/i.test(m.text));

  const slower = dataset.customers.filter((c) => {
    const a = payerProfile(before, c.id).grade;
    const b = payerProfile(now, c.id).grade;
    return a !== "-" && b !== "-" && b > a;
  });
  const weeks = weeklyForecast(now);
  const tight = tightestWeek(weeks);
  const actions = agentActions(now);

  const steps: AgentStep[] = [
    { id: "erp", tool: "erp", title: `${dataset.sources.erp} okundu`, detail: `${orders.length} yeni sipariş${contractNew.length ? `, ${contractNew.length} sözleşme taksiti` : ""} eklendi.` },
    { id: "muhasebe", tool: "muhasebe", title: `${dataset.sources.onMuhasebe} okundu`, detail: `${orders.length} fatura, ${payments.length} tahsilat kaydı (${money(payments.reduce((s, r) => s + r.amount, 0))}).` },
    { id: "banka", tool: "banka", title: `${dataset.sources.banka} okundu`, detail: `Güncel bakiye ${money(currentBalance(now))}.` },
    {
      id: "whatsapp",
      tool: "whatsapp",
      title: "WhatsApp sohbetleri tarandı",
      detail: messages.length
        ? `${messages.length} yeni mesaj; ${promises.length} ödeme sözü${stress.length ? `, ${stress.length} nakit sıkıntısı işareti` : ""} bulundu.`
        : "Yeni ödeme konuşması yok.",
    },
    {
      id: "karne",
      tool: "karne",
      title: "Ödeme karneleri güncellendi",
      detail: slower.length ? `${slower.length} müşteri yavaşladı: ${slower.slice(0, 2).map((c) => c.name).join(", ")}${slower.length > 2 ? "…" : ""}` : "Notu düşen müşteri yok.",
    },
    {
      id: "tahmin",
      tool: "tahmin",
      title: "8 haftalık nakit tahmini yenilendi",
      detail: `En dar hafta ${formatDateTr(tight.weekStart)}: beklenen ${money(tight.balanceBase)}, kötü senaryoda ${money(tight.balanceLow)}.`,
    },
    { id: "takip", tool: "takip", title: `${actions.length} takip önerisi hazırlandı`, detail: "Hiçbiri gönderilmedi; her mesaj sizin onayınızı bekliyor." },
  ];
  return steps;
}

export function tightestWeek(weeks: ForecastWeek[]): ForecastWeek {
  const first = weeks[0];
  if (!first) throw new Error("no forecast weeks");
  return weeks.reduce((min, w) => (w.balanceLow < min.balanceLow ? w : min), first);
}

export interface Briefing {
  headline: string;
  points: string[];
  tone: "calm" | "watch" | "alert";
}

export function businessBriefing(snap: Snapshot): Briefing {
  const weeks = weeklyForecast(snap);
  const tight = tightestWeek(weeks);
  const last = weeks.at(-1) as ForecastWeek;
  const inflows = expectedInflows(snap);
  const atRisk = inflows.filter((i) => i.atRisk);
  const overdue = inflows.filter((i) => i.receivable.dueDate < snap.asOf);
  const monthlyCost = snap.plannedExpenses.filter((e) => e.date <= addDays(snap.asOf, 30)).reduce((s, e) => s + e.amount, 0);
  const tone: Briefing["tone"] = tight.balanceLow < 0 ? "alert" : tight.balanceLow < monthlyCost * 0.25 ? "watch" : "calm";
  const headline =
    tone === "alert"
      ? `${formatDateTr(tight.weekStart)} haftasında kötü senaryoda kasa ekside. Şimdi tahsilata odaklanmak gerekiyor.`
      : tone === "watch"
        ? `Nakit yeterli ama ${formatDateTr(tight.weekStart)} haftası dar. Birkaç tahsilat öne çekilirse rahatlar.`
        : `Önümüzdeki 8 hafta rahat görünüyor; 8. hafta sonunda beklenen bakiye ${money(last.balanceBase)}.`;
  return {
    headline,
    tone,
    points: [
      `8 hafta sonunda bakiye ${money(last.balanceLow)} ile ${money(last.balanceHigh)} arasında, en olası ${money(last.balanceBase)}.`,
      `Vadesi geçmiş ${overdue.length} alacak var, toplam ${money(overdue.reduce((s, i) => s + i.receivable.amount, 0))}.`,
      atRisk.length
        ? `${atRisk.length} alacak (${money(atRisk.reduce((s, i) => s + i.receivable.amount, 0))}) tahsil edilemeyebilir; tahmine dahil edilmedi.`
        : "Tahsil edilemeyecek görünen alacak yok.",
    ],
  };
}

export const SUGGESTED_QUESTIONS = [
  "Önümüzdeki 4 hafta nasıl görünüyor?",
  "Nakit en çok ne zaman daralıyor?",
  "Bugün kimi aramalıyım?",
  "En riskli müşterim kim?",
  "En büyük müşterim 30 gün geç öderse?",
  "WhatsApp'ta kimler ödeme sözü verdi?",
] as const;

export type AgentIntent = "outlook" | "tight" | "call" | "risky" | "whatif" | "promises" | "overdue" | "unknown";

export interface AgentAnswer {
  intent: AgentIntent;
  text: string;
  bullets: string[];
  /** For "what if": the outlook with and without the scenario. */
  scenario?: { label: string; base: ForecastWeek[]; changed: ForecastWeek[] };
}

const INTENTS: ReadonlyArray<[AgentIntent, RegExp]> = [
  ["whatif", /\bya\b|eğer|geç öderse|ödemezse|senaryo|olursa/i],
  ["promises", /söz|whatsapp|mesaj/i],
  ["tight", /dar|sıkış|en düşük|açık ver|eksi/i],
  ["call", /ara(malı|yayım|yalım)|kimi|takip|hatırlat/i],
  ["risky", /risk|en kötü|en geç|güvenme/i],
  ["overdue", /ödeme(di|yen)|gecik|vadesi geç/i],
  ["outlook", /nasıl|görün|önümüzdeki|gelecek|tahmin|nakit|hafta|ay/i],
];

export function detectIntent(question: string): AgentIntent {
  for (const [intent, re] of INTENTS) if (re.test(question)) return intent;
  return "unknown";
}

export function askAgent(snap: Snapshot, question: string): AgentAnswer {
  const intent = detectIntent(question);
  const weeks = weeklyForecast(snap);
  const inflows = expectedInflows(snap);
  switch (intent) {
    case "outlook": {
      const four = weeks.slice(0, 4);
      const inSum = four.reduce((s, w) => s + w.inflowBase, 0);
      const outSum = four.reduce((s, w) => s + w.outflow, 0);
      return {
        intent,
        text: `4 hafta içinde ${money(inSum)} tahsilat ve ${money(outSum)} ödeme bekliyorum. 4. hafta sonunda bakiye büyük olasılıkla ${money(four.at(-1)?.balanceBase ?? 0)}.`,
        bullets: four.map((w) => `${formatDateTr(w.weekStart)} haftası: +${money(w.inflowBase)} / −${money(w.outflow)} → ${money(w.balanceBase)}`),
      };
    }
    case "tight": {
      const t = tightestWeek(weeks);
      const exp = snap.plannedExpenses.filter((e) => e.date >= t.weekStart && e.date < addDays(t.weekStart, 7));
      return {
        intent,
        text: `En dar hafta ${formatDateTr(t.weekStart)}. Kötü senaryoda bakiye ${money(t.balanceLow)} seviyesine iniyor.`,
        bullets: [
          ...exp.map((e) => `${formatDateTr(e.date)}: ${e.label} ${money(e.amount)}`),
          `O haftadan önce tahsil edilebilecek en büyük 3 alacak öne çekilirse risk azalır.`,
        ],
      };
    }
    case "call":
    case "overdue": {
      const actions = agentActions(snap, 5);
      return {
        intent,
        text: actions.length ? `Bugün öncelikli ${actions.length} kişi var. Mesaj taslakları hazır; onaylarsanız gönderilir.` : "Bugün acil takip gereken müşteri yok.",
        bullets: actions.map((a) => `${a.customer.name} — ${money(a.receivable.amount)}: ${a.reason}`),
      };
    }
    case "risky": {
      const worst = [...new Set(inflows.map((i) => i.customer.id))]
        .map((id) => ({ id, p: payerProfile(snap, id), c: inflows.find((i) => i.customer.id === id)!.customer }))
        .filter((x) => x.p.openAmount > 0)
        .sort((a, b) => b.p.overdueAmount - a.p.overdueAmount || b.p.medianDelay - a.p.medianDelay)
        .slice(0, 3);
      const top = worst[0];
      return {
        intent,
        text: top ? `En riskli müşteri ${top.c.name}: ${money(top.p.overdueAmount)} vadesi geçmiş, genelde ${top.p.medianDelay} gün geç ödüyor.` : "Riskli görünen müşteri yok.",
        bullets: worst.map((w) => `${w.c.name}: not ${w.p.grade}, açık ${money(w.p.openAmount)}, eğilim ${w.p.trend > 0 ? `+${w.p.trend} gün yavaşlıyor` : "sabit"}`),
      };
    }
    case "promises": {
      const promises = snap.chats.filter((m) => m.promiseDate).slice(-6).reverse();
      const names = new Map(snap.dataset.customers.map((c) => [c.id, c.name]));
      return {
        intent,
        text: promises.length ? `Son ${promises.length} ödeme sözü:` : "WhatsApp'ta kayıtlı ödeme sözü yok.",
        bullets: promises.map((m) => {
          const paid = snap.receivables.find((r) => r.id === m.receivableId)?.paidDate;
          const state = paid ? "ödendi" : (m.promiseDate as string) < snap.asOf ? "tutulmadı" : "bekleniyor";
          return `${names.get(m.customerId)}: ${formatDateTr(m.promiseDate as string)} — ${state}`;
        }),
      };
    }
    case "whatif": {
      const byCustomer = new Map<string, number>();
      for (const i of inflows) if (!i.atRisk) byCustomer.set(i.customer.id, (byCustomer.get(i.customer.id) ?? 0) + i.receivable.amount);
      const [biggestId, amount] = [...byCustomer.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
      const customer = snap.dataset.customers.find((c) => c.id === biggestId);
      if (!customer) return { intent, text: "Açık alacak olmadığı için senaryo çalıştıramadım.", bullets: [] };
      const result = whatIfLate(snap, customer.id, 30);
      const gap = scenarioGap(result.base, result.changed);
      const t1 = tightestWeek(result.changed);
      return {
        intent,
        text: `${customer.name} (${money(amount)} açık alacak) 30 gün geç öderse en büyük etki ${formatDateTr(gap.weekStart)} haftasında: bakiye ${money(gap.base)} yerine ${money(gap.changed)}.`,
        bullets: [
          `Fark ${money(gap.changed - gap.base)}; kötü senaryoda en dar hafta ${formatDateTr(t1.weekStart)} (${money(t1.balanceLow)}).`,
          t1.balanceLow < 0 ? "Bu senaryoda kasa ekside; kısa vadeli finansman veya ödeme erteleme gerekir." : "Bu senaryoda bile kasa artıda kalıyor.",
        ],
        scenario: { label: `${customer.name} +30 gün`, base: result.base, changed: result.changed },
      };
    }
    default:
      return { intent, text: "Bu demo ajanı nakit, tahsilat ve müşteri sorularını yanıtlıyor. Şunlardan birini deneyin:", bullets: [...SUGGESTED_QUESTIONS] };
  }
}

/** The week where a scenario moves the expected balance the most. */
export function scenarioGap(base: ForecastWeek[], changed: ForecastWeek[]) {
  let best = { weekStart: base[0]?.weekStart ?? "", base: base[0]?.balanceBase ?? 0, changed: changed[0]?.balanceBase ?? 0 };
  base.forEach((w, i) => {
    const c = changed[i]?.balanceBase ?? w.balanceBase;
    if (Math.abs(c - w.balanceBase) > Math.abs(best.changed - best.base)) best = { weekStart: w.weekStart, base: w.balanceBase, changed: c };
  });
  return best;
}

export function whatIfLate(snap: Snapshot, customerId: string, extraDays: number) {
  const shift = (i: ExpectedInflow): ExpectedInflow =>
    i.customer.id === customerId
      ? { ...i, expected: addDays(i.expected, extraDays), optimistic: addDays(i.optimistic, extraDays), pessimistic: addDays(i.pessimistic, extraDays) }
      : i;
  return { base: weeklyForecast(snap), changed: weeklyForecast(snap, 8, shift) };
}

// ---------- Banker side ----------

export interface CallItem {
  firm: Firm;
  score: number;
  change: number;
  reason: string;
}

export interface BankBriefing {
  headline: string;
  points: string[];
  callList: CallItem[];
}

export function bankBriefing(firms: Firm[], asOf: string, since = addDays(asOf, -14)): BankBriefing {
  const rows = firms.map((firm) => {
    const now = firmRisk(firm, asOf);
    const before = firmRisk(firm, since);
    return { firm, now, change: now.score - before.score };
  });
  const risers = rows.filter((r) => r.change >= 10).sort((a, b) => b.change - a.change);
  const brokenNew = firms.flatMap((f) => f.commitments.filter((c) => c.date > since && c.date <= asOf && commitmentStatus(c, asOf) === "broken"));
  const upcoming = firms.flatMap((f) => f.commitments.filter((c) => c.date > asOf && c.date <= addDays(asOf, 7)));
  const stressNew = firms.filter((f) => f.signals.some((s) => s.date > since && s.date <= asOf && (s.type === "stress" || s.type === "deferral")));
  const high = rows.filter((r) => r.now.level === "high");
  const callList = [...rows]
    .filter((r) => r.now.level !== "low")
    .sort((a, b) => b.change - a.change || b.now.score - a.now.score)
    .slice(0, 6)
    .map((r) => ({ firm: r.firm, score: r.now.score, change: r.change, reason: r.now.factors.slice().sort((a, b) => b.points - a.points)[0]?.label ?? "" }));
  return {
    headline: risers.length
      ? `Son 2 haftada ${risers.length} firmanın riski belirgin arttı. Öncelik: ${risers[0]?.firm.name}.`
      : "Son 2 haftada portföyde belirgin bir kötüleşme yok.",
    points: [
      `${high.length} firma yüksek riskte; kredi tutarı ${money(high.reduce((s, r) => s + r.firm.loanAmount, 0))}.`,
      `${brokenNew.length} taahhüt bu dönemde tutulmadı, ${upcoming.length} taahhüdün vadesi önümüzdeki 7 günde.`,
      `${stressNew.length} firmanın WhatsApp yazışmasında yeni nakit sıkıntısı işareti var.`,
    ],
    callList,
  };
}

export const daysBetweenLabel = (later: string, earlier: string) => {
  const d = diffDays(later, earlier);
  return d === 0 ? "bugün" : d > 0 ? `${d} gün sonra` : `${-d} gün önce`;
};
