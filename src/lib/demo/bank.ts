// Mock portfolio for the banker (credit risk / non-performing loans) panel.
// A regional unit has 20 specialists with 300 invented firms each.

import { addDays, addMonths, diffDays, withDay } from "./dates";
import { brandWord, createRng, type Rng } from "./rng";

export const BANKERS_PER_REGION = 20;
export const FIRMS_PER_BANKER = 300;

export const BANK_SECTORS = [
  { name: "İnşaat", risk: 0.75 },
  { name: "Tekstil", risk: 0.65 },
  { name: "Gıda", risk: 0.35 },
  { name: "Lojistik", risk: 0.5 },
  { name: "Yazılım", risk: 0.3 },
  { name: "Otomotiv yan sanayi", risk: 0.55 },
  { name: "Perakende", risk: 0.45 },
  { name: "Turizm", risk: 0.6 },
  { name: "Sağlık", risk: 0.25 },
  { name: "Tarım", risk: 0.5 },
] as const;

export type CommitmentStatus = "kept" | "late" | "broken" | "upcoming";

export interface FirmCommitment {
  id: string;
  kind: "restructuring" | "payment_promise";
  date: string;
  amount: number;
  /** When it was honoured; null = not honoured. Hidden until the viewed date. */
  settledDate: string | null;
}

export interface ChatSignal {
  id: string;
  date: string;
  type: "promise" | "deferral" | "stress" | "positive";
  text: string;
}

export interface Firm {
  id: string;
  name: string;
  sector: string;
  city: string;
  bankerNo: string;
  loanAmount: number;
  /** Median days the firm's own customers pay late, by month (from QualiFi data). */
  receivableDelay: { month: string; days: number }[];
  topCustomerShare: number;
  commitments: FirmCommitment[];
  signals: ChatSignal[];
  /** Hidden "truth" used to shape the data: how stressed the firm becomes. */
  stress: number;
}

const CITIES = ["İstanbul", "Kocaeli", "Bursa", "Sakarya", "Tekirdağ", "Yalova"] as const;
const SUFFIX = ["Ltd. Şti.", "A.Ş.", "San. Tic. A.Ş."] as const;

const STRESS_TEXTS = [
  "Müşterilerimiz ödemeleri 60 güne çekti, nakitte sıkışıyoruz.",
  "Bu ay maaşları zor ödedik, taksiti biraz kaydırabilir miyiz?",
  "Büyük alıcımız siparişleri durdurdu.",
] as const;
const DEFERRAL_TEXTS = ["Taksiti 15 gün erteleme imkânı var mı?", "Ödemeyi ay sonuna bırakmamız gerekiyor."] as const;
const PROMISE_TEXTS = ["Cuma günü taksiti yatırıyoruz.", "Tahsilat gelince hemen ödeme yapacağız."] as const;
const POSITIVE_TEXTS = ["Yeni ihracat siparişi aldık, nakit rahatladı.", "Taksiti erken kapatmak istiyoruz."] as const;

export function generatePortfolio(region: string, bankerNo: string, size = FIRMS_PER_BANKER): Firm[] {
  const banker = bankerNo.replace(/\D/g, "").padStart(2, "0");
  const rng = createRng(`bank-${region}-${banker}`);
  const firms: Firm[] = [];
  for (let i = 1; i <= size; i++) firms.push(makeFirm(rng, banker, i));
  return firms;
}

export function generateRegion(region: string): Firm[] {
  const all: Firm[] = [];
  for (let b = 1; b <= BANKERS_PER_REGION; b++) all.push(...generatePortfolio(region, String(b)));
  return all;
}

function makeFirm(rng: Rng, banker: string, index: number): Firm {
  const sector = rng.pick(BANK_SECTORS);
  const id = `F${banker}-${String(index).padStart(3, "0")}`;
  // Stress mostly follows the sector, with firm-level luck.
  const stress = Math.min(1, Math.max(0, sector.risk * 0.6 + rng.next() * 0.55 - 0.15));
  const receivableDelay: Firm["receivableDelay"] = [];
  const base = rng.int(2, 18);
  for (let m = 0; m < 15; m++) {
    const month = addMonths("2025-10-01", m);
    const worsening = stress > 0.55 ? Math.max(0, m - 8) * stress * 6 : 0;
    receivableDelay.push({ month, days: Math.round(base + worsening + rng.int(-3, 3)) });
  }
  const commitments: FirmCommitment[] = [];
  const signals: ChatSignal[] = [];
  const count = stress > 0.5 ? rng.int(2, 4) : rng.int(0, 2);
  for (let k = 0; k < count; k++) {
    const date = withDay(addMonths("2026-08-01", rng.int(0, 4)), rng.int(1, 28));
    const honoured = rng.next() > stress * 0.9;
    commitments.push({
      id: `${id}-T${k + 1}`,
      kind: rng.chance(0.4) ? "restructuring" : "payment_promise",
      date,
      amount: rng.amount(50_000, 900_000, 5_000),
      settledDate: honoured ? addDays(date, rng.chance(0.7) ? rng.int(-2, 1) : rng.int(5, 20)) : null,
    });
    signals.push({ id: `${id}-S${signals.length + 1}`, date: addDays(date, -rng.int(2, 6)), type: "promise", text: rng.pick(PROMISE_TEXTS) });
  }
  if (stress > 0.55) {
    const date = withDay(addMonths("2026-09-01", rng.int(0, 2)), rng.int(1, 28));
    signals.push({ id: `${id}-S${signals.length + 1}`, date, type: "stress", text: rng.pick(STRESS_TEXTS) });
    if (rng.chance(0.6)) signals.push({ id: `${id}-S${signals.length + 1}`, date: addDays(date, rng.int(5, 20)), type: "deferral", text: rng.pick(DEFERRAL_TEXTS) });
  } else if (rng.chance(0.25)) {
    signals.push({ id: `${id}-S${signals.length + 1}`, date: withDay(addMonths("2026-08-01", rng.int(0, 3)), rng.int(1, 28)), type: "positive", text: rng.pick(POSITIVE_TEXTS) });
  }
  return {
    id,
    name: `${brandWord(rng)} ${sector.name} ${rng.pick(SUFFIX)}`,
    sector: sector.name,
    city: rng.pick(CITIES),
    bankerNo: banker,
    loanAmount: rng.amount(250_000, 25_000_000, 50_000),
    receivableDelay,
    topCustomerShare: Math.round((0.1 + rng.next() * (0.3 + stress * 0.4)) * 100) / 100,
    commitments,
    signals: signals.sort((a, b) => a.date.localeCompare(b.date)),
    stress,
  };
}

export function commitmentStatus(c: FirmCommitment, asOf: string): CommitmentStatus {
  if (c.settledDate !== null && c.settledDate <= asOf) return diffDays(c.settledDate, c.date) > 3 ? "late" : "kept";
  return c.date > asOf ? "upcoming" : "broken";
}

export interface RiskFactor {
  label: string;
  points: number;
}

export interface FirmRisk {
  score: number;
  level: "low" | "medium" | "high";
  factors: RiskFactor[];
  delayNow: number;
  delayChange: number;
}

/** Explainable 0–100 score; each factor says how many points it added. */
export function firmRisk(firm: Firm, asOf: string): FirmRisk {
  const known = firm.receivableDelay.filter((d) => d.month <= asOf);
  const now = known.at(-1)?.days ?? 0;
  const before = known.at(-4)?.days ?? now;
  const change = now - before;
  const factors: RiskFactor[] = [];
  if (change > 0) factors.push({ label: `Alacak tahsil süresi 3 ayda ${change} gün uzadı`, points: Math.min(35, change * 2) });
  if (now > 30) factors.push({ label: `Müşterileri ortalama ${now} gün geç ödüyor`, points: Math.min(15, Math.round((now - 30) / 2)) });
  const statuses = firm.commitments.map((c) => commitmentStatus(c, asOf));
  const broken = statuses.filter((s) => s === "broken").length;
  const late = statuses.filter((s) => s === "late").length;
  if (broken) factors.push({ label: `${broken} taahhüt tutulmadı`, points: broken * 15 });
  if (late) factors.push({ label: `${late} taahhüt gecikmeli ödendi`, points: late * 5 });
  const visible = firm.signals.filter((s) => s.date <= asOf);
  const stress = visible.filter((s) => s.type === "stress" || s.type === "deferral").length;
  if (stress) factors.push({ label: `WhatsApp'ta ${stress} nakit sıkışıklığı işareti`, points: stress * 10 });
  if (visible.some((s) => s.type === "positive")) factors.push({ label: "Olumlu gelişme mesajı", points: -8 });
  if (firm.topCustomerShare > 0.45) factors.push({ label: `Gelirin %${Math.round(firm.topCustomerShare * 100)}'i tek müşteriden`, points: 10 });
  const score = Math.max(0, Math.min(100, Math.round(10 + factors.reduce((s, f) => s + f.points, 0))));
  return { score, level: score >= 60 ? "high" : score >= 35 ? "medium" : "low", factors, delayNow: now, delayChange: change };
}

export interface SectorRow {
  sector: string;
  firms: number;
  exposure: number;
  avgDelay: number;
  avgDelayChange: number;
  highRiskShare: number;
  brokenCommitments: number;
}

export function sectorAnalysis(firms: Firm[], asOf: string): SectorRow[] {
  const groups = new Map<string, Firm[]>();
  for (const f of firms) groups.set(f.sector, [...(groups.get(f.sector) ?? []), f]);
  return [...groups.entries()]
    .map(([sector, list]) => {
      const risks = list.map((f) => firmRisk(f, asOf));
      return {
        sector,
        firms: list.length,
        exposure: list.reduce((s, f) => s + f.loanAmount, 0),
        avgDelay: Math.round(risks.reduce((s, r) => s + r.delayNow, 0) / list.length),
        avgDelayChange: Math.round((risks.reduce((s, r) => s + r.delayChange, 0) / list.length) * 10) / 10,
        highRiskShare: Math.round((risks.filter((r) => r.level === "high").length / list.length) * 100) / 100,
        brokenCommitments: list.reduce((s, f) => s + f.commitments.filter((c) => commitmentStatus(c, asOf) === "broken").length, 0),
      };
    })
    .sort((a, b) => b.highRiskShare - a.highRiskShare);
}
