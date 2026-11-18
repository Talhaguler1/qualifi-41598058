import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, Calculator, Check, FileText, FileUp, Landmark, Loader2, MessageCircle, Plus, ShieldAlert, Sparkles, Trash2, Undo2 } from "lucide-react";
import { trackDemo } from "@/lib/demo/track";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTr, money } from "@/lib/demo";
import { FILE_KIND_LABEL, isLira, KIND_BY_EXTENSION, workspaceOutlook, type WorkspaceCommitment } from "@/lib/workspace-forecast";
import { Kpi, Toast, TopBar, useLocalState, useMounted } from "@/components/demo/shared";

interface FileRow {
  id: string;
  kind: keyof typeof FILE_KIND_LABEL;
  original_name: string;
  status: string;
  error: string | null;
  created_at: string;
}
interface CommitmentRow extends WorkspaceCommitment {
  evidence: string | null;
  confidence: number | null;
  file_id: string | null;
  paid_at: string | null;
}

const COMMITMENT_KIND = { invoice: "Fatura", contract_installment: "Sözleşme taksiti", promise: "Ödeme sözü", expense: "Gider" } as const;
const today = () => new Date().toISOString().slice(0, 10);

type Step = { name: string; state: "uploading" | "reading" | "done" | "failed"; message?: string };

export function WorkspacePanel({ userId, title, token, readOnly, accountSlot }: { userId: string; title: string; token: string; readOnly?: boolean; accountSlot: ReactNode }) {
  const mounted = useMounted();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [items, setItems] = useState<CommitmentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [balance, setBalance] = useLocalState<number>(`qd-ws-balance-${userId}`, 0);
  const clearToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    const [f, c] = await Promise.all([
      supabase.from("qualifi_workspace_files").select("id,kind,original_name,status,error,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("qualifi_commitments").select("id,counterparty,direction,amount,currency,due_date,kind,status,needs_review,evidence,confidence,file_id,paid_at").eq("user_id", userId).order("due_date", { ascending: true }),
    ]);
    if (f.error || c.error) {
      setLoadError("Veriler okunamadı. Sayfayı yenileyin; sorun sürerse yöneticinize haber verin.");
      return;
    }
    setFiles((f.data ?? []) as FileRow[]);
    setItems((c.data ?? []) as CommitmentRow[]);
  }, [userId]);
  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const kind = KIND_BY_EXTENSION[ext];
    if (!kind) {
      setStep({ name: file.name, state: "failed", message: "Bu dosya türü desteklenmiyor. PDF, PNG/JPG, XLSX/CSV veya WhatsApp .txt yükleyin." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStep({ name: file.name, state: "failed", message: "Dosya 10 MB'tan büyük." });
      return;
    }
    setStep({ name: file.name, state: "uploading" });
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("workspace-files").upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (up.error) {
      setStep({ name: file.name, state: "failed", message: "Dosya yüklenemedi. Tekrar deneyin." });
      return;
    }
    const row = await supabase.from("qualifi_workspace_files").insert({ kind, storage_path: path, original_name: file.name.slice(0, 255) }).select("id").single();
    if (row.error || !row.data) {
      setStep({ name: file.name, state: "failed", message: "Dosya kaydı oluşturulamadı." });
      return;
    }
    setStep({ name: file.name, state: "reading" });
    await load();
    const res = await fetch("/api/workspace/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ file_id: row.data.id }),
    });
    const body = (await res.json().catch(() => ({}))) as { count?: number; message?: string };
    if (!res.ok) setStep({ name: file.name, state: "failed", message: body.message ?? "Belge okunamadı." });
    else setStep({ name: file.name, state: "done", message: `${body.count ?? 0} taahhüt bulundu. Aşağıda kontrol edin.` });
    await load();
  };

  const update = async (id: string, patch: Partial<Pick<CommitmentRow, "amount" | "due_date" | "counterparty" | "status" | "paid_at" | "needs_review">>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("qualifi_commitments").update(patch).eq("id", id);
    if (error) {
      setToast("Değişiklik kaydedilemedi.");
      void load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("qualifi_commitments").delete().eq("id", id);
    if (error) setToast("Silinemedi.");
    void load();
  };

  const addManual = async (row: { counterparty: string; direction: "in" | "out"; amount: number; due_date: string; kind: keyof typeof COMMITMENT_KIND }) => {
    const { error } = await supabase.from("qualifi_commitments").insert({ ...row, status: "open", needs_review: false, evidence: "Elle eklendi" });
    if (error) setToast("Eklenemedi.");
    else setToast("Eklendi.");
    void load();
  };

  const deleteAll = async () => {
    if (!window.confirm("Yüklediğiniz tüm dosyalar ve çıkarılan bütün taahhütler kalıcı olarak silinecek. Bu geri alınamaz. Devam edilsin mi?")) return;
    const listed = await supabase.storage.from("workspace-files").list(userId, { limit: 1000 });
    const paths = (listed.data ?? []).map((o) => `${userId}/${o.name}`);
    if (paths.length) await supabase.storage.from("workspace-files").remove(paths);
    const { error } = await supabase.rpc("qualifi_delete_my_workspace");
    setToast(error ? "Silme tamamlanamadı; tekrar deneyin." : "Tüm verileriniz silindi.");
    void load();
  };

  const outlook = useMemo(() => workspaceOutlook(items, balance, today()), [items, balance]);
  const review = items.filter((c) => c.needs_review && c.status !== "paid");
  const end = outlook.weeks.at(-1);
  const lowest = outlook.weeks.reduce((m, w) => (w.balanceCautious < m.balanceCautious ? w : m), outlook.weeks[0] ?? { balanceCautious: 0, weekStart: today() } as never);

  return (
    <div className="qd">
      <TopBar title={title} subtitle={readOnly ? "Yönetici görünümü · salt okunur" : "Kendi belgelerinizle nakit görünümü"} badge={null}>
        {accountSlot}
      </TopBar>
      <main className="qd-main">
        <div className="qd-col">
          {loadError ? <div className="qd-alert" role="alert">{loadError}</div> : null}
          {!readOnly && !files.length && !items.length && !loadError ? <Onboarding onPick={(target) => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" })} /> : null}
          <section className="qd-kpis">
            <Kpi tone="accent" label="Bugünkü bakiye (sizin girdiğiniz)" value={money(balance)} sub={readOnly ? "Yalnız kullanıcının tarayıcısında" : "Aşağıdan değiştirebilirsiniz"} />
            <Kpi label="Beklenen tahsilat (TL)" value={money(outlook.openIn)} sub={`${items.filter((c) => c.direction === "in" && c.status !== "paid" && isLira(c) && !outlook.duplicates.has(c.id)).length} kalem${outlook.foreign.some((c) => c.direction === "in") ? " · döviz ayrı" : ""}`} />
            <Kpi label="Planlı ödeme (TL)" value={money(outlook.openOut)} sub={`${items.filter((c) => c.direction === "out" && c.status !== "paid" && isLira(c) && !outlook.duplicates.has(c.id)).length} kalem${outlook.foreign.some((c) => c.direction === "out") ? " · döviz ayrı" : ""}`} />
            <Kpi {...(lowest && lowest.balanceCautious < 0 ? { tone: "alert" as const } : {})} label="En dar hafta (temkinli)" value={money(lowest?.balanceCautious ?? 0)} sub={lowest ? `${formatDateTr(lowest.weekStart)} haftası` : ""} />
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">8 haftalık görünüm</span>
                <h2>Yüklediğiniz belgelerden nakit takvimi</h2>
              </div>
              {!readOnly ? (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  Bugünkü bakiye
                  <input className="qd-input qd-num" style={{ width: 140 }} type="number" step={1000} value={balance} onChange={(e) => setBalance(Number(e.target.value) || 0)} />
                </label>
              ) : null}
            </div>
            <div className="qd-chart">
              {mounted ? (
                <ResponsiveContainer>
                  <ComposedChart data={outlook.weeks.map((w) => ({ ...w, label: formatDateTr(w.weekStart).replace(/ \d{4}$/, ""), out: -w.outflow }))} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: "#66766a", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => money(v)} tick={{ fill: "#66766a", fontSize: 11 }} axisLine={false} tickLine={false} width={78} />
                    <Tooltip formatter={(v: number) => money(v)} />
                    <ReferenceLine y={0} stroke="#b4442f" strokeDasharray="4 4" />
                    <Bar dataKey="inflow" name="Tahsilat" fill="#8fbf4d" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar dataKey="out" name="Ödeme" fill="#e7b2a5" radius={[0, 0, 6, 6]} barSize={14} />
                    <Line dataKey="balance" name="Bakiye" stroke="#203b30" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line dataKey="balanceCautious" name="Temkinli bakiye" stroke="#b4442f" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <p style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>
              Temkinli çizgi, kontrol bekleyen ve vadesi geçmiş tahsilatları saymaz. Ödeme geçmişiniz biriktikçe ajan her müşterinin gerçek ödeme gününü öğrenir; şimdilik vade tarihleri esas alınıyor.
              {end ? ` 8. hafta sonunda: ${money(end.balance)}.` : ""}
              {outlook.undated.length ? ` ${outlook.undated.length} kalemin tarihi yok; tarih girince takvime eklenir.` : ""}
              {outlook.foreign.length ? ` ${outlook.foreign.length} döviz kalemi (${[...new Set(outlook.foreign.map((c) => (c.currency ?? "").toUpperCase()))].join(", ")}) TL toplamlarına katılmadı; kur netleşince TL karşılığını yazabilirsiniz.` : ""}
              {outlook.duplicates.size ? ` ${outlook.duplicates.size} kalem başka bir belgede de geçiyor gibi görünüyor; "Olası tekrar" satırlarını kontrol edip fazlasını silin.` : ""}
            </p>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Taahhütler</span>
                <h2>Ajanın belgelerden çıkardıkları</h2>
                <p>Tutar ve tarihleri kontrol edin; yanlışsa üzerine yazın. Sarı satırlar sizin onayınızı bekliyor.</p>
              </div>
              <span className="qd-pill qd-pill--warn">{review.length} kontrol bekliyor</span>
            </div>
            <CommitmentTable items={items} duplicates={outlook.duplicates} readOnly={Boolean(readOnly)} onUpdate={update} onRemove={remove} />
            {!readOnly ? <ManualAdd onAdd={addManual} /> : null}
          </section>
        </div>

        <aside className="qd-side">
          {!readOnly ? (
            <section className="qd-card qd-agent" id="qd-upload">
              <div className="qd-card__head" style={{ marginBottom: 6 }}>
                <div className="qd-agent__title">
                  <span className="qd-agent__avatar"><FileUp size={18} /></span>
                  <span><b>Belge yükleyin</b><small>Ajan tutar, vade ve karşı tarafı çıkarır</small></span>
                </div>
              </div>
              <label className="qd-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void upload(f); }}>
                <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} disabled={step?.state === "uploading" || step?.state === "reading"} />
                <b>Dosyayı buraya bırakın veya seçin</b>
                <span>Sözleşme (PDF) · Fatura görseli (PNG/JPG) · Excel/CSV · WhatsApp sohbeti (.txt) · en fazla 10 MB</span>
              </label>
              {step ? (
                <div className="qd-brief" data-tone={step.state === "failed" ? "alert" : "calm"} role="status">
                  <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {step.state === "uploading" || step.state === "reading" ? <Loader2 size={14} className="qd-spin" /> : step.state === "done" ? <Check size={14} /> : <ShieldAlert size={14} />}
                    {step.state === "uploading" ? "Yükleniyor…" : step.state === "reading" ? "Ajan belgeyi okuyor…" : step.state === "done" ? "Tamamlandı" : "Olmadı"}
                  </p>
                  <ul><li>{step.name}</li>{step.message ? <li>{step.message}</li> : null}</ul>
                </div>
              ) : null}
              <p style={{ color: "#b9ccb4", fontSize: 12, marginTop: 10 }}>
                Belgeleriniz yalnız sizin hesabınızda saklanır. Okuma için yapay zekâ kullanılır; ajan emin olmadığı bilgiyi işaretler, uydurmaz.
              </p>
            </section>
          ) : null}
          {!readOnly ? <Integrations onRequest={(name) => setToast(`${name} talebiniz alındı. Pilot kapsamında kurulumu sizinle planlayacağız.`)} /> : null}
          <section className="qd-card">
            <div className="qd-card__head"><h2>Yüklenen dosyalar</h2></div>
            {files.length ? (
              <ul className="qd-files">
                {files.map((f) => (
                  <li key={f.id}>
                    <span>
                      <b>{f.original_name}</b>
                      <small>{FILE_KIND_LABEL[f.kind] ?? f.kind} · {new Date(f.created_at).toLocaleDateString("tr-TR")}</small>
                      {f.error ? <small style={{ color: "var(--qd-bad)" }}>{f.error}</small> : null}
                    </span>
                    <span className={`qd-pill ${f.status === "extracted" ? "qd-pill--good" : f.status === "failed" ? "qd-pill--bad" : "qd-pill--muted"}`}>
                      {f.status === "extracted" ? "Okundu" : f.status === "failed" ? "Okunamadı" : f.status === "processing" ? "Okunuyor" : "Yüklendi"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--qd-muted)" }}>Henüz dosya yok. Bir sözleşme, fatura görseli veya WhatsApp sohbeti ile başlayın.</p>
            )}
          </section>
          {!readOnly ? (
            <section className="qd-card">
              <div className="qd-card__head"><h2>Verileriniz</h2></div>
              <p style={{ color: "var(--qd-muted)", fontSize: 13 }}>Dosyalarınızı ve çıkarılan taahhütleri istediğiniz an tamamen silebilirsiniz.</p>
              <button type="button" className="qd-btn qd-btn--sm" style={{ marginTop: 10, color: "var(--qd-bad)" }} onClick={() => void deleteAll()}>
                <Trash2 size={13} /> Tüm verilerimi sil
              </button>
            </section>
          ) : null}
        </aside>
      </main>
      {toast ? <Toast text={toast} onDone={clearToast} /> : null}
    </div>
  );
}

function Onboarding({ onPick }: { onPick: (target: string) => void }) {
  return (
    <section className="qd-card qd-enter qd-onboard">
      <span className="qd-eyebrow">Hoş geldiniz · ilk adım</span>
      <h2>Ajanınız nasıl başlasın?</h2>
      <p>Üç yoldan biriyle başlayın. Daha sonra diğerlerini de ekleyebilirsiniz.</p>
      <div className="qd-onboard__grid">
        <button type="button" className="qd-onboard__opt" onClick={() => onPick("qd-upload")}>
          <FileUp size={18} />
          <b>Belge yükle</b>
          <span>Sözleşme, fatura görseli, Excel veya WhatsApp sohbeti. Ajan tutar ve vadeyi çıkarır.</span>
        </button>
        <button type="button" className="qd-onboard__opt" onClick={() => onPick("qd-integrations")}>
          <Building2 size={18} />
          <b>Bağlantı kur</b>
          <span>ERP, ön muhasebe, e-fatura, banka hesabı veya WhatsApp Business. Pilotta birlikte kuruyoruz.</span>
        </button>
        <a className="qd-onboard__opt" href="/demo/isletme">
          <Sparkles size={18} />
          <b>Örnek verilerle dene</b>
          <span>Hiçbir şey yüklemeden, 185 müşterili örnek bir şirketin panelini gezin.</span>
        </a>
      </div>
    </section>
  );
}

const INTEGRATIONS = [
  { key: "efatura", name: "E-fatura / e-arşiv", icon: <FileText size={15} />, note: "Kesilen faturalar ve vadeler" },
  { key: "onmuhasebe", name: "Ön muhasebe", icon: <Calculator size={15} />, note: "Cari hesaplar, tahsilatlar, çek/senet" },
  { key: "erp", name: "ERP", icon: <Building2 size={15} />, note: "Müşteriler, siparişler, sözleşmeler" },
  { key: "banka", name: "Banka hesabı (açık bankacılık)", icon: <Landmark size={15} />, note: "Gelen/giden ödemeler, bakiye · salt okunur" },
  { key: "whatsapp", name: "WhatsApp Business", icon: <MessageCircle size={15} />, note: "Ödeme sözleri; ham mesajlar sizde kalır" },
] as const;

function Integrations({ onRequest }: { onRequest: (name: string) => void }) {
  const [asked, setAsked] = useState<string[]>([]);
  return (
    <section className="qd-card" id="qd-integrations">
      <div className="qd-card__head">
        <div>
          <h2>Bağlantılar</h2>
          <p>Canlı bağlantılar pilotta, sizin izninizle kurulur. Şimdilik dosya dışa aktarımıyla (Excel/CSV) başlayabilirsiniz.</p>
        </div>
      </div>
      <ul className="qd-integrations">
        {INTEGRATIONS.map((i) => (
          <li key={i.key}>
            <span className="qd-agent__avatar" style={{ width: 30, height: 30 }}>{i.icon}</span>
            <span><b>{i.name}</b><small>{i.note}</small></span>
            {asked.includes(i.key) ? (
              <span className="qd-pill qd-pill--good">Talep alındı</span>
            ) : (
              <button
                type="button"
                className="qd-btn qd-btn--sm"
                onClick={() => {
                  setAsked([...asked, i.key]);
                  trackDemo({ panel: "business", tenant: "self", demo_date: new Date().toISOString().slice(0, 10), action: "tab_open", target: `integration-${i.key}` });
                  onRequest(i.name);
                }}
              >
                Bağlanmak istiyorum
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommitmentTable({ items, duplicates, readOnly, onUpdate, onRemove }: { items: CommitmentRow[]; duplicates: Set<string>; readOnly: boolean; onUpdate: (id: string, p: Partial<CommitmentRow>) => void; onRemove: (id: string) => void }) {
  if (!items.length) return <p style={{ color: "var(--qd-muted)" }}>Henüz taahhüt yok. Belge yükleyin veya aşağıdan elle ekleyin.</p>;
  return (
    <div className="qd-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
      <table className="qd-table">
        <thead><tr><th>Karşı taraf</th><th>Tür</th><th>Yön</th><th className="qd-right">Tutar</th><th>Vade</th><th>Dayanak</th><th>Durum</th>{readOnly ? null : <th />}</tr></thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className={c.needs_review && c.status !== "paid" ? "qd-row--review" : c.status === "paid" ? "qd-row--paid" : ""}>
              <td>{readOnly ? c.counterparty : <input className="qd-cell" defaultValue={c.counterparty} onBlur={(e) => e.target.value.trim() && e.target.value !== c.counterparty && onUpdate(c.id, { counterparty: e.target.value.trim() })} aria-label="Karşı taraf" />}</td>
              <td>{COMMITMENT_KIND[c.kind as keyof typeof COMMITMENT_KIND] ?? c.kind}</td>
              <td>{c.direction === "in" ? <span className="qd-pill qd-pill--good">Gelecek</span> : <span className="qd-pill qd-pill--muted">Ödenecek</span>}</td>
              <td className="qd-right qd-num">{!isLira(c) ? <><span>{c.amount.toLocaleString("tr-TR")} {(c.currency ?? "").toUpperCase()}</span><div><span className="qd-pill qd-pill--warn">Döviz · toplama katılmadı</span></div></> : readOnly ? money(c.amount) : <input className="qd-cell qd-num" type="number" min={0} defaultValue={c.amount} onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 0 && v !== c.amount) onUpdate(c.id, { amount: v }); }} aria-label="Tutar" style={{ textAlign: "right", width: 110 }} />}</td>
              <td className="qd-num">{readOnly ? (c.due_date ? formatDateTr(c.due_date) : "—") : <input className="qd-cell qd-num" type="date" defaultValue={c.due_date ?? ""} onBlur={(e) => e.target.value !== (c.due_date ?? "") && onUpdate(c.id, { due_date: e.target.value || null })} aria-label="Vade" />}</td>
              <td style={{ maxWidth: 240, color: "var(--qd-muted)", fontSize: 12 }}>{c.evidence ? `“${c.evidence}”` : "—"}{c.confidence !== null ? <div>güven %{Math.round(c.confidence * 100)}</div> : null}</td>
              <td>
                {duplicates.has(c.id) ? <span className="qd-pill qd-pill--bad" title="Aynı tutar, para birimi ve vadeyle başka bir satır daha var; toplamlara katılmadı.">Olası tekrar</span> : null}
                {c.status === "paid" ? <span className="qd-pill qd-pill--good">Ödendi</span> : c.needs_review ? <span className="qd-pill qd-pill--warn">Kontrol bekliyor</span> : <span className="qd-pill qd-pill--muted">Açık</span>}
              </td>
              {readOnly ? null : (
                <td style={{ whiteSpace: "nowrap" }}>
                  {c.needs_review && c.status !== "paid" ? <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => onUpdate(c.id, { needs_review: false })}><Check size={12} /> Doğru</button> : null}
                  {c.status === "paid" ? (
                    <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => onUpdate(c.id, { status: "open", paid_at: null })}><Undo2 size={12} /> Geri al</button>
                  ) : (
                    <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => onUpdate(c.id, { status: "paid", paid_at: today(), needs_review: false })}>Ödendi</button>
                  )}
                  <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => onRemove(c.id)} aria-label="Sil"><Trash2 size={12} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManualAdd({ onAdd }: { onAdd: (row: { counterparty: string; direction: "in" | "out"; amount: number; due_date: string; kind: keyof typeof COMMITMENT_KIND }) => void }) {
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState({ counterparty: "", direction: "in" as "in" | "out", amount: "", due_date: "", kind: "invoice" as keyof typeof COMMITMENT_KIND });
  if (!open) return <button type="button" className="qd-btn qd-btn--sm" style={{ marginTop: 12 }} onClick={() => setOpen(true)}><Plus size={13} /> Elle ekle</button>;
  const ok = row.counterparty.trim() && Number(row.amount) > 0 && row.due_date;
  return (
    <div className="qd-project" style={{ marginTop: 12 }}>
      <label><span>Karşı taraf</span><input className="qd-input" value={row.counterparty} onChange={(e) => setRow({ ...row, counterparty: e.target.value })} /></label>
      <label><span>Yön</span><select className="qd-select" value={row.direction} onChange={(e) => setRow({ ...row, direction: e.target.value as "in" | "out" })}><option value="in">Gelecek para</option><option value="out">Ödenecek para</option></select></label>
      <label><span>Tür</span><select className="qd-select" value={row.kind} onChange={(e) => setRow({ ...row, kind: e.target.value as keyof typeof COMMITMENT_KIND })}>{Object.entries(COMMITMENT_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label><span>Tutar (TL)</span><input className="qd-input qd-num" type="number" min={0} value={row.amount} onChange={(e) => setRow({ ...row, amount: e.target.value })} /></label>
      <label><span>Vade</span><input className="qd-input qd-num" type="date" value={row.due_date} onChange={(e) => setRow({ ...row, due_date: e.target.value })} /></label>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" disabled={!ok} onClick={() => { onAdd({ counterparty: row.counterparty.trim(), direction: row.direction, amount: Number(row.amount), due_date: row.due_date, kind: row.kind }); setRow({ ...row, counterparty: "", amount: "", due_date: "" }); }}>Ekle</button>
        <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => setOpen(false)}>Kapat</button>
      </div>
    </div>
  );
}
