import { afterEach, describe, expect, it, vi } from "vitest";
import { exportLeads, searchLeads, updateLead } from "../lib/lead-admin.server";
import type { AdminBackend } from "../lib/lead-admin.server";
import { csvCell, dateBoundary, parseFilters } from "../lib/lead-admin";

const ID = "5d299901-c92f-4973-93f3-7f7eb4fbd440";
const lead = {
  id: ID,
  email: "lead@example.invalid",
  company: "=1+1",
  kind: "pilot" as const,
  page_id: "cashflow:tr",
  campaign_id: "cashflow",
  locale: "tr" as const,
  solution: "forecast",
  utm_source: "facebook",
  utm_medium: "paid-social",
  utm_campaign: "discovery",
  utm_content: "first",
  contact_status: "new" as const,
  created_at: "2026-11-11T23:30:00Z",
};
const owner = {
  id: ID,
  email_confirmed_at: "2026-11-01T12:00:00Z",
  app_metadata: { qualifi_admin: true },
};
function fixture(user: unknown = owner) {
  const backend: AdminBackend = {
    getUser: vi.fn().mockResolvedValue(user),
    list: vi.fn().mockResolvedValue({ rows: [lead], total: 1, newCount: 1, scheduledCount: 0 }),
    update: vi.fn().mockResolvedValue({ ...lead, contact_status: "contacted" }),
  };
  return { backend, factory: vi.fn(() => backend) };
}
function req(
  body: unknown = {},
  token: string | null = "test-token",
  method = "POST",
  origin?: string,
) {
  return new Request("https://qualifilab.com/api/admin/leads", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("private lead administration", () => {
  it.each([searchLeads, updateLead, exportLeads])(
    "rejects anonymous access before touching a backend",
    async (handler) => {
      const { backend, factory } = fixture();
      const response = await handler(req({}, null), factory);
      expect(response.status).toBe(401);
      expect(factory).not.toHaveBeenCalled();
      expect(backend.list).not.toHaveBeenCalled();
      expect(response.headers.get("Cache-Control")).toContain("no-store");
    },
  );
  it.each([
    null,
    { id: ID, email_confirmed_at: "yes", app_metadata: {}, user_metadata: { qualifi_admin: true } },
    { id: ID, app_metadata: { qualifi_admin: true } },
    { id: ID, email_confirmed_at: "yes", app_metadata: { qualifi_admin: "true" } },
  ])("does not trust an unverified or self-assigned role: %j", async (user) => {
    const { backend, factory } = fixture(user);
    const response = await searchLeads(req(), factory);
    expect([401, 403]).toContain(response.status);
    expect(backend.list).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("lead@example");
  });
  it("rejects cross-origin admin actions", async () => {
    const { factory } = fixture();
    const response = await updateLead(
      req({ id: ID, status: "contacted" }, "token", "PATCH", "https://other.invalid"),
      factory,
    );
    expect(response.status).toBe(403);
    expect(factory).not.toHaveBeenCalled();
  });
  it("returns only the authorized filtered page with no cache", async () => {
    const { backend, factory } = fixture();
    const response = await searchLeads(
      req({ email: "lead@", locale: "en", from: "2026-11-01", to: "2026-11-12", page: 2 }),
      factory,
    );
    expect(response.status).toBe(200);
    expect(backend.list).toHaveBeenCalledWith(
      {
        email: "lead@",
        locale: "en",
        status: "all",
        from: "2026-11-01",
        to: "2026-11-12",
        page: 2,
      },
      25,
    );
    expect(response.headers.get("Vary")).toBe("Authorization");
    expect((await response.json()).rows[0].email).toBe(lead.email);
  });
  it.each([
    { from: "2026-11-13", to: "2026-11-12" },
    { from: "2026-02-30" },
    { status: "owner" },
    { page: -1 },
  ])("rejects invalid filters: %j", async (body) => {
    const { backend, factory } = fixture();
    expect((await searchLeads(req(body), factory)).status).toBe(400);
    expect(backend.list).not.toHaveBeenCalled();
  });
  it("updates only the requested UUID and known contact status", async () => {
    const { backend, factory } = fixture();
    const response = await updateLead(
      req({ id: ID, status: "contacted", email: "ignored@example.invalid" }, "token", "PATCH"),
      factory,
    );
    expect(response.status).toBe(200);
    expect(backend.update).toHaveBeenCalledWith(ID, "contacted");
    expect((await response.json()).lead.contact_status).toBe("contacted");
    expect((await updateLead(req({ id: ID, status: "admin" }), factory)).status).toBe(400);
  });
  it("does not fabricate an empty list when database access fails", async () => {
    const { backend, factory } = fixture();
    vi.mocked(backend.list).mockRejectedValue(
      new Error("database secret SQL with lead@example.invalid"),
    );
    const response = await searchLeads(req(), factory);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "database_unavailable" });
  });
  it("exports the same filters, with a BOM and formula-safe CSV", async () => {
    const { backend, factory } = fixture();
    const response = await exportLeads(req({ email: "lead@", page: 6 }), factory);
    expect(response.status).toBe(200);
    expect(backend.list).toHaveBeenCalledWith(
      expect.objectContaining({ email: "lead@", page: 1 }),
      1000,
    );
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([239, 187, 191]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain(lead.email);
    expect(text).toContain("'=1+1");
  });
  it.each([1001, 2])("never silently truncates CSV data: total %i", async (total) => {
    const { backend, factory } = fixture();
    vi.mocked(backend.list).mockResolvedValue({
      rows: [lead],
      total,
      newCount: 1,
      scheduledCount: 0,
    });
    const response = await exportLeads(req(), factory);
    expect(response.status).toBe(total > 1000 ? 413 : 503);
    expect(response.headers.get("Content-Type")).toContain("application/json");
  });
  it("rejects large bodies before parsing", async () => {
    const { backend, factory } = fixture();
    const response = await searchLeads(req({ email: "x".repeat(6000) }), factory);
    expect(response.status).toBe(413);
    expect(backend.list).not.toHaveBeenCalled();
  });
});

describe("date and CSV boundaries", () => {
  it("includes Istanbul midnight and excludes the next day's midnight", () => {
    expect(dateBoundary("2026-11-12")).toBe("2026-11-11T21:00:00.000Z");
    expect(dateBoundary("2026-11-12", true)).toBe("2026-11-12T21:00:00.000Z");
    expect(() => parseFilters({ from: "2026-02-30" })).toThrow();
  });
  it.each(["=formula", "+formula", "-formula", "@formula", "   =formula", "\tformula"])(
    "neutralizes spreadsheet input: %s",
    (text) => {
      expect(csvCell(text)).toBe(`"'${text}"`);
    },
  );
});

describe("Supabase adapter authorization", () => {
  it("verifies the user remotely and never queries a table for an ordinary account", async () => {
    vi.stubEnv("SUPABASE_URL", "https://backend.example.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const network = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          id: ID,
          email_confirmed_at: "2026-11-01T12:00:00Z",
          app_metadata: {},
          user_metadata: { qualifi_admin: true },
        }),
      );
    vi.stubGlobal("fetch", network);
    const response = await searchLeads(req());
    expect(response.status).toBe(403);
    expect(network).toHaveBeenCalledTimes(1);
    expect(String(network.mock.calls[0]?.[0])).toContain("/auth/v1/user");
  });
  it("reads the contracted table using the verified user token and matching date filters", async () => {
    vi.stubEnv("SUPABASE_URL", "https://backend.example.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const queries: { url: URL; method: string; headers: Headers }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/auth/v1/user")) return Response.json(owner);
        queries.push({ url, method: init?.method ?? "GET", headers: new Headers(init?.headers) });
        if (init?.method === "HEAD")
          return new Response(null, {
            headers: {
              "content-range": `*/${url.searchParams.get("contact_status") === "eq.demo_scheduled" ? 0 : 1}`,
            },
          });
        return Response.json([lead], { headers: { "content-range": "0-0/1" } });
      }),
    );
    const response = await searchLeads(
      req({ from: "2026-11-12", to: "2026-11-12", email: "lead@", locale: "tr" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      rows: [lead],
      total: 1,
      newCount: 1,
      scheduledCount: 0,
    });
    expect(queries).toHaveLength(3);
    for (const query of queries) {
      expect(query.url.pathname).toBe("/rest/v1/qualifi_leads");
      expect(query.headers.get("authorization")).toBe("Bearer test-token");
      expect(query.headers.get("apikey")).toBe("sb_publishable_test");
      expect(query.url.searchParams.getAll("created_at")).toEqual([
        "gte.2026-11-11T21:00:00.000Z",
        "lt.2026-11-12T21:00:00.000Z",
      ]);
      expect(query.url.searchParams.get("locale")).toBe("eq.tr");
    }
  });
});
