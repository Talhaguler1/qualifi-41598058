import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, Bar, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, BarChart } from "recharts";
import { Building2, Calculator, Landmark, MessageCircle, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  SUGGESTED_QUESTIONS,
  tightestWeek,
  weeklyForecast,
  whatIfLate,
  type Customer,
  type DemoDate,
  type PayerProfile,
} from "@/lib/demo";
import { trackDemo, type DemoAction } from "@/lib/demo/track";
import { ActionQueue, AgentFeed, AskAgent, BriefingBox } from "./agent-panel";
import { ShareSummaryView } from "./share-view";
import { AnimatedNumber, Grade, Kpi, SourceChip, Tabs, Toast, TopBar, useMounted } from "./shared";

type Tab = "inflows" | "customers" | "whatsapp" | "sources";
const DOC_LABEL = { invoice: "Fatura", contract_installment: "Sözleşme taksiti", cheque: "Çek", note: "Senet" } as const;

export function BusinessPanel({ tenant, date, onDate }: { tenant: string; date: DemoDate; onDate: (d: DemoDate) => void }) {
  const dataset = useMemo(() => generateBusiness(tenant), [tenant]);
  const snap = useMemo(() => snapshot(dataset, date), [dataset, date]);
  const prevDate = DEMO_DATES[DEMO_DATES.indexOf(date) - 1];
  const weeks = useMemo(() => weeklyForecast(snap), [snap]);
  const inflows = useMemo(() => expectedInflows(snap), [snap]);
  const actions = useMemo(() => agentActions(snap, 8), [snap]);
  const steps = useMemo(() => agentRun(dataset, date, prevDate ?? addDays(date, -14)), [dataset, date, prevDate]);
  const briefing = useMemo(() => businessBriefing(snap), [snap]);
  const accuracy = useMemo(() => (prevDate ? forecastAccuracy(dataset, prevDate, date) : null), [dataset, prevDate, date]);
  const ask = useCallback((q: string) => askAgent(snap, q), [snap]);
  const [tab, setTab] = useState<Tab>("inflows");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const clearToast = useCallback(() => setToast(null), []);
  const log = useCallback(
    (action: DemoAction, target?: string, detail?: string) => trackDemo({ panel: "business", tenant, demo_date: date, action, target: target ?? null, detail: detail ?? null }),
    [tenant, date],
  );
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

  const balance = currentBalance(snap);
  const last = weeks.at(-1)!;
  const tight = tightestWeek(weeks);
  const overdue = inflows.filter((i) => i.receivable.dueDate < date);
  const overdueSum = overdue.reduce((s, i) => s + i.receivable.amount, 0);

  return (
    <div className="qd">
      <TopBar title={dataset.company.name} subtitle={`${dataset.company.sector} · ${dataset.company.city} · ${dataset.customers.length} müşteri`} date={date} onDate={changeDate}>
        <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" onClick={() => { log("tab_open", "bank-share"); setShareOpen(true); }}>
          Karnemi bankama göster
        </button>
      </TopBar>
      <main className="qd-main">
        <div className="qd-col">
          <div className="qd-sources">
            <SourceChip icon={<Building2 size={12} />} name={dataset.sources.erp} />
            <SourceChip icon={<Calculator size={12} />} name={dataset.sources.onMuhasebe} />
            <SourceChip icon={<Landmark size={12} />} name={dataset.sources.banka} />
            <SourceChip icon={<MessageCircle size={12} />} name="WhatsApp Business" />
          </div>

          <section className="qd-kpis" key={`kpi-${date}`}>
            <Kpi tone="accent" label="Bugünkü bakiye" value={<AnimatedNumber value={balance} format={money} />} sub={`${formatDateTr(date)} itibarıyla, ${dataset.sources.banka}`} />
            <Kpi label="8 hafta sonra (en olası)" value={<AnimatedNumber value={last.balanceBase} format={money} />} sub={`Aralık ${money(last.balanceLow)} – ${money(last.balanceHigh)}`} />
            <Kpi {...(tight.balanceLow < 0 ? { tone: "alert" as const } : {})} label="En dar hafta" value={<AnimatedNumber value={tight.balanceLow} format={money} />} sub={`${formatDateTr(tight.weekStart)} haftası, kötü senaryo`} />
            <Kpi label="Vadesi geçen alacak" value={<AnimatedNumber value={overdueSum} format={money} />} sub={`${overdue.length} fatura`} />
          </section>

          <CashFlowCard snap={snap} weeks={weeks} accuracy={accuracy} prevDate={prevDate} onScenario={(target, detail) => log("scenario_run", target, detail)} />

          <ScorecardCard dataset={dataset} prevDate={prevDate} date={date} onCustomer={openCustomer} />

          <section className="qd-card">
            <Tabs<Tab>
              value={tab}
              onChange={changeTab}
              items={[
                ["inflows", "Beklenen tahsilatlar"],
                ["customers", "Müşteri ödeme karnesi"],
                ["whatsapp", "WhatsApp sözleri"],
                ["sources", "Kaynaklar ve belgeler"],
              ]}
            />
            <div key={`${tab}-${date}`} className="qd-enter">
              {tab === "inflows" ? <InflowTable snap={snap} onCustomer={openCustomer} /> : null}
              {tab === "customers" ? <CustomerTable snap={snap} onCustomer={openCustomer} /> : null}
              {tab === "whatsapp" ? <PromiseList snap={snap} onCustomer={openCustomer} /> : null}
              {tab === "sources" ? <SourcesView snap={snap} /> : null}
            </div>
          </section>
        </div>

        <aside className="qd-side">
          <section className="qd-card qd-agent">
            <AgentFeed steps={steps} runKey={`${tenant}-${date}`} />
            <BriefingBox key={date} briefing={briefing} />
            <AskAgent ask={ask} suggestions={SUGGESTED_QUESTIONS} resetKey={date} onAsk={(q) => log("agent_question", undefined, q)} />
          </section>
          <section className="qd-card">
            <div className="qd-card__head">
              <h2>Ajanın önerileri</h2>
              <p>Siz onaylamadan hiçbir mesaj gitmez.</p>
            </div>
            <ActionQueue key={date} actions={actions} storageKey={`qd-actions-${tenant}-${date}`} onToast={setToast} onAction={(a, id) => log(a, id)} />
          </section>
        </aside>
      </main>
      <CustomerSheet snap={snap} customer={customer} onClose={() => setCustomer(null)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} dataset={dataset} date={date} onShared={() => { log("tab_open", "bank-share-sent"); setToast("Demo: paylaşım bankacı paneline yansıdı. Gerçekte hiçbir veri gönderilmedi."); }} />
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
          <span className="qd-eyebrow">Nakit akışı · 8 hafta</span>
          <h2>Kasa ne zaman daralıyor, ne zaman rahatlıyor</h2>
        </div>
        {accuracy && prevDate ? (
          <span className="qd-pill qd-pill--good" title="Önceki demo tarihinde yapılan tahmin ile o tarihten bugüne gerçekten gelen tahsilatın karşılaştırması">
            {formatDateTr(prevDate)} tahmini {money(accuracy.predicted)} · gerçekleşen {money(accuracy.actual)} · sapma %{Math.round(accuracy.errorRate * 100)}
          </span>
        ) : null}
      </div>
      <div className="qd-legend">
        <span><i style={{ background: "#dfeccb" }} />İyimser–kötümser aralık</span>
        <span><i style={{ background: "#203b30" }} />En olası bakiye</span>
        <span><i style={{ background: "#8fbf4d" }} />Beklenen tahsilat</span>
        <span><i style={{ background: "#e7b2a5" }} />Planlı ödemeler</span>
        {scenario ? <span><i style={{ background: "#b4442f" }} />Senaryo</span> : null}
      </div>
      <div className="qd-chart" key={snap.asOf}>
        {mounted ? (
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#66766a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => money(v)} tick={{ fill: "#66766a", fontSize: 11 }} axisLine={false} tickLine={false} width={78} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="#b4442f" strokeDasharray="4 4" />
              <Bar dataKey="inflow" fill="#8fbf4d" radius={[6, 6, 0, 0]} barSize={14} animationDuration={700} />
              <Bar dataKey="outflow" fill="#e7b2a5" radius={[0, 0, 6, 6]} barSize={14} animationDuration={700} />
              <Area dataKey="range" stroke="none" fill="#dfeccb" fillOpacity={0.9} animationDuration={900} />
              <Line dataKey="base" stroke="#203b30" strokeWidth={2.5} dot={{ r: 3, fill: "#203b30" }} animationDuration={900} />
              {scenario ? <Line dataKey="scenario" stroke="#b4442f" strokeWidth={2} strokeDasharray="6 4" dot={false} animationDuration={500} /> : null}
              <ReferenceDot x={formatDateTr(tight.weekStart).replace(/ \d{4}$/, "")} y={tight.balanceLow} r={6} fill="#b4442f" stroke="#fff" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <div className="qd-toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
        <span className="qd-eyebrow">Senaryo dene</span>
        <div className="qd-tabs" role="tablist" style={{ marginBottom: 0 }}>
          <button type="button" role="tab" aria-selected={mode === "late"} onClick={() => setMode("late")}>Müşteri geç öderse</button>
          <button type="button" role="tab" aria-selected={mode === "project"} onClick={() => { setMode("project"); if (!plan) setPlan(project); }}>Bu işi alırsam</button>
        </div>
        {mode === "late" ? (
          <>
            <select className="qd-select" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Geç ödeyecek müşteri">
              <option value="">Müşteri seçin…</option>
              {candidates.map(({ c, sum }) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({money(sum)})
                </option>
              ))}
            </select>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="range" min={7} max={60} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} disabled={!who} />
              <span className="qd-num">{days} gün geç öderse</span>
            </label>
            {scenario ? <ScenarioPill base={weeks} changed={scenario} /> : null}
          </>
        ) : null}
      </div>
      {mode === "project" ? (
        <div className="qd-project qd-enter">
          <label>
            <span>İşin bedeli (TL)</span>
            <input className="qd-input qd-num" type="number" min={10000} step={10000} value={project.amount} onChange={(e) => setP({ amount: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>
            <span>Avans: %{project.advancePct} ({money((project.amount * project.advancePct) / 100)})</span>
            <input type="range" min={0} max={60} step={5} value={project.advancePct} onChange={(e) => setP({ advancePct: Number(e.target.value) })} />
          </label>
          <label>
            <span>Ek maliyet (TL, ekip/dış hizmet)</span>
            <input className="qd-input qd-num" type="number" min={0} step={10000} value={project.cost} onChange={(e) => setP({ cost: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label>
            <span>Teslim süresi</span>
            <select className="qd-select" value={project.deliveryWeeks} onChange={(e) => setP({ deliveryWeeks: Number(e.target.value) })}>
              {[2, 3, 4, 6, 8].map((w) => (
                <option key={w} value={w}>{w} hafta</option>
              ))}
            </select>
          </label>
          <label>
            <span>Kalan ödemenin vadesi</span>
            <select className="qd-select" value={project.termDays} onChange={(e) => setP({ termDays: Number(e.target.value) })}>
              {[0, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d === 0 ? "Teslimde" : `Teslimden ${d} gün sonra`}</option>
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
  on_time: ["Tuttu (±3 gün)", "qd-pill--good"],
  early: ["Erken geldi", "qd-pill--good"],
  late: ["Geç geldi", "qd-pill--warn"],
  unpaid: ["Henüz gelmedi", "qd-pill--bad"],
} as const;
const PROMISE = { kept: ["Söz tutuldu", "qd-pill--good"], late: ["Gecikmeli", "qd-pill--warn"], broken: ["Tutulmadı", "qd-pill--bad"] } as const;

function ScorecardCard({ dataset, prevDate, date, onCustomer }: { dataset: ReturnType<typeof generateBusiness>; prevDate: string | undefined; date: string; onCustomer: (c: Customer) => void }) {
  const card = useMemo(() => (prevDate ? scorecard(dataset, prevDate, date) : null), [dataset, prevDate, date]);
  if (!card || !prevDate) {
    return (
      <section className="qd-card qd-enter">
        <span className="qd-eyebrow">Tahmin ve söz karnesi</span>
        <p style={{ marginTop: 6, color: "var(--qd-muted)" }}>
          Bu ilk tarih. {formatDateTr(DEMO_DATES[1])} veya {formatDateTr(DEMO_DATES[2])} tarihine geçin: ajanın bugün beklediği ödemelerin ve WhatsApp'ta verilen sözlerin o güne kadar nasıl sonuçlandığını burada tek tek göreceksiniz.
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
          <span className="qd-eyebrow">Tahmin ve söz karnesi</span>
          <h2>{formatDateTr(prevDate)} tarihinde beklenen ödemeler {formatDateTr(date)} tarihine kadar geldi mi?</h2>
        </div>
        <span className="qd-pill qd-pill--muted" title="Sentetik demo verisi üzerinde hesaplandı. Gerçek doğruluk pilotta, gerçek ödeme verisiyle ölçülecek.">Demo verisi · gerçek doğruluk pilotta ölçülecek</span>
      </div>
      <div className="qd-stat-row" style={{ marginTop: 0 }}>
        <div className="qd-stat">
          <span>Zamanında veya erken gelen</span>
          <b className="qd-num">{hit} / {card.predictions.length} ödeme</b>
        </div>
        <div className="qd-stat">
          <span>Ortalama sapma (gelen ödemeler)</span>
          <b className="qd-num">Ajan {card.avgErrorQualifi} gün</b>
          <span>Yalnız vade tarihine bakınca {card.avgErrorDueDate} gün</span>
        </div>
        <div className="qd-stat">
          <span>WhatsApp'ta verilen ödeme sözleri</span>
          <b className="qd-num">{card.promises.length ? `${kept} tutuldu · ${late} gecikti · ${broken} tutulmadı` : "Bu dönemde söz yok"}</b>
        </div>
      </div>
      <div className="qd-table-wrap">
        <table className="qd-table">
          <thead>
            <tr>
              <th>Müşteri</th>
              <th className="qd-right">Tutar</th>
              <th>Vade</th>
              <th>Ajanın beklediği</th>
              <th>Gerçekleşen</th>
              <th>Sonuç</th>
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
                <td><span className={`qd-pill ${OUTCOME[p.outcome][1]}`}>{OUTCOME[p.outcome][0]}{p.errorDays !== null && Math.abs(p.errorDays) > 0 ? ` (${p.errorDays > 0 ? "+" : ""}${p.errorDays} g)` : ""}</span></td>
              </tr>
            ))}
            {card.promises.map((p) => (
              <tr key={p.message.id} data-clickable onClick={() => onCustomer(p.customer)}>
                <td>{p.customer.name}<div style={{ color: "var(--qd-muted)", fontSize: 11.5 }}>WhatsApp: “{p.message.text}”</div></td>
                <td className="qd-right qd-num">{money(p.amount)}</td>
                <td className="qd-num">—</td>
                <td className="qd-num">Söz: {formatDateTr(p.message.promiseDate as string)}</td>
                <td className="qd-num">{p.paidDate ? formatDateTr(p.paidDate) : "—"}</td>
                <td><span className={`qd-pill ${PROMISE[p.outcome][1]}`}>{PROMISE[p.outcome][0]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--qd-muted)", fontSize: 12, marginTop: 10 }}>
        Yalnız {formatDateTr(date)} itibarıyla sonucu belli olan tahminler değerlendirilir; sonraki haftalar için yapılan tahminler henüz sınanmadı.
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
      <b>{negative ? "Bu iş, kötü senaryoda kasayı eksiye düşürüyor." : "Bu iş nakit açısından taşınabilir."}</b>
      <span>
        En dar hafta {formatDateTr(t1.weekStart)}: beklenen {money(t1.balanceBase)} (bu iş olmadan {money(t0.balanceBase)}), kötü senaryoda {money(t1.balanceLow)}.
        {negative ? ` Avansı artırmak, maliyeti teslime yaymak ya da yaklaşık ${money(need)} kısa vadeli finansman gerekir.` : ""}
      </span>
      {rest ? <span>Kalan {money(rest.amount)} {formatDateTr(rest.date)} tarihinde{rest.date > lastWeek ? "; 8 haftalık görünümün dışında" : ""}.</span> : null}
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
          <SheetTitle>Ödeme karnenizi bankanızla paylaşın</SheetTitle>
          <SheetDescription>
            Banka sizi izlemiyor; iyi ödeme karnenizi siz götürüyorsunuz. Daha hızlı limit görüşmesi ve uygun finansman için yalnız aşağıdaki özet gider. Paylaşımı istediğiniz an geri çekebilirsiniz.
          </SheetDescription>
        </SheetHeader>
        {summary ? <ShareSummaryView summary={summary} audience="business" /> : null}
        <div className="qd-action__buttons" style={{ marginTop: 16 }}>
          {sent ? (
            <>
              <span className="qd-pill qd-pill--good">Paylaşıldı · demo</span>
              <a className="qd-btn qd-btn--primary qd-btn--sm" href={`/demo/banka?b=01&d=${date}&s=${dataset.tenant}`}>Bankacı ekranında gör</a>
            </>
          ) : (
            <button type="button" className="qd-btn qd-btn--primary" onClick={() => { setSent(true); onShared(); }}>
              Bankama gönder (demo)
            </button>
          )}
        </div>
        <p style={{ color: "var(--qd-muted)", fontSize: 12, marginTop: 10 }}>Demo: gerçek bir bankaya veri gönderilmez. Banka entegrasyonu pilot ve izin sözleşmesiyle kurulur.</p>
      </SheetContent>
    </Sheet>
  );
}

function ScenarioPill({ base, changed }: { base: Weeks; changed: Weeks }) {
  const gap = scenarioGap(base, changed);
  const negative = changed.some((w) => w.balanceBase < 0);
  return (
    <span className={`qd-pill ${negative ? "qd-pill--bad" : "qd-pill--warn"}`}>
      En büyük etki {formatDateTr(gap.weekStart).replace(/ \d{4}$/, "")}: {money(gap.changed - gap.base)}
      {negative ? " · kasa ekside" : ""}
    </span>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { weekStart: string; base: number; range: [number, number]; inflow: number; outflow: number; scenario?: number } }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="qd-tooltip">
      <b>{formatDateTr(p.weekStart)} haftası</b>
      <div><span>Tahsilat</span><span className="qd-num">+{money(p.inflow)}</span></div>
      <div><span>Ödemeler</span><span className="qd-num">{money(p.outflow)}</span></div>
      <div><span>En olası bakiye</span><b className="qd-num" style={{ margin: 0 }}>{money(p.base)}</b></div>
      <div><span>Aralık</span><span className="qd-num">{money(p.range[0])} – {money(p.range[1])}</span></div>
      {p.scenario !== undefined ? <div><span>Senaryo</span><span className="qd-num">{money(p.scenario)}</span></div> : null}
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
            <th>Müşteri</th>
            <th>Belge</th>
            <th>Vade</th>
            <th>Ajanın beklediği</th>
            <th className="qd-right">Tutar</th>
            <th>Neden</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => {
            const late = diffDays(i.expected, i.receivable.dueDate);
            return (
              <tr key={i.receivable.id} data-clickable onClick={() => onCustomer(i.customer)}>
                <td>{i.customer.name}</td>
                <td><span className={`qd-pill ${i.receivable.kind === "cheque" || i.receivable.kind === "note" ? "qd-pill--warn" : "qd-pill--muted"}`}>{DOC_LABEL[i.receivable.kind]}</span></td>
                <td className="qd-num">{formatDateTr(i.receivable.dueDate)}</td>
                <td className="qd-num">
                  {i.atRisk ? <span className="qd-pill qd-pill--bad">Riskli · tahmine dahil değil</span> : <>{formatDateTr(i.expected)} {late > 3 ? <span className="qd-pill qd-pill--warn">+{late} gün</span> : late < -1 ? <span className="qd-pill qd-pill--good">erken</span> : null}</>}
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
        <input className="qd-input" placeholder="Müşteri ara" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Müşteri ara" />
        <span style={{ color: "var(--qd-muted)", fontSize: 12.5 }}>{rows.length} müşteri · A dakik, D riskli</span>
      </div>
      <div className="qd-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
        <table className="qd-table">
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Not</th>
              {th("medianDelay", "Ortanca gecikme")}
              <th className="qd-right">Zamanında</th>
              {th("openAmount", "Açık")}
              {th("overdueAmount", "Vadesi geçen")}
              {th("trend", "Eğilim")}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map(({ c, p }) => (
              <tr key={c.id} data-clickable onClick={() => onCustomer(c)}>
                <td>
                  {c.name}
                  <div style={{ color: "var(--qd-muted)", fontSize: 11.5 }}>{c.sector}</div>
                </td>
                <td><Grade grade={p.grade} /></td>
                <td className="qd-right qd-num">{p.paidCount ? `${p.medianDelay > 0 ? "+" : ""}${p.medianDelay} gün` : "—"}</td>
                <td className="qd-right qd-num">{p.onTimeRate === null ? "—" : `%${Math.round(p.onTimeRate * 100)}`}</td>
                <td className="qd-right qd-num">{money(p.openAmount)}</td>
                <td className="qd-right qd-num" style={{ color: p.overdueAmount ? "var(--qd-bad)" : undefined }}>{p.overdueAmount ? money(p.overdueAmount) : "—"}</td>
                <td className="qd-right">
                  {p.trend > 2 ? <span className="qd-pill qd-pill--bad"><ArrowUpRight size={12} />{p.trend} gün yavaş</span> : p.trend < -2 ? <span className="qd-pill qd-pill--good"><ArrowDownRight size={12} />hızlandı</span> : <span className="qd-pill qd-pill--muted">sabit</span>}
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
  if (!promises.length) return <p style={{ color: "var(--qd-muted)" }}>Bu tarihe kadar WhatsApp'ta ödeme konuşması yok.</p>;
  return (
    <div className="qd-table-wrap">
      <table className="qd-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Müşteri</th>
            <th>Mesaj</th>
            <th>Söz</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {promises.map((m) => {
            const paid = snap.receivables.find((r) => r.id === m.receivableId)?.paidDate;
            const state = !m.promiseDate ? ["Nakit sıkıntısı işareti", "qd-pill--bad"] : paid ? ["Ödendi", "qd-pill--good"] : m.promiseDate < snap.asOf ? ["Tutulmadı", "qd-pill--bad"] : ["Bekleniyor", "qd-pill--warn"];
            const c = customers.get(m.customerId)!;
            return (
              <tr key={m.id} data-clickable onClick={() => onCustomer(c)}>
                <td className="qd-num">{formatDateTr(m.date)}</td>
                <td>{c.name}</td>
                <td style={{ maxWidth: 320 }}>“{m.text}”</td>
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
    { icon: <Building2 size={16} />, name: d.sources.erp, kind: "ERP (demo)", lines: [`${d.customers.length} müşteri kartı`, `${invoices.length} sipariş`, `${snap.pastExpenses.filter((e) => e.source === "mockerp").length + snap.plannedExpenses.filter((e) => e.source === "mockerp").length} planlı/gerçek gider`] },
    { icon: <Calculator size={16} />, name: d.sources.onMuhasebe, kind: "Ön muhasebe (demo)", lines: [`${invoices.length} fatura`, `${paid.length} tahsilat kaydı`, `${snap.receivables.filter((r) => r.kind === "cheque").length} çek, ${snap.receivables.filter((r) => r.kind === "note").length} senet kaydı`] },
    { icon: <Landmark size={16} />, name: d.sources.banka, kind: "Banka hesabı (demo)", lines: [`Bakiye ${money(currentBalance(snap))}`, `${paid.length + snap.pastExpenses.length} hesap hareketi`, "Günlük eşleştirme"] },
    { icon: <MessageCircle size={16} />, name: "WhatsApp Business", kind: "Sohbet dışa aktarımı (demo)", lines: [`${snap.chats.length} mesaj`, `${snap.chats.filter((m) => m.promiseDate).length} ödeme sözü`, "Kaynak mesaj her zaman gösterilir"] },
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
        <b>Sözleşmeler</b>
        <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
          {d.contracts.filter((c) => c.signedDate <= snap.asOf).map((c) => (
            <li key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eef1ea" }}>
              <FileText size={15} />
              <span style={{ flex: 1 }}>{c.title} · {d.customers.find((x) => x.id === c.customerId)?.name}</span>
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
              <SheetDescription>{customer.sector} · {p.paidCount} ödeme geçmişi · {formatDateTr(snap.asOf)} itibarıyla</SheetDescription>
            </SheetHeader>
            <div className="qd-stat-row">
              <div className="qd-stat"><span>Ortanca gecikme</span><b className="qd-num">{p.medianDelay} gün</b></div>
              <div className="qd-stat"><span>Zamanında ödeme</span><b className="qd-num">{p.onTimeRate === null ? "—" : `%${Math.round(p.onTimeRate * 100)}`}</b></div>
              <div className="qd-stat"><span>Açık alacak</span><b className="qd-num">{money(p.openAmount)}</b></div>
            </div>
            <span className="qd-eyebrow">Son ödemeler: vadeye göre kaç gün geç</span>
            <div style={{ height: 140, marginTop: 6 }}>
              {mounted ? (
                <ResponsiveContainer>
                  <BarChart data={history}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#66766a" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => `${v} gün`} />
                    <ReferenceLine y={0} stroke="#cfd8c7" />
                    <Bar dataKey="delay" radius={[4, 4, 4, 4]}>
                      {history.map((h, i) => (
                        <Cell key={i} fill={h.delay > 7 ? "#b4442f" : h.delay > 2 ? "#d9a14a" : "#2f7d4f"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="qd-eyebrow">Açık belgeler</span>
              {open.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e6ebe0", fontSize: 13 }}>
                  <span>{r.id}</span>
                  <span className="qd-num">vade {formatDateTr(r.dueDate)}</span>
                  <b className="qd-num">{money(r.amount)}</b>
                </div>
              ))}
              {!open.length ? <p style={{ color: "var(--qd-muted)", fontSize: 13 }}>Açık belge yok.</p> : null}
            </div>
            {chats.length ? (
              <div style={{ marginTop: 16 }}>
                <span className="qd-eyebrow">WhatsApp</span>
                <div className="qd-chat" style={{ marginTop: 6 }}>
                  {chats.map((m) => (
                    <div key={m.id} className={`qd-bubble${m.from === "us" ? " qd-bubble--us" : ""}`}>
                      {m.text}
                      <small>{formatDateTr(m.date)}{m.promiseDate ? ` · söz: ${formatDateTr(m.promiseDate)}` : ""}</small>
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
