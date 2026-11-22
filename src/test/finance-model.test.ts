import { describe, expect, it } from "vitest";
import {
  buildPlan,
  DEFAULT_ASSUMPTIONS,
  marketSize,
  mergeAssumptions,
  tl,
  unitEconomics,
} from "@/lib/finance-model";

describe("finance model", () => {
  it("matches the market slide (TÜİK 2024 SME count, stated split)", () => {
    const m = marketSize(DEFAULT_ASSUMPTIONS);
    expect(Math.round(m.somMonthly)).toBe(390_000);
    expect(Math.round(m.samMonthly)).toBe(220_000 * 390 + 30_000 * 3_990);
    expect(Math.round(m.tamMonthly)).toBe((3_928_000 - 30_000) * 390 + 30_000 * 3_990);
    expect(tl(m.tamMonthly)).toBe("₺1,6 milyar");
    expect(tl(m.samMonthly)).toBe("₺205,5 milyon");
    expect(tl(m.somMonthly)).toBe("₺390 bin");
  });

  it("the round covers the deepest need inside its window; total covers the whole plan", () => {
    const plan = buildPlan(DEFAULT_ASSUMPTIONS);
    expect(plan.rows).toHaveLength(36);
    const windowDeepest = Math.min(
      0,
      ...plan.rows.slice(0, DEFAULT_ASSUMPTIONS.roundMonths).map((r) => r.cumulative),
    );
    expect(plan.fundingNeed).toBeGreaterThanOrEqual(-windowDeepest);
    expect(plan.totalCapitalNeed).toBeGreaterThanOrEqual(-plan.deepestCumulative);
    expect(plan.runwayMonths).not.toBeNull();
    expect(plan.runwayMonths!).toBeGreaterThanOrEqual(DEFAULT_ASSUMPTIONS.roundMonths);
    const total = Object.values(plan.useOfFunds).reduce((s, v) => s + v, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("a pessimistic plan ends smaller and needs more capital overall", () => {
    const low = buildPlan(DEFAULT_ASSUMPTIONS, "pessimistic");
    const high = buildPlan(DEFAULT_ASSUMPTIONS, "optimistic");
    expect(low.endArr).toBeLessThan(high.endArr);
    expect(low.totalCapitalNeed).toBeGreaterThan(high.totalCapitalNeed);
  });

  it("this round covers its own window; the whole plan may need more", () => {
    const p = buildPlan(DEFAULT_ASSUMPTIONS);
    expect(p.useOfFundsMonths).toBe(DEFAULT_ASSUMPTIONS.roundMonths);
    expect(p.totalCapitalNeed).toBeGreaterThanOrEqual(p.fundingNeed);
    expect(p.needsNextRound).toBe(p.totalCapitalNeed > p.fundingNeed);
  });

  it("no costs and some revenue means no funding need and payback in month 1", () => {
    const plan = buildPlan({
      ...DEFAULT_ASSUMPTIONS,
      team: [],
      oneOffs: [],
      recurring: [],
      marketingFixed: 0,
      cacSme: 0,
      cacGrowth: 0,
      costFree: { ai: 0, messaging: 0, integrations: 0, hosting: 0 },
      costSme: { ai: 0, messaging: 0, integrations: 0, hosting: 0 },
      costGrowth: { ai: 0, messaging: 0, integrations: 0, hosting: 0 },
      paymentCommission: 0,
    });
    expect(plan.fundingNeed).toBe(0);
    expect(plan.breakEvenMonth).toBe(1);
    expect(plan.paybackMonth).toBe(1);
  });

  it("unit economics follow the package mix", () => {
    const u = unitEconomics(DEFAULT_ASSUMPTIONS);
    expect(u.arpa).toBeCloseTo(0.92 * 390 + 0.08 * 3_990, 6);
    expect(u.grossMargin).toBeGreaterThan(0);
    expect(u.ltvToCac).toBeGreaterThan(1);
    const sme = u.packages.find((p) => p.key === "sme")!;
    expect(sme.cost).toBe(96);
    expect(sme.margin).toBeCloseTo((390 - 96 - 390 * 0.03) / 390, 6);
  });

  it("a grant lowers the funding need and contingency raises it", () => {
    const base = buildPlan(DEFAULT_ASSUMPTIONS);
    expect(
      buildPlan({ ...DEFAULT_ASSUMPTIONS, grantAmount: 1_000_000, grantMonth: 3 }).fundingNeed,
    ).toBeLessThan(base.fundingNeed);
    expect(buildPlan({ ...DEFAULT_ASSUMPTIONS, contingency: 0 }).fundingNeed).toBeLessThan(
      base.fundingNeed,
    );
  });

  it("restores defaults for broken saved data", () => {
    expect(mergeAssumptions(null)).toEqual(DEFAULT_ASSUMPTIONS);
    const merged = mergeAssumptions({
      priceSme: 450,
      cacSme: "x",
      costSme: { ai: 70 },
      team: [{ name: "A", monthlyCost: 1, startMonth: 0 }],
    });
    expect(merged.priceSme).toBe(450);
    expect(merged.cacSme).toBe(DEFAULT_ASSUMPTIONS.cacSme);
    expect(merged.costSme).toEqual({ ...DEFAULT_ASSUMPTIONS.costSme, ai: 70 });
    expect(merged.team[0]?.startMonth).toBe(1);
  });

  it("cutting the team brings break-even inside the plan", () => {
    const lean = buildPlan({
      ...DEFAULT_ASSUMPTIONS,
      team: DEFAULT_ASSUMPTIONS.team.filter((r) => r.startMonth < 13),
    });
    expect(lean.breakEvenMonth).not.toBeNull();
    expect(lean.paybackMonth === null || lean.paybackMonth > lean.breakEvenMonth!).toBe(true);
  });
});
