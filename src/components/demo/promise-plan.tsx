import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Check, FileText, Landmark, Loader2, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { diffDays, formatDateTr, money, payerProfile, type Snapshot } from "@/lib/demo";
import { Grade } from "./shared";

type Stage = "promise" | "matched" | "confirmed" | "ordered";
const ORDER: Stage[] = ["promise", "matched", "confirmed", "ordered"];
const STATUS: Record<Stage, [string, string]> = {
  promise: ["Teyitsiz ödeme sözü", "qd-pill--warn"],
  matched: ["Faturayla eşleşti · teyit bekliyor", "qd-pill--warn"],
  confirmed: ["Alıcı teyitli söz", "qd-pill--good"],
  ordered: ["Planlı ödeme emri (banka kaydı)", "qd-pill--good"],
};

/**
 * Vision moment for the 24 Nov presentation: one WhatsApp promise turned step by step into a
 * matched, buyer-confirmed promise and then a planned payment order. Fully simulated: nothing
 * is sent and no bank instruction is created.
 */
export function PromisePlanCard({ snap, onLog }: { snap: Snapshot; onLog: (step: string) => void }) {
  const featured = useMemo(() => {
    const open = new Map(snap.receivables.filter((r) => r.paidDate === null).map((r) => [r.id, r]));
    return snap.chats
      .filter((m) => m.promiseDate && m.promiseDate > snap.asOf && m.receivableId && open.has(m.receivableId))
      .map((m) => ({ msg: m, r: open.get(m.receivableId as string)! }))
      .sort((a, b) => b.r.amount - a.r.amount)[0];
  }, [snap]);
  const [stage, setStage] = useState<Stage>("promise");
  const [busy, setBusy] = useState<string | null>(null);

  if (!featured) {
    return (
      <section className="qd-card qd-enter">
        <span className="qd-eyebrow">Sözden işleme</span>
        <p style={{ marginTop: 6, color: "var(--qd-muted)" }}>Bu tarihte bekleyen bir ödeme sözü yok. 24 Kasım'a geçin: bir müşterinin "cuma gönderiyoruz" sözünü işlem planına dönüştürmeyi burada görebilirsiniz.</p>
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
          <span className="qd-eyebrow">Sözden işleme · vizyon</span>
          <h2>"Cuma gönderiyoruz" kasaya girene kadar</h2>
        </div>
        <span className={`qd-pill ${STATUS[stage][1]}`}>{STATUS[stage][0]}</span>
      </div>

      <div className="qd-plan__grid">
        <div className="qd-plan__msg">
          <div className="qd-plan__who">
            <Grade grade={p.grade} />
            <span>
              <b>{customer.name}</b>
              <small>{r.id} · {money(r.amount)} · vade {formatDateTr(r.dueDate)}{overdue > 0 ? ` (${overdue} gün geçti)` : ""}</small>
            </span>
          </div>
          <div className="qd-chat" style={{ marginTop: 10 }}>
            <div className="qd-bubble">
              {msg.text}
              <small>{formatDateTr(msg.date)} · WhatsApp · ajanın okuduğu söz: {formatDateTr(promised)}</small>
            </div>
          </div>
          <p className="qd-plan__hint">
            Ödeme notu {p.grade}; ortanca {p.medianDelay} gün geç ödüyor. Geçmiş sözler: {past.length ? `${kept}/${past.length} tutuldu` : "kayıt yok"}.
          </p>
        </div>

        <ol className="qd-steps">
          <li data-done={idx >= 1}>
            <span className="qd-steps__icon">{idx >= 1 ? <Check size={14} /> : <FileText size={14} />}</span>
            <div>
              <b>Faturayla eşleştir</b>
              <span>{idx >= 1 ? `Aynı müşteri, yanıt ${r.id} hatırlatmasına; tutar ${money(r.amount)}. Aynı alacak iki kez sayılmaz.` : "Söz hangi açık alacağa ait?"}</span>
            </div>
          </li>
          <li data-done={idx >= 2}>
            <span className="qd-steps__icon">{idx >= 2 ? <Check size={14} /> : <MessageCircle size={14} />}</span>
            <div>
              <b>Alıcıdan tarih teyidi</b>
              <span>{idx >= 2 ? `Alıcı teyit etti: ${formatDateTr(promised)} · ${money(r.amount)}.` : "Belirsiz \"cuma\" yerine tarih ve tutar tek dokunuşla teyit edilir."}</span>
            </div>
          </li>
          <li data-done={idx >= 3}>
            <span className="qd-steps__icon">{idx >= 3 ? <Check size={14} /> : <Landmark size={14} />}</span>
            <div>
              <b>Planlı ödeme emri</b>
              <span>{idx >= 3 ? `Alıcı kendi bankasında ${formatDateTr(promised)} tarihli talimatı onayladı.` : "Alıcıya, yetkili ödeme kuruluşu üzerinden ileri tarihli ödeme talimatı seçeneği (ÖHVPS 2.0)."}</span>
            </div>
          </li>
          <li data-done={false}>
            <span className="qd-steps__icon"><BadgeCheck size={14} /></span>
            <div>
              <b>Sonucu izle, karneye işle</b>
              <span>Ödeme günü banka hareketiyle eşleşir; sonuç ödeme karnesine ve bankaya taşınabilir karneye yazılır.</span>
            </div>
          </li>
        </ol>
      </div>

      {stage === "matched" && !busy ? (
        <div className="qd-action__draft qd-enter" style={{ marginTop: 12 }}>
          Merhaba, {r.id} numaralı {money(r.amount)} tutarlı ödemeniz için {formatDateTr(promised)} tarihini teyit eder misiniz? Tek dokunuşla onaylayabilirsiniz: [Evet, {formatDateTr(promised)}] [Başka tarih öner]
        </div>
      ) : null}
      {stage === "ordered" ? (
        <div className="qd-plan__result qd-enter">
          <ShieldCheck size={18} />
          <div>
            <b>Söz artık bir banka kaydı.</b>
            <span>
              Gerçek üründe bu {money(r.amount)} tahminde teyitli tahsilat olarak sayılır. Uygunsa işletme vadeden önce bankasından iskonto talep edebilir. Teyitli söz banka garantisi değildir; planlı emir de hesapta bakiye yoksa gerçekleşmeyebilir. Bu yüzden sonuç ayrıca izlenir.
            </span>
          </div>
        </div>
      ) : null}

      <div className="qd-action__buttons" style={{ marginTop: 14 }}>
        {busy ? (
          <span className="qd-pill qd-pill--muted"><Loader2 size={12} className="qd-spin" /> {busy}</span>
        ) : stage === "promise" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("matched", "Faturayla eşleştiriliyor…", 700)}>
            Sözü işlem planına dönüştür <ArrowRight size={14} />
          </button>
        ) : stage === "matched" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("confirmed", "Alıcının teyidi bekleniyor…", 1300)}>
            Teyit iste (simülasyon) <ArrowRight size={14} />
          </button>
        ) : stage === "confirmed" ? (
          <button type="button" className="qd-btn qd-btn--primary" onClick={() => advance("ordered", "Alıcı bankasında onaylıyor…", 1400)}>
            Planlı ödeme seçeneği gönder (simülasyon) <ArrowRight size={14} />
          </button>
        ) : (
          <button type="button" className="qd-btn qd-btn--sm" onClick={() => { setStage("promise"); onLog("reset"); }}>
            <RotateCcw size={13} /> Baştan oynat
          </button>
        )}
      </div>
      <p className="qd-plan__note">Sentetik senaryo. Gerçek WhatsApp mesajı gönderilmez, banka talimatı başlatılmaz, finansman teklifi oluşturulmaz.</p>
    </section>
  );
}
