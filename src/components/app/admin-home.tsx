import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Download, ExternalLink, FileUp, Mail, Link2, RefreshCw, Users } from "lucide-react";
import { parseAccountsCsv, ROLE_LABEL, SAMPLE_CSV, type AccountRow } from "@/lib/accounts";
import { Tabs, Toast, TopBar } from "@/components/demo/shared";

type Tab = "create" | "accounts" | "activity";

interface ListedUser {
  id: string;
  email: string;
  role: string;
  tenant: string | null;
  region: string | null;
  banker_no: string | null;
  company: string | null;
  confirmed: boolean;
  last_sign_in_at: string | null;
}

interface Result {
  email: string;
  status: "invited" | "link" | "updated" | "skipped_admin" | "failed";
  link?: string;
  error?: string;
}

const STATUS: Record<Result["status"], [string, string]> = {
  invited: ["Davet gönderildi", "qd-pill--good"],
  link: ["Bağlantı hazır", "qd-pill--good"],
  updated: ["Mevcut hesap güncellendi", "qd-pill--muted"],
  skipped_admin: ["Admin hesabı, değiştirilmedi", "qd-pill--warn"],
  failed: ["Hata", "qd-pill--bad"],
};

async function api(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(path, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : `http_${res.status}`);
  return body;
}

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function AdminHome({ token, accountSlot }: { token: string; accountSlot: ReactNode }) {
  const [tab, setTab] = useState<Tab>("create");
  const [toast, setToast] = useState<string | null>(null);
  const clear = useCallback(() => setToast(null), []);
  return (
    <div className="qd">
      <TopBar title="QualiFi yönetim" subtitle="Hesaplar, davetler ve demo etkinliği" badge={null}>
        <a className="qd-btn qd-btn--sm" href="/admin/leads">Başvurular</a>
        <a className="qd-btn qd-btn--sm" href="/demo">Demo paneller</a>
        {accountSlot}
      </TopBar>
      <main className="qd-main qd-main--single">
        <section className="qd-card">
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            items={[
              ["create", "Hesap aç (CSV)"],
              ["accounts", "Hesaplar"],
              ["activity", "Demo etkinliği"],
            ]}
          />
          <div key={tab} className="qd-enter">
            {tab === "create" ? <CreateAccounts token={token} onToast={setToast} /> : null}
            {tab === "accounts" ? <AccountList token={token} /> : null}
            {tab === "activity" ? <Activity token={token} /> : null}
          </div>
        </section>
      </main>
      {toast ? <Toast text={toast} onDone={clear} /> : null}
    </div>
  );
}

function CreateAccounts({ token, onToast }: { token: string; onToast: (t: string) => void }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"link" | "invite">("link");
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const parsed = useMemo(() => (text.trim() ? parseAccountsCsv(text) : null), [text]);
  const rows = parsed?.rows ?? [];
  const blocked = !parsed || parsed.errors.length > 0 || rows.length === 0 || progress !== null;

  const send = async () => {
    if (mode === "invite" && !window.confirm(`${rows.length} kişiye davet e-postası gönderilecek. Bu geri alınamaz. Devam edilsin mi?`)) return;
    setResults([]);
    const all: Result[] = [];
    setProgress({ done: 0, total: rows.length });
    // Small batches keep each request short and stay under the e-mail sender's rate limits.
    for (let i = 0; i < rows.length; i += 10) {
      const batch: AccountRow[] = rows.slice(i, i + 10);
      try {
        const body = (await api("/api/admin/accounts", token, { method: "POST", body: JSON.stringify({ mode, rows: batch }) })) as { results: Result[] };
        all.push(...body.results);
      } catch (e) {
        all.push(...batch.map((r) => ({ email: r.email, status: "failed" as const, error: e instanceof Error ? e.message : "hata" })));
      }
      setResults([...all]);
      setProgress({ done: Math.min(rows.length, i + 10), total: rows.length });
    }
    setProgress(null);
    onToast(`${all.filter((r) => r.status !== "failed").length} / ${all.length} hesap işlendi.`);
  };

  const downloadLinks = () => {
    const csv = ["email,durum,baglanti", ...results.map((r) => `${r.email},${STATUS[r.status][0]},${r.link ?? ""}`)].join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "qualifi-davetler.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="qd-admin">
      <div className="qd-admin__intro">
        <p>
          Sütunlar: <code>email, role, tenant, company, sector, region, banker_no</code>. <b>role</b>: <code>demo</code> (tenant ör. 017 gerekli), <code>blank</code> veya <code>banker</code> (region ve banker_no gerekli).
          Aynı e-posta zaten varsa hesap türü güncellenir; yeni davet gitmez. CSV ile admin hesabı açılamaz.
        </p>
        <div className="qd-toolbar" style={{ marginBottom: 0 }}>
          <label className="qd-btn qd-btn--sm">
            <FileUp size={14} /> CSV dosyası seç
            <input type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
          </label>
          <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => setText(SAMPLE_CSV)}>Örnek CSV'yi yükle</button>
        </div>
      </div>
      <textarea className="qd-textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="CSV'yi buraya yapıştırın veya dosya seçin" aria-label="Hesap CSV" />

      {parsed ? (
        <>
          {parsed.errors.length ? (
            <div className="qd-alert" role="alert">
              <b>Düzeltilmesi gereken satırlar</b>
              <ul>
                {parsed.errors.map((e) => (
                  <li key={`${e.line}-${e.message}`}>{e.line ? `Satır ${e.line}: ` : ""}{e.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="qd-stat-row">
            {(["demo", "blank", "banker"] as const).map((r) => (
              <div className="qd-stat" key={r}><span>{ROLE_LABEL[r]}</span><b className="qd-num">{rows.filter((x) => x.role === r).length}</b></div>
            ))}
          </div>
          <div className="qd-table-wrap" style={{ maxHeight: 280, overflowY: "auto" }}>
            <table className="qd-table">
              <thead><tr><th>E-posta</th><th>Tür</th><th>Panel</th><th>Şirket</th><th>Sonuç</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const res = results.find((x) => x.email === r.email);
                  return (
                    <tr key={r.email}>
                      <td>{r.email}</td>
                      <td>{ROLE_LABEL[r.role]}</td>
                      <td className="qd-num">{r.role === "demo" ? `mockerp${(r.tenant ?? "").padStart(3, "0")}` : r.role === "banker" ? `${r.region} · uzman ${(r.banker_no ?? "").padStart(2, "0")}` : "Kendi belgeleri"}</td>
                      <td>{r.company ?? "—"}</td>
                      <td>
                        {res ? <span className={`qd-pill ${STATUS[res.status][1]}`} title={res.error}>{STATUS[res.status][0]}</span> : null}
                        {res?.link ? (
                          <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => { void navigator.clipboard.writeText(res.link as string); onToast("Davet bağlantısı kopyalandı."); }}>
                            <Copy size={12} /> Kopyala
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="qd-mode" role="radiogroup" aria-label="Davet yöntemi">
            <label className={mode === "link" ? "is-on" : ""}>
              <input type="radio" name="mode" checked={mode === "link"} onChange={() => setMode("link")} />
              <Link2 size={15} />
              <span><b>Davet bağlantısı oluştur</b><small>E-posta gitmez. Bağlantıları kopyalayıp WhatsApp veya kendi e-postanızla gönderirsiniz. Bağlantılar sınırlı süre geçerlidir.</small></span>
            </label>
            <label className={mode === "invite" ? "is-on" : ""}>
              <input type="radio" name="mode" checked={mode === "invite"} onChange={() => setMode("invite")} />
              <Mail size={15} />
              <span><b>Davet e-postası gönder</b><small>QualiFi adına e-posta gider. Gönderilen e-posta geri alınamaz.</small></span>
            </label>
          </div>
          <div className="qd-toolbar" style={{ marginTop: 12 }}>
            <button type="button" className="qd-btn qd-btn--primary" disabled={blocked} onClick={send}>
              <Users size={14} /> {rows.length} hesabı aç
            </button>
            {progress ? <span className="qd-num">{progress.done} / {progress.total} işlendi…</span> : null}
            {results.some((r) => r.link) ? (
              <button type="button" className="qd-btn qd-btn--sm" onClick={downloadLinks}><Download size={13} /> Bağlantıları CSV indir</button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccountList({ token }: { token: string }) {
  const [users, setUsers] = useState<ListedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const load = useCallback(() => {
    setError(null);
    api("/api/admin/accounts", token, { method: "GET" })
      .then((b: { users: ListedUser[] }) => setUsers(b.users))
      .catch((e: Error) => setError(e.message));
  }, [token]);
  useEffect(load, [load]);
  if (error) return <p role="alert">Hesaplar okunamadı ({error}).</p>;
  if (!users) return <p style={{ color: "var(--qd-muted)" }}>Yükleniyor…</p>;
  const shown = users.filter((u) => u.email.includes(query.toLowerCase()));
  return (
    <>
      <div className="qd-toolbar">
        <input className="qd-input" placeholder="E-posta ara" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="E-posta ara" />
        <button type="button" className="qd-btn qd-btn--sm" onClick={load}><RefreshCw size={13} /> Yenile</button>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{users.length} hesap · {users.filter((u) => u.last_sign_in_at).length} kişi en az bir kez girdi</span>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
        <table className="qd-table">
          <thead><tr><th>E-posta</th><th>Tür</th><th>Panel</th><th>Şifre belirledi</th><th>Son giriş</th><th /></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td>{u.email}{u.company ? <div style={{ color: "var(--qd-muted)", fontSize: 11.5 }}>{u.company}</div> : null}</td>
                <td>{u.role === "admin" ? "Admin" : ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role}</td>
                <td className="qd-num">{u.tenant ? `mockerp${u.tenant}` : u.banker_no ? `${u.region} · ${u.banker_no}` : "—"}</td>
                <td>{u.confirmed ? <span className="qd-pill qd-pill--good">Evet</span> : <span className="qd-pill qd-pill--muted">Bekliyor</span>}</td>
                <td className="qd-num">{fmtDate(u.last_sign_in_at)}</td>
                <td>
                  {u.role === "demo" && u.tenant ? <a className="qd-btn qd-btn--ghost qd-btn--sm" href={`/demo/isletme?t=${u.tenant}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Onun gözünden</a> : null}
                  {u.role === "banker" && u.banker_no ? <a className="qd-btn qd-btn--ghost qd-btn--sm" href={`/demo/banka?b=${u.banker_no}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Onun gözünden</a> : null}
                  {u.role === "blank" ? <a className="qd-btn qd-btn--ghost qd-btn--sm" href={`/app?as=${u.id}`}><ExternalLink size={12} /> Belgelerini gör</a> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ACTION_LABEL: Record<string, string> = {
  agent_question: "Ajana soru",
  agent_approve: "Öneri onayı",
  agent_edit: "Öneri düzenleme",
  agent_snooze: "Öneri erteleme",
  scenario_run: "Senaryo",
  date_change: "Tarih değişimi",
  customer_open: "Müşteri kartı",
  firm_open: "Firma kartı",
  tab_open: "Sekme / paylaşım",
};

function Activity({ token }: { token: string }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<{ total: number; sessions: number; signedIn: number; byAction: Record<string, number>; questions: string[]; recent: { created_at: string; panel: string; tenant: string; action: string; target: string | null; detail: string | null; user_id: string | null }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    api(`/api/admin/demo-activity?days=${days}`, token, { method: "GET" }).then(setData).catch((e: Error) => setError(e.message));
  }, [token, days]);
  if (error) return <p role="alert">Etkinlik okunamadı ({error}).</p>;
  if (!data) return <p style={{ color: "var(--qd-muted)" }}>Yükleniyor…</p>;
  const max = Math.max(1, ...Object.values(data.byAction));
  return (
    <>
      <div className="qd-toolbar">
        <select className="qd-select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Dönem">
          {[1, 7, 14, 30].map((d) => <option key={d} value={d}>Son {d} gün</option>)}
        </select>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>Kişisel bilgi tutulmaz; giriş yapmış kullanıcılar yalnız hesap kimliğiyle görünür.</span>
      </div>
      <div className="qd-stat-row">
        <div className="qd-stat"><span>Tıklama/etkileşim</span><b className="qd-num">{data.total}</b></div>
        <div className="qd-stat"><span>Ayrı oturum</span><b className="qd-num">{data.sessions}</b></div>
        <div className="qd-stat"><span>Giriş yapmış kullanıcı</span><b className="qd-num">{data.signedIn}</b></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div>
          <span className="qd-eyebrow">Ne yapıldı</span>
          {Object.entries(data.byAction).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <div key={k} className="qd-factor">
              <span>{ACTION_LABEL[k] ?? k}</span>
              <div className="qd-bar qd-bar--good"><i style={{ width: `${(v / max) * 100}%` }} /></div>
              <b className="qd-num">{v}</b>
            </div>
          ))}
          {!data.total ? <p style={{ color: "var(--qd-muted)" }}>Bu dönemde etkileşim yok.</p> : null}
        </div>
        <div>
          <span className="qd-eyebrow">Ajana sorulan sorular</span>
          <ul className="qd-questions">
            {data.questions.slice(0, 30).map((q, i) => <li key={i}>“{q}”</li>)}
          </ul>
          {!data.questions.length ? <p style={{ color: "var(--qd-muted)" }}>Henüz soru yok.</p> : null}
        </div>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 360, overflowY: "auto", marginTop: 12 }}>
        <table className="qd-table">
          <thead><tr><th>Zaman</th><th>Panel</th><th>Hesap</th><th>Eylem</th><th>Hedef</th><th>Ayrıntı</th></tr></thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={i}>
                <td className="qd-num">{fmtDate(r.created_at)}</td>
                <td>{r.panel === "bank" ? "Bankacı" : "İşletme"} · {r.tenant}</td>
                <td>{r.user_id ? "Girişli" : "Anonim"}</td>
                <td>{ACTION_LABEL[r.action] ?? r.action}</td>
                <td className="qd-num">{r.target ?? "—"}</td>
                <td style={{ maxWidth: 280 }}>{r.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
