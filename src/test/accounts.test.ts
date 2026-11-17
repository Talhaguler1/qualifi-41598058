import { describe, expect, it, vi } from "vitest";
import { accountMetadata, identityFrom, parseAccountsCsv, SAMPLE_CSV } from "@/lib/accounts";
import { handleCreateAccounts, handleDemoActivity, handleListAccounts, type AccountsDeps, type AuthUser } from "@/lib/accounts.server";

const ADMIN: AuthUser = { id: "a1", email: "owner@qualifi.test", email_confirmed_at: "2026-11-01", app_metadata: { qualifi_admin: true } };

function deps(over: Partial<AccountsDeps> = {}): AccountsDeps {
  let n = 0;
  return {
    getUser: vi.fn().mockResolvedValue(ADMIN),
    hasAdminRole: vi.fn().mockResolvedValue(true),
    listUsers: vi.fn().mockResolvedValue([ADMIN]),
    invite: vi.fn().mockImplementation(async (email: string) => ({ id: `u${++n}`, email })),
    inviteLink: vi.fn().mockImplementation(async (email: string) => ({ user: { id: `u${++n}`, email }, link: `https://x.test/invite/${n}` })),
    setAppMetadata: vi.fn().mockResolvedValue(undefined),
    activity: vi.fn().mockResolvedValue([]),
    ...over,
  };
}

const post = (body: unknown, token = "t") =>
  new Request("https://qualifilab.com/api/admin/accounts", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("account CSV", () => {
  it("parses the sample with comma or semicolon and reports bad lines", () => {
    expect(parseAccountsCsv(SAMPLE_CSV).rows).toHaveLength(3);
    const semi = parseAccountsCsv("email;role;tenant\nA@B.com;demo;17\nbad;demo;1\nc@d.com;banker\nA@b.com;blank");
    expect(semi.rows.map((r) => r.email)).toEqual(["a@b.com"]);
    expect(semi.errors.map((e) => e.line)).toEqual([3, 4, 5]);
  });

  it("cannot create an admin from a CSV", () => {
    const r = parseAccountsCsv("email,role\nx@y.com,admin");
    expect(r.rows).toHaveLength(0);
    expect(JSON.stringify(accountMetadata({ email: "x@y.com", role: "demo", tenant: "7" }))).not.toContain("qualifi_admin");
    expect(accountMetadata({ email: "x@y.com", role: "demo", tenant: "7" })["qualifi_tenant"]).toBe("007");
  });

  it("reads identity only from app_metadata", () => {
    expect(identityFrom({ qualifi_admin: true }, true).role).toBe("admin");
    expect(identityFrom({ qualifi_admin: true }, false).role).toBe("none");
    expect(identityFrom({ qualifi_role: "demo", qualifi_tenant: "017" }, true)).toMatchObject({ role: "demo", tenant: "017" });
    expect(identityFrom({ qualifi_role: "banker", qualifi_region: "Marmara-1", qualifi_banker_no: "03" }, true)).toMatchObject({ role: "banker", bankerNo: "03" });
    expect(identityFrom({}, true).role).toBe("none");
  });
});

describe("admin account API", () => {
  const rows = parseAccountsCsv(SAMPLE_CSV).rows;

  it("rejects missing tokens, non-admins and admins without the protected role", async () => {
    expect((await handleCreateAccounts(new Request("https://qualifilab.com/api/admin/accounts", { method: "POST", body: "{}" }), deps())).status).toBe(401);
    const notAdmin = deps({ getUser: vi.fn().mockResolvedValue({ ...ADMIN, app_metadata: { qualifi_role: "demo" } }) });
    expect((await handleCreateAccounts(post({ mode: "invite", rows }), notAdmin)).status).toBe(403);
    expect((await handleCreateAccounts(post({ mode: "invite", rows }), deps({ hasAdminRole: vi.fn().mockResolvedValue(false) }))).status).toBe(403);
    expect((await handleListAccounts(new Request("https://qualifilab.com/api/admin/accounts", { headers: { Authorization: "Bearer t", Origin: "https://evil.test" } }), deps())).status).toBe(403);
  });

  it("invites new people, returns links in link mode and never touches an existing admin", async () => {
    const d = deps({ listUsers: vi.fn().mockResolvedValue([ADMIN, { id: "old", email: "deneme@firma.com", app_metadata: { qualifi_role: "demo", qualifi_tenant: "001" } }]) });
    const res = await handleCreateAccounts(post({ mode: "link", rows: [...rows, { email: "owner@qualifi.test", role: "blank" }] }), d);
    const body = (await res.json()) as { results: { email: string; status: string; link?: string }[] };
    expect(body.results.map((r) => r.status)).toEqual(["link", "updated", "link", "skipped_admin"]);
    expect(body.results[0]?.link).toContain("https://");
    expect(d.setAppMetadata).toHaveBeenCalledWith("old", { qualifi_role: "blank", qualifi_company: "Deneme Ltd.", qualifi_sector: "E-ticaret" });
    expect(d.invite).not.toHaveBeenCalled();
  });

  it("reports a failed row without stopping the others", async () => {
    const d = deps({ invite: vi.fn().mockRejectedValueOnce(new Error("rate limit")).mockResolvedValue({ id: "u9", email: "x" }) });
    const body = (await (await handleCreateAccounts(post({ mode: "invite", rows }), d)).json()) as { results: { status: string }[] };
    expect(body.results.map((r) => r.status)).toEqual(["failed", "invited", "invited"]);
  });

  it("summarises demo activity for admins", async () => {
    const d = deps({
      activity: vi.fn().mockResolvedValue([
        { user_id: null, session_id: "s1", panel: "business", tenant: "017", demo_date: "2026-11-24", action: "agent_question", target: null, detail: "Aralık nasıl?", created_at: "2026-11-18T10:00:00Z" },
        { user_id: "u1", session_id: "s2", panel: "bank", tenant: "01", demo_date: "2026-11-24", action: "firm_open", target: "F01-001", detail: null, created_at: "2026-11-18T09:00:00Z" },
      ]),
    });
    const body = (await (await handleDemoActivity(new Request("https://qualifilab.com/api/admin/demo-activity?days=3", { headers: { Authorization: "Bearer t" } }), d)).json()) as Record<string, unknown>;
    expect(body).toMatchObject({ days: 3, total: 2, sessions: 2, signedIn: 1, questions: ["Aralık nasıl?"] });
  });
});
