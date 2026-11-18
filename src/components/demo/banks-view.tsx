import { useMemo, useState } from "react";
import { BadgeCheck, Building2, EyeOff, Inbox, Landmark, Send, Share2, Sparkles } from "lucide-react";
import {
  bankTotals,
  businessBankProducts,
  DEMO_BANKS,
  formatDateTr,
  L,
  maskedView,
  money,
  pct,
  productName,
  requestQuotes,
  suggestProduct,
  type BankProductKind,
  type Firm,
  type OfferFromBank,
} from "@/lib/demo";
import { OFFERS_KEY, useLocalState } from "./shared";

/** Exact lira amounts for comparison tables, where rounding to "bin" would hide the difference. */
const exact = (n: number) => `₺${Math.round(n).toLocaleString(L("tr-TR", "en-US"))}`;
const ratePct = (r: number) => L(`%${r.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`, `${r.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`);

/** Business side: every bank in one place, offers from banks, and a quote request for a cash need. */
export function BanksView({ tenant, date, mainBalance, suggestedNeed, onShare, onLog }: { tenant: string; date: string; mainBalance: number; suggestedNeed: number; onShare: () => void; onLog: (what: string) => void }) {
  const products = useMemo(() => businessBankProducts(tenant, date, mainBalance), [tenant, date, mainBalance]);
  const totals = bankTotals(products);
  const [offers] = useLocalState<OfferFromBank[]>(OFFERS_KEY, []);
  const [need, setNeed] = useState(suggestedNeed);
  const [asked, setAsked] = useState(false);
  const quotes = useMemo(() => (asked ? requestQuotes(tenant, need) : []), [asked, tenant, need]);

  return (
    <div className="qd-banks">
      {offers.length ? (
        <section className="qd-card qd-offer-in qd-enter">
          <div className="qd-card__head">
            <div>
              <span className="qd-eyebrow">
                <Inbox size={13} strokeWidth={1.75} /> {L("Bankanızdan gelen teklif", "Offer from your bank")}
              </span>
              <h2>
                {offers.at(-1)!.bank} · {productName(offers.at(-1)!.product)}
              </h2>
            </div>
            <span className="qd-pill qd-pill--good">{L("Yeni · demo", "New · demo")}</span>
          </div>
          <p>
            {L(
              `Paylaştığınız ödeme karnesine göre ${money(offers.at(-1)!.amount)} için aylık ${ratePct(offers.at(-1)!.rate)} teklif edildi.`,
              `Based on the scorecard you shared: ${money(offers.at(-1)!.amount)} at ${ratePct(offers.at(-1)!.rate)} per month.`,
            )}
          </p>
        </section>
      ) : null}

      <section className="qd-card">
        <div className="qd-card__head">
          <div>
            <span className="qd-eyebrow">{L("3 bank, tek ekran", "3 banks, one screen")}</span>
            <h2>{L("Bankalardaki toplam nakit", "Cash across your banks")} · <span className="qd-num">{money(totals.cash)}</span></h2>
          </div>
          <span className="qd-pill qd-pill--muted">{L("Açık bankacılık izniyle · demo", "Via open-banking consent · demo")}</span>
        </div>
        <div className="qd-bankgrid">
          {DEMO_BANKS.map((bank) => (
            <div key={bank} className="qd-bankcol">
              <b>
                <Landmark size={15} strokeWidth={1.75} /> {bank}
              </b>
              {products
                .filter((p) => p.bank === bank)
                .map((p) => (
                  <div key={p.id} className="qd-bankrow">
                    <span>{productName(p.kind)}</span>
                    <span className="qd-num">
                      {money(p.amount)}
                      {p.limit ? <small> / {money(p.limit)}</small> : null}
                    </span>
                    {p.nextDue ? (
                      <small className="qd-bankrow__due">
                        {L("Sonraki ödeme", "Next payment")} {formatDateTr(p.nextDue)} · {money(p.nextAmount ?? 0)}
                      </small>
                    ) : null}
                  </div>
                ))}
            </div>
          ))}
        </div>
        <p className="qd-banks__note">
          {L(
            `Kredi kullanımı ${money(totals.creditUsed)} / ${money(totals.creditLimit)}. ${totals.nextDue ? `En yakın ödeme ${formatDateTr(totals.nextDue.date)}, ${totals.nextDue.bank}.` : ""} Talimat ve başvuru buradan verilecek (vizyon).`,
            `Credit used ${money(totals.creditUsed)} of ${money(totals.creditLimit)}. ${totals.nextDue ? `Next payment ${formatDateTr(totals.nextDue.date)}, ${totals.nextDue.bank}.` : ""} Instructions and applications will be made from here (vision).`,
          )}
        </p>
      </section>

      <section className="qd-card">
        <div className="qd-card__head">
          <div>
            <span className="qd-eyebrow">{L("Nakit ihtiyacı", "Cash need")}</span>
            <h2>{L("Bankalardan teklif isteyin, yan yana karşılaştırın", "Ask banks for quotes, compare side by side")}</h2>
          </div>
        </div>
        <div className="qd-quote-form">
          <label>
            <span>{L("Tutar", "Amount")}</span>
            <input className="qd-input qd-num" type="number" min={50_000} step={50_000} value={need} onChange={(e) => { setNeed(Math.max(50_000, Number(e.target.value) || 0)); setAsked(false); }} />
          </label>
          <span className="qd-quote-form__hint">{L("Ajanın önerisi: en dar haftayı kapatacak tutar", "Agent's suggestion: enough to cover the tightest week")}</span>
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => { setAsked(true); onLog(`quotes-${need}`); }}>
            <Send size={15} strokeWidth={1.75} /> {L("3 bankadan teklif iste (demo)", "Request quotes from 3 banks (demo)")}
          </button>
        </div>
        {quotes.length ? (
          <div className="qd-table-wrap qd-enter" style={{ marginTop: 14 }}>
            <table className="qd-table">
              <thead>
                <tr>
                  <th>{L("Banka", "Bank")}</th>
                  <th>{L("Ürün", "Product")}</th>
                  <th className="qd-right">{L("Aylık faiz", "Monthly rate")}</th>
                  <th className="qd-right">{L("Masraf", "Fee")}</th>
                  <th className="qd-right">{L("60 gün toplam maliyet", "60-day total cost")}</th>
                  <th className="qd-right">{L("Hız", "Speed")}</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, i) => (
                  <tr key={q.bank} className={i === 0 ? "qd-row--best" : undefined}>
                    <td>
                      {q.bank} {i === 0 ? <span className="qd-pill qd-pill--good"><BadgeCheck size={12} strokeWidth={1.75} /> {L("En uygun", "Best")}</span> : null}
                    </td>
                    <td>{productName(q.product)}</td>
                    <td className="qd-right qd-num">{ratePct(q.rate)}</td>
                    <td className="qd-right qd-num">{exact(q.fee)}</td>
                    <td className="qd-right qd-num">{exact(q.totalCost)}</td>
                    <td className="qd-right qd-num">{q.speedHours < 24 ? L(`${q.speedHours} saat`, `${q.speedHours} h`) : L(`${q.speedHours / 24} gün`, `${q.speedHours / 24} days`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <p className="qd-banks__note">{L("Simülasyon. QualiFi teklif isteğini sizin izninizle iletir; kredi aracılığı yapmaz, karar sizindir.", "Simulation. QualiFi forwards the request with your consent; it does not broker credit, and the decision is yours.")}</p>
      </section>

      <button type="button" className="qd-btn qd-btn--primary qd-btn--lg" onClick={onShare}>
        <Share2 size={16} strokeWidth={1.75} /> {L("Ödeme karnemi bankama göster", "Show my payment scorecard to my bank")}
      </button>
    </div>
  );
}

/** Banker side: the proactive product idea for this firm, shown with its reason. */
export function ProductIdea({ firm, date }: { firm: Firm; date: string }) {
  const idea = suggestProduct(firm, date);
  return (
    <div className="qd-idea">
      <Sparkles size={16} strokeWidth={1.75} />
      <div>
        <span className="qd-eyebrow">{L("Şimdi önerilecek ürün", "Product to offer now")}</span>
        <b>{idea.title}</b>
        <small>{idea.why}</small>
      </div>
    </div>
  );
}

/** Banker side: exactly what the AI model receives for this firm (masked). */
export function MaskedPreview({ firm, date }: { firm: Firm; date: string }) {
  const v = maskedView(firm, date);
  return (
    <div className="qd-masked">
      <span className="qd-eyebrow">
        <EyeOff size={13} strokeWidth={1.75} /> {L("Yapay zekânın gördüğü (maskeli)", "What the AI sees (masked)")}
      </span>
      <dl>
        <dt>{L("Firma", "Firm")}</dt>
        <dd>{v.id} · {v.name}</dd>
        <dt>{L("Vergi no", "Tax no")}</dt>
        <dd className="qd-num">{v.taxNo}</dd>
        <dt>{L("Kredi bandı", "Loan band")}</dt>
        <dd>₺{v.loanBand}</dd>
        <dt>{L("Tahsil süresi", "Collection time")}</dt>
        <dd>{v.delayNow} {L("gün", "days")} ({v.delayChange > 0 ? "+" : ""}{v.delayChange})</dd>
      </dl>
      <p>{L("Unvan, kimlik ve hesap bilgileri bankada kalır; model yalnız bu özeti ve maskeli mesaj alıntılarını görür.", "Names, IDs and account details stay inside the bank; the model only sees this summary and masked message quotes.")}</p>
    </div>
  );
}

/** Banker side: send a mock offer back to the business that shared its scorecard. */
export function OfferForm({ company, onSent }: { company: string; onSent: () => void }) {
  const [offers, setOffers] = useLocalState<OfferFromBank[]>(OFFERS_KEY, []);
  const [product, setProduct] = useState<BankProductKind>("revolving");
  const [amount, setAmount] = useState(500_000);
  const [rate, setRate] = useState(3.65);
  const sent = offers.length > 0;
  return (
    <div className="qd-offer-form">
      <b>
        <Building2 size={15} strokeWidth={1.75} /> {L(`${company} için teklif gönder`, `Send an offer to ${company}`)}
      </b>
      <div className="qd-quote-form">
        <label>
          <span>{L("Ürün", "Product")}</span>
          <select className="qd-select" value={product} onChange={(e) => setProduct(e.target.value as BankProductKind)}>
            {(["revolving", "cheque_discount", "factoring", "instalment"] as const).map((k) => (
              <option key={k} value={k}>{productName(k)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{L("Tutar", "Amount")}</span>
          <input className="qd-input qd-num" type="number" step={50_000} min={50_000} value={amount} onChange={(e) => setAmount(Math.max(50_000, Number(e.target.value) || 0))} />
        </label>
        <label>
          <span>{L("Aylık faiz", "Monthly rate")} ({pct(0).replace("0", "")})</span>
          <input className="qd-input qd-num" type="number" step={0.05} min={1} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
        </label>
        <button type="button" className="qd-btn qd-btn--primary" onClick={() => { setOffers([...offers, { bank: "Banka A", product, amount, rate, at: new Date().toISOString() }]); onSent(); }}>
          <Send size={15} strokeWidth={1.75} /> {sent ? L("Yeniden gönder", "Send again") : L("Teklifi gönder (demo)", "Send offer (demo)")}
        </button>
      </div>
      {sent ? <p className="qd-banks__note">{L("Gönderildi. İşletme panelinde 'Bankalarım' kartında görünür.", "Sent. It appears in the business panel under 'My banks'.")}</p> : null}
    </div>
  );
}
