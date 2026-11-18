import { track, trackCustom } from "@/lib/tracking";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, Bar, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, BarChart } from "recharts";
import { Building2, Calculator, Landmark, MessageCircle, FileText, ArrowUpRight, ArrowDownRight, TrendingUp, Handshake, BellRing, UserCheck, Target, Share2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  addDays,
  agentActions,
  agentRun,
  askAgent,
  businessBriefing,
  currentBalance,
  DEMO_DATES,
  diffDays,
  expectedInflows,
  forecastAccuracy,
  formatDateTr,
  generateBusiness,
  money,
  payerProfile,
  scenarioGap,
  defaultProject,
  withProject,
  type ProjectPlan,
  scorecard,
  bankShareSummary,
  snapshot,
  suggestedQuestions,
  L,
  pick,
  pct,
  days as dayCount,
  sectorName,
  messageText,
  labelText,
  isEnglish,
  tightestWeek,
  weeklyForecast,
  explainEvent,
  forecastWithEvents,
  readChatMessage,
  bankTotals,
  businessBankProducts,
  type OfferFromBank,
  pivotalCustomer,
  type ChatEvent,
  type EventOutcome,
  whatIfLate,
  type Customer,
  type DemoDate,
  type PayerProfile,
} from "@/lib/demo";
import { trackDemo, type DemoAction } from "@/lib/demo/track";
import { ActionQueue, AskAgent } from "./agent-panel";
import { ShareSummaryView } from "./share-view";
import { featuredPromise, PromisePlanCard } from "./promise-plan";
import { LiveUpdate, MessageComposer } from "./live-update";
import { BanksView } from "./banks-view";
import { AgentHero, FocusSheet, StoryGrid, useStoryFocus, type StoryCard } from "./home";
import { AnimatedNumber, Grade, OFFERS_KEY, SHARE_KEY, SourceChip, Tabs, Toast, TopBar, useLocalState, useMounted } from "./shared";

type Tab = "inflows" | "customers" | "whatsapp" | "sources";
type Story = "cash" | "promise" | "actions" | "customers" | "scorecard" | "banks";
const DOC_LABEL = {
  invoice: ["Fatura", "Invoice"],
  contract_installment: ["Sözleşme taksiti", "Contract instalment"],
  cheque: ["Çek", "Cheque"],
  note: ["Senet", "Promissory note"],
} as const;

export function BusinessPanel({ tenant, date, onDate, accountSlot }: { tenant: string; date: DemoDate; onDate: (d: DemoDate) => void; accountSlot?: ReactNode }) {
  const dataset = useMemo(() => generateBusiness(tenant), [tenant]);
  const snap = useMemo(() => snapshot(dataset, date), [dataset, date]);
  const prevDate = DEMO_DATES[DEMO_DATES.indexOf(date) - 1];
  // Customer messages processed in this session move dates; every number below follows them.
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [outcome, setOutcome] = useState<EventOutcome | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  useEffect(() => {
    setEvents([]);
    setOutcome(null);
    setLiveOpen(false);
  }, [tenant, date]);
  const weeks = useMemo(() => forecastWithEvents(snap, events), [snap, events]);
  const briefing = useMemo(() => businessBriefing(snap, weeks), [snap, weeks]);
  const inflows = useMemo(() => expectedInflows(snap), [snap]);
  const actions = useMemo(() => agentActions(snap, 8), [snap]);
  const steps = useMemo(() => agentRun(dataset, date, prevDate ?? addDays(date, -14)), [dataset, date, prevDate]);

  const accuracy = useMemo(() => (prevDate ? forecastAccuracy(dataset, prevDate, date) : null), [dataset, prevDate, date]);
  const card = useMemo(() => (prevDate ? scorecard(dataset, prevDate, date) : null), [dataset, prevDate, date]);
  const featured = useMemo(() => featuredPromise(snap), [snap]);

  const [tab, setTab] = useState<Tab>("customers");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const clearToast = useCallback(() => setToast(null), []);
  const log = useCallback(
    (action: DemoAction, target?: string, detail?: string) => trackDemo({ panel: "business", tenant, demo_date: date, action, target: target ?? null, detail: detail ?? null }),
    [tenant, date],
  );
  const story = useStoryFocus(null, (key) => log("tab_open", `card-${key}`));
  useEffect(() => track("ViewContent", { content_name: "business-demo" }), []);
  const changeDate = (d: DemoDate) => {
    log("date_change", d);
    onDate(d);
  };
  const changeTab = (t: Tab) => {
    log("tab_open", t);
    setTab(t);
  };
  const openCustomer = (c: Customer) => {
    log("customer_open", c.id);
    setCustomer(c);
  };
  const openShare = () => {
    log("tab_open", "bank-share");
    setShareOpen(true);
  };

  const balance = currentBalance(snap);
  const tight = tightestWeek(weeks);
  const overdue = inflows.filter((i) => i.receivable.dueDate < date);
  const overdueSum = overdue.reduce((s, i) => s + i.receivable.amount, 0);
  const hit = card ? card.predictions.filter((p) => p.outcome === "on_time" || p.outcome === "early").length : 0;
  const [offers] = useLocalState<OfferFromBank[]>(OFFERS_KEY, []);
  const bankCash = bankTotals(businessBankProducts(tenant, date, balance)).cash;
  // Enough to lift the tightest week's downside back to about ₺1 mn, rounded; at least ₺250k.
  const cashNeed = Math.max(250_000, Math.round((1_000_000 - tight.balanceLow) / 50_000) * 50_000);
  const featuredName = featured ? snap.dataset.customers.find((c) => c.id === featured.r.customerId)?.name : undefined;
  const processMessage = (text: string): EventOutcome | null => {
    const e = readChatMessage(snap, text, `ev-${events.length + 1}`);
    if (!e) return null;
    const out = explainEvent(snap, events, e);
    setEvents((prev) => [...prev, e]);
    setOutcome(out);
    setLiveOpen(true);
    log("scenario_run", "message", `${e.kind}:${e.customer.id}`);
    trackCustom("DemoTried", { kind: e.kind });
    return out;
  };
  const onComposerSend = (text: string): string | null =>
    processMessage(text) ? null : L("Bu mesajda bir ödeme bilgisi bulamadım. Örneğin tarih, erteleme ya da \"ödedik\" içeren bir mesaj deneyin.", "I couldn't find payment information in that message. Try one with a date, a delay or \"we paid\".");
  // Questions that are really customer messages ("Dazen texted: they'll pay 2 weeks later") run the live update.
  const ask = (q: string) => {
    const looksLikeMessage = /whatsapp|mesaj|yazdı|dedi|texted|message|said|wrote|:/i.test(q);
    const out = looksLikeMessage ? processMessage(q) : null;
    if (out) return { intent: "promises" as const, text: out.summary, bullets: out.advice.map((a) => a.title) };
    return askAgent(snap, q);
  };

  const cards: StoryCard[] = [
    {
      key: "cash",
      icon: <TrendingUp size={15} />,
      eyebrow: L("Nakit · 8 hafta", "Cash · 8 weeks"),
      value: money(tight.balanceBase),
      text: L(
        `En dar hafta ${formatDateTr(tight.weekStart)}, en olası bakiye. Kötü senaryoda ${money(tight.balanceLow)}.`,
        `Tightest week ${formatDateTr(tight.weekStart)}, most likely balance. ${money(tight.balanceLow)} in the downside case.`,
      ),
      ...(tight.balanceLow < 0 ? { tone: "alert" as const } : {}),
    },
    {
      key: "promise",
      icon: <Handshake size={15} />,
      eyebrow: L("Sözden ödemeye", "From promise to payment"),
      value: featured ? money(featured.r.amount) : "—",
      text: featured
        ? L(`${featuredName}: “Cuma gönderiyoruz.” Bu sözü planlı ödemeye dönüştürün.`, `${featuredName}: “We'll send it Friday.” Turn that promise into a scheduled payment.`)
        : L("Bu tarihte bekleyen söz yok; 24 Kasım'a geçin.", "No pending promise on this date; switch to 24 November."),
      cta: L("Canlı izle", "Watch it live"),
    },
    {
      key: "actions",
      icon: <BellRing size={15} />,
      eyebrow: L("Bugün takip", "Follow up today"),
      value: L(`${actions.length} müşteri`, `${actions.length} customers`),
      text: L("Ajan mesaj taslaklarını hazırladı; siz onaylamadan hiçbiri gitmez.", "The agent drafted the messages; none goes out until you approve it."),
    },
    {
      key: "customers",
      icon: <UserCheck size={15} />,
      eyebrow: L("Müşteri ödeme karnesi", "Customer payment scorecard"),
      value: money(overdueSum),
      text: L(`Vadesi geçmiş ${overdue.length} fatura. Kim ne zaman öder, WhatsApp sözleri ve kaynak belgeler burada.`, `Overdue across ${overdue.length} invoices. Who pays when, WhatsApp promises and source documents.`),
      ...(overdue.length ? { tone: "alert" as const } : {}),
    },
    {
      key: "scorecard",
      icon: <Target size={15} />,
      eyebrow: L("Ajan ne kadar tuttu?", "How accurate was the agent?"),
      value: card && prevDate ? `${hit} / ${card.predictions.length}` : "—",
      text:
        card && prevDate
          ? L(`${formatDateTr(prevDate)} tarihinde beklenen ödemelerden ${hit} tanesi zamanında geldi. Demo verisi.`, `${hit} of the payments expected on ${formatDateTr(prevDate)} arrived on time. Demo data.`)
          : L(`Önceki tarih yok. ${formatDateTr(DEMO_DATES[1])} tarihine geçin.`, `No earlier date. Switch to ${formatDateTr(DEMO_DATES[1])}.`),
      ...(card && prevDate ? { tone: "good" as const } : {}),
    },
    {
      key: "banks",
      icon: <Landmark size={15} />,
      eyebrow: L("Bankalarım", "My banks"),
      value: money(bankCash),
      text: offers.length
        ? L(`3 bankada toplam nakit (${money(balance)} Banka A'da). Banka A'dan yeni bir teklif var.`, `Total cash at 3 banks (${money(balance)} at Banka A). A new offer from Banka A is waiting.`)
        : L(`3 bankada toplam nakit; ${money(balance)} Banka A ana hesabında. Teklif isteyin, karnenizi paylaşın.`, `Total cash at 3 banks; ${money(balance)} in the main Banka A account. Ask for quotes, share your scorecard.`),
      tone: "accent",
      cta: offers.length ? L("Teklifi gör", "See the offer") : L("Aç", "Open"),
    },
  ];
  const titles: Record<Story, string> = {
    cash: L("Nakit akışı · 8 hafta", "Cash flow · 8 weeks"),
    promise: L("Sözden ödemeye", "From promise to payment"),
    actions: L("Bugün takip", "Follow up today"),
    customers: L("Müşteriler ve belgeler", "Customers and documents"),
    scorecard: L("Tahmin ve söz karnesi", "Forecast and promise scorecard"),
    banks: L("Bankalarım", "My banks"),
  };
  const open = story.open as Story | null;
  const shown = story.last as Story | null;

  return (
    <div className="qd">
      <TopBar langSwitch title={dataset.company.name} subtitle={`${sectorName(dataset.company.sector)} · ${dataset.company.city} · ${dataset.customers.length} ${L("müşteri", "customers")}`} date={date} onDate={changeDate}>
        {accountSlot}
      </TopBar>
      <main className="qd-home">
        <AgentHero
          title={L("QualiFi ajanı", "QualiFi agent")}
          headline={briefing.headline}
          tone={briefing.tone}
          points={[]}
          runKey={`${tenant}-${date}`}
          steps={steps}
          stats={[
            {
              label: L("Bugünkü bakiye", "Balance today"),
              value: <AnimatedNumber value={balance} format={money} />,
              sub: L(`${formatDateTr(date)} · ${dataset.sources.banka}`, `${formatDateTr(date)} · ${dataset.sources.banka}`),
            },
          ]}
        >
          <AskAgent ask={ask} suggestions={suggestedQuestions().slice(0, 4)} resetKey={date} onAsk={(q) => log("agent_question", undefined, q)} />
        </AgentHero>

        <MessageComposer
          customerName={featuredName ?? dataset.customers[0]?.name ?? "Dazen"}
          delayCustomerName={pivotalCustomer(snap)?.name ?? featuredName ?? dataset.customers[0]?.name ?? "Dazen"}
          onSend={onComposerSend}
          processed={events.length}
          onUndo={() => {
            setEvents([]);
            setOutcome(null);
          }}
        />

        <div className="qd-home__sources">
          <span>{L("Bağlı kaynaklar:", "Connected sources:")}</span>
          <SourceChip icon={<Building2 size={12} />} name={dataset.sources.erp} />
          <SourceChip icon={<Calculator size={12} />} name={dataset.sources.onMuhasebe} />
          <SourceChip icon={<Landmark size={12} />} name={dataset.sources.banka} />
          <SourceChip icon={<MessageCircle size={12} />} name="WhatsApp Business" />
        </div>

        <StoryGrid cards={cards} open={open} onToggle={story.toggle} />

        <FocusSheet open={open !== null} title={shown ? titles[shown] : ""} onClose={story.close}>
            {shown === "cash" ? <CashFlowCard snap={snap} weeks={weeks} accuracy={accuracy} prevDate={prevDate} onScenario={(target, detail) => log("scenario_run", target, detail)} /> : null}
            {shown === "promise" ? <PromisePlanCard key={`plan-${date}`} snap={snap} onLog={(step) => log("scenario_run", "promise-plan", step)} /> : null}
            {shown === "actions" ? (
              <section className="qd-card">
                <div className="qd-card__head">
                  <h2>{L("Ajanın önerileri", "Agent suggestions")}</h2>
                  <p>{L("Siz onaylamadan hiçbir mesaj gitmez.", "No message goes out without your approval.")}</p>
                </div>
                <ActionQueue key={date} actions={actions} storageKey={`qd-actions-${tenant}-${date}`} onToast={setToast} onAction={(a, id) => log(a, id)} />
              </section>
            ) : null}
            {shown === "customers" ? (
              <section className="qd-card">
                <Tabs<Tab>
                  value={tab}
                  onChange={changeTab}
                  items={[
                    ["customers", L("Müşteri ödeme karnesi", "Customer payment scorecard")],
                    ["inflows", L("Beklenen tahsilatlar", "Expected collections")],
                    ["whatsapp", L("WhatsApp sözleri", "WhatsApp promises")],
                    ["sources", L("Kaynaklar ve belgeler", "Sources and documents")],
                  ]}
                />
                <div key={`${tab}-${date}`} className="qd-enter">
                  {tab === "inflows" ? <InflowTable snap={snap} onCustomer={openCustomer} /> : null}
                  {tab === "customers" ? <CustomerTable snap={snap} onCustomer={openCustomer} /> : null}
                  {tab === "whatsapp" ? <PromiseList snap={snap} onCustomer={openCustomer} /> : null}
                  {tab === "sources" ? <SourcesView snap={snap} /> : null}
                </div>
              </section>
            ) : null}
            {shown === "scorecard" ? <ScorecardCard dataset={dataset} prevDate={prevDate} date={date} onCustomer={openCustomer} /> : null}
            {shown === "banks" ? (
              <BanksView
                tenant={tenant}
                date={date}
                mainBalance={balance}
                suggestedNeed={cashNeed}
                onShare={() => {
                  story.close();
                  openShare();
                }}
                onLog={(what) => log("scenario_run", "banks", what)}
              />
            ) : null}
        </FocusSheet>
      </main>
      <FocusSheet open={liveOpen} title={L("Canlı güncelleme", "Live update")} subtitle={L("Ajan mesajı okudu ve tahmini yeniden çizdi.", "The agent read the message and redrew the forecast.")} onClose={() => setLiveOpen(false)}>
        {outcome ? <LiveUpdate outcome={outcome} asOf={date} onAdvice={(a) => { log("agent_approve", a.id); setToast(L(`Demo: "${a.title}" onaylandı. Gerçekte hiçbir şey gönderilmedi.`, `Demo: "${a.title}" approved. Nothing was actually sent.`)); }} /> : null}
      </FocusSheet>
      <CustomerSheet snap={snap} customer={customer} onClose={() => setCustomer(null)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} dataset={dataset} date={date} onShared={() => { log("tab_open", "bank-share-sent"); try { window.localStorage.setItem(SHARE_KEY, JSON.stringify({ tenant, date })); } catch { /* storage blocked: the link in the sheet still works */ } setToast(L("Demo: paylaşım bankacı paneline yansıdı. Gerçekte hiçbir veri gönderilmedi.", "Demo: the share now appears in the banker panel. No data was actually sent.")); }} />
      {toast ? <Toast text={toast} onDone={clearToast} /> : null}
    </div>
  );
}

type Snap = ReturnType<typeof snapshot>;
type Weeks = ReturnType<typeof weeklyForecast>;

function CashFlowCard({ snap, weeks, accuracy, prevDate, onScenario }: { snap: Snap; weeks: Weeks; accuracy: ReturnType<typeof forecastAccuracy> | null; prevDate: string | undefined; onScenario: (target: string, detail: string) => void }) {
  const mounted = useMounted();
  const candidates = useMemo(() => {
    const sums = new Map<string, number>();
    for (const i of expectedInflows(snap)) if (!i.atRisk) sums.set(i.customer.id, (sums.get(i.customer.id) ?? 0) + i.receivable.amount);
    return [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, sum]) => ({ c: snap.dataset.customers.find((x) => x.id === id)!, sum }));
  }, [snap]);
  const [mode, setMode] = useState<"late" | "project">("late");
  const [who, setWho] = useState<string>("");
  const [days, setDays] = useState(30);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const project = plan ?? defaultProject(snap);
  const projectResult = useMemo(() => (mode === "project" && plan ? withProject(snap, plan) : null), [snap, mode, plan]);
  const scenario = useMemo(
    () => (mode === "late" ? (who ? whatIfLate(snap, who, days).changed : null) : (projectResult?.changed ?? null)),
    [snap, mode, who, days, projectResult],
  );
  const setP = (patch: Partial<ProjectPlan>) => setPlan({ ...project, ...patch });
  // Log a scenario once the inputs settle, not on every pixel.
  useEffect(() => {
    if (mode === "late" && !who) return;
    if (mode === "project" && !plan) return;
    const t = setTimeout(() => (mode === "late" ? onScenario(who, `${days} gün`) : onScenario("yeni-is", `${project.amount} TL, avans %${project.advancePct}`)), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, who, days, plan]);
  const tight = tightestWeek(weeks);
  const data = weeks.map((w, i) => ({
    label: formatDateTr(w.weekStart).replace(/ \d{4}$/, ""),
    weekStart: w.weekStart,
    range: [w.balanceLow, w.balanceHigh] as [number, number],
    base: w.balanceBase,
    inflow: w.inflowBase,
    outflow: -w.outflow,
    scenario: scenario?.[i]?.balanceBase,
  }));
  return (
    <section className="qd-card">
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">{L("Nakit akışı · 8 hafta", "Cash flow · 8 weeks")}</span>
          <h2>{L("Kasa ne zaman daralıyor, ne zaman rahatlıyor", "When cash gets tight, and when it eases")}</h2>
        </div>
        {accuracy && prevDate ? (
          <span className="qd-pill qd-pill--good" title={L("Önceki demo tarihinde yapılan tahmin ile o tarihten bugüne gerçekten gelen tahsilatın karşılaştırması", "The forecast made on the previous demo date compared with the collections that actually arrived since")}>
            {L(`${formatDateTr(prevDate)} tahmini`, `${formatDateTr(prevDate)} forecast`)} {money(accuracy.predicted)} · {L("gerçekleşen", "actual")} {money(accuracy.actual)} · {L("sapma", "error")} {pct(Math.round(accuracy.errorRate * 100))}
          </span>
        ) : null}
      </div>
      <div className="qd-legend">
        <span><i style={{ background: "#dfeccb" }} />{L("İyimser–kötümser aralık", "Upside–downside range")}</span>
        <span><i style={{ background: "#16302a" }} />{L("En olası bakiye", "Most likely balance")}</span>
        <span><i style={{ background: "#8fbf4d" }} />{L("Beklenen tahsilat", "Expected collections")}</span>
        <span><i style={{ background: "#e7b2a5" }} />{L("Planlı ödemeler", "Planned payments")}</span>
        {scenario ? <span><i style={{ background: "#c0503a" }} />{L("Senaryo", "Scenario")}</span> : null}
      </div>
      <div className="qd-chart" key={snap.asOf}>
        {mounted ? (
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#5d6c61", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => money(v)} tick={{ fill: "#5d6c61", fontSize: 12 }} axisLine={false} tickLine={false} width={78} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="#c0503a" strokeDasharray="4 4" />
              <Bar dataKey="inflow" fill="#8fbf4d" radius={[6, 6, 0, 0]} barSize={14} animationDuration={700} />
              <Bar dataKey="outflow" fill="#e7b2a5" radius={[0, 0, 6, 6]} barSize={14} animationDuration={700} />
              <Area dataKey="range" stroke="none" fill="#dfeccb" fillOpacity={0.9} animationDuration={900} />
              <Line dataKey="base" stroke="#16302a" strokeWidth={2.5} dot={{ r: 3, fill: "#16302a" }} animationDuration={900} />
              {scenario ? <Line dataKey="scenario" stroke="#c0503a" strokeWidth={2} strokeDasharray="6 4" dot={false} animationDuration={500} /> : null}
              <ReferenceDot x={formatDateTr(tight.weekStart).replace(/ \d{4}$/, "")} y={tight.balanceLow} r={6} fill="#c0503a" stroke="#fff" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <div className="qd-toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
        <span className="qd-eyebrow">{L("Senaryo dene", "Try a scenario")}</span>
        <div className="qd-tabs" role="tablist" style={{ marginBottom: 0 }}>
          <button type="button" role="tab" aria-selected={mode === "late"} onClick={() => setMode("late")}>{L("Müşteri geç öderse", "If a customer pays late")}</button>
          <button type="button" role="tab" aria-selected={mode === "project"} onClick={() => { setMode("project"); if (!plan) setPlan(project); }}>{L("Bu işi alırsam", "If I take this job")}</button>
        </div>
        {mode === "late" ? (
          <>
            <select className="qd-select" value={who} onChange={(e) => setWho(e.target.value)} aria-label={L("Geç ödeyecek müşteri", "Customer who pays late")}>
              <option value="">{L("Müşteri seçin…", "Choose a customer…")}</option>
              {candidates.map(({ c, sum }) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({money(sum)})
                </option>
              ))}
            </select>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="range" min={7} max={60} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} disabled={!who} />
              <span className="qd-num">{L(`${days} gün geç öderse`, `pays ${days} days late`)}</span>
            </label>
            {scenario ? <ScenarioPill base={weeks} changed={scenario} /> : null}
          </>
        ) : null}
      </div>
      {mode === "project" ? (
        <div className="qd-project qd-enter">
          <label>
            <span>{L("İşin bedeli (TL)", "Job value (TRY)")}</span>
            <input className="qd-input qd-num" type="number" min={10000} step={10000} value={project.amount} onChange={(e) => setP({ amount: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>
            <span>{L("Avans", "Advance")}: {pct(project.advancePct)} ({money((project.amount * project.advancePct) / 100)})</span>
            <input type="range" min={0} max={60} step={5} value={project.advancePct} onChange={(e) => setP({ advancePct: Number(e.target.value) })} />
          </label>
          <label>
            <span>{L("Ek maliyet (TL, ekip/dış hizmet)", "Extra cost (TRY, team/contractors)")}</span>
            <input className="qd-input qd-num" type="number" min={0} step={10000} value={project.cost} onChange={(e) => setP({ cost: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>
            <span>{L("Teslim süresi", "Delivery time")}</span>
            <select className="qd-select" value={project.deliveryWeeks} onChange={(e) => setP({ deliveryWeeks: Number(e.target.value) })}>
              {[2, 3, 4, 6, 8].map((w) => (
                <option key={w} value={w}>{L(`${w} hafta`, `${w} weeks`)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{L("Kalan ödemenin vadesi", "Remaining payment due")}</span>
            <select className="qd-select" value={project.termDays} onChange={(e) => setP({ termDays: Number(e.target.value) })}>
              {[0, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d === 0 ? L("Teslimde", "On delivery") : L(`Teslimden ${d} gün sonra`, `${d} days after delivery`)}</option>
              ))}
            </select>
          </label>
          {projectResult ? <ProjectVerdict base={weeks} changed={projectResult.changed} flows={projectResult.flows} /> : null}
        </div>
      ) : null}
    </section>
  );
}

const OUTCOME = {
  on_time: [["Tuttu (±3 gün)", "On target (±3 days)"], "qd-pill--good"],
  early: [["Erken geldi", "Arrived early"], "qd-pill--good"],
  late: [["Geç geldi", "Arrived late"], "qd-pill--warn"],
  unpaid: [["Henüz gelmedi", "Not yet paid"], "qd-pill--bad"],
} as const;
const PROMISE = { kept: [["Söz tutuldu", "Promise kept"], "qd-pill--good"], late: [["Gecikmeli", "Late"], "qd-pill--warn"], broken: [["Tutulmadı", "Broken"], "qd-pill--bad"] } as const;

function ScorecardCard({ dataset, prevDate, date, onCustomer }: { dataset: ReturnType<typeof generateBusiness>; prevDate: string | undefined; date: string; onCustomer: (c: Customer) => void }) {
  const card = useMemo(() => (prevDate ? scorecard(dataset, prevDate, date) : null), [dataset, prevDate, date]);
  if (!card || !prevDate) {
    return (
      <section className="qd-card qd-enter">
        <span className="qd-eyebrow">{L("Tahmin ve söz karnesi", "Forecast and promise scorecard")}</span>
        <p style={{ marginTop: 6, color: "var(--qd-muted)" }}>
          {L(
            `Bu ilk tarih. ${formatDateTr(DEMO_DATES[1])} veya ${formatDateTr(DEMO_DATES[2])} tarihine geçin: ajanın bugün beklediği ödemelerin ve WhatsApp'ta verilen sözlerin o güne kadar nasıl sonuçlandığını burada tek tek göreceksiniz.`,
            `This is the first date. Switch to ${formatDateTr(DEMO_DATES[1])} or ${formatDateTr(DEMO_DATES[2])} to see, one by one, how the payments the agent expects today and the promises made on WhatsApp actually turned out.`,
          )}
        </p>
      </section>
    );
  }
  const hit = card.predictions.filter((p) => p.outcome === "on_time" || p.outcome === "early").length;
  const kept = card.promises.filter((p) => p.outcome === "kept").length;
  const late = card.promises.filter((p) => p.outcome === "late").length;
  const broken = card.promises.filter((p) => p.outcome === "broken").length;
  const rows = [...card.predictions].sort((a, b) => b.receivable.amount - a.receivable.amount).slice(0, 8);
  return (
    <section className="qd-card qd-enter" key={date}>
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">{L("Tahmin ve söz karnesi", "Forecast and promise scorecard")}</span>
          <h2>{L(`${formatDateTr(prevDate)} tarihinde beklenen ödemeler ${formatDateTr(date)} tarihine kadar geldi mi?`, `Did the payments expected on ${formatDateTr(prevDate)} arrive by ${formatDateTr(date)}?`)}</h2>
        </div>
        <span className="qd-pill qd-pill--muted" title={L("Sentetik demo verisi üzerinde hesaplandı. Gerçek doğruluk pilotta, gerçek ödeme verisiyle ölçülecek.", "Computed on synthetic demo data. Real accuracy will be measured in the pilot with real payment data.")}>{L("Demo verisi · gerçek doğruluk pilotta ölçülecek", "Demo data · real accuracy measured in the pilot")}</span>
      </div>
      <div className="qd-stat-row" style={{ marginTop: 0 }}>
        <div className="qd-stat">
          <span>{L("Zamanında veya erken gelen", "On time or early")}</span>
          <b className="qd-num">{hit} / {card.predictions.length} {L("ödeme", "payments")}</b>
        </div>
        <div className="qd-stat">
          <span>{L("Ortalama sapma (gelen ödemeler)", "Average error (paid items)")}</span>
          <b className="qd-num">{L("Ajan", "Agent")} {dayCount(card.avgErrorQualifi)}</b>
          <span>{L(`Yalnız vade tarihine bakınca ${card.avgErrorDueDate} gün`, `Using the due date alone: ${card.avgErrorDueDate} days`)}</span>
        </div>
        <div className="qd-stat">
          <span>{L("WhatsApp'ta verilen ödeme sözleri", "Payment promises made on WhatsApp")}</span>
          <b className="qd-num">{card.promises.length ? L(`${kept} tutuldu · ${late} gecikti · ${broken} tutulmadı`, `${kept} kept · ${late} late · ${broken} broken`) : L("Bu dönemde söz yok", "No promises this period")}</b>
        </div>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>{L("Müşteri", "Customer")}</th>
              <th className="qd-right">{L("Tutar", "Amount")}</th>
              <th>{L("Vade", "Due")}</th>
              <th>{L("Ajanın beklediği", "Agent expected")}</th>
              <th>{L("Gerçekleşen", "Actual")}</th>
              <th>{L("Sonuç", "Result")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.receivable.id} data-clickable onClick={() => onCustomer(p.customer)}>
                <td>{p.customer.name}</td>
                <td className="qd-right qd-num">{money(p.receivable.amount)}</td>
                <td className="qd-num">{formatDateTr(p.receivable.dueDate)}</td>
                <td className="qd-num">{formatDateTr(p.expected)}</td>
                <td className="qd-num">{p.paidDate ? formatDateTr(p.paidDate) : "—"}</td>
                <td><span className={`qd-pill ${OUTCOME[p.outcome][1]}`}>{pick(OUTCOME[p.outcome][0])}{p.errorDays !== null && Math.abs(p.errorDays) > 0 ? ` (${p.errorDays > 0 ? "+" : ""}${p.errorDays} ${L("g", "d")})` : ""}</span></td>
              </tr>
            ))}
            {card.promises.map((p) => (
              <tr key={p.message.id} data-clickable onClick={() => onCustomer(p.customer)}>
                <td>{p.customer.name}<div style={{ color: "var(--qd-muted)", fontSize: 12 }}>WhatsApp: “{messageText(p.message.text)}”</div></td>
                <td className="qd-right qd-num">{money(p.amount)}</td>
                <td className="qd-num">—</td>
                <td className="qd-num">{L("Söz", "Promise")}: {formatDateTr(p.message.promiseDate as string)}</td>
                <td className="qd-num">{p.paidDate ? formatDateTr(p.paidDate) : "—"}</td>
                <td><span className={`qd-pill ${PROMISE[p.outcome][1]}`}>{pick(PROMISE[p.outcome][0])}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--qd-muted)", fontSize: 12, marginTop: 10 }}>
        {L(
          `Yalnız ${formatDateTr(date)} itibarıyla sonucu belli olan tahminler değerlendirilir; sonraki haftalar için yapılan tahminler henüz sınanmadı.`,
          `Only forecasts whose outcome is known by ${formatDateTr(date)} are scored; forecasts for later weeks have not been tested yet.`,
        )}
      </p>
    </section>
  );
}

function ProjectVerdict({ base, changed, flows }: { base: Weeks; changed: Weeks; flows: ReturnType<typeof withProject>["flows"] }) {
  const t0 = tightestWeek(base);
  const t1 = tightestWeek(changed);
  const rest = flows.find((f) => f.label === "Kalan ödeme");
  const lastWeek = base.at(-1)?.weekStart ?? "";
  const negative = t1.balanceLow < 0;
  const need = negative ? -t1.balanceLow : 0;
  return (
    <div className={`qd-verdict ${negative ? "qd-verdict--bad" : "qd-verdict--good"}`}>
      <b>{negative ? L("Bu iş, kötü senaryoda kasayı eksiye düşürüyor.", "In the downside case this job pushes cash below zero.") : L("Bu iş nakit açısından taşınabilir.", "This job is affordable in cash terms.")}</b>
      <span>
        {L(
          `En dar hafta ${formatDateTr(t1.weekStart)}: beklenen ${money(t1.balanceBase)} (bu iş olmadan ${money(t0.balanceBase)}), kötü senaryoda ${money(t1.balanceLow)}.`,
          `Tightest week ${formatDateTr(t1.weekStart)}: expected ${money(t1.balanceBase)} (${money(t0.balanceBase)} without this job), ${money(t1.balanceLow)} in the downside case.`,
        )}
        {negative ? L(` Avansı artırmak, maliyeti teslime yaymak ya da yaklaşık ${money(need)} kısa vadeli finansman gerekir.`, ` You would need a larger advance, costs spread to delivery, or about ${money(need)} of short-term financing.`) : ""}
      </span>
      {rest ? <span>{L(`Kalan ${money(rest.amount)} ${formatDateTr(rest.date)} tarihinde${rest.date > lastWeek ? "; 8 haftalık görünümün dışında" : ""}.`, `The remaining ${money(rest.amount)} arrives on ${formatDateTr(rest.date)}${rest.date > lastWeek ? ", outside the 8-week view" : ""}.`)}</span> : null}
    </div>
  );
}

function ShareSheet({ open, onClose, dataset, date, onShared }: { open: boolean; onClose: () => void; dataset: ReturnType<typeof generateBusiness>; date: string; onShared: () => void }) {
  const summary = useMemo(() => (open ? bankShareSummary(dataset, date) : null), [open, dataset, date]);
  const [sent, setSent] = useState(false);
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setSent(false); } }}>
      <SheetContent className="qd-sheet qd">
        <SheetHeader>
          <SheetTitle>{L("Ödeme karnenizi bankanızla paylaşın", "Share your payment scorecard with your bank")}</SheetTitle>
          <SheetDescription>
            {L(
              "Banka sizi izlemiyor; iyi ödeme karnenizi siz götürüyorsunuz. Daha hızlı limit görüşmesi ve uygun finansman için yalnız aşağıdaki özet gider. Paylaşımı istediğiniz an geri çekebilirsiniz.",
              "The bank is not watching you; you bring your good scorecard to it. Only the summary below is sent, for faster credit-limit talks and better financing. You can withdraw the share at any time.",
            )}
          </SheetDescription>
        </SheetHeader>
        {summary ? <ShareSummaryView summary={summary} audience="business" /> : null}
        <div className="qd-action__buttons" style={{ marginTop: 16 }}>
          {sent ? (
            <>
              <span className="qd-pill qd-pill--good">{L("Paylaşıldı · demo", "Shared · demo")}</span>
              <a className="qd-btn qd-btn--primary qd-btn--sm" href={`/demo/banka?b=01&d=${date}&s=${dataset.tenant}${isEnglish() ? "&l=en" : ""}`}>{L("Bankacı ekranında gör", "See it on the banker screen")}</a>
            </>
          ) : (
            <button type="button" className="qd-btn qd-btn--primary" onClick={() => { setSent(true); onShared(); }}>
              {L("Bankama gönder (demo)", "Send to my bank (demo)")}
            </button>
          )}
        </div>
        <p style={{ color: "var(--qd-muted)", fontSize: 12, marginTop: 10 }}>{L("Demo: gerçek bir bankaya veri gönderilmez. Banka entegrasyonu pilot ve izin sözleşmesiyle kurulur.", "Demo: no data is sent to a real bank. A bank integration is set up through a pilot and a consent agreement.")}</p>
      </SheetContent>
    </Sheet>
  );
}

function ScenarioPill({ base, changed }: { base: Weeks; changed: Weeks }) {
  const gap = scenarioGap(base, changed);
  const negative = changed.some((w) => w.balanceBase < 0);
  return (
    <span className={`qd-pill ${negative ? "qd-pill--bad" : "qd-pill--warn"}`}>
      {L("En büyük etki", "Biggest impact")} {formatDateTr(gap.weekStart).replace(/ \d{4}$/, "")}: {money(gap.changed - gap.base)}
      {negative ? L(" · kasa ekside", " · cash below zero") : ""}
    </span>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { weekStart: string; base: number; range: [number, number]; inflow: number; outflow: number; scenario?: number } }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="qd-tooltip">
      <b>{L(`${formatDateTr(p.weekStart)} haftası`, `Week of ${formatDateTr(p.weekStart)}`)}</b>
      <div><span>{L("Tahsilat", "Collections")}</span><span className="qd-num">+{money(p.inflow)}</span></div>
      <div><span>{L("Ödemeler", "Payments")}</span><span className="qd-num">{money(p.outflow)}</span></div>
      <div><span>{L("En olası bakiye", "Most likely balance")}</span><b className="qd-num" style={{ margin: 0 }}>{money(p.base)}</b></div>
      <div><span>{L("Aralık", "Range")}</span><span className="qd-num">{money(p.range[0])} – {money(p.range[1])}</span></div>
      {p.scenario !== undefined ? <div><span>{L("Senaryo", "Scenario")}</span><span className="qd-num">{money(p.scenario)}</span></div> : null}
    </div>
  );
}

function InflowTable({ snap, onCustomer }: { snap: Snap; onCustomer: (c: Customer) => void }) {
  const rows = useMemo(() => expectedInflows(snap).sort((a, b) => a.expected.localeCompare(b.expected)).slice(0, 40), [snap]);
  return (
    <div className="qd-table-wrap">
      <table className="qd-table">
        <thead>
          <tr>
            <th>{L("Müşteri", "Customer")}</th>
            <th>{L("Belge", "Document")}</th>
            <th>{L("Vade", "Due")}</th>
            <th>{L("Ajanın beklediği", "Agent expects")}</th>
            <th className="qd-right">{L("Tutar", "Amount")}</th>
            <th>{L("Neden", "Why")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => {
            const late = diffDays(i.expected, i.receivable.dueDate);
            return (
              <tr key={i.receivable.id} data-clickable onClick={() => onCustomer(i.customer)}>
                <td>{i.customer.name}</td>
                <td><span className={`qd-pill ${i.receivable.kind === "cheque" || i.receivable.kind === "note" ? "qd-pill--warn" : "qd-pill--muted"}`}>{pick(DOC_LABEL[i.receivable.kind])}</span></td>
                <td className="qd-num">{formatDateTr(i.receivable.dueDate)}</td>
                <td className="qd-num">
                  {i.atRisk ? <span className="qd-pill qd-pill--bad">{L("Riskli · tahmine dahil değil", "Risky · not in forecast")}</span> : <>{formatDateTr(i.expected)} {late > 3 ? <span className="qd-pill qd-pill--warn">+{dayCount(late)}</span> : late < -1 ? <span className="qd-pill qd-pill--good">{L("erken", "early")}</span> : null}</>}
                </td>
                <td className="qd-right qd-num">{money(i.receivable.amount)}</td>
                <td style={{ color: "var(--qd-muted)", fontSize: 12.5, maxWidth: 320 }}>{i.reason}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type SortKey = "openAmount" | "medianDelay" | "overdueAmount" | "trend";

function CustomerTable({ snap, onCustomer }: { snap: Snap; onCustomer: (c: Customer) => void }) {
  const [sort, setSort] = useState<SortKey>("overdueAmount");
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      snap.dataset.customers
        .map((c) => ({ c, p: payerProfile(snap, c.id) }))
        .filter((r) => r.p.paidCount > 0 || r.p.openAmount > 0)
        .filter((r) => r.c.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")))
        .sort((a, b) => b.p[sort] - a.p[sort]),
    [snap, sort, query],
  );
  const th = (key: SortKey, label: string) => (
    <th className="qd-right">
      <button type="button" onClick={() => setSort(key)} aria-pressed={sort === key}>
        {label}
        {sort === key ? " ↓" : ""}
      </button>
    </th>
  );
  return (
    <>
      <div className="qd-toolbar">
        <input className="qd-input" placeholder={L("Müşteri ara", "Search customers")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={L("Müşteri ara", "Search customers")} />
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{L(`${rows.length} müşteri · A dakik, D riskli`, `${rows.length} customers · A punctual, D risky`)}</span>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
        <table className="qd-table">
          <thead>
            <tr>
              <th>{L("Müşteri", "Customer")}</th>
              <th>{L("Not", "Grade")}</th>
              {th("medianDelay", L("Ortanca gecikme", "Median delay"))}
              <th className="qd-right">{L("Zamanında", "On time")}</th>
              {th("openAmount", L("Açık", "Open"))}
              {th("overdueAmount", L("Vadesi geçen", "Overdue"))}
              {th("trend", L("Eğilim", "Trend"))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map(({ c, p }) => (
              <tr key={c.id} data-clickable onClick={() => onCustomer(c)}>
                <td>
                  {c.name}
                  <div style={{ color: "var(--qd-muted)", fontSize: 12 }}>{sectorName(c.sector)}</div>
                </td>
                <td><Grade grade={p.grade} /></td>
                <td className="qd-right qd-num">{p.paidCount ? `${p.medianDelay > 0 ? "+" : ""}${dayCount(p.medianDelay)}` : "—"}</td>
                <td className="qd-right qd-num">{p.onTimeRate === null ? "—" : pct(Math.round(p.onTimeRate * 100))}</td>
                <td className="qd-right qd-num">{money(p.openAmount)}</td>
                <td className="qd-right qd-num" style={{ color: p.overdueAmount ? "var(--qd-bad)" : undefined }}>{p.overdueAmount ? money(p.overdueAmount) : "—"}</td>
                <td className="qd-right">
                  {p.trend > 2 ? <span className="qd-pill qd-pill--bad"><ArrowUpRight size={12} />{L(`${p.trend} gün yavaş`, `${p.trend} days slower`)}</span> : p.trend < -2 ? <span className="qd-pill qd-pill--good"><ArrowDownRight size={12} />{L("hızlandı", "faster")}</span> : <span className="qd-pill qd-pill--muted">{L("sabit", "stable")}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PromiseList({ snap, onCustomer }: { snap: Snap; onCustomer: (c: Customer) => void }) {
  const customers = new Map(snap.dataset.customers.map((c) => [c.id, c]));
  const promises = snap.chats.filter((m) => m.promiseDate || /zor|süre rica/i.test(m.text)).slice().reverse();
  if (!promises.length) return <p style={{ color: "var(--qd-muted)" }}>{L("Bu tarihe kadar WhatsApp'ta ödeme konuşması yok.", "No payment conversations on WhatsApp up to this date.")}</p>;
  return (
    <div className="qd-table-wrap">
      <table className="qd-table">
        <thead>
          <tr>
            <th>{L("Tarih", "Date")}</th>
            <th>{L("Müşteri", "Customer")}</th>
            <th>{L("Mesaj", "Message")}</th>
            <th>{L("Söz", "Promise")}</th>
            <th>{L("Durum", "Status")}</th>
          </tr>
        </thead>
        <tbody>
          {promises.map((m) => {
            const paid = snap.receivables.find((r) => r.id === m.receivableId)?.paidDate;
            const state = !m.promiseDate ? [L("Nakit sıkıntısı işareti", "Cash-stress signal"), "qd-pill--bad"] : paid ? [L("Ödendi", "Paid"), "qd-pill--good"] : m.promiseDate < snap.asOf ? [L("Tutulmadı", "Broken"), "qd-pill--bad"] : [L("Bekleniyor", "Pending"), "qd-pill--warn"];
            const c = customers.get(m.customerId)!;
            return (
              <tr key={m.id} data-clickable onClick={() => onCustomer(c)}>
                <td className="qd-num">{formatDateTr(m.date)}</td>
                <td>{c.name}</td>
                <td style={{ maxWidth: 320 }}>“{messageText(m.text)}”</td>
                <td className="qd-num">{m.promiseDate ? formatDateTr(m.promiseDate) : "—"}</td>
                <td><span className={`qd-pill ${state[1]}`}>{state[0]}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SourcesView({ snap }: { snap: Snap }) {
  const d = snap.dataset;
  const invoices = snap.receivables.filter((r) => r.kind === "invoice");
  const paid = snap.receivables.filter((r) => r.paidDate);
  const items = [
    { icon: <Building2 size={16} />, name: d.sources.erp, kind: "ERP (demo)", lines: [L(`${d.customers.length} müşteri kartı`, `${d.customers.length} customer records`), L(`${invoices.length} sipariş`, `${invoices.length} orders`), L(`${snap.pastExpenses.filter((e) => e.source === "mockerp").length + snap.plannedExpenses.filter((e) => e.source === "mockerp").length} planlı/gerçek gider`, `${snap.pastExpenses.filter((e) => e.source === "mockerp").length + snap.plannedExpenses.filter((e) => e.source === "mockerp").length} planned/actual expenses`)] },
    { icon: <Calculator size={16} />, name: d.sources.onMuhasebe, kind: L("Ön muhasebe (demo)", "Bookkeeping (demo)"), lines: [L(`${invoices.length} fatura`, `${invoices.length} invoices`), L(`${paid.length} tahsilat kaydı`, `${paid.length} collections`), L(`${snap.receivables.filter((r) => r.kind === "cheque").length} çek, ${snap.receivables.filter((r) => r.kind === "note").length} senet kaydı`, `${snap.receivables.filter((r) => r.kind === "cheque").length} cheques, ${snap.receivables.filter((r) => r.kind === "note").length} promissory notes`)] },
    { icon: <Landmark size={16} />, name: d.sources.banka, kind: L("Banka hesabı (demo)", "Bank account (demo)"), lines: [`${L("Bakiye", "Balance")} ${money(currentBalance(snap))}`, L(`${paid.length + snap.pastExpenses.length} hesap hareketi`, `${paid.length + snap.pastExpenses.length} transactions`), L("Günlük eşleştirme", "Daily reconciliation")] },
    { icon: <MessageCircle size={16} />, name: "WhatsApp Business", kind: L("Sohbet dışa aktarımı (demo)", "Chat export (demo)"), lines: [L(`${snap.chats.length} mesaj`, `${snap.chats.length} messages`), L(`${snap.chats.filter((m) => m.promiseDate).length} ödeme sözü`, `${snap.chats.filter((m) => m.promiseDate).length} payment promises`), L("Kaynak mesaj her zaman gösterilir", "The source message is always shown")] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {items.map((s) => (
        <div key={s.name} className="qd-card" style={{ boxShadow: "none" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="qd-agent__avatar" style={{ width: 30, height: 30 }}>{s.icon}</span>
            <div>
              <b>{s.name}</b>
              <div style={{ color: "var(--qd-muted)", fontSize: 12 }}>{s.kind}</div>
            </div>
          </div>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13 }}>
            {s.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="qd-card" style={{ boxShadow: "none", gridColumn: "1 / -1" }}>
        <b>{L("Sözleşmeler", "Contracts")}</b>
        <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
          {d.contracts.filter((c) => c.signedDate <= snap.asOf).map((c) => (
            <li key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eef1ea" }}>
              <FileText size={15} />
              <span style={{ flex: 1 }}>{labelText(c.title)} · {d.customers.find((x) => x.id === c.customerId)?.name}</span>
              <span className="qd-num">{money(c.total)}</span>
              <span className="qd-pill qd-pill--muted">{formatDateTr(c.signedDate)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CustomerSheet({ snap, customer, onClose }: { snap: Snap; customer: Customer | null; onClose: () => void }) {
  const mounted = useMounted();
  const p: PayerProfile | null = customer ? payerProfile(snap, customer.id) : null;
  const history = customer
    ? snap.receivables
        .filter((r) => r.customerId === customer.id && r.paidDate)
        .slice(-12)
        .map((r) => ({ label: formatDateTr(r.dueDate).replace(/ \d{4}$/, ""), delay: diffDays(r.paidDate as string, r.dueDate) }))
    : [];
  const open = customer ? snap.receivables.filter((r) => r.customerId === customer.id && !r.paidDate) : [];
  const chats = customer ? snap.chats.filter((m) => m.customerId === customer.id) : [];
  return (
    <Sheet open={customer !== null} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent className="qd-sheet qd">
        {customer && p ? (
          <>
            <SheetHeader>
              <SheetTitle style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Grade grade={p.grade} /> {customer.name}
              </SheetTitle>
              <SheetDescription>{L(`${sectorName(customer.sector)} · ${p.paidCount} ödeme geçmişi · ${formatDateTr(snap.asOf)} itibarıyla`, `${sectorName(customer.sector)} · ${p.paidCount} past payments · as of ${formatDateTr(snap.asOf)}`)}</SheetDescription>
            </SheetHeader>
            <div className="qd-stat-row">
              <div className="qd-stat"><span>{L("Ortanca gecikme", "Median delay")}</span><b className="qd-num">{dayCount(p.medianDelay)}</b></div>
              <div className="qd-stat"><span>{L("Zamanında ödeme", "Paid on time")}</span><b className="qd-num">{p.onTimeRate === null ? "—" : pct(Math.round(p.onTimeRate * 100))}</b></div>
              <div className="qd-stat"><span>{L("Açık alacak", "Open receivables")}</span><b className="qd-num">{money(p.openAmount)}</b></div>
            </div>
            <span className="qd-eyebrow">{L("Son ödemeler: vadeye göre kaç gün geç", "Recent payments: days late versus the due date")}</span>
            <div style={{ height: 140, marginTop: 6 }}>
              {mounted ? (
                <ResponsiveContainer>
                  <BarChart data={history}>
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5d6c61" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => dayCount(v)} />
                    <ReferenceLine y={0} stroke="#cfd8c7" />
                    <Bar dataKey="delay" radius={[4, 4, 4, 4]}>
                      {history.map((h, i) => (
                        <Cell key={i} fill={h.delay > 7 ? "#c0503a" : h.delay > 2 ? "#d9a14a" : "#2f7d4f"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="qd-eyebrow">{L("Açık belgeler", "Open documents")}</span>
              {open.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e6ebe0", fontSize: 13 }}>
                  <span>{r.id}</span>
                  <span className="qd-num">{L("vade", "due")} {formatDateTr(r.dueDate)}</span>
                  <b className="qd-num">{money(r.amount)}</b>
                </div>
              ))}
              {!open.length ? <p style={{ color: "var(--qd-muted)", fontSize: 13 }}>{L("Açık belge yok.", "No open documents.")}</p> : null}
            </div>
            {chats.length ? (
              <div style={{ marginTop: 16 }}>
                <span className="qd-eyebrow">WhatsApp</span>
                <div className="qd-chat" style={{ marginTop: 6 }}>
                  {chats.map((m) => (
                    <div key={m.id} className={`qd-bubble${m.from === "us" ? " qd-bubble--us" : ""}`}>
                      {messageText(m.text)}
                      <small>{formatDateTr(m.date)}{m.promiseDate ? ` · ${L("söz", "promise")}: ${formatDateTr(m.promiseDate)}` : ""}</small>
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
