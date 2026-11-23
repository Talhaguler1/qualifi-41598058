import { describe, expect, it } from "vitest";
import { parseLead } from "@/lib/qualifi-submission";
import { AUDIENCE_PATH, AUDIENCES } from "@/lib/site/copy";
import { PAGE_CONFIG } from "@/lib/qualifi-page-config";

// Mirrors the body EmailCapture posts, for every audience that shows it.
function body(lang: "tr" | "en", audience: (typeof AUDIENCES)[number], extra: Record<string, string> = {}) {
  const path = AUDIENCE_PATH[lang][audience];
  const page = PAGE_CONFIG[path as keyof typeof PAGE_CONFIG];
  return {
    id: "6b1f1c2e-8d3a-4c55-9a77-2f0f6c0b1a11",
    email: "  Ornek@Isletme.com ",
    consent: true,
    kind: "waitlist",
    solution: page.solutions[0],
    context: { pagePath: path, locale: page.locale, segment: page.segment, analyticsConsent: false, ...extra },
  };
}

describe("one-field email capture", () => {
  for (const lang of ["tr", "en"] as const) {
    for (const audience of ["business", "freelancer", "finance"] as const) {
      it(`is accepted on the ${lang} ${audience} page`, () => {
        const lead = parseLead(body(lang, audience));
        expect(lead.email).toBe("ornek@isletme.com");
        expect(lead.kind).toBe("waitlist");
        expect(lead.visitor_id).toBeNull();
      });
    }
  }
  it("keeps the campaign source for counting leads per channel", () => {
    const lead = parseLead(body("tr", "business", { utm_source: "instagram", utm_campaign: "kasim" })) as Record<string, unknown>;
    expect(lead["utm_source"]).toBe("instagram");
    expect(lead["utm_campaign"]).toBe("kasim");
  });
  it("drops a malformed campaign source instead of failing", () => {
    const lead = parseLead(body("tr", "business", { utm_source: "<script>" })) as Record<string, unknown>;
    expect(lead["utm_source"]).toBeNull();
  });
});
