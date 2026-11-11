import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LeadInbox, LeadsAdminPage } from "../components/admin/leads-admin-page";
import { AdminApiError, leadAdminApi } from "../lib/lead-admin-client";
import type { LeadList } from "../lib/lead-admin";

const { auth } = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));

const row = {
  id: "5d299901-c92f-4973-93f3-7f7eb4fbd440",
  email: "lead@example.invalid",
  company: "Test Company",
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
const results: LeadList = { rows: [row], total: 1, newCount: 1, scheduledCount: 0 };
function view() {
  return render(<LeadInbox token="test-token" email="owner@example.invalid" onSignOut={vi.fn()} />);
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("owner lead inbox", () => {
  it("shows real returned contacts, source, Istanbul date and mail action", async () => {
    vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    view();
    expect(await screen.findByText(row.email)).toBeVisible();
    expect(screen.getByText("Sözleşmeden nakit akışı")).toBeVisible();
    expect(screen.getByText("facebook")).toBeVisible();
    expect(screen.getByText(/12 Kas 2026/)).toBeVisible();
    expect(screen.getByRole("link", { name: `${row.email} adresine e-posta yaz` })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:"),
    );
  });
  it("distinguishes missing storage from a verified empty inbox", async () => {
    vi.spyOn(leadAdminApi, "search").mockRejectedValue(
      new AdminApiError(503, "storage_not_configured"),
    );
    view();
    expect(await screen.findByText(/Başvuru bağlantısı henüz hazır değil/)).toBeVisible();
    expect(screen.queryByText(row.email)).not.toBeInTheDocument();
    expect(screen.queryByText("Bu filtrelerde başvuru yok.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV indir/ })).toBeDisabled();
  });
  it("shows an empty state only after a successful empty response", async () => {
    vi.spyOn(leadAdminApi, "search").mockResolvedValue({
      rows: [],
      total: 0,
      newCount: 0,
      scheduledCount: 0,
    });
    view();
    expect(await screen.findByText("Bu filtrelerde başvuru yok.")).toBeVisible();
    expect(screen.getByRole("button", { name: /CSV indir/ })).toBeDisabled();
  });
  it("applies the selected filters and resets pagination", async () => {
    const search = vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    view();
    await screen.findByText(row.email);
    fireEvent.change(screen.getByLabelText("E-postada ara"), { target: { value: "lead@" } });
    fireEvent.change(screen.getByLabelText("Dil"), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrele" }));
    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        "test-token",
        expect.objectContaining({ email: "lead@", locale: "en", page: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("saves status through the API and refreshes instead of claiming a local-only save", async () => {
    const search = vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    const update = vi
      .spyOn(leadAdminApi, "update")
      .mockResolvedValue({ ...row, contact_status: "contacted" });
    view();
    await screen.findByText(row.email);
    fireEvent.change(screen.getByLabelText(`${row.email} iletişim durumu`), {
      target: { value: "contacted" },
    });
    expect(await screen.findByText("İletişim durumu kaydedildi.")).toBeVisible();
    expect(update).toHaveBeenCalledWith("test-token", row.id, "contacted", expect.any(AbortSignal));
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
  });
  it("hides contacts after a revoked authorization and disables export", async () => {
    vi.spyOn(leadAdminApi, "search")
      .mockResolvedValueOnce(results)
      .mockRejectedValueOnce(new AdminApiError(403, "admin_required"));
    view();
    await screen.findByText(row.email);
    fireEvent.click(screen.getByRole("button", { name: "Başvuruları yenile" }));
    expect(await screen.findByText(/Bu hesabın başvurulara erişim yetkisi yok/)).toBeVisible();
    expect(screen.queryByText(row.email)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV indir/ })).toBeDisabled();
  });
  it("does not download a pending export after logout/unmount", async () => {
    vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    let finish!: (blob: Blob) => void;
    const exporting = vi.spyOn(leadAdminApi, "export").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const create = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create });
    const panel = view();
    await screen.findByText(row.email);
    fireEvent.click(screen.getByRole("button", { name: /CSV indir/ }));
    await waitFor(() => expect(exporting).toHaveBeenCalledTimes(1));
    const signal = exporting.mock.calls[0]?.[2];
    panel.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      finish(new Blob(["private"], { type: "text/csv" }));
    });
    expect(create).not.toHaveBeenCalled();
  });
  it("locks filters while a CSV is being prepared", async () => {
    vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    let finish!: (blob: Blob) => void;
    vi.spyOn(leadAdminApi, "export").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const panel = view();
    await screen.findByText(row.email);
    fireEvent.click(screen.getByRole("button", { name: /CSV indir/ }));
    expect(screen.getByLabelText("E-postada ara")).toBeDisabled();
    expect(screen.getByLabelText("Dil")).toBeDisabled();
    expect(screen.getByLabelText(`${row.email} iletişim durumu`)).toBeDisabled();
    panel.unmount();
    await act(async () => {
      finish(new Blob(["private"]));
    });
  });
});

describe("admin sign-in boundary", () => {
  function setup(session: unknown = null) {
    auth.getSession.mockResolvedValue({ data: { session } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  }
  it("does not fetch contacts before a session exists and handles failed login", async () => {
    setup();
    const search = vi.spyOn(leadAdminApi, "search");
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid credentials"),
    });
    render(<LeadsAdminPage />);
    const login = await screen.findByRole("button", { name: "Giriş yap" });
    fireEvent.change(screen.getByLabelText("E-posta adresi"), {
      target: { value: "owner@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Şifre"), { target: { value: "test-password" } });
    fireEvent.click(login);
    expect(await screen.findByText(/Giriş yapılamadı/)).toBeVisible();
    expect(search).not.toHaveBeenCalled();
  });
  it("removes previously displayed contacts immediately on sign-out", async () => {
    setup({ user: { id: "owner", email: "owner@example.invalid" }, access_token: "test-token" });
    auth.signOut.mockResolvedValue({ error: null });
    vi.spyOn(leadAdminApi, "search").mockResolvedValue(results);
    render(<LeadsAdminPage />);
    await screen.findByText(row.email);
    fireEvent.click(screen.getByRole("button", { name: "Çıkış" }));
    expect(await screen.findByRole("button", { name: "Giriş yap" })).toBeVisible();
    expect(screen.queryByText(row.email)).not.toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
