import { Check } from "lucide-react";
import { AUDIENCE_PATH, type SiteLang } from "@/lib/site/copy";

type Plan = { name: string; who: string; price: string; per: string; vat: string; items: string[]; hi?: boolean; badge?: string };

const PLANS: Record<SiteLang, { title: string; sub: string; plans: Plan[]; bank: string; bankLink: string }> = {
  tr: {
    title: "Ücretsiz başlayın, işletmenizle birlikte büyüyün.",
    sub: "Başlangıç paketi ücretsiz, kredi kartı gerekmez.",
    plans: [
      { name: "Başlangıç", who: "Denemek isteyen her işletme", price: "₺0", per: "/ ay", vat: "Ücretsiz", items: ["1 WhatsApp hesabı, 10 sohbete kadar", "1 Google Drive hesabı"] },
      { name: "KOBİ", who: "Tek numara ve tek sistemle çalışan işletmeler", price: "₺390", per: "/ ay", vat: "KDV hariç", items: ["Her kaynaktan 1 hesap: WhatsApp, Google Drive, ERP, ön muhasebe, banka", "Sınırsız sohbet"], hi: true, badge: "Küçük işletmeler için" },
      { name: "Büyüme", who: "Birden fazla numara ve sistemi olan işletmeler", price: "₺3.990", per: "/ ay", vat: "KDV hariç", items: ["25 WhatsApp numarasına kadar", "10 sistem bağlantısına kadar", "25 kullanıcıya kadar", "Sınırsız sohbet"] },
    ],
    bank: "Bankalar için portföy büyüklüğüne göre kurumsal lisans.",
    bankLink: "Bankalar sayfası",
  },
  en: {
    title: "Start free, grow with your business.",
    sub: "The Starter plan is free, no credit card needed.",
    plans: [
      { name: "Starter", who: "Any business that wants to try", price: "₺0", per: "/ mo", vat: "Free", items: ["1 WhatsApp account, up to 10 chats", "1 Google Drive account"] },
      { name: "SME", who: "Businesses on one number and one system", price: "₺390", per: "/ mo", vat: "excl. VAT", items: ["1 account per source: WhatsApp, Google Drive, ERP, accounting, bank", "Unlimited chats"], hi: true, badge: "For small businesses" },
      { name: "Growth", who: "Businesses with several numbers and systems", price: "₺3,990", per: "/ mo", vat: "excl. VAT", items: ["Up to 25 WhatsApp numbers", "Up to 10 system connections", "Up to 25 users", "Unlimited chats"] },
    ],
    bank: "Banks get an enterprise licence priced by portfolio size.",
    bankLink: "Banks page",
  },
};

/** Prices on the landing page itself, so a visitor never has to sign up just to learn what it costs. */
export function Pricing({ lang }: { lang: SiteLang }) {
  const p = PLANS[lang];
  return (
    <section className="section" id={lang === "tr" ? "fiyatlar" : "pricing"}>
      <div className="wrap">
        <div className="section__head">
          <h2>{p.title}</h2>
          <p>{p.sub}</p>
        </div>
        <div className="prices">
          {p.plans.map((pl) => (
            <article key={pl.name} className={`price${pl.hi ? " price--hi" : ""}`}>
              {pl.badge ? <span className="price__badge">{pl.badge}</span> : null}
              <h3>{pl.name}</h3>
              <p className="price__who">{pl.who}</p>
              <p className="price__amount">
                <b>{pl.price}</b> <span>{pl.per}</span>
              </p>
              <p className="price__vat">{pl.vat}</p>
              <ul>
                {pl.items.map((it) => (
                  <li key={it}>
                    <Check size={16} strokeWidth={2} aria-hidden="true" /> {it}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="prices__bank">
          {p.bank} <a href={AUDIENCE_PATH[lang].bank}>{p.bankLink} →</a>
        </p>
      </div>
    </section>
  );
}
