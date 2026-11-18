import { L } from "@/lib/demo";

/** Links shown on public demo panels so every page leads to sign-up and sign-in. */
export function DemoLinks() {
  return (
    <>
      <a className="qd-btn qd-btn--ghost qd-btn--sm" href="/app/giris">{L("Giriş", "Sign in")}</a>
      <a className="qd-btn qd-btn--sm" href="/app/kayit">{L("Ücretsiz hesap aç", "Open a free account")}</a>
    </>
  );
}
