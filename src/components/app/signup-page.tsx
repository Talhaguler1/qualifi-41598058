import { useState, type FormEvent } from "react";
import { ArrowRight, MailCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/demo/shared";

export function SignupPage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Şifre en az 12 karakter olmalı.");
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/app`, data: { company: company.trim().slice(0, 120) } },
    });
    setBusy(false);
    if (err) {
      setError(/registered|already/i.test(err.message) ? "Bu e-posta ile zaten bir hesap var. Giriş yapın veya şifrenizi sıfırlayın." : "Hesap açılamadı. Bilgileri kontrol edip tekrar deneyin.");
      return;
    }
    if (data.session) window.location.assign("/app");
    else setSentTo(email.trim());
  };

  return (
    <div className="qd">
      <header className="qd-top">
        <Brand />
        <div className="qd-spacer" />
        <a className="qd-btn qd-btn--ghost qd-btn--sm" href="/demo">Canlı demo</a>
        <a className="qd-btn qd-btn--sm" href="/app/giris">Giriş</a>
      </header>
      <main className="qd-login qd-login--wide">
        <section className="qd-card qd-enter">
          {sentTo ? (
            <>
              <span className="qd-agent__avatar"><MailCheck size={18} /></span>
              <h1>E-postanızı doğrulayın</h1>
              <p>{sentTo} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığınızda hesabınız açılır ve sizi ilk adımlar karşılar.</p>
              <p className="qd-login__alt">E-posta gelmediyse gereksiz klasörünü kontrol edin veya <a href="/app/giris">giriş sayfasından</a> yeni bağlantı isteyin.</p>
            </>
          ) : (
            <>
              <span className="qd-badge" style={{ alignSelf: "flex-start" }}><Sparkles size={12} /> Ücretsiz · belge gerekmez</span>
              <h1>İşinizi siz büyütün. Finansal takibi biz halledelim.</h1>
              <p>Hesabınızı açın; sonra belgelerinizi yükleyin veya bağlantı kurun. Hiçbir şey yüklemeden de önce örnek verilerle deneyebilirsiniz.</p>
              <form onSubmit={submit}>
                <label>
                  <span>Şirket adı</span>
                  <input className="qd-input" required maxLength={120} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
                </label>
                <label>
                  <span>İş e-postası</span>
                  <input className="qd-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                  <span>Şifre (en az 12 karakter)</span>
                  <input className="qd-input" type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label className="qd-check">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                  <span>
                    Hesabıma yüklediğim belgelerin yalnız benim hesabımda saklanacağını, okunması için yapay zekâ hizmeti kullanılacağını ve istediğim an silebileceğimi biliyorum.
                  </span>
                </label>
                <button className="qd-btn qd-btn--primary" type="submit" disabled={busy || !consent}>
                  Ücretsiz hesap aç <ArrowRight size={14} />
                </button>
              </form>
              {error ? <p role="alert" className="qd-login__msg qd-login__msg--error">{error}</p> : null}
              <p className="qd-login__alt">
                Zaten hesabınız var mı? <a href="/app/giris">Giriş yapın</a> · Banka ekibi misiniz? <a href="/bankalar">Kurumsal pilot</a>
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
