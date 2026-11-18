import { afterEach, describe, expect, it } from "vitest";
import {
  agentActions,
  agentRun,
  askAgent,
  businessBriefing,
  delayPhrase,
  expectedInflows,
  formatDateTr,
  generateBusiness,
  messageText,
  money,
  parseAmount,
  setDemoLang,
  snapshot,
  SUGGESTED_QUESTIONS,
  SUGGESTED_QUESTIONS_EN,
} from "@/lib/demo";

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;

describe("demo language", () => {
  afterEach(() => setDemoLang("tr"));
  const d = generateBusiness("017");
  const s = snapshot(d, "2026-11-24");
  // Company names are proper nouns and stay Turkish; everything around them must be English.
  const names = d.customers.map((c) => c.name).sort((a, b) => b.length - a.length);
  const strip = (t: string) => names.reduce((acc, n) => acc.split(n).join("NAME"), t);

  it("defaults to Turkish", () => {
    expect(formatDateTr("2026-11-24")).toBe("24 Kas 2026");
    expect(delayPhrase(-1)).toBe("1 gün erken");
    expect(money(1_300_000)).toBe("₺1,3 mn");
  });

  it("formats dates, delays and money in English", () => {
    setDemoLang("en");
    expect(formatDateTr("2026-11-24")).toBe("24 Nov 2026");
    expect(delayPhrase(-1)).toBe("1 day early");
    expect(delayPhrase(3)).toBe("3 days late");
    expect(delayPhrase(0)).toBe("on the due date");
    expect(money(1_300_000)).toBe("₺1.3M");
    expect(money(450_000)).toBe("₺450K");
  });

  it("answers every English suggested question, the same way as its Turkish twin", () => {
    setDemoLang("en");
    SUGGESTED_QUESTIONS_EN.forEach((q, i) => {
      const en = askAgent(s, q);
      expect(en.intent).not.toBe("unknown");
      expect(strip(en.text)).not.toMatch(TURKISH);
      for (const b of en.bullets) expect(strip(b)).not.toMatch(TURKISH);
      setDemoLang("tr");
      expect(askAgent(s, SUGGESTED_QUESTIONS[i]!).intent).toBe(en.intent);
      setDemoLang("en");
    });
    expect(parseAmount("a new ₺1.5 million project")).toBe(1_500_000);
  });

  it("produces English agent text with no Turkish left in the generated parts", () => {
    setDemoLang("en");
    for (const step of agentRun(d, "2026-11-24", "2026-11-10")) expect(`${step.title} ${step.detail}`).not.toMatch(/okundu|yeni|gün/);
    for (const p of businessBriefing(s).points) expect(p).not.toMatch(TURKISH);
    for (const i of expectedInflows(s)) expect(i.reason).not.toMatch(TURKISH);
    for (const a of agentActions(s)) {
      expect(a.reason).not.toMatch(TURKISH);
      expect(a.draftMessage).not.toMatch(TURKISH);
    }
  });

  it("translates every demo WhatsApp message", () => {
    setDemoLang("en");
    for (const m of d.chats) expect(messageText(m.text)).not.toMatch(TURKISH);
    setDemoLang("tr");
    expect(messageText(d.chats[0]!.text)).toBe(d.chats[0]!.text);
  });
});
