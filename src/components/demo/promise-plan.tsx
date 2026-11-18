import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Check, FileText, Landmark, Loader2, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { delayPhrase, diffDays, formatDateTr, L, messageText, money, payerProfile, pick, type Snapshot } from "@/lib/demo";
import { Grade } from "./shared";

type Stage = "promise" | "matched" | "confirmed" | "ordered";
const ORDER: Stage[] = ["promise", "matched", "confirmed", "ordered"];
const STATUS: Record<Stage, [readonly [string, string], string]> = {
  promise: [["Teyitsiz ödeme sözü", "Unconfirmed payment promise"], "qd-pill--warn"],
  matched: [["Faturayla eşleşti · teyit bekliyor", "Matched to invoice · awaiting confirmation"], "qd-pill--warn"],
  confirmed: [["Alıcı teyitli söz", "Buyer-confirmed promise"], "qd-pill--good"],
  ordered: [["Planlı ödeme emri (banka kaydı)", "Scheduled payment order (bank record)"], "qd-pill--good"],
};

/**
 * Vision moment for the 24 Nov presentation: one WhatsApp promise turned step by step into a
 * matched, buyer-confirmed promise and then a planned payment order. Fully simulated: nothing
 * is sent and no bank instruction is created.
 */
/** The largest open receivable with a promise still ahead: the one the vision card plays out. */
export function featuredPromise(snap: Snapshot) {
  const open = new Map(snap.receivables.filter((r) => r.paidDate === null).map((r) => [r.id, r]));
  return snap.chats
    .filter((m) => m.promiseDate && m.promiseDate > snap.asOf && m.receivableId && open.has(m.receivableId))
    .map((m) => ({ msg: m, r: open.get(m.receivableId as string)! }))
    .sort((a, b) => b.r.amount - a.r.amount)[0];
}

export function PromisePlanCard({ snap, onLog }: { snap: Snapshot; onLog: (step: string) => void }) {
  const featured = useMemo(() => featuredPromise(snap), [snap]);
  const [stage, setStage] = useState<Stage>("promise");
  const [busy, setBusy] = useState<string | null>(null);

  if (!featured) {
    return (
      <section className="qd-card qd-enter">
        <span className="qd-eyebrow">{L("Sözden ödemeye", "From promise to payment")}</span>
        <p style={{ marginTop: 6, color: "var(--qd-muted)" }}>
          {L(
            "Bu tarihte bekleyen bir ödeme sözü yok. 24 Kasım'a geçin: bir müşterinin “cuma gönderiyoruz” sözünü işlem planına dönüştürmeyi burada görebilirsiniz.",
            "No pending payment promise on this date. Switch to 24 November to see a customer's “we'll send it Friday” turned into a transaction plan.",
          )}
        </p>
      </section>
    );
  }

  const { msg, r } = featured;
  const customer = snap.dataset.customers.find((c) => c.id === r.customerId)!;
  const p = payerProfile(snap, customer.id);
  const past = snap.chats.filter((m) => m.customerId === customer.id && m.promiseDate && m.promiseDate <= snap.asOf);
  const kept = past.filter((m) => {
    const paid = snap.receivables.find((x) => x.id === m.receivableId)?.paidDate;
    return paid && diffDays(paid, m.promiseDate as string) <= 2;
  }).length;
  const promised = msg.promiseDate as string;
  const overdue = diffDays(snap.asOf, r.dueDate);
  const idx = ORDER.indexOf(stage);

  const advance = (to: Stage, label: string, wait: number) => {
    setBusy(label);
    onLog(to);
    setTimeout(() => {
      setStage(to);
      setBusy(null);
    }, wait);
  };

  return (
    <section className="qd-card qd-enter qd-plan">
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">{L("Sözden ödemeye · vizyon", "From promise to payment · vision")}</span>
          <h2>{L("“Cuma gönderiyoruz” kasaya girene kadar", "From “we'll send it Friday” to cash in the bank")}</h2>
        </div>
        <span className={`qd-pill ${STATUS[stage][1]}`}>{pick(STATUS[stage][0])}</span>
      </div>

      <div className="qd-plan__grid">
        <div className="qd-plan__msg">
          <div className="qd-plan__who">
            <Grade grade={p.grade} />
            <span>
              <b>{customer.name}</b>
              <small>{r.id} · {money(r.amount)} · {L("vade", "due")} {formatDateTr(r.dueDate)}{overdue > 0 ? L(` (${overdue} gün geçti)`, ` (${overdue} days overdue)`) : ""}</small>
            </span>
          </div>
          <div className="qd-chat" style={{ marginTop: 10 }}>
            <div className="qd-bubble">
              {messageText(msg.text)}
              <small>{formatDateTr(msg.date)} · WhatsApp · {L("ajanın okuduğu söz", "promise the agent read")}: {formatDateTr(promised)}</small>
            </div>
          </div>
          <p className="qd-plan__hint">
            {L(
              `Ödeme notu ${p.grade}; genelde ${delayPhrase(p.medianDelay)} ödüyor. Geçmiş sözler: ${past.length ? `${kept}/${past.length} tutuldu` : "kayıt yok"}.`,
              `Payer grade ${p.grade}; usually pays ${delayPhrase(p.medianDelay)}. Past promises: ${past.length ? `${kept}/${past.length} kept` : "no record"}.`,
            )}
          </p>
        </div>

        <ol className="qd-steps">
          <li data-done={idx >= 1}>
            <span className="qd-steps__icon">{idx >= 1 ? <Check size={14} /> : <FileText size={14} />}</span>
            <div>
              <b>{L("Faturayla eşleştir", "Match to the invoice")}</b>
              <span>
                {idx >= 1
                  ? L(`Aynı müşteri, yanıt ${r.id} hatırlatmasına; tutar ${money(r.amount)}. Aynı alacak iki kez sayılmaz.`, `Same customer, replying to the ${r.id} reminder; amount ${money(r.amount)}. The receivable is never counted twice.`)
                  : L("Söz hangi açık alacağa ait?", "Which open receivable does the promise belong to?")}
              </span>
            </div>
          </li>
          <li data-done={idx >= 2}>
            <span className="qd-steps__icon">{idx >= 2 ? <Check size={14} /> : <MessageCircle size={14} />}</span>
            <div>
              <b>{L("Alıcıdan tarih teyidi", "Date confirmed by the buyer")}</b>
              <span>
                {idx >= 2
                  ? L(`Alıcı teyit etti: ${formatDateTr(promised)} · ${money(r.amount)}.`, `Buyer confirmed: ${formatDateTr(promised)} · ${money(r.amount)}.`)
                  : L("Belirsiz “cuma” yerine tarih ve tutar tek dokunuşla teyit edilir.", "Instead of a vague “Friday”, date and amount are confirmed with one tap.")}
              </span>
            </div>
          </li>
          <li data-done={idx >= 3}>
            <span className="qd-steps__icon">{idx >= 3 ? <Check size={14} /> : <Landmark size={14} />}</span>
            <div>
              <b>{L("Planlı ödeme emri", "Scheduled payment order")}</b>
              <span>
                {idx >= 3
                  ? L(`Alıcı kendi bankasında ${formatDateTr(promised)} tarihli talimatı onayladı.`, `The buyer approved an order dated ${formatDateTr(promised)} in their own bank.`)
                  : L("Alıcıya, yetkili ödeme kuruluşu üzerinden ileri tarihli ödeme talimatı seçeneği (ÖHVPS 2.0).", "The buyer is offered a future-dated payment order through a licensed payment institution (Turkish open banking, ÖHVPS 2.0).")}
              </span>
            </div>
          </li>
          <li data-done={false}>
            <span className="qd-steps__icon"><BadgeCheck size={14} /></span>
            <div>
              <b>{L("Sonucu izle, karneye işle", "Track the result, update the scorecard")}</b>
              <span>{L("Ödeme günü banka hareketiyle eşleşir; sonuç ödeme karnesine ve bankaya taşınabilir karneye yazılır.", "On the day it is matched to the bank transaction; the result goes into the payment scorecard and the scorecard the business can take to its bank.")}</span>
            </div>
          </li>
        </ol>
      </div>

      {stage === "matched" && !busy ? (
        <div className="qd-action__draft qd-enter" style={{ marginTop: 12 }}>
          {L(
            `Merhaba, ${r.id} numaralı ${money(r.amount)} tutarlı ödemeniz için ${formatDateTr(promised)} tarihini teyit eder misiniz? Tek dokunuşla onaylayabilirsiniz: [Evet, ${formatDateTr(promised)}] [Başka tarih öner]`,
            `Hello, could you confirm ${formatDateTr(promised)} for your ${money(r.amount)} payment on ${r.id}? One tap to confirm: [Yes, ${formatDateTr(promised)}] [Suggest another date]`,
          )}
        </div>
      ) : null}
      {stage === "ordered" ? (
        <div className="qd-plan__result qd-enter">
          <ShieldCheck size={18} />
          <div>
            <b>{L("Söz artık bir banka kaydı.", "The promise is now a bank record.")}</b>
            <span>
              {L(
                `Gerçek üründe bu ${money(r.amount)} tahminde teyitli tahsilat olarak sayılır. Uygunsa işletme vadeden önce bankasından iskonto talep edebilir. Teyitli söz banka garantisi değildir; planlı emir de hesapta bakiye yoksa gerçekleşmeyebilir. Bu yüzden sonuç ayrıca izlenir.`,
                `In the real product this ${money(r.amount)} counts as a confirmed collection in the forecast. Where eligible, the business can ask its bank to discount it before the due date. A confirmed promise is not a bank guarantee, and a scheduled order may fail if the account lacks funds, so the outcome is still tracked.`,
              )}
            </span>
          </div>
        </div>
      ) : null}

      <div className="qd-action__buttons" style={{ marginTop: 14 }}>
        {busy ? (
          <span className="qd-pill qd-pill--muted"><Loader2 size={12} className="qd-spin" /> {busy}</span>
        ) : stage === "promise" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("matched", L("Faturayla eşleştiriliyor…", "Matching to the invoice…"), 700)}>
            {L("Sözü işlem planına dönüştür", "Turn the promise into a transaction plan")} <ArrowRight size={14} />
          </button>
        ) : stage === "matched" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("confirmed", L("Alıcının teyidi bekleniyor…", "Waiting for the buyer to confirm…"), 1300)}>
            {L("Teyit iste (simülasyon)", "Request confirmation (simulation)")} <ArrowRight size={14} />
          </button>
        ) : stage === "confirmed" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("ordered", L("Alıcı bankasında onaylıyor…", "Buyer is approving in their bank…"), 1400)}>
            {L("Planlı ödeme seçeneği gönder (simülasyon)", "Send a scheduled-payment option (simulation)")} <ArrowRight size={14} />
          </button>
        ) : (
          <button type="button" className="qd-btn qd-btn--sm" onClick={() => { setStage("promise"); onLog("reset"); }}>
            <RotateCcw size={13} /> {L("Baştan oynat", "Replay")}
          </button>
        )}
      </div>
      <p className="qd-plan__note">{L("Sentetik senaryo. Gerçek WhatsApp mesajı gönderilmez, banka talimatı başlatılmaz, finansman teklifi oluşturulmaz.", "Synthetic scenario. No real WhatsApp message is sent, no bank instruction is started and no financing offer is created.")}</p>
    </section>
  );
}
