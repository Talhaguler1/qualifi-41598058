import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BellRing, CalendarClock, Check, CircleCheck, MessageCircle, PhoneCall, Send, TriangleAlert } from "lucide-react";
import { addDays, diffDays, formatDateTr, L, money, sampleMessages, type Advice, type EventOutcome, type ForecastWeek } from "@/lib/demo";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_MOVE = [0.65, 0, 0.35, 1] as const;

/** Where the user drops a customer's message. Samples make it one click; typing works too. */
export function MessageComposer({ customerName, delayCustomerName, onSend, processed, onUndo }: { customerName: string; delayCustomerName?: string; onSend: (text: string) => string | null; processed: number; onUndo: () => void }) {
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const samples = useMemo(() => sampleMessages(customerName, delayCustomerName), [customerName, delayCustomerName]);
  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const problem = onSend(v);
    setHint(problem);
    if (!problem) setText("");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };
  return (
    <section className="qd-composer qd-enter" aria-labelledby="qd-composer-title">
      <div className="qd-composer__head">
        <span className="qd-composer__icon" aria-hidden="true">
          <MessageCircle size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="qd-composer-title">{L("Müşteriden mesaj geldi. Ne değişir?", "A customer just texted. What changes?")}</h2>
          <p>{L("Bir örneğe tıklayın ya da WhatsApp mesajını yapıştırın; ajan tarihi kaydırıp tahmini yeniden çizer.", "Tap a sample or paste a WhatsApp message; the agent moves the date and redraws the forecast.")}</p>
        </div>
        {processed ? (
          <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm qd-composer__undo" onClick={onUndo}>
            {L(`${processed} mesaj işlendi · geri al`, `${processed} processed · undo`)}
          </button>
        ) : null}
      </div>
      <div className="qd-composer__samples">
        {samples.map((s) => (
          <button key={s.label} type="button" className="qd-sample" onClick={() => send(s.text)}>
            {s.label}
          </button>
        ))}
      </div>
      <form className="qd-composer__form" onSubmit={submit}>
        <input
          className="qd-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={L(`Örn. "${customerName.split(" ")[0]}: Ödemeyi ay sonuna bırakabilir miyiz?"`, `e.g. "${customerName.split(" ")[0]}: Can we pay at the end of the month?"`)}
          aria-label={L("Müşteri mesajı", "Customer message")}
        />
        <button type="submit" className="qd-btn qd-btn--primary">
          <Send size={15} strokeWidth={1.75} /> {L("Ajana ver", "Send to agent")}
        </button>
      </form>
      {hint ? <p className="qd-composer__hint" role="status">{hint}</p> : null}
    </section>
  );
}

function linePath(weeks: ForecastWeek[], pick: (w: ForecastWeek) => number, x: (i: number) => number, y: (v: number) => number): string {
  return weeks.map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pick(w)).toFixed(1)}`).join(" ");
}

/** The agent's live reply to one message: bubble → facts → date slides → line redraws → advice. */
export function LiveUpdate({ outcome, asOf, onAdvice }: { outcome: EventOutcome; asOf: string; onAdvice: (a: Advice) => void }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? 5 : 0);
  useEffect(() => {
    if (reduce) {
      setStage(5);
      return;
    }
    setStage(0);
    const timers = [350, 1000, 1700, 2500, 3100].map((t, i) => setTimeout(() => setStage(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, [outcome, reduce]);

  const { event, before, after, tightIndex, warning } = outcome;
  const start = addDays(asOf, 1);
  const span = 56;
  // Chips stay inside the track even when the new date is beyond the 8-week window.
  const pos = (d: string) => Math.min(92, Math.max(6, (diffDays(d, start) / span) * 100));
  const shifted = diffDays(event.to, event.from);

  // Chart geometry
  const W = 640;
  const H = 200;
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const values = [...before, ...after].flatMap((w) => [w.balanceBase, w.balanceLow]).concat(0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (after.length - 1);
  const y = (v: number) => pad.t + ((max - v) * (H - pad.t - pad.b)) / (max - min || 1);
  const beforeBase = linePath(before, (w) => w.balanceBase, x, y);
  const afterBase = linePath(after, (w) => w.balanceBase, x, y);
  const beforeLow = linePath(before, (w) => w.balanceLow, x, y);
  const afterLow = linePath(after, (w) => w.balanceLow, x, y);
  const colW = (W - pad.l - pad.r) / (after.length - 1);
  const tight = after[tightIndex]!;
  const delta = tight.balanceBase - (before[tightIndex]?.balanceBase ?? tight.balanceBase);

  return (
    <div className="qd-live">
      <div className="qd-live__top">
        <motion.div
          className="qd-live__bubble"
          initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <small>
            <MessageCircle size={13} strokeWidth={1.75} /> WhatsApp · {event.customer.name}
          </small>
          {event.text}
        </motion.div>
        <ul className="qd-live__facts qd-reveal" data-on={stage >= 1}>
          <li>
            <span>{L("Müşteri", "Customer")}</span>
            <b>{event.customer.name}</b>
            {event.assumedCustomer ? <em>{L("son konuşmadan", "from the latest chat")}</em> : null}
          </li>
          <li>
            <span>{L("Fatura", "Invoice")}</span>
            <b className="qd-num">
              {event.receivable.id} · {money(event.amount)}
            </b>
          </li>
          <li>
            <span>{L("Ajanın anladığı", "What the agent read")}</span>
            <b>
              {event.kind === "paid"
                ? L("Ödendi", "Paid")
                : event.kind === "split"
                  ? L("İkiye bölünecek", "Split in two")
                  : shifted > 0
                    ? L(`${shifted} gün sonra`, `${shifted} days later`)
                    : L(`Yeni tarih: ${formatDateTr(event.to)}`, `New date: ${formatDateTr(event.to)}`)}
            </b>
          </li>
        </ul>
      </div>

      <div className="qd-live__timeline" aria-label={L("Beklenen ödeme tarihi", "Expected payment date")}>
        <div className="qd-live__axis">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ left: `${(i / 8) * 100}%` }}>
              {i < 8 ? formatDateTr(addDays(start, i * 7)).replace(/ \d{4}$/, "") : ""}
            </span>
          ))}
        </div>
        <div className="qd-live__track">
          <span className="qd-live__ghost" style={{ left: `${pos(event.from)}%` }} data-show={stage >= 2}>
            {formatDateTr(event.from).replace(/ \d{4}$/, "")}
          </span>
          <motion.span
            className="qd-live__chip"
            data-kind={event.kind}
            initial={false}
            animate={{ left: `${stage >= 2 ? pos(event.to) : pos(event.from)}%` }}
            transition={{ duration: reduce ? 0 : 0.8, ease: EASE_MOVE }}
          >
            <CalendarClock size={13} strokeWidth={1.75} />
            <b className="qd-num">{money(event.kind === "split" ? Math.round(event.amount / 2) : event.amount)}</b>
            <small>{formatDateTr(stage >= 2 ? event.to : event.from).replace(/ \d{4}$/, "")}</small>
          </motion.span>
          {event.kind === "split" && event.secondTo ? (
            <motion.span
              className="qd-live__chip qd-live__chip--second"
              initial={false}
              animate={{ left: `${stage >= 2 ? pos(event.secondTo) : pos(event.from)}%`, opacity: stage >= 2 ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.8, ease: EASE_MOVE }}
            >
              <b className="qd-num">{money(event.amount - Math.round(event.amount / 2))}</b>
              <small>{formatDateTr(event.secondTo).replace(/ \d{4}$/, "")}</small>
            </motion.span>
          ) : null}
        </div>
      </div>

      <div className="qd-live__chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={L("8 haftalık nakit tahmini, önce ve sonra", "8-week cash forecast, before and after")}>
          <motion.rect
            x={x(tightIndex) - colW / 2}
            y={pad.t - 6}
            width={colW}
            height={H - pad.t - pad.b + 6}
            rx={10}
            className={warning ? "qd-live__tight qd-live__tight--warn" : "qd-live__tight"}
            initial={false}
            animate={{ opacity: stage >= 3 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
          <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} className="qd-live__zero" />
          <path d={beforeBase} className="qd-live__before" />
          <motion.path className="qd-live__low" initial={false} animate={{ d: stage >= 3 ? afterLow : beforeLow }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE_MOVE }} />
          <motion.path className="qd-live__after" initial={false} animate={{ d: stage >= 3 ? afterBase : beforeBase }} transition={{ duration: reduce ? 0 : 0.9, ease: EASE_MOVE }} />
          {after.map((w, i) => (
            <text key={w.weekStart} x={x(i)} y={H - 6} textAnchor="middle" className="qd-live__label">
              {formatDateTr(w.weekStart).replace(/ \d{4}$/, "")}
            </text>
          ))}
        </svg>
        <div className="qd-live__legend">
          <span><i className="qd-live__key qd-live__key--before" />{L("Mesajdan önce", "Before the message")}</span>
          <span><i className="qd-live__key qd-live__key--after" />{L("Şimdi (en olası)", "Now (most likely)")}</span>
          <span><i className="qd-live__key qd-live__key--low" />{L("Kötü senaryo", "Downside case")}</span>
        </div>
      </div>

      <div className={`qd-live__verdict qd-reveal${warning ? " qd-live__verdict--warn" : ""}`} data-on={stage >= 4}>
        {warning ? <TriangleAlert size={18} strokeWidth={1.75} /> : <CircleCheck size={18} strokeWidth={1.75} />}
        <div>
          <b>
            {warning
              ? L(`${formatDateTr(tight.weekStart)} haftasında nakit sıkışıyor`, `Cash gets tight in the week of ${formatDateTr(tight.weekStart)}`)
              : event.kind === "paid"
                ? L("Nakit tahmini güncellendi", "Cash forecast updated")
                : L("Nakit hâlâ yeterli", "Cash is still sufficient")}
          </b>
          <span>
            {outcome.summary}{" "}
            {delta < 0 ? L(`O hafta beklenen bakiye ${money(-delta)} düştü.`, `Expected balance that week drops by ${money(-delta)}.`) : delta > 0 ? L(`O hafta beklenen bakiye ${money(delta)} arttı.`, `Expected balance that week rises by ${money(delta)}.`) : ""}
          </span>
        </div>
      </div>

      <div className="qd-live__advice">
        {outcome.advice.map((a, i) => (
          <button
            key={a.id}
            type="button"
            className="qd-advice qd-reveal"
            data-on={stage >= 5}
            style={{ transitionDelay: reduce ? "0ms" : `${i * 80}ms` }}
            onClick={() => onAdvice(a)}
            tabIndex={stage >= 5 ? 0 : -1}
          >
            <span className="qd-advice__icon" aria-hidden="true">
              {a.kind === "remind" ? <BellRing size={16} strokeWidth={1.75} /> : a.kind === "pull" ? <PhoneCall size={16} strokeWidth={1.75} /> : a.kind === "defer" ? <CalendarClock size={16} strokeWidth={1.75} /> : <Check size={16} strokeWidth={1.75} />}
            </span>
            <span>
              <b>{a.title}</b>
              <small>{a.detail}</small>
            </span>
            <ArrowRight size={15} strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </div>
  );
}
