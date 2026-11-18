import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute } from "@tanstack/react-router";
import { AccountChip, useAppSession } from "@/components/app/session";
import { AdminHome } from "@/components/app/admin-home";
import { WorkspacePanel } from "@/components/app/workspace-panel";
import { BusinessPanel } from "@/components/demo/business-panel";
import { BankPanel } from "@/components/demo/bank-panel";
import { Brand } from "@/components/demo/shared";
import { demoHead } from "@/components/demo/head";
import { DEFAULT_DEMO_DATE, type DemoDate } from "@/lib/demo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/app/")({
  validateSearch: (s: Record<string, unknown>): { as?: string } => (typeof s["as"] === "string" && UUID.test(s["as"]) ? { as: s["as"] } : {}),
  head: () => demoHead("Panelim", "QualiFi hesabınızın paneli."),
  component: AppHome,
});

function AppHome() {
  const state = useAppSession();
  const { as } = Route.useSearch();
  const [date, setDate] = useState<DemoDate>(DEFAULT_DEMO_DATE);

  useEffect(() => {
    if (state.status === "signed_out") window.location.replace("/app/giris");
  }, [state.status]);

  // Self sign-up: a confirmed account without a role asks the server for the workspace role once.
  const claimed = useRef(false);
  const [claimFailed, setClaimFailed] = useState(false);
  const needsClaim = state.status === "signed_in" && state.identity.role === "none";
  useEffect(() => {
    if (!needsClaim || claimed.current || state.status !== "signed_in") return;
    claimed.current = true;
    void fetch("/api/account/claim", { method: "POST", headers: { Authorization: `Bearer ${state.session.access_token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        await supabase.auth.refreshSession();
      })
      .catch(() => setClaimFailed(true));
  }, [needsClaim, state]);

  if (state.status !== "signed_in" || (needsClaim && !claimFailed)) {
    return (
      <div className="qd">
        <header className="qd-top"><Brand /></header>
        <div className="qd-loading" role="status">{needsClaim ? "Çalışma alanınız hazırlanıyor…" : "Hesabınız açılıyor…"}</div>
      </div>
    );
  }

  const slot = <AccountChip email={state.email} />;
  const { identity, session } = state;
  const token = session.access_token;

  if (identity.role === "admin") {
    if (as) {
      return (
        <WorkspacePanel
          userId={as}
          token={token}
          readOnly
          title="Kullanıcının çalışma alanı"
          accountSlot={<><a className="qd-btn qd-btn--sm" href="/app">Yönetime dön</a>{slot}</>}
        />
      );
    }
    return <AdminHome token={token} accountSlot={slot} />;
  }
  if (identity.role === "demo" && identity.tenant) return <BusinessPanel tenant={identity.tenant} date={date} onDate={setDate} accountSlot={slot} />;
  if (identity.role === "banker" && identity.region && identity.bankerNo) {
    return <BankPanel region={identity.region} banker={identity.bankerNo} date={date} onDate={setDate} onBanker={() => undefined} lockBanker accountSlot={slot} />;
  }
  if (identity.role === "blank") return <WorkspacePanel userId={session.user.id} token={token} title={identity.company ?? "Çalışma alanım"} accountSlot={slot} />;

  return (
    <div className="qd">
      <header className="qd-top"><Brand /><div className="qd-spacer" />{slot}</header>
      <main className="qd-login">
        <section className="qd-card">
          <h1>Hesabınıza henüz bir panel atanmadı</h1>
          <p>Yöneticiniz hesabınızı demo işletme, kendi belgelerinizle çalışma alanı veya bankacı paneli olarak tanımladığında burada görünecek.</p>
          <p className="qd-login__alt">Bu arada <a href="/demo">demo panellerine</a> göz atabilirsiniz.</p>
        </section>
      </main>
    </div>
  );
}
