import { describe, expect, it } from "vitest";
import {
  demoDecision,
  forecastWithEvents,
  generateBusiness,
  promiseEvent,
  promiseTargets,
  snapshot,
  weeklyForecast,
} from "@/lib/demo";

const snap = snapshot(generateBusiness("017"), "2026-11-24");

describe("demo decision summary", () => {
  it("prices late collections, measures 30-day coverage and finds the downside gap", () => {
    const weeks = weeklyForecast(snap);
    const d = demoDecision(snap, weeks, [], 0.45);
    expect(d.delayCost).toBeGreaterThanOrEqual(0);
    expect(d.outflow30).toBeGreaterThan(0);
    expect(d.coverage).not.toBeNull();
    expect(d.coverageLow!).toBeLessThanOrEqual(d.coverage!);
    const worst = Math.min(...weeks.map((w) => w.balanceLow));
    expect(d.need === null ? worst >= 0 : d.need.amount === -worst).toBe(true);
    // a higher rate never lowers the cost of delay
    expect(demoDecision(snap, weeks, [], 0.9).delayCost).toBeGreaterThanOrEqual(d.delayCost);
  });

  it("a promise taken on the phone moves the expected date and raises the cost of delay", () => {
    const target = promiseTargets(snap)[0]!;
    const later = "2027-01-15";
    const e = promiseEvent(snap, target.receivable.id, later, "Telefonda verilen söz", "ev-1")!;
    expect(e.kind).toBe("date");
    expect(e.to).toBe(later);
    expect(e.from).toBe(target.expected);
    const before = demoDecision(snap, forecastWithEvents(snap, []), [], 0.45);
    const after = demoDecision(snap, forecastWithEvents(snap, [e]), [e], 0.45);
    expect(after.delayCost).toBeGreaterThan(before.delayCost);
    expect(promiseEvent(snap, "missing", later, "x", "ev-2")).toBeNull();
  });
});
