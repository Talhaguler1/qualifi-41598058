import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AccountChip, useAppSession } from "@/components/app/session";
import { FinancePlanner } from "@/components/admin/finance-planner";
import { Brand } from "@/components/demo/shared";
import { demoHead } from "@/components/demo/head";

export const Route = createFileRoute("/admin/finans")({
  head: () => demoHead("Finans modeli", "QualiFi özel finans modeli."),
  component: FinancePage,
});

function FinancePage() {
  const state = useAppSession();
  useEffect(() => {
    if (state.status === "signed_out") window.location.replace("/app/giris");
  }, [state.status]);

  if (state.status !== "signed_in") {
    return (
      <div className="qd">
        <header className="qd-top">
          <Brand />
        </header>
        <div className="qd-loading" role="status">
          Hesabınız açılıyor…
        </div>
      </div>
    );
  }
  if (state.identity.role !== "admin") {
    return (
      <div className="qd">
        <header className="qd-top">
          <Brand />
        </header>
        <main className="qd-login">
          <section className="qd-card">
            <h1>Bu sayfa yalnızca yöneticiler için</h1>
            <p>
              <a href="/app">Panelinize dönün</a>.
            </p>
          </section>
        </main>
      </div>
    );
  }
  return <FinancePlanner accountSlot={<AccountChip email={state.email} />} />;
}
