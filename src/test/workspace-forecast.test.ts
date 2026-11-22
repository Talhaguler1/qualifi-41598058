import { describe, expect, it } from "vitest";
import { coverage, delayCost, financingNeed, possibleDuplicates, workspaceOutlook, type WorkspaceCommitment } from "@/lib/workspace-forecast";

const c = (over: Partial<WorkspaceCommitment>): WorkspaceCommitment => ({
  id: Math.random().toString(36),
  counterparty: "X",
  direction: "in",
  amount: 100,
  due_date: "2026-11-27",
  kind: "invoice",
  status: "open",
  needs_review: false,
  ...over,
});

describe("empty-account outlook", () => {
  it("places items by due date and keeps unsure money out of the cautious line", () => {
    const o = workspaceOutlook(
      [
        c({ amount: 1000, due_date: "2026-11-27" }),
        c({ amount: 500, due_date: "2026-11-28", needs_review: true }),
        c({ direction: "out", amount: 300, due_date: "2026-12-05" }),
        c({ amount: 999, status: "paid" }),
        c({ amount: 50, due_date: null }),
      ],
      2000,
      "2026-11-24",
    );
    expect(o.weeks[0]).toMatchObject({ inflow: 1500, inflowSure: 1000, outflow: 0, balance: 3500, balanceCautious: 3000 });
    expect(o.weeks[1]).toMatchObject({ outflow: 300, balance: 3200, balanceCautious: 2700 });
    expect(o.undated).toHaveLength(1);
    expect(o.openIn).toBe(1550);
    expect(o.openOut).toBe(300);
  });

  it("expects overdue receivables a week from today, and only in the base line", () => {
    const o = workspaceOutlook([c({ amount: 400, due_date: "2026-11-01" })], 0, "2026-11-24");
    expect(o.overdue).toHaveLength(1);
    const week = o.weeks.find((w) => w.inflow > 0);
    expect((week?.weekStart ?? "9999") <= "2026-12-01").toBe(true);
    expect(o.weeks.at(-1)).toMatchObject({ balance: 400, balanceCautious: 0 });
  });

  it("keeps dollar amounts out of TL totals and lists them separately", () => {
    const o = workspaceOutlook([c({ amount: 12000, currency: "USD" }), c({ amount: 500, currency: "TRY" }), c({ amount: 300, currency: null })], 0, "2026-11-24");
    expect(o.openIn).toBe(800);
    expect(o.foreign).toHaveLength(1);
    expect(o.weeks[0]?.inflow).toBe(800);
  });

  it("flags the same money seen in two documents and counts it once", () => {
    const a = c({ id: "a", direction: "out", amount: 90000, due_date: "2026-12-01" });
    const b = c({ id: "b", direction: "out", amount: 90000, due_date: "2026-12-01" });
    const other = c({ id: "x", direction: "out", amount: 90000, due_date: "2026-12-02" });
    expect([...possibleDuplicates([a, b, other])]).toEqual(["b"]);
    expect(workspaceOutlook([a, b, other], 0, "2026-11-24").openOut).toBe(180000);
  });
  it("prices late money at the owner's rate, including days pushed by a promise", () => {
    const overdue = c({ id: "o", amount: 36500, due_date: "2026-11-14" });
    const pushed = c({ id: "p", amount: 73000, due_date: "2026-12-04" });
    const logs = [{ commitmentId: "p", channel: "phone" as const, note: "", oldDue: "2026-11-27", newDue: "2026-12-04", recordedAt: "2026-11-22" }];
    const cost = delayCost([overdue, pushed, c({ amount: 999, due_date: "2026-12-30" })], logs, "2026-11-24", 0.365);
    // 36.500 × 10 days × 0,1% + 73.000 × 7 days × 0,1%
    expect(cost.total).toBeCloseTo(365 + 511, 6);
    expect(cost.perDay).toBeCloseTo(36.5, 6);
    expect(cost.items).toBe(2);
  });

  it("covers payments with collections and finds the deepest cautious gap", () => {
    const o = workspaceOutlook([c({ amount: 800, due_date: "2026-11-27" }), c({ direction: "out", amount: 1000, due_date: "2026-11-28" }), c({ amount: 500, due_date: "2026-11-28", needs_review: true })], 0, "2026-11-24");
    const cov = coverage(o);
    expect(cov.ratio).toBeCloseTo(1.3, 6);
    expect(cov.ratioSure).toBeCloseTo(0.8, 6);
    expect(financingNeed(o)).toMatchObject({ amount: 200 });
    expect(financingNeed(workspaceOutlook([c({ amount: 10 })], 0, "2026-11-24"))).toBeNull();
  });
});
