import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/demo/shared";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage({ tone: "error", text: "E-posta veya şifre hatalı. Davet bağlantısıyla şifrenizi belirlediyseniz tekrar deneyin ya da aşağıdan yeni bağlantı isteyin." });
      return;
    }
    window.location.assign("/app");
  };

  const reset = async () => {
    if (!email.trim()) {
      setMessage({ tone: "error", text: "Önce e-posta adresinizi yazın." });
      return;
    }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    // Same answer whether or not the address exists, so accounts cannot be probed.
    setMessage({ tone: "info", text: "Bu adres kayıtlıysa şifre belirleme bağlantısı gönderildi. Gelen kutunuzu kontrol edin." });
  };

  return (
    <div className="qd">
      <header className="qd-top">
        <Brand />
        <div className="qd-spacer" />
        <a className="qd-btn qd-btn--ghost qd-btn--sm" href="/demo">Canlı demo</a>
        <a className="qd-btn qd-btn--primary qd-btn--sm" href="/app/kayit">Ücretsiz başla</a>
      </header>
      <main className="qd-login">
        <section className="qd-card qd-enter">
          <span className="qd-agent__avatar"><KeyRound size={18} /></span>
          <h1>QualiFi hesabınıza giriş yapın</h1>
          <p>Kayıt sayfasından açtığınız ya da davetle gelen hesabınızla giriş yapın. Davet aldıysanız önce e-postadaki bağlantıyla şifrenizi belirleyin.</p>
          <form onSubmit={signIn}>
            <label>
              <span>E-posta</span>
              <input className="qd-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              <span>Şifre</span>
              <input className="qd-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="qd-btn qd-btn--primary" type="submit" disabled={busy}>
              Giriş yap <ArrowRight size={14} />
            </button>
            <button className="qd-btn qd-btn--ghost qd-btn--sm" type="button" onClick={reset} disabled={busy}>
              Şifremi unuttum / şifre belirle
            </button>
          </form>
          {message ? <p role={message.tone === "error" ? "alert" : "status"} className={`qd-login__msg qd-login__msg--${message.tone}`}>{message.text}</p> : null}
          <p className="qd-login__alt">
            Hesabınız yok mu? <a href="/app/kayit">Ücretsiz hesap açın</a> · <a href="/demo">Canlı demo</a> giriş gerektirmez.
          </p>
        </section>
      </main>
    </div>
  );
}
