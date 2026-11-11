import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Download,
  ExternalLink,
  Inbox,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Search,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_STATUSES, PAGE_SIZE, REPORT_TIMEZONE } from "@/lib/lead-admin";
import type { ContactStatus, LeadFilters, LeadList } from "@/lib/lead-admin";
import { AdminApiError, adminErrorText, leadAdminApi } from "@/lib/lead-admin-client";

const EMPTY_FILTERS: LeadFilters = {
  email: "",
  from: "",
  to: "",
  status: "all",
  locale: "all",
  page: 1,
};
const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: REPORT_TIMEZONE,
  dateStyle: "medium",
  timeStyle: "short",
});
const kindLabels = {
  waitlist: "Bekleme listesi",
  pilot: "Pilot talebi",
  meeting: "Görüşme talebi",
};
const campaignLabels: Record<string, string> = {
  cashflow: "Sözleşmeden nakit akışı",
  "project-income": "Freelancer gelir planı",
  collections: "Tahsilat takibi",
  "sales-follow-up": "Gmail satış takibi",
  "sales-forecast": "Satış öngörüsü",
  whatsapp: "WhatsApp ödeme takibi",
  "bank-risk": "Banka risk pilotu",
};

function Brand() {
  return (
    <a className="qa-brand" href="/" aria-label="QualiFi ana sayfa">
      <img src="/favicon.svg" alt="" width="32" height="32" />
      QualiFi<span>.</span>
    </a>
  );
}

export function LeadInbox({
  token,
  email,
  onSignOut,
}: {
  token: string;
  email: string;
  onSignOut: () => void;
}) {
  const [draft, setDraft] = useState<LeadFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [data, setData] = useState<LeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const actions = useRef(new Set<AbortController>());
  useEffect(
    () => () => {
      for (const controller of actions.current) controller.abort();
      actions.current.clear();
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    leadAdminApi
      .search(token, filters, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, filters, revision]);

  async function updateStatus(id: string, status: ContactStatus) {
    const controller = new AbortController();
    actions.current.add(controller);
    setUpdating(id);
    setNotice("");
    setError(null);
    try {
      await leadAdminApi.update(token, id, status, controller.signal);
      if (controller.signal.aborted) return;
      setNotice("İletişim durumu kaydedildi.");
      setRevision((value) => value + 1);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure);
    } finally {
      actions.current.delete(controller);
      if (!controller.signal.aborted) setUpdating(null);
    }
  }

  async function download() {
    const controller = new AbortController();
    actions.current.add(controller);
    setExporting(true);
    setError(null);
    try {
      const blob = await leadAdminApi.export(token, filters, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "qualifi-basvurular.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice("Filtrelenmiş başvurular CSV olarak indirildi.");
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure);
    } finally {
      actions.current.delete(controller);
      if (!controller.signal.aborted) setExporting(false);
    }
  }

  const forbidden = error instanceof AdminApiError && [401, 403].includes(error.status);
  // A lost/revoked session must never leave previously loaded contacts visible.
  const visible = forbidden ? null : data;
  const blocked = loading || !visible || updating !== null;
  const pages = visible ? Math.max(1, Math.ceil(visible.total / PAGE_SIZE)) : 1;

  return (
    <div className="qualifi-admin">
      <header className="qa-top">
        <Brand />
        <span className="qa-private">
          <ShieldCheck size={15} />
          Özel yönetim alanı
        </span>
        <div className="qa-account">
          <span>{email}</span>
          <button className="qa-button qa-quiet" onClick={onSignOut}>
            <LogOut size={16} />
            Çıkış
          </button>
        </div>
      </header>
      <main className="qa-main">
        <div className="qa-heading">
          <div>
            <p className="qa-eyebrow">QUALIFI / BAŞVURULAR</p>
            <h1>İlk ilgiden ilk görüşmeye.</h1>
            <p>Kim ilgilendi, hangi çözümü seçti, sırada hangi adım var?</p>
          </div>
          <a className="qa-button qa-outline" href="/" target="_blank" rel="noopener noreferrer">
            Siteyi aç
            <ExternalLink size={15} />
          </a>
        </div>
        <div className="qa-metrics" aria-label="Filtrelenmiş başvuru özeti">
          {[
            ["Toplam başvuru", visible?.total],
            ["İletişim bekleyen", visible?.newCount],
            ["Görüşme planlanan", visible?.scheduledCount],
          ].map(([label, value]) => (
            <div className="qa-metric" key={String(label)}>
              <span>{label}</span>
              <strong>{loading || value === undefined ? "—" : value}</strong>
              <small>Seçili filtreler kapsamında</small>
            </div>
          ))}
        </div>
        <section className="qa-inbox" aria-labelledby="qa-inbox-title">
          <div className="qa-list-head">
            <div>
              <h2 id="qa-inbox-title">
                <Inbox size={20} />
                Başvuru listesi
              </h2>
              <p>Yalnızca kaydedilmiş başvurular · Saat dilimi: İstanbul</p>
            </div>
            <div className="qa-list-actions">
              <button
                className="qa-button qa-outline"
                disabled={loading || !!updating}
                onClick={() => setRevision((value) => value + 1)}
                aria-label="Başvuruları yenile"
              >
                <RefreshCw size={16} />
                Yenile
              </button>
              <button
                className="qa-button qa-primary"
                disabled={blocked || exporting || visible?.total === 0}
                onClick={download}
              >
                <Download size={16} />
                {exporting ? "Hazırlanıyor…" : "CSV indir"}
              </button>
            </div>
          </div>
          <form
            className="qa-filters"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice("");
              setFilters({ ...draft, page: 1 });
            }}
          >
            <fieldset disabled={exporting}>
              <label className="qa-search">
                <span>E-postada ara</span>
                <div>
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="isim@sirket.com"
                    maxLength={100}
                    value={draft.email}
                    onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                  />
                </div>
              </label>
              <label>
                <span>İletişim durumu</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as LeadFilters["status"] })
                  }
                >
                  <option value="all">Tüm durumlar</option>
                  {Object.entries(CONTACT_STATUSES).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Dil</span>
                <select
                  value={draft.locale}
                  onChange={(event) =>
                    setDraft({ ...draft, locale: event.target.value as LeadFilters["locale"] })
                  }
                >
                  <option value="all">Tüm diller</option>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                <span>Başlangıç</span>
                <input
                  type="date"
                  value={draft.from}
                  onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                />
              </label>
              <label>
                <span>Bitiş</span>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                />
              </label>
              <button
                className="qa-button qa-outline"
                type="submit"
                disabled={loading || !!updating}
              >
                Filtrele
              </button>
              <button
                className="qa-clear"
                type="button"
                disabled={loading || !!updating}
                onClick={() => {
                  setDraft(EMPTY_FILTERS);
                  setFilters({ ...EMPTY_FILTERS });
                }}
              >
                Temizle
              </button>
            </fieldset>
          </form>
          <div className="qa-messages" aria-live="polite">
            {notice && (
              <p className="qa-notice">
                <Check size={16} />
                {notice}
              </p>
            )}
            {error != null && (
              <p className="qa-error" role="alert">
                {adminErrorText(error)}
                {forbidden && <button onClick={onSignOut}>Giriş ekranına dön</button>}
              </p>
            )}
          </div>
          {loading ? (
            <div className="qa-empty" role="status">
              <span className="qa-spinner" />
              Başvurular yükleniyor…
            </div>
          ) : !visible ? (
            <div className="qa-empty">
              <ShieldCheck size={30} />
              <h3>{forbidden ? "Erişim doğrulanamadı" : "Başvurular şu anda görüntülenemiyor"}</h3>
              <p>
                {forbidden
                  ? "Bu liste yalnızca yetkili hesabına açıktır."
                  : "Bağlantı hazır olduğunda gerçek başvurular burada görünecek."}
              </p>
            </div>
          ) : visible.rows.length === 0 ? (
            <div className="qa-empty">
              <Inbox size={32} />
              <h3>Bu filtrelerde başvuru yok.</h3>
              <p>Başka bir tarih aralığı seçebilir veya filtreleri temizleyebilirsin.</p>
            </div>
          ) : (
            <div className="qa-table-wrap">
              <table>
                <caption className="qa-sr-only">
                  Kaydedilmiş başvurular ve iletişim durumları
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Kişi / e-posta</th>
                    <th scope="col">İlgilendiği çözüm</th>
                    <th scope="col">Kaynak</th>
                    <th scope="col">Kayıt tarihi</th>
                    <th scope="col">İletişim durumu</th>
                    <th scope="col">
                      <span className="qa-sr-only">İletişim</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.email}</strong>
                        <small>{row.company || "Şirket belirtilmedi"}</small>
                      </td>
                      <td>
                        <strong>{campaignLabels[row.campaign_id ?? ""] || row.page_id}</strong>
                        <small>
                          {kindLabels[row.kind]} · {row.locale.toUpperCase()}
                        </small>
                      </td>
                      <td>
                        <strong>{row.utm_source || "Kaynak bilinmiyor"}</strong>
                        <small>
                          {[row.utm_medium, row.utm_campaign].filter(Boolean).join(" · ") ||
                            "Kampanya bilgisi yok"}
                        </small>
                      </td>
                      <td>
                        <time dateTime={row.created_at}>
                          {dateFormat.format(new Date(row.created_at))}
                        </time>
                      </td>
                      <td>
                        <select
                          className={`qa-status qa-status-${row.contact_status}`}
                          aria-label={`${row.email} iletişim durumu`}
                          value={row.contact_status}
                          disabled={!!updating || exporting}
                          onChange={(event) =>
                            void updateStatus(row.id, event.target.value as ContactStatus)
                          }
                        >
                          {Object.entries(CONTACT_STATUSES).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {updating === row.id && <small role="status">Kaydediliyor…</small>}
                      </td>
                      <td>
                        <a
                          className="qa-mail"
                          href={`mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent("QualiFi talebiniz hakkında")}`}
                          aria-label={`${row.email} adresine e-posta yaz`}
                        >
                          <Mail size={17} />
                          <span>E-posta yaz</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {visible && !loading && (
            <footer className="qa-pagination">
              <span>
                {visible.total === 0
                  ? "0 kayıt"
                  : `${(filters.page - 1) * PAGE_SIZE + 1}–${Math.min(filters.page * PAGE_SIZE, visible.total)} / ${visible.total} kayıt`}
              </span>
              <div>
                <button
                  className="qa-button qa-outline"
                  disabled={filters.page <= 1 || !!updating || exporting}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  aria-label="Önceki sayfa"
                >
                  <ArrowLeft size={16} />
                </button>
                <span>
                  Sayfa {filters.page} / {pages}
                </span>
                <button
                  className="qa-button qa-outline"
                  disabled={filters.page >= pages || !!updating || exporting}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  aria-label="Sonraki sayfa"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </footer>
          )}
        </section>
        <p className="qa-footnote">
          CTA tıklamaları bu listeye kişi eklemez. Burada yalnızca formu gönderip kaydı tamamlanan
          başvurular bulunur. “E-posta yaz” posta uygulamanı açar; otomatik mesaj göndermez.
        </p>
      </main>
    </div>
  );
}

export function LeadsAdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    let authChanged = false;
    let unsubscribe: (() => void) | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_event, next) => {
        authChanged = true;
        if (alive) {
          setSession(next);
          setChecking(false);
        }
      });
      unsubscribe = () => result.data.subscription.unsubscribe();
      void supabase.auth
        .getSession()
        .then((result) => {
          if (alive && !authChanged) {
            setSession(result.data.session);
            setChecking(false);
          }
        })
        .catch(() => {
          if (alive) {
            setError("Giriş bağlantısı şu anda hazır değil.");
            setChecking(false);
          }
        });
    } catch {
      setError("Giriş bağlantısı henüz hazır değil.");
      setChecking(false);
    }
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error || !result.data.session) {
        setError("Giriş yapılamadı. E-posta adresini ve şifreni kontrol et.");
        return;
      }
      setSession(result.data.session);
      setPassword("");
    } catch {
      setError("Giriş bağlantısı şu anda kullanılamıyor. Daha sonra tekrar deneyebilirsin.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setSession(null);
    setPassword("");
    try {
      const result = await supabase.auth.signOut({ scope: "local" });
      if (result.error) setError("Çıkış doğrulanamadı. Yeniden deneyebilirsin.");
    } catch {
      setError("Çıkış doğrulanamadı. Yeniden deneyebilirsin.");
    }
  }
  if (session)
    return (
      <LeadInbox
        key={session.user.id}
        token={session.access_token}
        email={session.user.email ?? "Yetkili hesap"}
        onSignOut={() => void signOut()}
      />
    );
  return (
    <main className="qualifi-admin qa-login">
      <div className="qa-login-card">
        <Brand />
        <p className="qa-eyebrow">YALNIZCA YETKİLİ HESAPLAR İÇİN</p>
        <h1>Başvuruların burada.</h1>
        <p>İlgi gösteren kişileri gör, sonraki adımlarını takip et.</p>
        {checking ? (
          <p role="status">Oturum kontrol ediliyor…</p>
        ) : (
          <form onSubmit={login}>
            <label>
              <span>E-posta adresi</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Şifre</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="qa-button qa-primary" disabled={busy} type="submit">
              {busy ? "Giriş yapılıyor…" : "Giriş yap"}
              <ArrowRight size={16} />
            </button>
            <small>Başvurular yalnızca yönetici olarak tanımlanan hesabına açıktır.</small>
          </form>
        )}
        {error && (
          <p className="qa-error" role="alert">
            {error}
          </p>
        )}
        <a className="qa-back" href="/">
          ← Web sitesine dön
        </a>
      </div>
    </main>
  );
}
