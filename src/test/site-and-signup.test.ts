import { describe, expect, it, vi } from "vitest";
import { PAGES } from "@/lib/qualifi-pages";
import { enhancePage } from "@/lib/qualifi-enhance";
import { prefersTurkish, servePage, sitemapXml } from "@/lib/qualifi-serve";
import { DAILY_EXTRACT_LIMIT, extractQuotaCheck, handleClaim, type ClaimDeps } from "@/lib/account-claim.server";

describe("marketing pages are connected and honest", () => {
  const routes = Object.keys(PAGES);

  it("removes every broken upload option and outdated no-AI promise", () => {
    for (const r of routes) {
      const html = enhancePage(r, PAGES[r] as string);
      expect(html, r).not.toContain('value="upload"');
      expect(html, r).not.toMatch(/5 MB/);
      expect(html, r).not.toMatch(/AI modeline gönderilmez|not sent to an AI model|AI modeline göndermiyoruz/);
    }
  });

  it("links home, demo, sign-up and sign-in from every non-campaign page", () => {
    for (const r of routes.filter((x) => (PAGES[x] as string).includes('class="nav-shell"'))) {
      const html = enhancePage(r, PAGES[r] as string);
      expect(html, r).toContain('href="/app/giris"');
      expect(html, r).toContain('href="/demo"');
      expect(html, r).toContain('href="/app/kayit"');
      expect(html, r).toContain('class="footer-links"');
    }
  });

  it("puts the founder's message and the free account first on business home pages", () => {
    const tr = enhancePage("/isletmeler", PAGES["/isletmeler"] as string);
    expect(tr).toContain("İşinizi siz büyütün.<br><em>Finansal takibi biz halledelim.</em>");
    expect(tr).toMatch(/<div class="actions"><a class="button primary" href="\/app\/kayit">Ücretsiz hesap aç/);
    expect(tr).toContain('href="/demo/isletme"');
    const en = enhancePage("/en/business", PAGES["/en/business"] as string);
    expect(en).toContain("We handle the financial follow-up.");
    const bank = enhancePage("/bankalar", PAGES["/bankalar"] as string);
    expect(bank).toMatch(/<div class="actions"><a class="button primary" href="\/demo\/banka">/);
    expect(bank).toContain('data-open="agent"');
  });

  it("is idempotent and leaves campaign pages' single action alone", () => {
    const once = enhancePage("/isletmeler", PAGES["/isletmeler"] as string);
    expect(enhancePage("/isletmeler", once)).toBe(once);
    const campaign = enhancePage("/tr/sozlesmeden-nakit-akisi", PAGES["/tr/sozlesmeden-nakit-akisi"] as string);
    expect(campaign).toContain("campaign-primary");
  });

  it("sends Turkish browsers to the Turkish home page and serves a sitemap", () => {
    expect(prefersTurkish("tr-TR,tr;q=0.9,en;q=0.8")).toBe(true);
    expect(prefersTurkish("en-US,en;q=0.9,tr;q=0.8")).toBe(false);
    const res = servePage("/", new Request("https://qualifilab.com/", { headers: { "Accept-Language": "tr-TR" } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/isletmeler");
    expect(servePage("/", new Request("https://qualifilab.com/", { headers: { "Accept-Language": "en" } })).status).toBe(200);
    expect(sitemapXml("https://qualifilab.com")).toContain("<loc>https://qualifilab.com/isletmeler</loc>");
  });
});

describe("self sign-up role claim", () => {
  const req = (token = "t") => new Request("https://qualifilab.com/api/account/claim", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const deps = (user: Awaited<ReturnType<ClaimDeps["getUser"]>>): ClaimDeps => ({ getUser: vi.fn().mockResolvedValue(user), setAppMetadata: vi.fn().mockResolvedValue(undefined) });

  it("gives a confirmed user without a role only the blank workspace role", async () => {
    const d = deps({ id: "u1", email_confirmed_at: "2026-11-18", app_metadata: { provider: "email" }, user_metadata: { company: "Acme <b>Ltd</b>", qualifi_role: "banker", qualifi_admin: true } });
    const res = await handleClaim(req(), d);
    expect(await res.json()).toEqual({ role: "blank", changed: true });
    expect(d.setAppMetadata).toHaveBeenCalledWith("u1", { provider: "email", qualifi_role: "blank", qualifi_self_signup: true, qualifi_company: "Acme bLtd/b" });
  });

  it("never changes an existing role or an admin, and refuses unconfirmed or anonymous callers", async () => {
    const banker = deps({ id: "u2", email_confirmed_at: "x", app_metadata: { qualifi_role: "banker" } });
    expect(await (await handleClaim(req(), banker)).json()).toEqual({ role: "banker", changed: false });
    expect(banker.setAppMetadata).not.toHaveBeenCalled();
    const admin = deps({ id: "u3", email_confirmed_at: "x", app_metadata: { qualifi_admin: true } });
    expect(await (await handleClaim(req(), admin)).json()).toMatchObject({ role: "admin", changed: false });
    expect((await handleClaim(req(), deps({ id: "u4", email_confirmed_at: null, app_metadata: {} }))).status).toBe(403);
    expect((await handleClaim(new Request("https://qualifilab.com/api/account/claim", { method: "POST" }), deps(null))).status).toBe(401);
  });

  it("caps AI document reads per account per day, admins exempt", async () => {
    const q = (used: number, admin = false) => ({ userIdFromToken: vi.fn().mockResolvedValue("u1"), isAdmin: vi.fn().mockResolvedValue(admin), readsSince: vi.fn().mockResolvedValue(used) });
    const r = new Request("https://qualifilab.com/api/workspace/extract", { method: "POST", headers: { Authorization: "Bearer t" } });
    expect(await extractQuotaCheck(r, q(DAILY_EXTRACT_LIMIT - 1))).toBeNull();
    expect((await extractQuotaCheck(r, q(DAILY_EXTRACT_LIMIT)))?.status).toBe(429);
    expect(await extractQuotaCheck(r, q(999, true))).toBeNull();
  });
});
