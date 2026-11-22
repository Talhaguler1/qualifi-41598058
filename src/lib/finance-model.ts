// QualiFi financial model: market size, monthly plan, funding need and payback.
// Every number here is an editable assumption, not a forecast or a claim; the admin page
// keeps the owner's edits in their own browser. Prices are monthly and exclude VAT.

export interface TeamRole {
  name: string;
  /** Monthly employer cost (TL) at month 1 prices. */
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

export type CostCategory = "team" | "infra" | "acquisition" | "compliance" | "bank" | "other";

export const COST_LABEL: Record<CostCategory, string> = {
  team: "Ürün ve ekip",
  infra: "Altyapı ve yapay zekâ",
  acquisition: "İşletme edinimi",
  compliance: "Güvenlik ve uyum",
  bank: "Banka entegrasyonu",
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

  // Variable costs (TL per month, month 1 prices)
  aiPerSme: number;
  aiPerGrowth: number;
  aiPerFree: number;
  paymentCommission: number; // share of subscription revenue
  cac: number; // acquisition cost per new paying firm
  marketingFixed: number;

  // Fixed costs (TL per month, month 1 prices)
  team: TeamRole[];
  infraBase: number;
  complianceMonthly: number;
  openBankingMonthly: number;
  openBankingStartMonth: number;
  otherMonthly: number;
  oneOffs: OneOffCost[];
  costInflationMonthly: number;

  // Funding and return
  horizonMonths: number;
  startCash: number;
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
  firstBankMonth: 10,
  monthsBetweenBanks: 12,

  aiPerSme: 30,
  aiPerGrowth: 150,
  aiPerFree: 4,
  paymentCommission: 0.03,
  cac: 1_200,
  marketingFixed: 25_000,

  team: [
    { name: "Kurucu (ürün ve satış)", monthlyCost: 60_000, startMonth: 1 },
    { name: "Yazılım geliştirici", monthlyCost: 110_000, startMonth: 1 },
    { name: "Yapay zekâ / veri mühendisi", monthlyCost: 130_000, startMonth: 3 },
    { name: "Yazılım geliştirici (mobil)", monthlyCost: 110_000, startMonth: 6 },
    { name: "Satış ve banka ilişkileri", monthlyCost: 80_000, startMonth: 6 },
    { name: "Müşteri başarısı", monthlyCost: 50_000, startMonth: 9 },
  ],
  infraBase: 20_000,
  complianceMonthly: 15_000,
  openBankingMonthly: 25_000,
  openBankingStartMonth: 7,
  otherMonthly: 20_000,
  oneOffs: [
    {
      name: "Şirket, sözleşmeler ve KVKK kurulumu",
      amount: 150_000,
      month: 1,
      category: "compliance",
    },
    { name: "Sızma testi ve güvenlik denetimi", amount: 250_000, month: 8, category: "compliance" },
    { name: "Banka entegrasyonu geliştirme", amount: 300_000, month: 9, category: "bank" },
    { name: "ISO 27001 hazırlığı", amount: 400_000, month: 18, category: "compliance" },
  ],
  costInflationMonthly: 0.02,

  horizonMonths: 36,
  startCash: 0,
  safetyBuffer: 0.2,
  preMoneyValuation: 40_000_000,
  revenueMultiple: 5,
};

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
  mrr: number;
  costs: Record<CostCategory, number>;
  totalCost: number;
  net: number;
  /** Cumulative net from month 1, without outside money. */
  cumulative: number;
}

export interface FinancePlan {
  rows: MonthRow[];
  market: MarketSize;
  /** Deepest point of cumulative net (negative = money needed). */
  deepestCumulative: number;
  deepestMonth: number;
  /** Rounded up to the next 250 thousand, including the safety buffer. */
  fundingNeed: number;
  /** First month whose own net is not negative and stays so to the end. */
  breakEvenMonth: number | null;
  /** First month the cumulative net is back at zero or above. */
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

export interface UnitEconomics {
  arpa: number;
  variableCost: number;
  grossMargin: number;
  ltv: number;
  cac: number;
  ltvToCac: number;
  cacPaybackMonths: number;
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
  const cac = a.cac * s.cac;
  const horizon = Math.max(1, Math.round(a.horizonMonths));
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

    sme = sme * (1 - churn) + newPaid * (1 - a.growthShare);
    growth = growth * (1 - churn) + newPaid * a.growthShare;
    free += newPaid * a.freePerPaid;
    const banks =
      a.firstBankMonth > 0 && m >= a.firstBankMonth
        ? 1 +
          (a.monthsBetweenBanks > 0 ? Math.floor((m - a.firstBankMonth) / a.monthsBetweenBanks) : 0)
        : 0;

    const subscription = (sme * a.priceSme + growth * a.priceGrowth) * priceStep;
    const bankRevenue = banks * a.bankMonthlyFee * priceStep;
    const revenue = subscription + bankRevenue;

    const costs = emptyCosts();
    costs.team =
      a.team.filter((r) => m >= r.startMonth).reduce((sum, r) => sum + r.monthlyCost, 0) * costStep;
    costs.infra =
      (a.infraBase + sme * a.aiPerSme + growth * a.aiPerGrowth + free * a.aiPerFree) * costStep;
    costs.acquisition = (newPaid * cac + a.marketingFixed) * costStep;
    costs.compliance = a.complianceMonthly * costStep;
    costs.bank = m >= a.openBankingStartMonth ? a.openBankingMonthly * costStep : 0;
    costs.other = a.otherMonthly * costStep + subscription * a.paymentCommission;
    for (const o of a.oneOffs) if (o.month === m) costs[o.category] += o.amount * costStep;

    const totalCost = CATEGORIES.reduce((sum, c) => sum + costs[c], 0);
    const net = revenue - totalCost;
    cumulative += net;
    rows.push({
      month: m,
      newPaid,
      smeCustomers: sme,
      growthCustomers: growth,
      freeAccounts: free,
      banks,
      revenue,
      mrr: revenue,
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

  const fundingNeed =
    deepestCumulative < 0
      ? roundUp(-deepestCumulative * (1 + a.safetyBuffer) - a.startCash, 250_000)
      : 0;
  const available = Math.max(0, fundingNeed) + a.startCash;
  const broke = rows.find((r) => available + r.cumulative < 0);
  const runwayMonths = broke ? broke.month - 1 : null;

  // What the money pays for: every cost until the deepest point (after it, revenue carries the company).
  const useOfFundsMonths = deepestMonth || horizon;
  const useOfFunds = emptyCosts();
  for (const r of rows.slice(0, useOfFundsMonths))
    for (const c of CATEGORIES) useOfFunds[c] += r.costs[c];

  const last = rows[rows.length - 1] as MonthRow;
  const endArr = last.revenue * 12;
  const endValuation = endArr * a.revenueMultiple;
  const postMoney = a.preMoneyValuation + fundingNeed;
  const investorStake = postMoney > 0 ? fundingNeed / postMoney : 0;
  const investorMultiple = fundingNeed > 0 ? (investorStake * endValuation) / fundingNeed : 0;

  const unit = unitEconomics(a, cac, churn);

  return {
    rows,
    market: marketSize(a),
    deepestCumulative,
    deepestMonth,
    fundingNeed,
    breakEvenMonth,
    paybackMonth,
    runwayMonths,
    useOfFunds,
    useOfFundsMonths,
    endArr,
    endValuation,
    investorStake,
    investorMultiple,
    unit,
  };
}

/** Per paying firm at month 1 prices, using the package mix of new firms. */
export function unitEconomics(
  a: FinanceAssumptions,
  cac = a.cac,
  churn = a.churnMonthly,
): UnitEconomics {
  const arpa = (1 - a.growthShare) * a.priceSme + a.growthShare * a.priceGrowth;
  const variableCost =
    (1 - a.growthShare) * a.aiPerSme +
    a.growthShare * a.aiPerGrowth +
    a.freePerPaid * a.aiPerFree +
    arpa * a.paymentCommission;
  const grossMargin = arpa > 0 ? (arpa - variableCost) / arpa : 0;
  const monthlyContribution = arpa - variableCost;
  const ltv = churn > 0 ? monthlyContribution / churn : Infinity;
  return {
    arpa,
    variableCost,
    grossMargin,
    ltv,
    cac,
    ltvToCac: cac > 0 ? ltv / cac : Infinity,
    cacPaybackMonths: monthlyContribution > 0 ? cac / monthlyContribution : Infinity,
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

/** Reads a saved model, keeping defaults for anything missing or malformed. */
export function mergeAssumptions(raw: unknown): FinanceAssumptions {
  const base = DEFAULT_ASSUMPTIONS;
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base) as (keyof FinanceAssumptions)[]) {
    const v = src[key];
    const d = base[key];
    if (typeof d === "number" && typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  if (Array.isArray(src["team"])) {
    out["team"] = (src["team"] as unknown[])
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => ({
        name: typeof r["name"] === "string" ? r["name"] : "Rol",
        monthlyCost: Number.isFinite(r["monthlyCost"]) ? Number(r["monthlyCost"]) : 0,
        startMonth: Number.isFinite(r["startMonth"])
          ? Math.max(1, Math.round(Number(r["startMonth"])))
          : 1,
      }));
  }
  if (Array.isArray(src["oneOffs"])) {
    out["oneOffs"] = (src["oneOffs"] as unknown[])
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => ({
        name: typeof r["name"] === "string" ? r["name"] : "Kalem",
        amount: Number.isFinite(r["amount"]) ? Number(r["amount"]) : 0,
        month: Number.isFinite(r["month"]) ? Math.max(1, Math.round(Number(r["month"]))) : 1,
        category: (CATEGORIES as string[]).includes(String(r["category"]))
          ? (r["category"] as CostCategory)
          : "other",
      }));
  }
  return out as unknown as FinanceAssumptions;
}
