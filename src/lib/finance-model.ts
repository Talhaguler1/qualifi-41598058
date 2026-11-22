// QualiFi financial model: market size, monthly plan, funding need and payback.
// Every number here is an editable assumption, not a forecast or a claim; the admin page
// keeps the owner's edits in their own browser. Prices are monthly and exclude VAT.

export interface TeamRole {
  name: string;
  /** Monthly employer cost (TL) at month 1 prices: gross salary + employer SGK. */
  monthlyCost: number;
  /** First month this role is paid (1-based). */
  startMonth: number;
}

export interface OneOffCost {
  name: string;
  amount: number;
  month: number;
  category: CostCategory;
}

export interface RecurringCost {
  name: string;
  /** TL per month at month 1 prices. */
  amount: number;
  startMonth: number;
  category: CostCategory;
}

/** What one account on a package costs us each month (TL, month 1 prices). */
export interface PackageCost {
  ai: number; // reading messages and documents, answering questions
  messaging: number; // WhatsApp template messages (reminders) billed by Meta
  integrations: number; // open banking / e-invoice API fees per connected account
  hosting: number; // storage, database, compute
}

export type PackageKey = "free" | "sme" | "growth";
export const PACKAGE_LABEL: Record<PackageKey, string> = {
  free: "Başlangıç",
  sme: "KOBİ",
  growth: "Büyüme",
};

export type CostCategory = "team" | "infra" | "acquisition" | "compliance" | "bank" | "other";

export const COST_LABEL: Record<CostCategory, string> = {
  team: "Ürün ve ekip",
  infra: "Altyapı ve yapay zekâ",
  acquisition: "İşletme edinimi",
  compliance: "Güvenlik ve uyum",
  bank: "Banka ve veri entegrasyonları",
  other: "Diğer",
};

export interface FinanceAssumptions {
  // Market (TAM / SAM / SOM)
  smeCount: number; // TÜİK 2024: 3.928 thousand
  samSmall: number; // estimate: small firms with many receivables
  samMedium: number; // estimate: medium firms
  somFirms: number; // first target

  // Prices (TL per month, VAT excluded)
  priceSme: number; // "KOBİ" package
  priceGrowth: number; // "Büyüme" package
  bankMonthlyFee: number; // per bank licence
  annualPriceIncrease: number; // e.g. 0.25 = prices rise 25% every 12 months

  // Adoption
  newPaidMonth1: number; // new paying firms in month 1
  growthYear1: number; // monthly growth of new paying firms in months 1-12
  growthLater: number; // monthly growth after month 12
  growthShare: number; // share of new paying firms on the Büyüme package
  churnMonthly: number; // monthly churn of paying firms
  freePerPaid: number; // free accounts opened per new paying firm
  firstBankMonth: number; // 0 = no bank licence in the plan
  monthsBetweenBanks: number; // a new bank every N months after the first (0 = only one)

  // Cost to serve, per account per month
  costFree: PackageCost;
  costSme: PackageCost;
  costGrowth: PackageCost;
  paymentCommission: number; // share of subscription revenue (card / virtual POS)

  // Acquisition
  cacSme: number; // ads, content, onboarding per new KOBİ firm
  cacGrowth: number; // sales time and demos per new Büyüme firm
  marketingFixed: number;

  // Fixed costs (TL per month, month 1 prices)
  team: TeamRole[];
  recurring: RecurringCost[];
  oneOffs: OneOffCost[];
  costInflationMonthly: number; // salaries, rent, ads and fixed services in TL
  serveCostChangeMonthly: number; // per-account cost drift: TL weakening vs falling AI prices
  contingency: number; // share added on top of every month's costs

  // Funding and return
  horizonMonths: number;
  roundMonths: number; // runway this round must buy (seed = reach milestones, not break-even)
  startCash: number;
  grantAmount: number; // non-dilutive (TÜBİTAK BİGG, KOSGEB); 0 = none assumed
  grantMonth: number;
  safetyBuffer: number; // extra share on top of the deepest cash need
  preMoneyValuation: number;
  revenueMultiple: number; // ARR multiple used for the end-of-plan value
}

export type Scenario = "pessimistic" | "base" | "optimistic";

export const SCENARIO_LABEL: Record<Scenario, string> = {
  pessimistic: "Kötümser",
  base: "Baz",
  optimistic: "İyimser",
};

const SCENARIO: Record<Scenario, { growth: number; churn: number; cac: number }> = {
  pessimistic: { growth: 0.6, churn: 1.5, cac: 1.3 },
  base: { growth: 1, churn: 1, cac: 1 },
  optimistic: { growth: 1.3, churn: 0.75, cac: 0.85 },
};

export const DEFAULT_ASSUMPTIONS: FinanceAssumptions = {
  smeCount: 3_928_000,
  samSmall: 220_000,
  samMedium: 30_000,
  somFirms: 1_000,

  priceSme: 390,
  priceGrowth: 3_990,
  bankMonthlyFee: 150_000,
  annualPriceIncrease: 0.25,

  newPaidMonth1: 30,
  growthYear1: 0.15,
  growthLater: 0.05,
  growthShare: 0.08,
  churnMonthly: 0.03,
  freePerPaid: 4,
  firstBankMonth: 13,
  monthsBetweenBanks: 12,

  // 1 USD ≈ 45 TL. AI: ~₺0,02 per message, ~₺0,5 per document page.
  // WhatsApp utility template in Türkiye ≈ $0,006 ≈ ₺0,27 per reminder.
  costFree: { ai: 8, messaging: 0, integrations: 0, hosting: 3 },
  costSme: { ai: 50, messaging: 11, integrations: 25, hosting: 10 },
  costGrowth: { ai: 550, messaging: 135, integrations: 150, hosting: 60 },
  paymentCommission: 0.03,

  cacSme: 2_000,
  cacGrowth: 15_000,
  marketingFixed: 15_000,

  team: [
    { name: "Kurucu (ürün ve satış)", monthlyCost: 60_000, startMonth: 1 },
    { name: "Yazılım geliştirici", monthlyCost: 125_000, startMonth: 1 },
    { name: "Yapay zekâ / veri mühendisi", monthlyCost: 160_000, startMonth: 4 },
    { name: "Satış ve banka ilişkileri", monthlyCost: 95_000, startMonth: 7 },
    // After this round: paid by revenue and the next round.
    { name: "Mobil geliştirici", monthlyCost: 125_000, startMonth: 13 },
    { name: "Müşteri başarısı", monthlyCost: 60_000, startMonth: 13 },
  ],
  recurring: [
    { name: "Sunucu ve veritabanı (temel)", amount: 20_000, startMonth: 1, category: "infra" },
    { name: "Yazılım araçları ve lisanslar", amount: 12_000, startMonth: 1, category: "infra" },
    {
      name: "Türkiye'de barındırma (veri yerelleştirme)",
      amount: 20_000,
      startMonth: 12,
      category: "infra",
    },
    {
      name: "Hukuk, KVKK ve güvenlik danışmanlığı",
      amount: 15_000,
      startMonth: 1,
      category: "compliance",
    },
    { name: "Siber sigorta", amount: 5_000, startMonth: 9, category: "compliance" },
    { name: "Açık bankacılık ortağı (lisanslı)", amount: 25_000, startMonth: 7, category: "bank" },
    { name: "E-fatura entegratörü", amount: 8_000, startMonth: 6, category: "bank" },
    { name: "Etkinlik, fuar ve seyahat", amount: 15_000, startMonth: 3, category: "acquisition" },
    { name: "Mali müşavir ve resmi giderler", amount: 15_000, startMonth: 1, category: "other" },
    { name: "Ofis / ortak çalışma alanı", amount: 20_000, startMonth: 1, category: "other" },
  ],
  oneOffs: [
    {
      name: "Şirket, sözleşmeler ve KVKK kurulumu",
      amount: 150_000,
      month: 1,
      category: "compliance",
    },
    { name: "Ekipman (bilgisayar, telefon)", amount: 250_000, month: 1, category: "other" },
    { name: "Marka, video ve web", amount: 60_000, month: 2, category: "acquisition" },
    { name: "İşe alım ve eğitim", amount: 120_000, month: 3, category: "team" },
    { name: "Ek ekipman", amount: 180_000, month: 6, category: "other" },
    {
      name: "Açık bankacılık ortaklık ve hukuki inceleme",
      amount: 100_000,
      month: 6,
      category: "bank",
    },
    { name: "Sızma testi ve güvenlik denetimi", amount: 250_000, month: 8, category: "compliance" },
    { name: "Banka entegrasyonu geliştirme", amount: 300_000, month: 9, category: "bank" },
    { name: "ISO 27001 hazırlığı", amount: 400_000, month: 18, category: "compliance" },
  ],
  costInflationMonthly: 0.02,
  serveCostChangeMonthly: 0,
  contingency: 0.1,

  horizonMonths: 36,
  roundMonths: 12,
  startCash: 0,
  grantAmount: 0,
  grantMonth: 6,
  safetyBuffer: 0.2,
  preMoneyValuation: 40_000_000,
  revenueMultiple: 5,
};

export function packageCostTotal(c: PackageCost): number {
  return c.ai + c.messaging + c.integrations + c.hosting;
}

export interface MarketSize {
  tamMonthly: number;
  samMonthly: number;
  somMonthly: number;
}

/** TAM: every SME, medium firms on the Büyüme price. SAM: the stated small + medium estimate. SOM: first target on the KOBİ price. */
export function marketSize(a: FinanceAssumptions): MarketSize {
  return {
    tamMonthly: Math.max(0, a.smeCount - a.samMedium) * a.priceSme + a.samMedium * a.priceGrowth,
    samMonthly: a.samSmall * a.priceSme + a.samMedium * a.priceGrowth,
    somMonthly: a.somFirms * a.priceSme,
  };
}

export interface MonthRow {
  month: number;
  newPaid: number;
  smeCustomers: number;
  growthCustomers: number;
  freeAccounts: number;
  banks: number;
  revenue: number;
  costs: Record<CostCategory, number>;
  totalCost: number;
  net: number;
  /** Cumulative net from month 1 including any grant, without investment. */
  cumulative: number;
}

export interface PackageMargin {
  key: PackageKey;
  price: number;
  cost: number;
  commission: number;
  margin: number; // share of price left after cost to serve and commission
}

export interface UnitEconomics {
  arpa: number;
  variableCost: number;
  grossMargin: number;
  ltv: number;
  cac: number;
  ltvToCac: number;
  cacPaybackMonths: number;
  packages: PackageMargin[];
}

export interface FinancePlan {
  rows: MonthRow[];
  market: MarketSize;
  /** Deepest point of cumulative net (negative = money needed). */
  deepestCumulative: number;
  deepestMonth: number;
  /** This round: deepest cash need within roundMonths, plus buffer, rounded up to 250 thousand. */
  fundingNeed: number;
  /** All outside money needed over the whole horizon, same rounding (null-safe: 0 = none). */
  totalCapitalNeed: number;
  /** True when the horizon ends with cash still falling (needs another round or more time). */
  needsNextRound: boolean;
  /** First month whose own net is not negative and stays so to the end. */
  breakEvenMonth: number | null;
  /** First month after the deepest point where the cumulative net is back at zero or above. */
  paybackMonth: number | null;
  /** Months the funding lasts from month 1 (null = through the whole horizon). */
  runwayMonths: number | null;
  useOfFunds: Record<CostCategory, number>;
  useOfFundsMonths: number;
  endArr: number;
  endValuation: number;
  investorStake: number;
  investorMultiple: number;
  unit: UnitEconomics;
}

const CATEGORIES: CostCategory[] = ["team", "infra", "acquisition", "compliance", "bank", "other"];

function emptyCosts(): Record<CostCategory, number> {
  return { team: 0, infra: 0, acquisition: 0, compliance: 0, bank: 0, other: 0 };
}

function roundUp(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function buildPlan(input: FinanceAssumptions, scenario: Scenario = "base"): FinancePlan {
  const s = SCENARIO[scenario];
  const a = input;
  const churn = Math.min(1, Math.max(0, a.churnMonthly * s.churn));
  const horizon = Math.max(1, Math.round(a.horizonMonths));
  const serveFree = packageCostTotal(a.costFree);
  const serveSme = packageCostTotal(a.costSme);
  const serveGrowth = packageCostTotal(a.costGrowth);
  const rows: MonthRow[] = [];

  let sme = 0;
  let growth = 0;
  let free = 0;
  let newPaid = a.newPaidMonth1 * s.growth;
  let cumulative = 0;

  for (let m = 1; m <= horizon; m++) {
    if (m > 1) newPaid *= 1 + (m <= 12 ? a.growthYear1 : a.growthLater) * s.growth;
    const priceStep = Math.pow(1 + a.annualPriceIncrease, Math.floor((m - 1) / 12));
    const costStep = Math.pow(1 + a.costInflationMonthly, m - 1);
    const serveStep = Math.pow(1 + a.serveCostChangeMonthly, m - 1);

    const newSme = newPaid * (1 - a.growthShare);
    const newGrowth = newPaid * a.growthShare;
    sme = sme * (1 - churn) + newSme;
    growth = growth * (1 - churn) + newGrowth;
    free += newPaid * a.freePerPaid;
    const banks =
      a.firstBankMonth > 0 && m >= a.firstBankMonth
        ? 1 +
          (a.monthsBetweenBanks > 0 ? Math.floor((m - a.firstBankMonth) / a.monthsBetweenBanks) : 0)
        : 0;

    const subscription = (sme * a.priceSme + growth * a.priceGrowth) * priceStep;
    const revenue = subscription + banks * a.bankMonthlyFee * priceStep;

    const costs = emptyCosts();
    costs.team =
      a.team.filter((r) => m >= r.startMonth).reduce((sum, r) => sum + r.monthlyCost, 0) * costStep;
    costs.infra = (free * serveFree + sme * serveSme + growth * serveGrowth) * serveStep;
    costs.acquisition =
      (newSme * a.cacSme + newGrowth * a.cacGrowth) * s.cac * costStep +
      a.marketingFixed * costStep;
    costs.other = subscription * a.paymentCommission;
    for (const r of a.recurring) if (m >= r.startMonth) costs[r.category] += r.amount * costStep;
    for (const o of a.oneOffs) if (o.month === m) costs[o.category] += o.amount * costStep;
    const base = CATEGORIES.reduce((sum, c) => sum + costs[c], 0);
    costs.other += base * a.contingency;

    const totalCost = CATEGORIES.reduce((sum, c) => sum + costs[c], 0);
    const net = revenue - totalCost;
    cumulative += net + (a.grantAmount > 0 && m === a.grantMonth ? a.grantAmount : 0);
    rows.push({
      month: m,
      newPaid,
      smeCustomers: sme,
      growthCustomers: growth,
      freeAccounts: free,
      banks,
      revenue,
      costs,
      totalCost,
      net,
      cumulative,
    });
  }

  let deepestCumulative = 0;
  let deepestMonth = 0;
  for (const r of rows) {
    if (r.cumulative < deepestCumulative) {
      deepestCumulative = r.cumulative;
      deepestMonth = r.month;
    }
  }

  let breakEvenMonth: number | null = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if ((rows[i] as MonthRow).net >= 0) breakEvenMonth = (rows[i] as MonthRow).month;
    else break;
  }

  const paybackRow = rows.find((r) => r.month > deepestMonth && r.cumulative >= 0);
  const paybackMonth = deepestMonth === 0 ? 1 : paybackRow ? paybackRow.month : null;

  const need = (deepest: number) =>
    deepest < 0 ? Math.max(0, roundUp(-deepest * (1 + a.safetyBuffer) - a.startCash, 250_000)) : 0;
  const roundWindow = rows.slice(0, Math.max(1, Math.min(horizon, Math.round(a.roundMonths))));
  const roundDeepest = Math.min(0, ...roundWindow.map((r) => r.cumulative));
  const fundingNeed = need(roundDeepest);
  const totalCapitalNeed = need(deepestCumulative);
  const needsNextRound = totalCapitalNeed > fundingNeed;
  const available = fundingNeed + a.startCash;
  const broke = rows.find((r) => available + r.cumulative < 0);
  const runwayMonths = broke ? broke.month - 1 : null;

  // What this round pays for: every cost inside the round window.
  const useOfFundsMonths = roundWindow.length;
  const useOfFunds = emptyCosts();
  for (const r of rows.slice(0, useOfFundsMonths))
    for (const c of CATEGORIES) useOfFunds[c] += r.costs[c];

  const last = rows[rows.length - 1] as MonthRow;
  const endArr = last.revenue * 12;
  const endValuation = endArr * a.revenueMultiple;
  const postMoney = a.preMoneyValuation + fundingNeed;
  const investorStake = postMoney > 0 ? fundingNeed / postMoney : 0;
  const investorMultiple = fundingNeed > 0 ? (investorStake * endValuation) / fundingNeed : 0;

  return {
    rows,
    market: marketSize(a),
    deepestCumulative,
    deepestMonth,
    fundingNeed,
    totalCapitalNeed,
    needsNextRound,
    breakEvenMonth,
    paybackMonth,
    runwayMonths,
    useOfFunds,
    useOfFundsMonths,
    endArr,
    endValuation,
    investorStake,
    investorMultiple,
    unit: unitEconomics(a, s.cac, churn),
  };
}

/** Per paying firm at month 1 prices, using the package mix of new firms; free accounts are carried by paying ones. */
export function unitEconomics(
  a: FinanceAssumptions,
  cacFactor = 1,
  churn = a.churnMonthly,
): UnitEconomics {
  const g = a.growthShare;
  const arpa = (1 - g) * a.priceSme + g * a.priceGrowth;
  const serve =
    (1 - g) * packageCostTotal(a.costSme) +
    g * packageCostTotal(a.costGrowth) +
    a.freePerPaid * packageCostTotal(a.costFree);
  const variableCost = serve + arpa * a.paymentCommission;
  const grossMargin = arpa > 0 ? (arpa - variableCost) / arpa : 0;
  const contribution = arpa - variableCost;
  const cac = ((1 - g) * a.cacSme + g * a.cacGrowth) * cacFactor;
  const ltv = churn > 0 ? contribution / churn : Infinity;
  const pkg = (key: PackageKey, price: number, c: PackageCost): PackageMargin => {
    const cost = packageCostTotal(c);
    const commission = price * a.paymentCommission;
    return {
      key,
      price,
      cost,
      commission,
      margin: price > 0 ? (price - cost - commission) / price : -Infinity,
    };
  };
  return {
    arpa,
    variableCost,
    grossMargin,
    ltv,
    cac,
    ltvToCac: cac > 0 ? ltv / cac : Infinity,
    cacPaybackMonths: contribution > 0 ? cac / contribution : Infinity,
    packages: [
      pkg("free", 0, a.costFree),
      pkg("sme", a.priceSme, a.costSme),
      pkg("growth", a.priceGrowth, a.costGrowth),
    ],
  };
}

/** Turkish money text: ₺1,6 milyar · ₺205 milyon · ₺390 bin · ₺850. */
export function tl(value: number, digits = 1): string {
  const sign = value < 0 ? "−" : "";
  const v = Math.abs(value);
  const fmt = (n: number, d: number) =>
    n.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  if (v >= 1e9) return `${sign}₺${fmt(v / 1e9, digits)} milyar`;
  if (v >= 1e6) return `${sign}₺${fmt(v / 1e6, digits)} milyon`;
  if (v >= 1e4) return `${sign}₺${fmt(v / 1e3, 0)} bin`;
  return `${sign}₺${fmt(v, 0)}`;
}

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
const cat = (v: unknown): CostCategory =>
  (CATEGORIES as string[]).includes(String(v)) ? (v as CostCategory) : "other";
const rows = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    : null;

/** Reads a saved model, keeping defaults for anything missing or malformed. */
export function mergeAssumptions(raw: unknown): FinanceAssumptions {
  const base = DEFAULT_ASSUMPTIONS;
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base) as (keyof FinanceAssumptions)[]) {
    if (typeof base[key] === "number") out[key] = num(src[key], base[key] as number);
  }
  for (const key of ["costFree", "costSme", "costGrowth"] as const) {
    const v = src[key];
    const d = base[key];
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    out[key] = {
      ai: num(o["ai"], d.ai),
      messaging: num(o["messaging"], d.messaging),
      integrations: num(o["integrations"], d.integrations),
      hosting: num(o["hosting"], d.hosting),
    };
  }
  const team = rows(src["team"]);
  if (team)
    out["team"] = team.map((r) => ({
      name: str(r["name"], "Rol"),
      monthlyCost: num(r["monthlyCost"], 0),
      startMonth: Math.max(1, Math.round(num(r["startMonth"], 1))),
    }));
  const recurring = rows(src["recurring"]);
  if (recurring)
    out["recurring"] = recurring.map((r) => ({
      name: str(r["name"], "Kalem"),
      amount: num(r["amount"], 0),
      startMonth: Math.max(1, Math.round(num(r["startMonth"], 1))),
      category: cat(r["category"]),
    }));
  const oneOffs = rows(src["oneOffs"]);
  if (oneOffs)
    out["oneOffs"] = oneOffs.map((r) => ({
      name: str(r["name"], "Kalem"),
      amount: num(r["amount"], 0),
      month: Math.max(1, Math.round(num(r["month"], 1))),
      category: cat(r["category"]),
    }));
  return out as unknown as FinanceAssumptions;
}
