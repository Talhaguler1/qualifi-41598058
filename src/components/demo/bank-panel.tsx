import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Bot, Phone, PhoneCall, Sparkles, ShieldAlert, PieChart, MessageCircle, CalendarClock, FileCheck2 } from "lucide-react";
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
  otherBanksSummary,
  suggestProduct,
  isEnglish,
  L,
  pick,
  pct,
  count,
  days,
  sectorName,
  messageText,
  type AgentStep,
  type BankBriefing,
  type DemoDate,
  type Firm,
} from "@/lib/demo";
import { trackDemo, type DemoAction } from "@/lib/demo/track";
import { ShareSummaryView } from "./share-view";
import { MaskedPreview, OfferForm, ProductIdea } from "./banks-view";
import { AgentHero, FocusSheet, StoryGrid, useStoryFocus, type StoryCard } from "./home";
import { AnimatedNumber, SHARE_KEY, TopBar, useLocalState, useMounted } from "./shared";

type Story = "calls" | "portfolio" | "sectors" | "signals" | "commitments" | "shared";
const STATUS_LABEL = { kept: [["Tutuldu", "Kept"], "qd-pill--good"], late: [["Gecikmeli", "Late"], "qd-pill--warn"], broken: [["Tutulmadı", "Broken"], "qd-pill--bad"], upcoming: [["Yaklaşıyor", "Upcoming"], "qd-pill--muted"] } as const;
const SIGNAL_LABEL = { promise: [["Ödeme sözü", "Payment promise"], "qd-pill--muted"], deferral: [["Erteleme talebi", "Deferral request"], "qd-pill--warn"], stress: [["Nakit sıkıntısı", "Cash stress"], "qd-pill--bad"], positive: [["Olumlu", "Positive"], "qd-pill--good"] } as const;
const LEVEL = { high: [["Yüksek", "High"], "qd-pill--bad"], medium: [["Orta", "Medium"], "qd-pill--warn"], low: [["Düşük", "Low"], "qd-pill--good"] } as const;

export function BankPanel({ region, banker, date, onDate, onBanker, sharedTenant: sharedFromUrl, accountSlot, lockBanker }: { region: string; banker: string; date: DemoDate; onDate: (d: DemoDate) => void; onBanker: (b: string) => void; sharedTenant?: string | undefined; accountSlot?: ReactNode; lockBanker?: boolean }) {
  // A scorecard shared from the business panel arrives either in the URL or through this browser's storage.
  const [stored] = useLocalState<{ tenant: string } | null>(SHARE_KEY, null);
  const sharedTenant = sharedFromUrl ?? stored?.tenant;
  const firms = useMemo(() => (banker === "all" ? generateRegion(region) : generatePortfolio(region, banker)), [region, banker]);
  const prevDate = DEMO_DATES[DEMO_DATES.indexOf(date) - 1] ?? addDays(date, -14);
  const risks = useMemo(() => new Map(firms.map((f) => [f.id, firmRisk(f, date)])), [firms, date]);
  const briefing = useMemo(() => bankBriefing(firms, date, prevDate), [firms, date, prevDate]);
  const sectors = useMemo(() => sectorAnalysis(firms, date), [firms, date]);
  const [firm, setFirm] = useState<Firm | null>(null);
  const log = (action: DemoAction, target?: string) => trackDemo({ panel: "bank", tenant: banker, demo_date: date, action, target: target ?? null });
  const story = useStoryFocus(sharedFromUrl ? "shared" : null, (key) => log("tab_open", `card-${key}`));
  const openFirm = (f: Firm) => {
    log("firm_open", f.id);
    setFirm(f);
  };

  const high = firms.filter((f) => risks.get(f.id)?.level === "high");
  const allCommitments = firms.flatMap((f) => f.commitments.map((c) => ({ f, c, s: commitmentStatus(c, date) })));
  const broken = allCommitments.filter((x) => x.s === "broken");
  // Same windows as the agent's briefing, so the hero and the cards never disagree.
  const upcoming = allCommitments.filter((x) => x.c.date > date && x.c.date <= addDays(date, 7));
  const brokenNow = broken.filter((x) => x.c.date > prevDate);
  const newSignals = firms.flatMap((f) => f.signals.filter((s) => s.date > prevDate && s.date <= date));
  const newStress = newSignals.filter((s) => s.type === "stress" || s.type === "deferral");
  const stressFirms = firms.filter((f) => f.signals.some((s) => s.date > prevDate && s.date <= date && (s.type === "stress" || s.type === "deferral"))).length;
  const topSector = sectors[0];
  const totalLoans = firms.reduce((s, f) => s + f.loanAmount, 0);
  const highLoans = high.reduce((s, f) => s + f.loanAmount, 0);

  const steps: AgentStep[] = [
    { id: "p", tool: "karne", title: L(`${count(firms.length)} firmanın tahsilat verisi tarandı`, `Scanned collection data for ${count(firms.length)} firms`), detail: L(`Firmaların kendi müşterilerinden tahsil süreleri ${formatDateTr(date)} itibarıyla güncellendi.`, `Updated how fast each firm collects from its own customers, as of ${formatDateTr(date)}.`) },
    { id: "w", tool: "whatsapp", title: L("WhatsApp yazışmaları okundu", "Read WhatsApp messages"), detail: L(`${newSignals.length} yeni işaret: ${newStress.length} sıkıntı/erteleme, ${newSignals.filter((s) => s.type === "promise").length} ödeme sözü.`, `${newSignals.length} new signals: ${newStress.length} stress/deferral, ${newSignals.filter((s) => s.type === "promise").length} payment promises.`) },
    { id: "t", tool: "takip", title: L("Taahhütler kontrol edildi", "Checked commitments"), detail: L(`${brokenNow.length} yeni tutulmayan, önümüzdeki 7 günde ${upcoming.length} taahhüt.`, `${brokenNow.length} newly broken; ${upcoming.length} due in the next 7 days.`) },
    { id: "s", tool: "tahmin", title: L("Sektör analizi yenilendi", "Refreshed the sector analysis"), detail: `${L("En riskli sektör", "Riskiest sector")}: ${sectorName(topSector?.sector ?? "—")}.` },
    { id: "c", tool: "banka", title: L("Bugünün arama listesi hazır", "Today's call list is ready"), detail: L(`${briefing.callList.length} firma; gerekçeleriyle birlikte.`, `${briefing.callList.length} firms, each with its reason.`) },
  ];

  const cards: StoryCard[] = [
    {
      key: "calls",
      icon: <PhoneCall size={15} />,
      eyebrow: L("Bugün aranacaklar", "Calls for today"),
      value: L(`${briefing.callList.length} firma`, `${briefing.callList.length} firms`),
      text: briefing.callList[0]
        ? L(`Önce ${briefing.callList[0].firm.name}: ${briefing.callList[0].reason.toLocaleLowerCase("tr")}.`, `First ${briefing.callList[0].firm.name}: ${briefing.callList[0].reason.toLowerCase()}.`)
        : L("Bugün aranması gereken firma yok.", "No firm needs a call today."),
      ...(briefing.callList.length ? { tone: "alert" as const } : {}),
    },
    {
      key: "portfolio",
      icon: <ShieldAlert size={15} />,
      eyebrow: L("Portföy riski", "Portfolio risk"),
      value: L(`${high.length} yüksek riskli`, `${high.length} high risk`),
      text: L(`${count(firms.length)} firmadan; ${money(highLoans)} kredi (toplam ${money(totalLoans)}). Her skorun gerekçesi görünür.`, `Out of ${count(firms.length)} firms; ${money(highLoans)} in loans (of ${money(totalLoans)}). Every score shows its reasons.`),
    },
    {
      key: "sectors",
      icon: <PieChart size={15} />,
      eyebrow: L("Sektör analizi", "Sector analysis"),
      value: topSector ? sectorName(topSector.sector) : "—",
      text: topSector
        ? L(`En riskli sektör: firmaların ${pct(Math.round(topSector.highRiskShare * 100))}'i yüksek riskte, tahsil süresi 3 ayda ${topSector.avgDelayChange > 0 ? "+" : ""}${topSector.avgDelayChange.toLocaleString("tr-TR")} gün.`, `Riskiest sector: ${pct(Math.round(topSector.highRiskShare * 100))} of firms are high risk; collection time ${topSector.avgDelayChange > 0 ? "+" : ""}${topSector.avgDelayChange} days in 3 months.`)
        : "",
    },
    {
      key: "signals",
      icon: <MessageCircle size={15} />,
      eyebrow: L("WhatsApp içgörüleri", "WhatsApp insights"),
      value: L(`${stressFirms} firma`, `${stressFirms} firms`),
      text: L(`Son 2 haftada ${newStress.length} nakit sıkıntısı veya erteleme mesajı. Her içgörünün yanında kaynak mesaj durur.`, `${newStress.length} cash-stress or deferral messages in the last 2 weeks. Every insight sits next to its source message.`),
      ...(stressFirms ? { tone: "alert" as const } : {}),
    },
    {
      key: "commitments",
      icon: <CalendarClock size={15} />,
      eyebrow: L("Taahhüt takibi", "Commitment tracking"),
      value: L(`${brokenNow.length} tutulmadı`, `${brokenNow.length} broken`),
      text: L(`Son 2 haftada. ${upcoming.length} taahhüdün vadesi önümüzdeki 7 günde.`, `In the last 2 weeks. ${upcoming.length} commitments fall due in the next 7 days.`),
    },
    {
      key: "shared",
      icon: <FileCheck2 size={15} />,
      eyebrow: L("İşletmenin paylaştığı karne", "Scorecard shared by a business"),
      value: sharedTenant ? L("1 yeni karne", "1 new scorecard") : L("Paylaşım yok", "No shares yet"),
      text: sharedTenant
        ? L("Bir işletme kendi ödeme karnesini onayıyla gönderdi. Limit görüşmesi için hazır özet.", "A business sent its own payment scorecard with consent. A ready summary for a credit-limit talk.")
        : L("İşletmeler 'Karnemi bankama göster' ile özet gönderdiğinde burada görünür.", "When a business uses 'Show my scorecard to my bank', the summary appears here."),
      tone: "accent",
    },
  ];
  const titles: Record<Story, string> = {
    calls: L("Bugün aranacaklar", "Calls for today"),
    portfolio: L("Portföy", "Portfolio"),
    sectors: L("Sektör analizi", "Sector analysis"),
    signals: L("WhatsApp içgörüleri", "WhatsApp insights"),
    commitments: L("Taahhüt takibi", "Commitment tracking"),
    shared: L("İşletmenin paylaştığı karne", "Scorecard shared by a business"),
  };
  const open = story.open as Story | null;
  const shown = story.last as Story | null;

  return (
    <div className="qd">
      <TopBar langSwitch title={L(`${region} · Müşteri ilişkileri`, `${region} · Relationship management`)} subtitle={banker === "all" ? L(`Birim yöneticisi görünümü · ${BANKERS_PER_REGION} uzman`, `Unit manager view · ${BANKERS_PER_REGION} specialists`) : L(`Uzman ${banker} · ${firms.length} firma`, `Specialist ${banker} · ${firms.length} firms`)} date={date} onDate={(d) => { log("date_change", d); onDate(d); }}>
        {accountSlot}
        {lockBanker ? null : (
        <select className="qd-select" value={banker} onChange={(e) => onBanker(e.target.value)} aria-label={L("Uzman", "Specialist")}>
          <option value="all">{L("Birimin tamamı (6.000 firma)", "Whole unit (6,000 firms)")}</option>
          {Array.from({ length: BANKERS_PER_REGION }, (_, i) => String(i + 1).padStart(2, "0")).map((b) => (
            <option key={b} value={b}>
              {L(`Uzman ${b} · 300 firma`, `Specialist ${b} · 300 firms`)}
            </option>
          ))}
        </select>
        )}
      </TopBar>
      <main className="qd-home">
        <AgentHero
          title={L("QualiFi bankacı asistanı", "QualiFi banker assistant")}
          note={L("Yapay zekâ yalnız maskeli veri görür", "The AI only sees masked data")}
          headline={briefing.headline}
          tone={high.length > firms.length * 0.15 ? "alert" : "watch"}
          points={[]}
          runKey={`${banker}-${date}`}
          steps={steps}
          stats={[
            { label: L("Yüksek risk", "High risk"), value: <AnimatedNumber value={high.length} format={count} />, sub: `${money(highLoans)} ${L("kredi", "in loans")}` },
          ]}
        />

        <StoryGrid cards={cards} open={open} onToggle={story.toggle} />

        <FocusSheet open={open !== null} title={shown ? titles[shown] : ""} onClose={story.close}>
            {shown === "calls" ? <CallList briefing={briefing} date={date} onFirm={openFirm} /> : null}
            {shown === "portfolio" ? <section className="qd-card"><Portfolio firms={firms} risks={risks} onFirm={openFirm} /></section> : null}
            {shown === "sectors" ? <section className="qd-card"><Sectors firms={firms} date={date} /></section> : null}
            {shown === "signals" ? <section className="qd-card"><Signals firms={firms} date={date} onFirm={openFirm} /></section> : null}
            {shown === "commitments" ? <section className="qd-card"><Commitments rows={allCommitments} date={date} onFirm={openFirm} /></section> : null}
            {shown === "shared" ? (
              sharedTenant ? (
                <SharedCard tenant={sharedTenant} date={date} />
              ) : (
                <section className="qd-card">
                  <p style={{ color: "var(--qd-muted)" }}>
                    {L(
                      "Banka işletmeyi izlemez; işletme iyi ödeme karnesini kendisi getirir. İşletme panelinde 'Karnemi bankama göster' düğmesine basıldığında özet burada belirir.",
                      "The bank does not watch the business; the business brings its good scorecard itself. When 'Show my scorecard to my bank' is pressed in the business panel, the summary appears here.",
                    )}
                  </p>
                  <a className="qd-btn qd-btn--primary qd-btn--sm" style={{ marginTop: 12 }} href={`/demo/isletme?t=017&d=${date}${isEnglish() ? "&l=en" : ""}`}>
                    {L("İşletme panelinden dene", "Try it from the business panel")}
                  </a>
                </section>
              )
            ) : null}
        </FocusSheet>
      </main>
      <FirmSheet firm={firm} date={date} onClose={() => setFirm(null)} />
    </div>
  );
}

function CallList({ briefing, date, onFirm }: { briefing: BankBriefing; date: string; onFirm: (f: Firm) => void }) {
  return (
    <section className="qd-card">
      <div className="qd-card__head">
        <h2>{L("Bugün aranacaklar", "Calls for today")}</h2>
        <p>{L("Riski en çok artandan başlayarak; her firmaya önerilecek ürünle", "Biggest risk increase first, each with a product to offer")}</p>
      </div>
      <div className="qd-actions">
        {briefing.callList.map((c, i) => (
          <article key={c.firm.id} className="qd-action qd-enter" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="qd-action__top">
              <div>
                <div className="qd-action__name">{c.firm.name}</div>
                <div className="qd-action__reason">{c.reason}</div>
                <span className="qd-pill qd-pill--idea" style={{ marginTop: 6 }}>
                  <Sparkles size={12} strokeWidth={1.75} /> {suggestProduct(c.firm, date).title}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`qd-pill ${c.score >= 60 ? "qd-pill--bad" : "qd-pill--warn"}`}>{L("Skor", "Score")} {c.score}</span>
                {c.change > 0 ? <div className="qd-num" style={{ color: "var(--qd-bad)", fontSize: 12, marginTop: 4 }}>+{c.change} {L("puan", "pts")}</div> : null}
              </div>
            </div>
            <div className="qd-action__buttons">
              <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" onClick={() => onFirm(c.firm)}>
                <Bot size={13} /> {L("Firma kartı", "Firm card")}
              </button>
              <span className="qd-pill qd-pill--muted"><Phone size={12} /> {c.firm.city}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SharedCard({ tenant, date }: { tenant: string; date: string }) {
  const summary = useMemo(() => bankShareSummary(generateBusiness(tenant), date), [tenant, date]);
  const others = useMemo(() => otherBanksSummary(tenant, date), [tenant, date]);
  return (
    <section className="qd-card qd-enter" style={{ borderColor: "#b6dbb8" }}>
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">{L("İşletmenin paylaştığı ödeme karnesi · yeni", "Payment scorecard shared by the business · new")}</span>
          <h2>{summary.company.name}</h2>
          <p>{sectorName(summary.company.sector)} · {summary.company.city} · {L(`${formatDateTr(date)} itibarıyla, işletmenin kendi onayıyla`, `as of ${formatDateTr(date)}, with the business's own consent`)}</p>
        </div>
        <span className="qd-pill qd-pill--good">{L("İşletme paylaştı · demo", "Shared by the business · demo")}</span>
      </div>
      <ShareSummaryView summary={summary} audience="bank" />
      <p className="qd-other-banks">
        {L(
          `Diğer bankalar (işletmenin izniyle, toplam): ${others.banks} bankada ${money(others.creditUsed)} kredi${others.nextDue ? `, en yakın vade ${formatDateTr(others.nextDue)}` : ""}. Ürün ayrıntısı paylaşılmaz.`,
          `Other banks (with the business's consent, totals only): ${money(others.creditUsed)} of credit at ${others.banks} banks${others.nextDue ? `, next due ${formatDateTr(others.nextDue)}` : ""}. No product details are shared.`,
        )}
      </p>
      <OfferForm company={summary.company.name} onSent={() => undefined} />
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
        <input className="qd-input" placeholder={L("Firma ara", "Search firms")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={L("Firma ara", "Search firms")} />
        <select className="qd-select" value={sector} onChange={(e) => setSector(e.target.value)} aria-label={L("Sektör", "Sector")}>
          <option value="all">{L("Tüm sektörler", "All sectors")}</option>
          {BANK_SECTORS.map((s) => (
            <option key={s.name} value={s.name}>{sectorName(s.name)}</option>
          ))}
        </select>
        <select className="qd-select" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Risk">
          <option value="all">{L("Tüm risk seviyeleri", "All risk levels")}</option>
          <option value="high">{L("Yüksek", "High")}</option>
          <option value="medium">{L("Orta", "Medium")}</option>
          <option value="low">{L("Düşük", "Low")}</option>
        </select>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{count(rows.length)} {L("firma", "firms")}</span>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 560, overflowY: "auto" }}>
        <table className="qd-table">
          <thead>
            <tr>
              <th>{L("Firma", "Firm")}</th>
              <th>{L("Sektör", "Sector")}</th>
              <th className="qd-right">{L("Kredi", "Loan")}</th>
              <th>Risk</th>
              <th className="qd-right">{L("Tahsil süresi", "Collection time")}</th>
              <th>{L("En büyük etken", "Main factor")}</th>
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
                    <div style={{ color: "var(--qd-muted)", fontSize: 12 }}>{f.id} · {f.city}</div>
                  </td>
                  <td>{sectorName(f.sector)}</td>
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
                    {days(r.delayNow)} {r.delayChange > 0 ? <span className="qd-pill qd-pill--bad">+{r.delayChange}</span> : null}
                  </td>
                  <td style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{top?.label ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 120 ? <p style={{ color: "var(--qd-muted)", fontSize: 12, padding: 8 }}>{L("En riskli 120 firma gösteriliyor; filtreyle daraltın.", "Showing the 120 riskiest firms; use the filters to narrow down.")}</p> : null}
      </div>
    </>
  );
}

function Sectors({ firms, date }: { firms: Firm[]; date: string }) {
  const mounted = useMounted();
  const rows = useMemo(() => sectorAnalysis(firms, date), [firms, date]);
  const data = rows.map((r) => ({ sector: sectorName(r.sector), high: Math.round(r.highRiskShare * 100), change: r.avgDelayChange }));
  return (
    <>
      <p style={{ color: "var(--qd-muted)", marginBottom: 8 }}>{L("Yüksek riskli firma oranı (%) — sektörlere göre, en riskliden başlayarak", "Share of high-risk firms (%) by sector, riskiest first")}</p>
      <div style={{ height: 260 }}>
        {mounted ? (
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="#eef1ea" />
              <XAxis type="number" tickFormatter={(v: number) => pct(v)} tick={{ fontSize: 12, fill: "#66766a" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 12, fill: "#203b30" }} width={130} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => pct(v)} />
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
              <th>{L("Sektör", "Sector")}</th>
              <th className="qd-right">{L("Firma", "Firms")}</th>
              <th className="qd-right">{L("Kredi", "Loans")}</th>
              <th className="qd-right">{L("Ort. tahsil süresi", "Avg. collection time")}</th>
              <th className="qd-right">{L("3 ayda değişim", "3-month change")}</th>
              <th className="qd-right">{L("Yüksek risk", "High risk")}</th>
              <th className="qd-right">{L("Tutulmayan taahhüt", "Broken commitments")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sector}>
                <td>{sectorName(r.sector)}</td>
                <td className="qd-right qd-num">{r.firms}</td>
                <td className="qd-right qd-num">{money(r.exposure)}</td>
                <td className="qd-right qd-num">{days(r.avgDelay)}</td>
                <td className="qd-right qd-num" style={{ color: r.avgDelayChange > 2 ? "var(--qd-bad)" : undefined }}>{r.avgDelayChange > 0 ? "+" : ""}{days(r.avgDelayChange)}</td>
                <td className="qd-right qd-num">{pct(Math.round(r.highRiskShare * 100))}</td>
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
        <select className="qd-select" value={type} onChange={(e) => setType(e.target.value)} aria-label={L("İşaret türü", "Signal type")}>
          <option value="risk">{L("Sıkıntı ve erteleme", "Stress and deferral")}</option>
          <option value="promise">{L("Ödeme sözleri", "Payment promises")}</option>
          <option value="positive">{L("Olumlu", "Positive")}</option>
          <option value="all">{L("Tümü", "All")}</option>
        </select>
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{L("Her içgörünün yanında kaynak mesaj durur; ajan yorum değil alıntı gösterir.", "Every insight sits next to its source message; the agent quotes rather than interprets.")}</span>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>{L("Tarih", "Date")}</th>
              <th>{L("Firma", "Firm")}</th>
              <th>{L("İçgörü", "Insight")}</th>
              <th>{L("Kaynak mesaj", "Source message")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ f, s }) => (
              <tr key={s.id} data-clickable onClick={() => onFirm(f)}>
                <td className="qd-num">{formatDateTr(s.date)}</td>
                <td>{f.name}<div style={{ color: "var(--qd-muted)", fontSize: 12 }}>{sectorName(f.sector)}</div></td>
                <td><span className={`qd-pill ${SIGNAL_LABEL[s.type][1]}`}>{pick(SIGNAL_LABEL[s.type][0])}</span></td>
                <td style={{ maxWidth: 360 }}>“{messageText(s.text)}”</td>
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
        <select className="qd-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={L("Durum", "Status")}>
          <option value="open">{L("Yaklaşan ve tutulmayan", "Upcoming and broken")}</option>
          <option value="kept">{L("Tutulan", "Kept")}</option>
          <option value="late">{L("Gecikmeli", "Late")}</option>
          <option value="all">{L("Tümü", "All")}</option>
        </select>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>{L("Tarih", "Date")}</th>
              <th>{L("Firma", "Firm")}</th>
              <th>{L("Tür", "Type")}</th>
              <th className="qd-right">{L("Tutar", "Amount")}</th>
              <th>{L("Durum", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ f, c, s }) => (
              <tr key={c.id} data-clickable onClick={() => onFirm(f)}>
                <td className="qd-num">{formatDateTr(c.date)}</td>
                <td>{f.name}</td>
                <td>{c.kind === "restructuring" ? L("Yapılandırma taksiti", "Restructuring instalment") : L("Ödeme sözü", "Payment promise")}</td>
                <td className="qd-right qd-num">{money(c.amount)}</td>
                <td><span className={`qd-pill ${STATUS_LABEL[s][1]}`}>{pick(STATUS_LABEL[s][0])}</span></td>
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
              <SheetDescription>{sectorName(firm.sector)} · {firm.city} · {L("kredi", "loan")} {money(firm.loanAmount)} · {L(`${formatDateTr(date)} itibarıyla`, `as of ${formatDateTr(date)}`)}</SheetDescription>
            </SheetHeader>
            <div className="qd-stat-row">
              <div className="qd-stat"><span>{L("Risk skoru", "Risk score")}</span><b className="qd-num">{risk.score} · {pick(LEVEL[risk.level][0])}</b></div>
              <div className="qd-stat"><span>{L("Müşterilerinden tahsil", "Collects from customers in")}</span><b className="qd-num">{days(risk.delayNow)}</b></div>
              <div className="qd-stat"><span>{L("En büyük müşteri payı", "Largest customer share")}</span><b className="qd-num">{pct(Math.round(firm.topCustomerShare * 100))}</b></div>
            </div>
            <ProductIdea firm={firm} date={date} />
            <span className="qd-eyebrow">{L("Skoru oluşturan etkenler", "What drives the score")}</span>
            <div style={{ marginTop: 6 }}>
              {risk.factors.map((f) => (
                <div key={f.label} className="qd-factor">
                  <span>{f.label}</span>
                  <div className={`qd-bar${f.points < 0 ? " qd-bar--good" : ""}`}><i style={{ width: `${Math.min(100, Math.abs(f.points) * 2.5)}%` }} /></div>
                  <b className="qd-num">{f.points > 0 ? "+" : ""}{f.points}</b>
                </div>
              ))}
              {!risk.factors.length ? <p style={{ color: "var(--qd-muted)" }}>{L("Belirgin risk etkeni yok.", "No notable risk factors.")}</p> : null}
            </div>
            <MaskedPreview firm={firm} date={date} />
            <div style={{ marginTop: 14 }}>
              <span className="qd-eyebrow">{L("Firmanın kendi müşterilerinden tahsil süresi (gün)", "How fast the firm collects from its own customers (days)")}</span>
              <div style={{ height: 140 }}>
                {mounted ? (
                  <ResponsiveContainer>
                    <LineChart data={firm.receivableDelay.filter((d) => d.month <= date).map((d) => ({ m: formatDateTr(d.month).replace(/^1 /, ""), days: d.days }))}>
                      <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#66766a" }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis hide domain={[0, "auto"]} />
                      <Tooltip formatter={(v: number) => days(v)} />
                      <ReferenceLine y={30} stroke="#e7b2a5" strokeDasharray="4 4" />
                      <Line dataKey="days" stroke="#203b30" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
            {firm.commitments.length ? (
              <div style={{ marginTop: 12 }}>
                <span className="qd-eyebrow">{L("Taahhütler", "Commitments")}</span>
                {firm.commitments.map((c) => {
                  const s = commitmentStatus(c, date);
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderBottom: "1px solid #e6ebe0", fontSize: 13 }}>
                      <span className="qd-num">{formatDateTr(c.date)}</span>
                      <span>{c.kind === "restructuring" ? L("Yapılandırma", "Restructuring") : L("Ödeme sözü", "Payment promise")}</span>
                      <b className="qd-num">{money(c.amount)}</b>
                      <span className={`qd-pill ${STATUS_LABEL[s][1]}`}>{pick(STATUS_LABEL[s][0])}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {firm.signals.some((s) => s.date <= date) ? (
              <div style={{ marginTop: 14 }}>
                <span className="qd-eyebrow">{L("WhatsApp (kaynak mesajlar)", "WhatsApp (source messages)")}</span>
                <div className="qd-chat" style={{ marginTop: 6 }}>
                  {firm.signals.filter((s) => s.date <= date).map((s) => (
                    <div key={s.id} className="qd-bubble">
                      {messageText(s.text)}
                      <small>{formatDateTr(s.date)} · {pick(SIGNAL_LABEL[s.type][0])}</small>
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
