import { describe, expect, it } from "vitest";
import {
  agentActions,
  BANKERS_PER_REGION,
  commitmentStatus,
  currentBalance,
  DEMO_DATES,
  expectedInflows,
  firmRisk,
  forecastAccuracy,
  generateBusiness,
  generatePortfolio,
  normaliseTenant,
  payerProfile,
  sectorAnalysis,
  snapshot,
  weeklyForecast,
  type BusinessDataset,
} from "@/lib/demo";

const tiny = (): BusinessDataset => ({
  tenant: "999",
  company: { name: "Test A.Ş.", sector: "Yazılım", city: "İstanbul" },
  sources: { erp: "mockerp999", onMuhasebe: "mockonmuhasebe999", banka: "mockbanka999" },
  openingBalance: 100_000,
  customers: [{ id: "late", name: "Geç Ltd.", sector: "Yazılım", persona: "late" }],
  receivables: [
    { id: "a", customerId: "late", kind: "invoice", source: "mockonmuhasebe", issueDate: "2026-06-01", dueDate: "2026-07-01", amount: 10_000, paidDate: "2026-07-11" },
    { id: "b", customerId: "late", kind: "invoice", source: "mockonmuhasebe", issueDate: "2026-07-01", dueDate: "2026-08-01", amount: 10_000, paidDate: "2026-08-11" },
    { id: "c", customerId: "late", kind: "invoice", source: "mockonmuhasebe", issueDate: "2026-08-01", dueDate: "2026-09-01", amount: 10_000, paidDate: "2026-09-11" },
    { id: "d", customerId: "late", kind: "invoice", source: "mockonmuhasebe", issueDate: "2026-10-01", dueDate: "2026-11-05", amount: 20_000, paidDate: "2026-11-15" },
  ],
  contracts: [],
  expenses: [{ id: "e", label: "Kira", date: "2026-11-05", amount: 5_000, source: "mockerp" }],
  chats: [],
});

describe("demo business data", () => {
  it("is deterministic per tenant and accepts mock source names", () => {
    expect(generateBusiness("17")).toEqual(generateBusiness("mockerp017"));
    expect(generateBusiness("017").company.name).not.toBe(generateBusiness("018").company.name);
    expect(normaliseTenant("mockonmuhasebe5")).toBe("005");
  });

  it("targets businesses with 100-200 customers and wires the three mock sources", () => {
    const d = generateBusiness("017");
    expect(d.customers.length).toBeGreaterThanOrEqual(100);
    expect(d.customers.length).toBeLessThanOrEqual(200);
    expect(d.sources).toEqual({ erp: "mockerp017", onMuhasebe: "mockonmuhasebe017", banka: "mockbanka017" });
    expect(d.contracts).toHaveLength(3);
    expect(d.chats.some((m) => m.promiseDate)).toBe(true);
  });

  it("hides everything dated after the viewed demo date", () => {
    const d = generateBusiness("017");
    const s = snapshot(d, "2026-10-01");
    expect(s.receivables.every((r) => r.issueDate <= "2026-10-01")).toBe(true);
    expect(s.receivables.every((r) => r.paidDate === null || r.paidDate <= "2026-10-01")).toBe(true);
    expect(s.chats.every((m) => m.date <= "2026-10-01")).toBe(true);
    // Moving forward delivers new invoices.
    expect(snapshot(d, "2026-11-01").receivables.length).toBeGreaterThan(s.receivables.length);
  });
});

describe("forecast engine", () => {
  it("learns a customer's typical delay and applies it to open invoices", () => {
    const s = snapshot(tiny(), "2026-10-20");
    const p = payerProfile(s, "late");
    expect(p).toMatchObject({ paidCount: 3, medianDelay: 10, onTimeRate: 0, grade: "B" });
    const [inflow] = expectedInflows(s);
    expect(inflow?.expected).toBe("2026-11-15");
  });

  it("puts the expected payment in the right week and subtracts planned costs", () => {
    const s = snapshot(tiny(), "2026-10-20");
    expect(currentBalance(s)).toBe(130_000);
    const weeks = weeklyForecast(s, 4);
    const week = weeks.find((w) => w.inflowBase > 0);
    expect(week?.weekStart).toBe("2026-11-11"); // the week holding 15 Nov
    expect(week?.inflowBase).toBe(20_000);
    expect(weeks.at(-1)?.balanceBase).toBe(130_000 + 20_000 - 5_000);
  });

  it("proposes a reminder before the due date of a slow payer, never sends it", () => {
    const actions = agentActions(snapshot(tiny(), "2026-11-01"));
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "reminder", dueInDays: 4 });
    expect(actions[0]?.draftMessage).toContain("d numaralı");
  });

  it("produces a usable outlook and agent list on every demo date", () => {
    const d = generateBusiness("042");
    for (const date of DEMO_DATES) {
      const s = snapshot(d, date);
      expect(weeklyForecast(s)).toHaveLength(8);
      expect(agentActions(s).length).toBeGreaterThan(0);
    }
    const acc = forecastAccuracy(d, "2026-10-01", "2026-11-01");
    expect(acc.actual).toBeGreaterThan(0);
    expect(acc.errorRate).toBeLessThan(0.5);
  });
});

describe("banker portfolio", () => {
  it("gives each specialist 300 deterministic firms", () => {
    const a = generatePortfolio("Marmara-1", "01");
    expect(a).toHaveLength(300);
    expect(generatePortfolio("Marmara-1", "1")).toEqual(a);
    expect(BANKERS_PER_REGION).toBe(20);
  });

  it("explains every risk score and reacts to the viewed date", () => {
    const firms = generatePortfolio("Marmara-1", "01");
    const risky = firms.find((f) => firmRisk(f, "2026-12-01").level === "high");
    expect(risky).toBeDefined();
    const risk = firmRisk(risky!, "2026-12-01");
    expect(risk.factors.length).toBeGreaterThan(0);
    expect(firmRisk(risky!, "2026-08-01").score).toBeLessThanOrEqual(risk.score);
  });

  it("tracks commitments as kept, late, broken or upcoming", () => {
    const c = { id: "x", kind: "payment_promise" as const, date: "2026-10-10", amount: 1, settledDate: null };
    expect(commitmentStatus(c, "2026-10-01")).toBe("upcoming");
    expect(commitmentStatus(c, "2026-10-20")).toBe("broken");
    expect(commitmentStatus({ ...c, settledDate: "2026-10-25" }, "2026-11-01")).toBe("late");
  });

  it("summarises sectors with riskier sectors first", () => {
    const rows = sectorAnalysis(generatePortfolio("Marmara-1", "02"), "2026-11-01");
    expect(rows.reduce((s, r) => s + r.firms, 0)).toBe(300);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1]!.highRiskShare).toBeGreaterThanOrEqual(rows[i]!.highRiskShare);
  });
});

import { agentRun, askAgent, bankBriefing, businessBriefing, detectIntent, SUGGESTED_QUESTIONS, whatIfLate, tightestWeek } from "@/lib/demo";

describe("agent", () => {
  const d = generateBusiness("017");
  const s = snapshot(d, "2026-11-24");

  it("logs a full round over the three mock sources, WhatsApp, scorecards, forecast and follow-ups", () => {
    const steps = agentRun(d, "2026-11-24", "2026-11-10");
    expect(steps.map((x) => x.tool)).toEqual(["erp", "muhasebe", "banka", "whatsapp", "karne", "tahmin", "takip"]);
    expect(steps[0]?.title).toContain("mockerp017");
    expect(steps.at(-1)?.detail).toContain("onayınızı");
  });

  it("routes every suggested question to a real answer", () => {
    for (const q of SUGGESTED_QUESTIONS) {
      const a = askAgent(s, q);
      expect(a.intent).not.toBe("unknown");
      expect(a.text.length).toBeGreaterThan(10);
    }
    expect(detectIntent("merhaba")).toBe("unknown");
  });

  it("what-if delays only the chosen customer and never improves the tightest week", () => {
    const id = d.customers[0]!.id;
    const r = whatIfLate(s, id, 30);
    expect(tightestWeek(r.changed).balanceBase).toBeLessThanOrEqual(tightestWeek(r.base).balanceBase + 1);
    const a = askAgent(s, "En büyük müşterim 30 gün geç öderse?");
    expect(a.scenario?.changed).toHaveLength(8);
  });

  it("briefs the business and the banker", () => {
    expect(businessBriefing(s).points).toHaveLength(3);
    const b = bankBriefing(generatePortfolio("Marmara-1", "01"), "2026-11-24");
    expect(b.callList.length).toBeGreaterThan(0);
    expect(b.points).toHaveLength(3);
  });
});

import { scorecard } from "@/lib/demo";

describe("prediction and promise scorecard", () => {
  it("judges only outcomes known by the later date", () => {
    const d = generateBusiness("017");
    const s = scorecard(d, "2026-11-10", "2026-11-24");
    expect(s.predictions.length).toBeGreaterThan(0);
    for (const p of s.predictions) {
      expect(p.expected > "2026-11-10" && p.expected <= "2026-11-24").toBe(true);
      if (p.paidDate) expect(p.paidDate <= "2026-11-24").toBe(true);
    }
    for (const p of s.promises) expect(p.message.promiseDate! <= "2026-11-24").toBe(true);
    expect(s.paid).toBeLessThanOrEqual(s.predictions.length);
  });
});
