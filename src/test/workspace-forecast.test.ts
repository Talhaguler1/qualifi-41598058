import { describe, expect, it } from "vitest";
import { workspaceOutlook, type WorkspaceCommitment } from "@/lib/workspace-forecast";

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
});
