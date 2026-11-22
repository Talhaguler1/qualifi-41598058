import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Plus, Printer, RotateCcw, Trash2, Upload } from "lucide-react";
import { Kpi, Tabs, Toast, TopBar, useLocalState, useMounted } from "@/components/demo/shared";
import {
  buildPlan,
  COST_LABEL,
  DEFAULT_ASSUMPTIONS,
  mergeAssumptions,
  PACKAGE_LABEL,
  packageCostTotal,
  SCENARIO_LABEL,
  tl,
  type CostCategory,
  type FinanceAssumptions,
  type PackageCost,
  type Scenario,
} from "@/lib/finance-model";

const STORE_KEY = "qf-finance-model-v2";
const PACKAGE_FIELDS = { free: "costFree", sme: "costSme", growth: "costGrowth" } as const;
const COST_PARTS: ReadonlyArray<readonly [keyof PackageCost, string]> = [
  ["ai", "Yapay zekâ"],
  ["messaging", "WhatsApp mesaj ücreti"],
  ["integrations", "Entegrasyon ücretleri"],
  ["hosting", "Barındırma"],
];
const CATS = Object.keys(COST_LABEL) as CostCategory[];
const CAT_COLOR: Record<CostCategory, string> = {
  team: "#16302a",
  infra: "#2f7d4f",
  acquisition: "#8fbf4d",
  compliance: "#e0873a",
  bank: "#5d8fb0",
  other: "#a9b2ab",
};

type Kind = "tl" | "pct" | "int";
type Field = readonly [keyof FinanceAssumptions, string, Kind, string?];

const GROUPS: ReadonlyArray<readonly [string, ReadonlyArray<Field>]> = [
  [
    "Pazar",
    [
      ["smeCount", "KOBİ sayısı (TÜİK 2024)", "int"],
      ["samSmall", "SAM: küçük firma (tahmin)", "int"],
      ["samMedium", "SAM: orta firma (tahmin)", "int"],
      ["somFirms", "SOM: ilk hedef firma", "int"],
    ],
  ],
  [
    "Fiyatlar (aylık, KDV hariç)",
    [
      ["priceSme", "KOBİ paketi", "tl"],
      ["priceGrowth", "Büyüme paketi", "tl"],
      ["bankMonthlyFee", "Banka lisansı (banka başına)", "tl"],
      ["annualPriceIncrease", "Yıllık fiyat artışı", "pct"],
    ],
  ],
  [
    "Büyüme",
    [
      ["newPaidMonth1", "1. ay yeni ücretli firma", "int"],
      ["growthYear1", "Aylık büyüme (ilk 12 ay)", "pct"],
      ["growthLater", "Aylık büyüme (12. aydan sonra)", "pct"],
      ["growthShare", "Yeni firmaların Büyüme paketi payı", "pct"],
      ["churnMonthly", "Aylık kayıp (churn)", "pct"],
      ["freePerPaid", "Ücretli firma başına ücretsiz hesap", "int"],
      ["firstBankMonth", "İlk banka lisansı ayı (0 = yok)", "int"],
      ["monthsBetweenBanks", "Yeni banka her … ayda (0 = tek)", "int"],
    ],
  ],
  [
    "Edinme ve komisyon",
    [
      ["cacSme", "Edinme maliyeti / KOBİ firması", "tl"],
      ["cacGrowth", "Edinme maliyeti / Büyüme firması", "tl"],
      ["marketingFixed", "Sabit pazarlama (aylık)", "tl"],
      ["paymentCommission", "Ödeme komisyonu", "pct"],
    ],
  ],
  [
    "Enflasyon ve beklenmedik gider",
    [
      ["costInflationMonthly", "Aylık maliyet artışı (maaş, kira, reklam)", "pct"],
      [
        "serveCostChangeMonthly",
        "Hesap başı maliyet değişimi (kur − yapay zekâ ucuzlaması)",
        "pct",
      ],
      ["contingency", "Beklenmedik gider payı", "pct"],
    ],
  ],
  [
    "Yatırım ve değerleme",
    [
      ["horizonMonths", "Plan süresi (ay)", "int"],
      ["roundMonths", "Bu turun sağlayacağı pist (ay)", "int"],
      ["startCash", "Mevcut nakit", "tl"],
      ["grantAmount", "Hibe (TÜBİTAK, KOSGEB; 0 = yok)", "tl"],
      ["grantMonth", "Hibenin geldiği ay", "int"],
      ["safetyBuffer", "Güvenlik payı", "pct"],
      ["preMoneyValuation", "Yatırım öncesi değerleme", "tl"],
      ["revenueMultiple", "Değerleme çarpanı (yıllık gelir ×)", "int"],
    ],
  ],
];

const num = (v: number, d = 0) => v.toLocaleString("tr-TR", { maximumFractionDigits: d });
const pct = (v: number, d = 0) => `%${num(v * 100, d)}`;
const monthText = (m: number | null) => (m === null ? "plan içinde yok" : `${m}. ay`);

export function FinancePlanner({ accountSlot }: { accountSlot: ReactNode }) {
  const mounted = useMounted();
  const [saved, setSaved] = useLocalState<unknown>(STORE_KEY, DEFAULT_ASSUMPTIONS);
  const a = useMemo(() => mergeAssumptions(saved), [saved]);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [toast, setToast] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const plan = useMemo(() => buildPlan(a, scenario), [a, scenario]);
  const set = (patch: Partial<FinanceAssumptions>) => setSaved({ ...a, ...patch });

  const years = useMemo(() => {
    const out: { year: number; firms: number; revenue: number; cost: number; net: number }[] = [];
    for (let y = 0; y * 12 < plan.rows.length; y++) {
      const slice = plan.rows.slice(y * 12, y * 12 + 12);
      const last = slice[slice.length - 1];
      if (!last) break;
      const revenue = slice.reduce((s, r) => s + r.revenue, 0);
      const cost = slice.reduce((s, r) => s + r.totalCost, 0);
      out.push({
        year: y + 1,
        firms: last.smeCustomers + last.growthCustomers,
        revenue,
        cost,
        net: revenue - cost,
      });
    }
    return out;
  }, [plan]);

  const chart = plan.rows.map((r) => ({
    label: `${r.month}`,
    gelir: Math.round(r.revenue),
    gider: Math.round(-r.totalCost),
    nakit: Math.round(plan.fundingNeed + a.startCash + r.cumulative),
  }));
  const useTotal = CATS.reduce((s, c) => s + plan.useOfFunds[c], 0);
  const last = plan.rows[plan.rows.length - 1];

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qualifi-finans-modeli.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file: File) => {
    try {
      setSaved(mergeAssumptions(JSON.parse(await file.text())));
      setToast("Varsayımlar yüklendi.");
    } catch {
      setToast("Dosya okunamadı; JSON olmalı.");
    }
  };

  return (
    <div className="qd qf-fin">
      <TopBar
        title="Finans modeli"
        subtitle="Pazar, gelir planı, yatırım ihtiyacı ve geri dönüş · tüm sayılar varsayımdır"
        badge={null}
      >
        <a className="qd-btn qd-btn--sm" href="/app">
          Yönetim
        </a>
        {accountSlot}
      </TopBar>
      <main className="qd-main">
        <div className="qd-col">
          <section className="qd-card qf-fin__bar">
            <Tabs<Scenario>
              value={scenario}
              onChange={setScenario}
              items={(Object.keys(SCENARIO_LABEL) as Scenario[]).map(
                (s) => [s, SCENARIO_LABEL[s]] as const,
              )}
            />
            <div className="qd-spacer" />
            <button
              type="button"
              className="qd-btn qd-btn--sm qd-btn--ghost"
              onClick={() => window.print()}
            >
              <Printer size={14} /> Yazdır
            </button>
            <button type="button" className="qd-btn qd-btn--sm qd-btn--ghost" onClick={exportJson}>
              <Download size={14} /> JSON indir
            </button>
            <button
              type="button"
              className="qd-btn qd-btn--sm qd-btn--ghost"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={14} /> JSON yükle
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="qd-btn qd-btn--sm qd-btn--ghost"
              onClick={() => {
                setSaved(DEFAULT_ASSUMPTIONS);
                setToast("Varsayılan değerlere dönüldü.");
              }}
            >
              <RotateCcw size={14} /> Sıfırla
            </button>
          </section>

          <div className="qd-kpis">
            <Kpi
              tone="accent"
              label="Bu turun yatırım ihtiyacı"
              value={tl(plan.fundingNeed)}
              sub={`${num(a.roundMonths)} ay pist · %${num(a.safetyBuffer * 100)} güvenlik payıyla`}
            />
            <Kpi
              label={`${plan.rows.length} ayda toplam dış sermaye`}
              value={tl(plan.totalCapitalNeed)}
              sub={
                plan.needsNextRound
                  ? `Fark (${tl(plan.totalCapitalNeed - plan.fundingNeed)}) sonraki turla`
                  : "Bu tur yetiyor"
              }
            />
            <Kpi
              label="Aylık başabaş"
              value={monthText(plan.breakEvenMonth)}
              sub={
                plan.paybackMonth
                  ? `Harcanan nakit ${plan.paybackMonth}. ayda geri kazanılıyor`
                  : "Gelir, gideri kalıcı olarak geçtiği ay"
              }
            />
            <Kpi
              label={`${plan.rows.length}. ay yıllık gelir (ARR)`}
              value={tl(plan.endArr)}
              sub={`${num((last?.smeCustomers ?? 0) + (last?.growthCustomers ?? 0))} ücretli firma · ${last?.banks ?? 0} banka`}
            />
          </div>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Pazar</span>
                <h2>TAM · SAM · SOM</h2>
                <p>
                  KOBİ sayısı TÜİK 2024. Ölçek dağılımı ve paket eşleşmesi tahmindir. Banka
                  lisansları dahil değildir.
                </p>
              </div>
            </div>
            <div className="qf-fin__market">
              {(
                [
                  [
                    "TAM",
                    "Tüm KOBİ'ler",
                    plan.market.tamMonthly,
                    `${num(a.smeCount - a.samMedium)} × ${tl(a.priceSme)} + ${num(a.samMedium)} × ${tl(a.priceGrowth)}`,
                  ],
                  [
                    "SAM",
                    "Alacağı çok olan küçük ve orta firmalar",
                    plan.market.samMonthly,
                    `${num(a.samSmall)} × ${tl(a.priceSme)} + ${num(a.samMedium)} × ${tl(a.priceGrowth)}`,
                  ],
                  [
                    "SOM",
                    "İlk hedef",
                    plan.market.somMonthly,
                    `${num(a.somFirms)} × ${tl(a.priceSme)}`,
                  ],
                ] as const
              ).map(([k, who, v, f]) => (
                <div key={k} className="qf-fin__ring">
                  <span className="qd-eyebrow">{k}</span>
                  <strong>
                    {tl(v)} <small>/ ay</small>
                  </strong>
                  <span>{who}</span>
                  <small>
                    {f} · yılda {tl(v * 12)}
                  </small>
                </div>
              ))}
            </div>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Plan · {SCENARIO_LABEL[scenario]}</span>
                <h2>Aylık gelir, gider ve yatırımla nakit</h2>
                <p>
                  Nakit çizgisi, {tl(plan.fundingNeed)} yatırımın 1. ayda geldiğini varsayar.
                  {plan.runwayMonths !== null
                    ? ` Bu tutar ${plan.runwayMonths}. aya kadar yetiyor.`
                    : ""}
                </p>
              </div>
            </div>
            <div className="qd-chart qf-fin__chart">
              {mounted ? (
                <ResponsiveContainer>
                  <ComposedChart data={chart} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#5d6c61", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tickFormatter={(v: number) => tl(v, 0)}
                      tick={{ fill: "#5d6c61", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={92}
                    />
                    <Tooltip formatter={(v: number) => tl(v)} labelFormatter={(l) => `${l}. ay`} />
                    <ReferenceLine y={0} stroke="#c0503a" strokeDasharray="4 4" />
                    <Area
                      dataKey="nakit"
                      name="Nakit (yatırımla)"
                      stroke="#16302a"
                      fill="#d6ee9e"
                      fillOpacity={0.45}
                      strokeWidth={2}
                    />
                    <Bar
                      dataKey="gelir"
                      name="Gelir"
                      fill="#8fbf4d"
                      barSize={8}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="gider"
                      name="Gider"
                      fill="#e7b2a5"
                      barSize={8}
                      radius={[0, 0, 4, 4]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div className="qd-table-wrap">
              <table className="qd-table">
                <thead>
                  <tr>
                    <th>Yıl</th>
                    <th className="qd-right">Yıl sonu ücretli firma</th>
                    <th className="qd-right">Gelir</th>
                    <th className="qd-right">Gider</th>
                    <th className="qd-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.year}>
                      <td>{y.year}. yıl</td>
                      <td className="qd-right qd-num">{num(y.firms)}</td>
                      <td className="qd-right qd-num">{tl(y.revenue)}</td>
                      <td className="qd-right qd-num">{tl(y.cost)}</td>
                      <td className={`qd-right qd-num ${y.net < 0 ? "qf-neg" : "qf-pos"}`}>
                        {tl(y.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Bu tur nereye gidiyor</span>
                <h2>İlk {plan.useOfFundsMonths} ayın giderleri</h2>
                <p>
                  Bu sürede{" "}
                  {num(
                    (plan.rows[plan.useOfFundsMonths - 1]?.smeCustomers ?? 0) +
                      (plan.rows[plan.useOfFundsMonths - 1]?.growthCustomers ?? 0),
                  )}{" "}
                  ücretli firmaya ve aylık {tl(plan.rows[plan.useOfFundsMonths - 1]?.revenue ?? 0)}{" "}
                  gelire ulaşılıyor.
                </p>
              </div>
            </div>
            <div className="qf-fin__use">
              {CATS.filter((c) => plan.useOfFunds[c] > 0).map((c) => (
                <div key={c} className="qf-fin__userow">
                  <span>
                    <i style={{ background: CAT_COLOR[c] }} />
                    {COST_LABEL[c]}
                  </span>
                  <div className="qf-fin__track">
                    <div
                      style={{
                        width: `${(plan.useOfFunds[c] / useTotal) * 100}%`,
                        background: CAT_COLOR[c],
                      }}
                    />
                  </div>
                  <b className="qd-num">{pct(plan.useOfFunds[c] / useTotal)}</b>
                  <small className="qd-num">{tl(plan.useOfFunds[c])}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Birim ekonomi</span>
                <h2>Ücretli firma başına (1. ay fiyatlarıyla)</h2>
              </div>
            </div>
            <div className="qd-kpis">
              <Kpi
                label="Firma başına aylık gelir (ARPA)"
                value={tl(plan.unit.arpa)}
                sub={`Brüt marj ${pct(plan.unit.grossMargin)}`}
              />
              <Kpi
                label="Müşteri yaşam boyu değeri (LTV)"
                value={tl(plan.unit.ltv)}
                sub={`Aylık kayıp ${pct(a.churnMonthly, 1)} ile`}
              />
              <Kpi
                label="LTV / CAC"
                value={Number.isFinite(plan.unit.ltvToCac) ? `${num(plan.unit.ltvToCac, 1)}×` : "—"}
                sub={`CAC ${tl(plan.unit.cac)}`}
              />
              <Kpi
                label="CAC geri dönüşü"
                value={
                  Number.isFinite(plan.unit.cacPaybackMonths)
                    ? `${num(plan.unit.cacPaybackMonths, 1)} ay`
                    : "—"
                }
                sub="Edinme maliyeti kaç ayda çıkıyor"
              />
            </div>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Paket maliyetleri</span>
                <h2>Bir hesap bize ayda kaça mal oluyor</h2>
                <p>
                  1. ay fiyatlarıyla, hesap başına. Yapay zekâ ve WhatsApp ücretleri dolar bazlıdır;
                  kur artışı aylık maliyet artışına dahildir. Hücreleri değiştirebilirsiniz.
                </p>
              </div>
            </div>
            <div className="qd-table-wrap">
              <table className="qd-table qf-fin__pkg">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th className="qd-right">Fiyat</th>
                    {COST_PARTS.map(([, label]) => (
                      <th key={label} className="qd-right">
                        {label}
                      </th>
                    ))}
                    <th className="qd-right">Toplam maliyet</th>
                    <th className="qd-right">Brüt marj</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.unit.packages.map((p) => {
                    const field = PACKAGE_FIELDS[p.key];
                    const cost = a[field];
                    return (
                      <tr key={p.key}>
                        <td>
                          <b>{PACKAGE_LABEL[p.key]}</b>
                        </td>
                        <td className="qd-right qd-num">{p.price ? tl(p.price) : "Ücretsiz"}</td>
                        {COST_PARTS.map(([part]) => (
                          <td key={part} className="qd-right">
                            <input
                              className="qd-cell qd-num"
                              type="number"
                              min={0}
                              value={cost[part]}
                              aria-label={`${PACKAGE_LABEL[p.key]} ${part}`}
                              onChange={(e) =>
                                set({
                                  [field]: {
                                    ...cost,
                                    [part]: Math.max(0, Number(e.target.value) || 0),
                                  },
                                } as Partial<FinanceAssumptions>)
                              }
                              style={{ width: 76, textAlign: "right" }}
                            />
                          </td>
                        ))}
                        <td className="qd-right qd-num">{tl(packageCostTotal(cost))}</td>
                        <td
                          className={`qd-right qd-num ${p.price && p.margin < 0.5 ? "qf-neg" : "qf-pos"}`}
                        >
                          {p.price ? pct(p.margin) : `${num(a.freePerPaid)} hesap / ücretli`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="qf-fin__note">
              Ücretsiz hesapların maliyeti ücretli firmalar tarafından taşınır; birim ekonomideki
              brüt marj bunu ve ödeme komisyonunu içerir.
            </p>
          </section>

          <section className="qd-card">
            <div className="qd-card__head">
              <div>
                <span className="qd-eyebrow">Yatırımcı için</span>
                <h2>{plan.rows.length}. ay sonunda tahmini değer</h2>
                <p>
                  Yıllık gelir × {num(a.revenueMultiple)} çarpanıyla basit bir değerleme. Gerçek bir
                  teklif değil, konuşma zemini.
                </p>
              </div>
            </div>
            <div className="qd-kpis">
              <Kpi
                label="Yatırımcının payı"
                value={pct(plan.investorStake, 1)}
                sub={`${tl(a.preMoneyValuation)} değerleme + ${tl(plan.fundingNeed)}`}
              />
              <Kpi
                label="Şirket değeri"
                value={tl(plan.endValuation)}
                sub={`${tl(plan.endArr)} yıllık gelir`}
              />
              <Kpi
                tone="accent"
                label="Yatırımın katı"
                value={plan.fundingNeed > 0 ? `${num(plan.investorMultiple, 1)}×` : "—"}
                sub={`${plan.rows.length}. ay sonunda`}
              />
              <Kpi
                label="Payın değeri"
                value={tl(plan.investorStake * plan.endValuation)}
                sub="Sulandırma hariç"
              />
            </div>
          </section>
        </div>

        <aside className="qd-side qf-fin__side">
          <section className="qd-card">
            <h2 className="qf-fin__h">Varsayımlar</h2>
            <p className="qf-fin__note">
              Değişiklikler yalnızca bu tarayıcıda saklanır. Başka bilgisayara taşımak için JSON
              indirip yükleyin.
            </p>
            {GROUPS.map(([title, fields]) => (
              <fieldset key={title} className="qf-fin__group">
                <legend>{title}</legend>
                {fields.map(([key, label, kind]) => (
                  <NumberField
                    key={key}
                    label={label}
                    kind={kind}
                    value={a[key] as number}
                    onChange={(v) => set({ [key]: v } as Partial<FinanceAssumptions>)}
                  />
                ))}
              </fieldset>
            ))}

            <fieldset className="qf-fin__group">
              <legend>Ekip (aylık işveren maliyeti)</legend>
              {a.team.map((r, i) => (
                <div key={i} className="qf-fin__line">
                  <input
                    className="qd-input"
                    value={r.name}
                    aria-label="Rol"
                    onChange={(e) =>
                      set({
                        team: a.team.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={0}
                    step={1000}
                    value={r.monthlyCost}
                    aria-label="Aylık maliyet"
                    onChange={(e) =>
                      set({
                        team: a.team.map((x, j) =>
                          j === i ? { ...x, monthlyCost: Number(e.target.value) || 0 } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={1}
                    value={r.startMonth}
                    aria-label="Başlangıç ayı"
                    title="Başlangıç ayı"
                    onChange={(e) =>
                      set({
                        team: a.team.map((x, j) =>
                          j === i
                            ? { ...x, startMonth: Math.max(1, Number(e.target.value) || 1) }
                            : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="qd-btn qd-btn--ghost qd-btn--sm"
                    aria-label="Rolü sil"
                    onClick={() => set({ team: a.team.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="qd-btn qd-btn--sm"
                onClick={() =>
                  set({
                    team: [...a.team, { name: "Yeni rol", monthlyCost: 80_000, startMonth: 1 }],
                  })
                }
              >
                <Plus size={13} /> Rol ekle
              </button>
            </fieldset>

            <fieldset className="qf-fin__group">
              <legend>Sürekli giderler (aylık)</legend>
              {a.recurring.map((o, i) => (
                <div key={i} className="qf-fin__line qf-fin__line--oneoff">
                  <input
                    className="qd-input"
                    value={o.name}
                    aria-label="Kalem"
                    onChange={(e) =>
                      set({
                        recurring: a.recurring.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={0}
                    step={1000}
                    value={o.amount}
                    aria-label="Aylık tutar"
                    onChange={(e) =>
                      set({
                        recurring: a.recurring.map((x, j) =>
                          j === i ? { ...x, amount: Number(e.target.value) || 0 } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={1}
                    value={o.startMonth}
                    aria-label="Başlangıç ayı"
                    title="Başlangıç ayı"
                    onChange={(e) =>
                      set({
                        recurring: a.recurring.map((x, j) =>
                          j === i
                            ? { ...x, startMonth: Math.max(1, Number(e.target.value) || 1) }
                            : x,
                        ),
                      })
                    }
                  />
                  <select
                    className="qd-select"
                    value={o.category}
                    aria-label="Kategori"
                    onChange={(e) =>
                      set({
                        recurring: a.recurring.map((x, j) =>
                          j === i ? { ...x, category: e.target.value as CostCategory } : x,
                        ),
                      })
                    }
                  >
                    {CATS.map((c) => (
                      <option key={c} value={c}>
                        {COST_LABEL[c]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="qd-btn qd-btn--ghost qd-btn--sm"
                    aria-label="Kalemi sil"
                    onClick={() => set({ recurring: a.recurring.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="qd-btn qd-btn--sm"
                onClick={() =>
                  set({
                    recurring: [
                      ...a.recurring,
                      { name: "Yeni gider", amount: 10_000, startMonth: 1, category: "other" },
                    ],
                  })
                }
              >
                <Plus size={13} /> Gider ekle
              </button>
            </fieldset>

            <fieldset className="qf-fin__group">
              <legend>Tek seferlik giderler</legend>
              {a.oneOffs.map((o, i) => (
                <div key={i} className="qf-fin__line qf-fin__line--oneoff">
                  <input
                    className="qd-input"
                    value={o.name}
                    aria-label="Kalem"
                    onChange={(e) =>
                      set({
                        oneOffs: a.oneOffs.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={0}
                    step={10000}
                    value={o.amount}
                    aria-label="Tutar"
                    onChange={(e) =>
                      set({
                        oneOffs: a.oneOffs.map((x, j) =>
                          j === i ? { ...x, amount: Number(e.target.value) || 0 } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="qd-input qd-num"
                    type="number"
                    min={1}
                    value={o.month}
                    aria-label="Ay"
                    title="Ay"
                    onChange={(e) =>
                      set({
                        oneOffs: a.oneOffs.map((x, j) =>
                          j === i ? { ...x, month: Math.max(1, Number(e.target.value) || 1) } : x,
                        ),
                      })
                    }
                  />
                  <select
                    className="qd-select"
                    value={o.category}
                    aria-label="Kategori"
                    onChange={(e) =>
                      set({
                        oneOffs: a.oneOffs.map((x, j) =>
                          j === i ? { ...x, category: e.target.value as CostCategory } : x,
                        ),
                      })
                    }
                  >
                    {CATS.map((c) => (
                      <option key={c} value={c}>
                        {COST_LABEL[c]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="qd-btn qd-btn--ghost qd-btn--sm"
                    aria-label="Kalemi sil"
                    onClick={() => set({ oneOffs: a.oneOffs.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="qd-btn qd-btn--sm"
                onClick={() =>
                  set({
                    oneOffs: [
                      ...a.oneOffs,
                      { name: "Yeni kalem", amount: 100_000, month: 1, category: "other" },
                    ],
                  })
                }
              >
                <Plus size={13} /> Kalem ekle
              </button>
            </fieldset>
          </section>
        </aside>
      </main>
      {toast ? <Toast text={toast} onDone={() => setToast(null)} /> : null}
    </div>
  );
}

function NumberField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind: Kind;
  value: number;
  onChange: (v: number) => void;
}) {
  const shown = kind === "pct" ? Math.round(value * 1000) / 10 : value;
  return (
    <label className="qf-fin__field">
      <span>{label}</span>
      <span className="qf-fin__input">
        {kind === "tl" ? <i>₺</i> : kind === "pct" ? <i>%</i> : null}
        <input
          className="qd-input qd-num"
          type="number"
          step={kind === "pct" ? 0.5 : kind === "tl" ? 10 : 1}
          value={shown}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(kind === "pct" ? n / 100 : n);
          }}
        />
      </span>
    </label>
  );
}
