import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Bot, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  addDays,
  BANK_SECTORS,
  BANKERS_PER_REGION,
  bankBriefing,
  commitmentStatus,
  DEMO_DATES,
  firmRisk,
  formatDateTr,
  generatePortfolio,
  generateRegion,
  money,
  bankShareSummary,
  generateBusiness,
  sectorAnalysis,
  type AgentStep,
  type DemoDate,
  type Firm,
} from "@/lib/demo";
import { trackDemo, type DemoAction } from "@/lib/demo/track";
import { AgentFeed, BriefingBox } from "./agent-panel";
import { ShareSummaryView } from "./share-view";
import { AnimatedNumber, Kpi, Tabs, TopBar, useMounted } from "./shared";

type Tab = "portfolio" | "sectors" | "signals" | "commitments";
const STATUS_LABEL = { kept: ["Tutuldu", "qd-pill--good"], late: ["Gecikmeli", "qd-pill--warn"], broken: ["Tutulmadı", "qd-pill--bad"], upcoming: ["Yaklaşıyor", "qd-pill--muted"] } as const;
const SIGNAL_LABEL = { promise: ["Ödeme sözü", "qd-pill--muted"], deferral: ["Erteleme talebi", "qd-pill--warn"], stress: ["Nakit sıkıntısı", "qd-pill--bad"], positive: ["Olumlu", "qd-pill--good"] } as const;
const LEVEL = { high: ["Yüksek", "qd-pill--bad"], medium: ["Orta", "qd-pill--warn"], low: ["Düşük", "qd-pill--good"] } as const;

export function BankPanel({ region, banker, date, onDate, onBanker, sharedTenant }: { region: string; banker: string; date: DemoDate; onDate: (d: DemoDate) => void; onBanker: (b: string) => void; sharedTenant?: string | undefined }) {
  const firms = useMemo(() => (banker === "all" ? generateRegion(region) : generatePortfolio(region, banker)), [region, banker]);
  const prevDate = DEMO_DATES[DEMO_DATES.indexOf(date) - 1] ?? addDays(date, -14);
  const risks = useMemo(() => new Map(firms.map((f) => [f.id, firmRisk(f, date)])), [firms, date]);
  const briefing = useMemo(() => bankBriefing(firms, date, prevDate), [firms, date, prevDate]);
  const [tab, setTab] = useState<Tab>("portfolio");
  const [firm, setFirm] = useState<Firm | null>(null);
  const log = (action: DemoAction, target?: string) => trackDemo({ panel: "bank", tenant: banker, demo_date: date, action, target: target ?? null });
  const openFirm = (f: Firm) => {
    log("firm_open", f.id);
    setFirm(f);
  };

  const high = firms.filter((f) => risks.get(f.id)?.level === "high");
  const allCommitments = firms.flatMap((f) => f.commitments.map((c) => ({ f, c, s: commitmentStatus(c, date) })));
  const broken = allCommitments.filter((x) => x.s === "broken");
  const upcoming = allCommitments.filter((x) => x.s === "upcoming" && x.c.date <= addDays(date, 7));
  const newSignals = firms.flatMap((f) => f.signals.filter((s) => s.date > prevDate && s.date <= date));

  const steps: AgentStep[] = [
    { id: "p", tool: "karne", title: `${firms.length.toLocaleString("tr-TR")} firmanın tahsilat verisi tarandı`, detail: `Firmaların kendi müşterilerinden tahsil süreleri ${formatDateTr(date)} itibarıyla güncellendi.` },
    { id: "w", tool: "whatsapp", title: "WhatsApp yazışmaları okundu", detail: `${newSignals.length} yeni işaret: ${newSignals.filter((s) => s.type === "stress" || s.type === "deferral").length} sıkıntı/erteleme, ${newSignals.filter((s) => s.type === "promise").length} ödeme sözü.` },
    { id: "t", tool: "takip", title: "Taahhütler kontrol edildi", detail: `${broken.length} tutulmayan, önümüzdeki 7 günde ${upcoming.length} taahhüt.` },
    { id: "s", tool: "tahmin", title: "Sektör analizi yenilendi", detail: `En riskli sektör: ${sectorAnalysis(firms, date)[0]?.sector ?? "—"}.` },
    { id: "c", tool: "banka", title: "Bugünün arama listesi hazır", detail: `${briefing.callList.length} firma; gerekçeleriyle birlikte.` },
  ];

  return (
    <div className="qd">
      <TopBar title={`${region} bölge birimi · Kredi risk`} subtitle={banker === "all" ? `Birim yöneticisi görünümü · ${BANKERS_PER_REGION} uzman` : `Uzman ${banker} · ${firms.length} firma`} date={date} onDate={(d) => { log("date_change", d); onDate(d); }}>
        <select className="qd-select" value={banker} onChange={(e) => onBanker(e.target.value)} aria-label="Uzman">
          <option value="all">Birimin tamamı (6.000 firma)</option>
          {Array.from({ length: BANKERS_PER_REGION }, (_, i) => String(i + 1).padStart(2, "0")).map((b) => (
            <option key={b} value={b}>
              Uzman {b} · 300 firma
            </option>
          ))}
        </select>
      </TopBar>
      <main className="qd-main">
        <div className="qd-col">
          {sharedTenant ? <SharedCard tenant={sharedTenant} date={date} /> : null}
          <section className="qd-kpis" key={`kpi-${date}-${banker}`}>
            <Kpi tone="accent" label="İzlenen firma" value={<AnimatedNumber value={firms.length} format={(n) => Math.round(n).toLocaleString("tr-TR")} />} sub={`Toplam kredi ${money(firms.reduce((s, f) => s + f.loanAmount, 0))}`} />
            <Kpi {...(high.length ? { tone: "alert" as const } : {})} label="Yüksek risk" value={<AnimatedNumber value={high.length} format={(n) => Math.round(n).toLocaleString("tr-TR")} />} sub={`${money(high.reduce((s, f) => s + f.loanAmount, 0))} kredi`} />
            <Kpi label="Tutulmayan taahhüt" value={<AnimatedNumber value={broken.length} format={(n) => String(Math.round(n))} />} sub={`${money(broken.reduce((s, x) => s + x.c.amount, 0))}`} />
            <Kpi label="7 gün içinde vadesi gelen" value={<AnimatedNumber value={upcoming.length} format={(n) => String(Math.round(n))} />} sub="taahhüt" />
          </section>

          <section className="qd-card">
            <Tabs<Tab>
              value={tab}
              onChange={(t) => { log("tab_open", t); setTab(t); }}
              items={[
                ["portfolio", "Portföy"],
                ["sectors", "Sektör analizi"],
                ["signals", "WhatsApp içgörüleri"],
                ["commitments", "Taahhüt takibi"],
              ]}
            />
            <div key={`${tab}-${date}-${banker}`} className="qd-enter">
              {tab === "portfolio" ? <Portfolio firms={firms} risks={risks} onFirm={openFirm} /> : null}
              {tab === "sectors" ? <Sectors firms={firms} date={date} /> : null}
              {tab === "signals" ? <Signals firms={firms} date={date} onFirm={openFirm} /> : null}
              {tab === "commitments" ? <Commitments rows={allCommitments} date={date} onFirm={openFirm} /> : null}
            </div>
          </section>
        </div>
        <aside className="qd-side">
          <section className="qd-card qd-agent">
            <AgentFeed steps={steps} runKey={`${banker}-${date}`} />
            <BriefingBox key={`${banker}-${date}`} briefing={{ headline: briefing.headline, points: briefing.points, tone: high.length > firms.length * 0.15 ? "alert" : "watch" }} />
          </section>
          <section className="qd-card">
            <div className="qd-card__head">
              <h2>Bugün aranacaklar</h2>
              <p>Riski en çok artandan başlayarak</p>
            </div>
            <div className="qd-actions">
              {briefing.callList.map((c, i) => (
                <article key={c.firm.id} className="qd-action qd-enter" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="qd-action__top">
                    <div>
                      <div className="qd-action__name">{c.firm.name}</div>
                      <div className="qd-action__reason">{c.reason}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`qd-pill ${c.score >= 60 ? "qd-pill--bad" : "qd-pill--warn"}`}>Skor {c.score}</span>
                      {c.change > 0 ? <div className="qd-num" style={{ color: "var(--qd-bad)", fontSize: 12, marginTop: 4 }}>+{c.change} puan</div> : null}
                    </div>
                  </div>
                  <div className="qd-action__buttons">
                    <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" onClick={() => openFirm(c.firm)}>
                      <Bot size={13} /> Firma kartı
                    </button>
                    <span className="qd-pill qd-pill--muted"><Phone size={12} /> {c.firm.city}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>
      <FirmSheet firm={firm} date={date} onClose={() => setFirm(null)} />
    </div>
  );
}

function SharedCard({ tenant, date }: { tenant: string; date: string }) {
  const summary = useMemo(() => bankShareSummary(generateBusiness(tenant), date), [tenant, date]);
  return (
    <section className="qd-card qd-enter" style={{ borderColor: "#b6dbb8" }}>
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">İşletmenin paylaştığı ödeme karnesi · yeni</span>
          <h2>{summary.company.name}</h2>
          <p>{summary.company.sector} · {summary.company.city} · {formatDateTr(date)} itibarıyla, işletmenin kendi onayıyla</p>
        </div>
        <span className="qd-pill qd-pill--good">İşletme paylaştı · demo</span>
      </div>
      <ShareSummaryView summary={summary} audience="bank" />
    </section>
  );
}

type Risks = Map<string, ReturnType<typeof firmRisk>>;

function Portfolio({ firms, risks, onFirm }: { firms: Firm[]; risks: Risks; onFirm: (f: Firm) => void }) {
  const [sector, setSector] = useState("all");
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      firms
        .filter((f) => sector === "all" || f.sector === sector)
        .filter((f) => level === "all" || risks.get(f.id)?.level === level)
        .filter((f) => f.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")))
        .sort((a, b) => (risks.get(b.id)?.score ?? 0) - (risks.get(a.id)?.score ?? 0)),
    [firms, risks, sector, level, query],
  );
  return (
    <>
      <div className="qd-toolbar">
        <input className="qd-input" placeholder="Firma ara" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Firma ara" />
        <select className="qd-select" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sektör">
          <option value="all">Tüm sektörler</option>
          {BANK_SECTORS.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select className="qd-select" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Risk">
          <option value="all">Tüm risk seviyeleri</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{rows.length.toLocaleString("tr-TR")} firma</span>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 560, overflowY: "auto" }}>
        <table className="qd-table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>Sektör</th>
              <th className="qd-right">Kredi</th>
              <th>Risk</th>
              <th className="qd-right">Tahsil süresi</th>
              <th>En büyük etken</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 120).map((f) => {
              const r = risks.get(f.id)!;
              const top = r.factors.slice().sort((a, b) => b.points - a.points)[0];
              return (
                <tr key={f.id} data-clickable onClick={() => onFirm(f)}>
                  <td>
                    {f.name}
                    <div style={{ color: "var(--qd-muted)", fontSize: 11.5 }}>{f.id} · {f.city}</div>
                  </td>
                  <td>{f.sector}</td>
                  <td className="qd-right qd-num">{money(f.loanAmount)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="qd-bar" style={{ width: 70 }}>
                        <i style={{ width: `${r.score}%`, background: r.level === "high" ? "#b4442f" : r.level === "medium" ? "#d9a14a" : "#2f7d4f" }} />
                      </div>
                      <span className="qd-num" style={{ fontWeight: 600 }}>{r.score}</span>
                    </div>
                  </td>
                  <td className="qd-right qd-num">
                    {r.delayNow} gün {r.delayChange > 0 ? <span className="qd-pill qd-pill--bad">+{r.delayChange}</span> : null}
                  </td>
                  <td style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{top?.label ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 120 ? <p style={{ color: "var(--qd-muted)", fontSize: 12, padding: 8 }}>En riskli 120 firma gösteriliyor; filtreyle daraltın.</p> : null}
      </div>
    </>
  );
}

function Sectors({ firms, date }: { firms: Firm[]; date: string }) {
  const mounted = useMounted();
  const rows = useMemo(() => sectorAnalysis(firms, date), [firms, date]);
  const data = rows.map((r) => ({ sector: r.sector, high: Math.round(r.highRiskShare * 100), change: r.avgDelayChange }));
  return (
    <>
      <p style={{ color: "var(--qd-muted)", marginBottom: 8 }}>Yüksek riskli firma oranı (%) — sektörlere göre, en riskliden başlayarak</p>
      <div style={{ height: 260 }}>
        {mounted ? (
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="#eef1ea" />
              <XAxis type="number" tickFormatter={(v: number) => `%${v}`} tick={{ fontSize: 11, fill: "#66766a" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 12, fill: "#203b30" }} width={130} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `%${v}`} />
              <Bar dataKey="high" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800}>
                {data.map((d, i) => (
                  <Cell key={d.sector} fill={i < 2 ? "#b4442f" : i < 5 ? "#d9a14a" : "#8fbf4d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <div className="qd-table-wrap" style={{ marginTop: 12 }}>
        <table className="qd-table">
          <thead>
            <tr>
              <th>Sektör</th>
              <th className="qd-right">Firma</th>
              <th className="qd-right">Kredi</th>
              <th className="qd-right">Ort. tahsil süresi</th>
              <th className="qd-right">3 ayda değişim</th>
              <th className="qd-right">Yüksek risk</th>
              <th className="qd-right">Tutulmayan taahhüt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sector}>
                <td>{r.sector}</td>
                <td className="qd-right qd-num">{r.firms}</td>
                <td className="qd-right qd-num">{money(r.exposure)}</td>
                <td className="qd-right qd-num">{r.avgDelay} gün</td>
                <td className="qd-right qd-num" style={{ color: r.avgDelayChange > 2 ? "var(--qd-bad)" : undefined }}>{r.avgDelayChange > 0 ? "+" : ""}{r.avgDelayChange} gün</td>
                <td className="qd-right qd-num">%{Math.round(r.highRiskShare * 100)}</td>
                <td className="qd-right qd-num">{r.brokenCommitments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Signals({ firms, date, onFirm }: { firms: Firm[]; date: string; onFirm: (f: Firm) => void }) {
  const [type, setType] = useState("risk");
  const rows = firms
    .flatMap((f) => f.signals.filter((s) => s.date <= date).map((s) => ({ f, s })))
    .filter(({ s }) => (type === "risk" ? s.type === "stress" || s.type === "deferral" : type === "all" ? true : s.type === type))
    .sort((a, b) => b.s.date.localeCompare(a.s.date))
    .slice(0, 80);
  return (
    <>
      <div className="qd-toolbar">
        <select className="qd-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="İşaret türü">
          <option value="risk">Sıkıntı ve erteleme</option>
          <option value="promise">Ödeme sözleri</option>
          <option value="positive">Olumlu</option>
          <option value="all">Tümü</option>
        </select>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>Her içgörünün yanında kaynak mesaj durur; ajan yorum değil alıntı gösterir.</span>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Firma</th>
              <th>İçgörü</th>
              <th>Kaynak mesaj</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ f, s }) => (
              <tr key={s.id} data-clickable onClick={() => onFirm(f)}>
                <td className="qd-num">{formatDateTr(s.date)}</td>
                <td>{f.name}<div style={{ color: "var(--qd-muted)", fontSize: 11.5 }}>{f.sector}</div></td>
                <td><span className={`qd-pill ${SIGNAL_LABEL[s.type][1]}`}>{SIGNAL_LABEL[s.type][0]}</span></td>
                <td style={{ maxWidth: 360 }}>“{s.text}”</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Commitments({ rows, date, onFirm }: { rows: Array<{ f: Firm; c: Firm["commitments"][number]; s: ReturnType<typeof commitmentStatus> }>; date: string; onFirm: (f: Firm) => void }) {
  const [filter, setFilter] = useState("open");
  const list = rows
    .filter((x) => (filter === "open" ? x.s === "upcoming" || x.s === "broken" : filter === "all" ? true : x.s === filter))
    .sort((a, b) => Math.abs(Date.parse(a.c.date) - Date.parse(date)) - Math.abs(Date.parse(b.c.date) - Date.parse(date)))
    .slice(0, 80);
  return (
    <>
      <div className="qd-toolbar">
        <select className="qd-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Durum">
          <option value="open">Yaklaşan ve tutulmayan</option>
          <option value="kept">Tutulan</option>
          <option value="late">Gecikmeli</option>
          <option value="all">Tümü</option>
        </select>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Firma</th>
              <th>Tür</th>
              <th className="qd-right">Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ f, c, s }) => (
              <tr key={c.id} data-clickable onClick={() => onFirm(f)}>
                <td className="qd-num">{formatDateTr(c.date)}</td>
                <td>{f.name}</td>
                <td>{c.kind === "restructuring" ? "Yapılandırma taksiti" : "Ödeme sözü"}</td>
                <td className="qd-right qd-num">{money(c.amount)}</td>
                <td><span className={`qd-pill ${STATUS_LABEL[s][1]}`}>{STATUS_LABEL[s][0]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FirmSheet({ firm, date, onClose }: { firm: Firm | null; date: string; onClose: () => void }) {
  const mounted = useMounted();
  const risk = firm ? firmRisk(firm, date) : null;
  const close = useCallback((o: boolean) => (!o ? onClose() : undefined), [onClose]);
  return (
    <Sheet open={firm !== null} onOpenChange={close}>
      <SheetContent className="qd-sheet qd">
        {firm && risk ? (
          <>
            <SheetHeader>
              <SheetTitle>{firm.name}</SheetTitle>
              <SheetDescription>{firm.sector} · {firm.city} · kredi {money(firm.loanAmount)} · {formatDateTr(date)} itibarıyla</SheetDescription>
            </SheetHeader>
            <div className="qd-stat-row">
              <div className="qd-stat"><span>Risk skoru</span><b className="qd-num">{risk.score} · {LEVEL[risk.level][0]}</b></div>
              <div className="qd-stat"><span>Müşterilerinden tahsil</span><b className="qd-num">{risk.delayNow} gün</b></div>
              <div className="qd-stat"><span>En büyük müşteri payı</span><b className="qd-num">%{Math.round(firm.topCustomerShare * 100)}</b></div>
            </div>
            <span className="qd-eyebrow">Skoru oluşturan etkenler</span>
            <div style={{ marginTop: 6 }}>
              {risk.factors.map((f) => (
                <div key={f.label} className="qd-factor">
                  <span>{f.label}</span>
                  <div className={`qd-bar${f.points < 0 ? " qd-bar--good" : ""}`}><i style={{ width: `${Math.min(100, Math.abs(f.points) * 2.5)}%` }} /></div>
                  <b className="qd-num">{f.points > 0 ? "+" : ""}{f.points}</b>
                </div>
              ))}
              {!risk.factors.length ? <p style={{ color: "var(--qd-muted)" }}>Belirgin risk etkeni yok.</p> : null}
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="qd-eyebrow">Firmanın kendi müşterilerinden tahsil süresi (gün)</span>
              <div style={{ height: 140 }}>
                {mounted ? (
                  <ResponsiveContainer>
                    <LineChart data={firm.receivableDelay.filter((d) => d.month <= date).map((d) => ({ m: formatDateTr(d.month).replace(/^1 /, ""), days: d.days }))}>
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#66766a" }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis hide domain={[0, "auto"]} />
                      <Tooltip formatter={(v: number) => `${v} gün`} />
                      <ReferenceLine y={30} stroke="#e7b2a5" strokeDasharray="4 4" />
                      <Line dataKey="days" stroke="#203b30" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
            {firm.commitments.length ? (
              <div style={{ marginTop: 12 }}>
                <span className="qd-eyebrow">Taahhütler</span>
                {firm.commitments.map((c) => {
                  const s = commitmentStatus(c, date);
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderBottom: "1px solid #e6ebe0", fontSize: 13 }}>
                      <span className="qd-num">{formatDateTr(c.date)}</span>
                      <span>{c.kind === "restructuring" ? "Yapılandırma" : "Ödeme sözü"}</span>
                      <b className="qd-num">{money(c.amount)}</b>
                      <span className={`qd-pill ${STATUS_LABEL[s][1]}`}>{STATUS_LABEL[s][0]}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {firm.signals.some((s) => s.date <= date) ? (
              <div style={{ marginTop: 14 }}>
                <span className="qd-eyebrow">WhatsApp (kaynak mesajlar)</span>
                <div className="qd-chat" style={{ marginTop: 6 }}>
                  {firm.signals.filter((s) => s.date <= date).map((s) => (
                    <div key={s.id} className="qd-bubble">
                      {s.text}
                      <small>{formatDateTr(s.date)} · {SIGNAL_LABEL[s.type][0]}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
