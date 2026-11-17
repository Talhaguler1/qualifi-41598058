// Mock data for a demo business account. Everything comes from the tenant number,
// so `mockerp017` always has the same customers, invoices, payments and chats.
// Nothing here is real: the sources imitate an ERP, a pre-accounting tool and a bank.

import { addDays, addMonths, DATA_END, DEMO_DATES, diffDays, HISTORY_START, withDay } from "./dates";
import { brandWord, createRng, type Rng } from "./rng";

export type Persona = "punctual" | "late" | "irregular" | "promise_breaker" | "distressed";
export type SourceSystem = "mockerp" | "mockonmuhasebe" | "mockbanka" | "contract" | "whatsapp";

export interface Customer {
  id: string;
  name: string;
  sector: string;
  persona: Persona;
}

export interface Receivable {
  id: string;
  customerId: string;
  kind: "invoice" | "contract_installment";
  source: SourceSystem;
  issueDate: string;
  dueDate: string;
  amount: number;
  /** When the money actually arrived; null = never paid in the data window. Hidden until the viewed date. */
  paidDate: string | null;
  contractId?: string;
}

export interface Contract {
  id: string;
  customerId: string;
  title: string;
  signedDate: string;
  total: number;
}

export interface Expense {
  id: string;
  label: string;
  date: string;
  amount: number;
  source: SourceSystem;
}

export interface ChatMessage {
  id: string;
  customerId: string;
  date: string;
  from: "customer" | "us";
  text: string;
  /** A payment date the customer promised in this message. */
  promiseDate?: string;
  receivableId?: string;
}

export interface BusinessDataset {
  tenant: string;
  company: { name: string; sector: string; city: string };
  sources: { erp: string; onMuhasebe: string; banka: string };
  openingBalance: number;
  customers: Customer[];
  receivables: Receivable[];
  contracts: Contract[];
  expenses: Expense[];
  chats: ChatMessage[];
}

const SECTORS = ["Yazılım", "E-ticaret", "Lojistik", "Gıda toptan", "Tekstil", "Medikal", "Ajans", "Eğitim"] as const;
const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Antalya"] as const;
const COMPANY_KINDS = ["Yazılım", "Teknoloji", "Dijital", "Bulut Hizmetleri"] as const;
const CUSTOMER_SUFFIX = ["Ltd.", "A.Ş.", "Tic. Ltd.", "San. A.Ş."] as const;

const PERSONA_SHARE: ReadonlyArray<[Persona, number]> = [
  ["punctual", 0.5],
  ["late", 0.25],
  ["irregular", 0.15],
  ["promise_breaker", 0.07],
  ["distressed", 0.03],
];

/** Normalises "17", "017" or "mockerp017" to "017". */
export function normaliseTenant(tenant: string): string {
  const digits = tenant.replace(/\D/g, "");
  if (!digits) throw new Error("tenant must contain a number");
  return digits.slice(-3).padStart(3, "0");
}

const NAME_WORD: Record<(typeof SECTORS)[number], string> = {
  Yazılım: "Yazılım",
  "E-ticaret": "E-Ticaret",
  Lojistik: "Lojistik",
  "Gıda toptan": "Gıda",
  Tekstil: "Tekstil",
  Medikal: "Medikal",
  Ajans: "Reklam",
  Eğitim: "Eğitim",
};

function namedCustomer(rng: Rng): { name: string; sector: string } {
  const sector = rng.pick(SECTORS);
  return { name: `${brandWord(rng)} ${NAME_WORD[sector]} ${rng.pick(CUSTOMER_SUFFIX)}`, sector };
}

function pickPersona(rng: Rng): Persona {
  let roll = rng.next();
  for (const [persona, share] of PERSONA_SHARE) {
    if (roll < share) return persona;
    roll -= share;
  }
  return "punctual";
}

/** Days after the due date the customer pays (negative = early); null = does not pay. */
function paymentDelay(rng: Rng, persona: Persona, dueDate: string): number | null {
  switch (persona) {
    case "punctual":
      return rng.int(-3, 2);
    case "late":
      return rng.int(9, 21);
    case "irregular":
      return rng.int(-5, 35);
    case "promise_breaker":
      return rng.int(14, 45);
    case "distressed": {
      // Gets worse over time and stops paying from October 2026.
      if (dueDate >= "2026-10-01") return rng.chance(0.75) ? null : rng.int(40, 70);
      const months = Math.max(0, diffDays(dueDate, HISTORY_START) / 30);
      return Math.round(5 + months * 3) + rng.int(0, 6);
    }
  }
}

export function generateBusiness(tenantInput: string): BusinessDataset {
  const tenant = normaliseTenant(tenantInput);
  const rng = createRng(`business-${tenant}`);

  const companyName = `${brandWord(rng)} ${rng.pick(COMPANY_KINDS)} A.Ş.`;
  const customerCount = rng.int(110, 190);
  const customers: Customer[] = [];
  for (let i = 1; i <= customerCount; i++) {
    customers.push({
      id: `c${tenant}-${String(i).padStart(3, "0")}`,
      ...namedCustomer(rng),
      persona: pickPersona(rng),
    });
  }

  const receivables: Receivable[] = [];
  let invoiceNo = 1;
  const months: string[] = [];
  for (let m = addMonths(HISTORY_START, 0); m <= DATA_END; m = addMonths(m, 1)) months.push(m);

  for (const customer of customers) {
    // Each customer buys in some months; bigger accounts buy more often.
    const frequency = rng.pick([0.35, 0.5, 0.7, 0.9]);
    const size = rng.pick([1, 1, 2, 4]);
    const terms = rng.pick([15, 30, 30, 45, 60]);
    for (const month of months) {
      if (!rng.chance(frequency)) continue;
      const issueDate = withDay(month, rng.int(1, 28));
      if (issueDate > DATA_END) continue;
      const dueDate = addDays(issueDate, terms);
      const delay = paymentDelay(rng, customer.persona, dueDate);
      receivables.push({
        id: `INV-${tenant}-${String(invoiceNo++).padStart(5, "0")}`,
        customerId: customer.id,
        kind: "invoice",
        source: "mockonmuhasebe",
        issueDate,
        dueDate,
        amount: rng.amount(4_000, 60_000 * size, 50),
        paidDate: delay === null ? null : addDays(dueDate, delay),
      });
    }
  }

  // Three signed service contracts paid in installments.
  const contracts: Contract[] = [];
  for (let k = 1; k <= 3; k++) {
    const customer = rng.pick(customers);
    const signedDate = withDay(addMonths("2026-08-01", k - 1), rng.int(3, 20));
    const installments = rng.int(3, 4);
    const each = rng.amount(40_000, 150_000, 1_000);
    const contractId = `SOZ-${tenant}-${k}`;
    contracts.push({ id: contractId, customerId: customer.id, title: `Yazılım hizmet sözleşmesi ${k}`, signedDate, total: each * installments });
    for (let n = 0; n < installments; n++) {
      const dueDate = withDay(addMonths(signedDate, n + 1), 10);
      const delay = paymentDelay(rng, customer.persona, dueDate);
      receivables.push({
        id: `${contractId}-T${n + 1}`,
        customerId: customer.id,
        kind: "contract_installment",
        source: "contract",
        issueDate: signedDate,
        dueDate,
        amount: each,
        paidDate: delay === null ? null : addDays(dueDate, delay),
        contractId,
      });
    }
  }

  // Monthly revenue sets the size of fixed costs, so the cash curve stays plausible.
  const monthlyRevenue = receivables.reduce((sum, r) => sum + r.amount, 0) / months.length;
  const expenses: Expense[] = [];
  let expenseNo = 1;
  const payroll = Math.round((monthlyRevenue * 0.46) / 1000) * 1000;
  const rent = Math.round((monthlyRevenue * 0.06) / 500) * 500;
  for (const month of months) {
    expenses.push({ id: `GDR-${tenant}-${expenseNo++}`, label: "Maaş ödemeleri", date: withDay(month, 1), amount: payroll, source: "mockerp" });
    expenses.push({ id: `GDR-${tenant}-${expenseNo++}`, label: "Kira", date: withDay(month, 5), amount: rent, source: "mockerp" });
    expenses.push({ id: `GDR-${tenant}-${expenseNo++}`, label: "Vergi ve SGK", date: withDay(month, 26), amount: Math.round(payroll * 0.38), source: "mockonmuhasebe" });
    for (const day of [8, 22]) {
      expenses.push({ id: `GDR-${tenant}-${expenseNo++}`, label: "Tedarikçi ödemesi", date: withDay(month, day), amount: rng.amount(monthlyRevenue * 0.06, monthlyRevenue * 0.14, 100), source: "mockerp" });
    }
  }

  const chats = generateChats(rng, customers, receivables);

  // Calibrate the opening balance so every account starts the first demo date with
  // about two weeks of fixed costs in the bank: tight enough that a slow payer matters.
  const firstDemoDate = DEMO_DATES[0];
  const collected = receivables.reduce((s, r) => s + (r.paidDate !== null && r.paidDate <= firstDemoDate ? r.amount : 0), 0);
  const spent = expenses.reduce((s, e) => s + (e.date <= firstDemoDate ? e.amount : 0), 0);
  const cushion = (payroll + rent) * (0.45 + rng.next() * 0.3);
  const openingBalance = Math.round((cushion - (collected - spent)) / 1000) * 1000;

  return {
    tenant,
    company: { name: companyName, sector: "Yazılım ve teknoloji", city: rng.pick(CITIES) },
    sources: { erp: `mockerp${tenant}`, onMuhasebe: `mockonmuhasebe${tenant}`, banka: `mockbanka${tenant}` },
    openingBalance,
    customers,
    receivables,
    contracts,
    expenses,
    chats,
  };
}

function generateChats(rng: Rng, customers: Customer[], receivables: Receivable[]): ChatMessage[] {
  const chats: ChatMessage[] = [];
  let n = 1;
  const talkative = customers.filter((c) => c.persona !== "punctual").slice(0, 18);
  for (const customer of talkative) {
    const open = receivables.filter((r) => r.customerId === customer.id && r.dueDate >= "2026-09-01" && r.dueDate <= "2026-12-31");
    for (const r of open.slice(0, 2)) {
      const reminder = addDays(r.dueDate, rng.int(1, 4));
      const id = () => `MSG-${customer.id}-${n++}`;
      chats.push({ id: id(), customerId: customer.id, date: reminder, from: "us", text: `Merhaba, ${r.id} numaralı faturanın vadesi geldi. Ödeme planınızı paylaşabilir misiniz?`, receivableId: r.id });
      const promiseDate = addDays(reminder, rng.int(3, 8));
      if (customer.persona === "distressed") {
        chats.push({ id: id(), customerId: customer.id, date: addDays(reminder, 2), from: "customer", text: "Bu ay tahsilatlarımız çok aksadı, maaşları zor ödedik. Biraz daha süre rica ediyoruz.", receivableId: r.id });
      } else if (customer.persona === "irregular") {
        chats.push({ id: id(), customerId: customer.id, date: addDays(reminder, 1), from: "customer", text: "Şimdilik yarısını gönderebiliriz, kalanını ay sonunda yaparız.", promiseDate, receivableId: r.id });
      } else {
        chats.push({ id: id(), customerId: customer.id, date: addDays(reminder, 1), from: "customer", text: "Kusura bakmayın, muhasebeye ilettim. Cuma günü gönderiyoruz.", promiseDate, receivableId: r.id });
      }
    }
  }
  return chats.sort((a, b) => a.date.localeCompare(b.date));
}
