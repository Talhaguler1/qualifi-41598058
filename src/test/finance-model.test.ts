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

  it("asks for at least the deepest cash need and lasts the horizon with it", () => {
    const plan = buildPlan(DEFAULT_ASSUMPTIONS);
    expect(plan.rows).toHaveLength(36);
    expect(plan.fundingNeed).toBeGreaterThanOrEqual(-plan.deepestCumulative);
    expect(plan.runwayMonths).toBeNull();
    const total = Object.values(plan.useOfFunds).reduce((s, v) => s + v, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("a pessimistic plan needs more money than an optimistic one", () => {
    const low = buildPlan(DEFAULT_ASSUMPTIONS, "pessimistic");
    const high = buildPlan(DEFAULT_ASSUMPTIONS, "optimistic");
    expect(low.fundingNeed).toBeGreaterThan(high.fundingNeed);
  });

  it("no costs and some revenue means no funding need and payback in month 1", () => {
    const plan = buildPlan({
      ...DEFAULT_ASSUMPTIONS,
      team: [],
      oneOffs: [],
      infraBase: 0,
      complianceMonthly: 0,
      openBankingMonthly: 0,
      otherMonthly: 0,
      marketingFixed: 0,
      cac: 0,
      aiPerSme: 0,
      aiPerGrowth: 0,
      aiPerFree: 0,
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
  });

  it("restores defaults for broken saved data", () => {
    expect(mergeAssumptions(null)).toEqual(DEFAULT_ASSUMPTIONS);
    const merged = mergeAssumptions({
      priceSme: 450,
      cac: "x",
      team: [{ name: "A", monthlyCost: 1, startMonth: 0 }],
    });
    expect(merged.priceSme).toBe(450);
    expect(merged.cac).toBe(DEFAULT_ASSUMPTIONS.cac);
    expect(merged.team[0]?.startMonth).toBe(1);
  });

  it("base plan breaks even before it pays back", () => {
    const p = buildPlan(DEFAULT_ASSUMPTIONS);
    expect(p.breakEvenMonth).not.toBeNull();
    expect(p.paybackMonth).not.toBeNull();
    expect(p.paybackMonth!).toBeGreaterThan(p.breakEvenMonth!);
  });
});
