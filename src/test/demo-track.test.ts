import { afterEach, describe, expect, it, vi } from "vitest";
import { trackDemo } from "@/lib/demo/track";
import { demoInteractionSchema } from "@/lib/demo-interactions.server";

describe("demo interaction tracking", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends bodies that the server schema accepts, with one session per tab", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    trackDemo({ panel: "business", tenant: "017", demo_date: "2026-11-24", action: "agent_question", detail: "Önümüzdeki 4 hafta nasıl görünüyor?" });
    trackDemo({ panel: "bank", tenant: "all", demo_date: "2026-10-27", action: "firm_open", target: "F01-007" });
    trackDemo({ panel: "business", tenant: "017", demo_date: "2026-11-10", action: "scenario_run", target: "c017-063", detail: "30 gün" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string));
    for (const b of bodies) expect(demoInteractionSchema.safeParse(b).success).toBe(true);
    expect(new Set(bodies.map((b) => b.session_id)).size).toBe(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/demo-interactions");
  });

  it("never throws when the network fails", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(() => trackDemo({ panel: "bank", tenant: "01", demo_date: "2026-11-24", action: "tab_open", target: "sectors" })).not.toThrow();
  });
});
