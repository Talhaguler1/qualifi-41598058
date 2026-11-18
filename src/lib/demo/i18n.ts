// Demo language (Turkish by default, English via `?l=en`).
// The language is set once per render by the demo route before any demo text is built,
// so engine functions can return ready-to-show strings without threading a parameter.
// Turkish stays the default everywhere else (the app and the tests never set it).

export type DemoLang = "tr" | "en";

let current: DemoLang = "tr";

export function setDemoLang(lang: DemoLang): void {
  current = lang;
}

export const demoLang = (): DemoLang => current;

export const isEnglish = (): boolean => current === "en";

/** Picks the Turkish or English text for the current demo language. */
export const L = (tr: string, en: string): string => (current === "en" ? en : tr);

/** Picks from a [tr, en] pair. */
export const pick = (pair: readonly [string, string]): string => (current === "en" ? pair[1] : pair[0]);

export function langOf(value: unknown): DemoLang {
  return value === "en" ? "en" : "tr";
}

/** "%12" in Turkish, "12%" in English. */
export const pct = (n: number): string => (current === "en" ? `${n}%` : `%${n}`);

/** Thousands separators for counts. */
export const count = (n: number): string => Math.round(n).toLocaleString(current === "en" ? "en-US" : "tr-TR");

/** Day counts: "12 gün" / "12 days". */
export const days = (n: number): string => (current === "en" ? `${n} ${Math.abs(n) === 1 ? "day" : "days"}` : `${n} gün`);

const SECTOR_EN: Record<string, string> = {
  Yazılım: "Software",
  "Yazılım ve teknoloji": "Software and technology",
  "E-ticaret": "E-commerce",
  Lojistik: "Logistics",
  "Gıda toptan": "Food wholesale",
  Tekstil: "Textiles",
  Medikal: "Medical",
  Ajans: "Agency",
  Eğitim: "Education",
  İnşaat: "Construction",
  Gıda: "Food",
  "Otomotiv yan sanayi": "Automotive parts",
  Perakende: "Retail",
  Turizm: "Tourism",
  Sağlık: "Healthcare",
  Tarım: "Agriculture",
};

/** Sector names are stored in Turkish; shown in the demo language. */
export const sectorName = (s: string): string => (current === "en" ? (SECTOR_EN[s] ?? s) : s);

const MESSAGE_EN: Record<string, string> = {
  // Business-side WhatsApp messages from customers
  "Merhaba, onay süreci uzadı kusura bakmayın. Cuma günü gönderiyoruz.": "Hi, sorry, the approval took longer than expected. We'll send it on Friday.",
  "Bu ay tahsilatlarımız çok aksadı, maaşları zor ödedik. Biraz daha süre rica ediyoruz.": "Our own collections slipped badly this month and we barely made payroll. We'd like a little more time.",
  "Şimdilik yarısını gönderebiliriz, kalanını ay sonunda yaparız.": "We can send half for now and the rest at the end of the month.",
  "Kusura bakmayın, muhasebeye ilettim. Cuma günü gönderiyoruz.": "Sorry, I've passed it to accounting. We'll send it on Friday.",
  // Banker-side WhatsApp signals
  "Müşterilerimiz ödemeleri 60 güne çekti, nakitte sıkışıyoruz.": "Our customers stretched payments to 60 days; cash is getting tight.",
  "Bu ay maaşları zor ödedik, taksiti biraz kaydırabilir miyiz?": "We barely made payroll this month. Could we push the instalment back a little?",
  "Büyük alıcımız siparişleri durdurdu.": "Our biggest buyer has stopped ordering.",
  "Taksiti 15 gün erteleme imkânı var mı?": "Is it possible to defer the instalment by 15 days?",
  "Ödemeyi ay sonuna bırakmamız gerekiyor.": "We need to leave the payment until the end of the month.",
  "Cuma günü taksiti yatırıyoruz.": "We're paying the instalment on Friday.",
  "Tahsilat gelince hemen ödeme yapacağız.": "We'll pay as soon as our collection comes in.",
  "Yeni ihracat siparişi aldık, nakit rahatladı.": "We won a new export order; cash has eased.",
  "Taksiti erken kapatmak istiyoruz.": "We'd like to pay off the instalment early.",
};

/**
 * Demo WhatsApp messages are stored in Turkish (that is what the agent reads).
 * In English the translation is shown; unknown texts stay as they are.
 */
export function messageText(text: string): string {
  if (current !== "en") return text;
  const exact = MESSAGE_EN[text];
  if (exact) return exact;
  let m = text.match(/^Merhaba, (\S+) numaralı proje hakediş faturamızın vadesi 20 Kasım'da doldu\. Ödeme tarihini paylaşabilir misiniz\?$/);
  if (m) return `Hi, our project milestone invoice ${m[1]} was due on 20 November. Could you share the payment date?`;
  m = text.match(/^Merhaba, (\S+) numaralı faturanın vadesi geldi\. Ödeme planınızı paylaşabilir misiniz\?$/);
  if (m) return `Hi, invoice ${m[1]} is now due. Could you share your payment plan?`;
  return text;
}

const LABEL_EN: Record<string, string> = {
  "Maaş ödemeleri": "Payroll",
  Kira: "Rent",
  "Vergi ve SGK": "Taxes and social security",
  "Tedarikçi ödemesi": "Supplier payment",
  Avans: "Advance",
  "Ek maliyet": "Extra cost",
  "Kalan ödeme": "Remaining payment",
};

/** Expense, cash-flow and contract labels are stored in Turkish; shown in the demo language. */
export const labelText = (s: string): string =>
  current === "en" ? (LABEL_EN[s] ?? s.replace(/^Yazılım hizmet sözleşmesi/, "Software services contract")) : s;
