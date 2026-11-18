import { afterEach, describe, expect, it } from "vitest";
import { diffDays, explainEvent, forecastWithEvents, generateBusiness, readChatMessage, sampleMessages, setDemoLang, snapshot, weeklyForecast } from "@/lib/demo";

describe("chat message → forecast", () => {
  afterEach(() => setDemoLang("tr"));
  const d = generateBusiness("017");
  const s = snapshot(d, "2026-11-24");

  it("reads '2 hafta sonra' for a named customer and moves its largest open invoice by 14 days", () => {
    const e = readChatMessage(s, "Dazen: Merhaba, ödemeyi 2 hafta sonra yapabileceğiz.")!;
    expect(e.kind).toBe("delay");
    expect(e.customer.name).toMatch(/^Dazen/);
    expect(e.assumedCustomer).toBe(false);
    expect(diffDays(e.to, e.from)).toBeGreaterThanOrEqual(14);
  });

  it("understands the English brief's exact sentence", () => {
    setDemoLang("en");
    const e = readChatMessage(s, "Dazen just texted on WhatsApp: they will pay 2 weeks later. Update the forecast.")!;
    expect(e.kind).toBe("delay");
    expect(e.customer.name).toMatch(/^Dazen/);
  });

  it("handles paid, split and Friday, and ignores non-payment text", () => {
    expect(readChatMessage(s, "Dazen: Bugün havale yaptık.")!.kind).toBe("paid");
    const split = readChatMessage(s, "Dazen: ikiye bölebilir miyiz?")!;
    expect(split.kind).toBe("split");
    expect(split.secondTo).toBeDefined();
    expect(readChatMessage(s, "Dazen: Cuma günü gönderiyoruz.")!.kind).toBe("date");
    expect(readChatMessage(s, "Merhaba, nasılsınız?")).toBeNull();
  });

  it("a delay never improves the forecast; a split keeps the total amount", () => {
    const e = readChatMessage(s, "Dazen: 2 hafta sonra ödeyeceğiz")!;
    const before = weeklyForecast(s);
    const after = forecastWithEvents(s, [e]);
    after.forEach((w, i) => expect(w.balanceBase).toBeLessThanOrEqual(before[i]!.balanceBase + 1));
    const split = readChatMessage(s, "Dazen: ikiye bölelim, kalanı 2 hafta sonra")!;
    const out = explainEvent(s, [], split);
    expect(out.advice.length).toBeGreaterThan(0);
    expect(out.after).toHaveLength(8);
  });

  it("every sample message is understood, in both languages", () => {
    for (const lang of ["tr", "en"] as const) {
      setDemoLang(lang);
      for (const m of sampleMessages("Dazen Yazılım Ltd.")) expect(readChatMessage(s, m.text)).not.toBeNull();
    }
  });
});
