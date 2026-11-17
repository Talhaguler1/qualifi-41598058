import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Check, Loader2, Send, Pencil, Clock3, PhoneCall, MessageCircle } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateTr, money, type AgentAction, type AgentAnswer, type AgentStep, type Briefing } from "@/lib/demo";
import { TOOL_ICONS, useLocalState, useMounted } from "./shared";

/** Plays the agent's round step by step, like watching it work. Replays when `runKey` changes. */
export function AgentFeed({ steps, runKey }: { steps: AgentStep[]; runKey: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(steps.length + 1);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setProgress(i);
      if (i > steps.length) clearInterval(timer);
    }, 520);
    return () => clearInterval(timer);
  }, [runKey, steps.length]);
  const working = progress <= steps.length;
  return (
    <>
      <div className="qd-card__head" style={{ marginBottom: 0 }}>
        <div className="qd-agent__title">
          <span className="qd-agent__avatar">
            <Bot size={18} />
          </span>
          <span>
            <b>QualiFi ajanı</b>
            <small>Kaynakları tarar, tahmini yeniler, takip önerir</small>
          </span>
        </div>
        <span className="qd-agent__status" aria-live="polite">{working ? "Çalışıyor" : "Güncel"}</span>
      </div>
      <ol className="qd-feed">
        {steps.map((s, i) => {
          const state = i + 1 < progress ? "done" : i + 1 === progress ? "running" : "pending";
          return (
            <li key={`${runKey}-${s.id}`} data-state={state}>
              <span className="qd-feed__icon">{state === "running" ? <Loader2 size={14} className="qd-spin" /> : state === "done" ? <Check size={14} /> : TOOL_ICONS[s.tool]}</span>
              <div>
                <b>{s.title}</b>
                <span>{s.detail}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

export function BriefingBox({ briefing }: { briefing: Briefing }) {
  return (
    <div className="qd-brief qd-enter" data-tone={briefing.tone}>
      <p>{briefing.headline}</p>
      <ul>
        {briefing.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

interface Turn {
  id: number;
  question: string;
  answer: AgentAnswer | null;
}

export function AskAgent({ ask, suggestions, resetKey, onAsk }: { ask: (q: string) => AgentAnswer; suggestions: readonly string[]; resetKey: string; onAsk?: (q: string) => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const counter = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setTurns([]);
  }, [resetKey]);
  useEffect(() => {
    if (turns.length) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns]);

  const send = (q: string) => {
    const question = q.trim();
    if (!question) return;
    const id = ++counter.current;
    onAsk?.(question);
    setTurns((t) => [...t.slice(-3), { id, question, answer: null }]);
    setText("");
    // A short pause reads as the agent thinking; the answer itself is computed instantly.
    setTimeout(() => setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer: ask(question) } : x))), 650);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };
  return (
    <div className="qd-ask">
      <div className="qd-chips">
        {suggestions.map((s) => (
          <button key={s} type="button" className="qd-chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ajana sorun: Aralık nasıl görünüyor?" aria-label="Ajana soru" />
        <button className="qd-btn qd-btn--primary" type="submit" aria-label="Gönder">
          <Send size={14} />
        </button>
      </form>
      <div className="qd-thread">
        {turns.map((t) => (
          <div key={t.id} style={{ display: "contents" }}>
            <div className="qd-msg qd-msg--me">{t.question}</div>
            <div className="qd-msg qd-msg--agent">
              {t.answer ? <AnswerBody answer={t.answer} /> : <span className="qd-typing" aria-label="Ajan yazıyor"><i /><i /><i /></span>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function AnswerBody({ answer }: { answer: AgentAnswer }) {
  const mounted = useMounted();
  return (
    <>
      <div>{answer.text}</div>
      {answer.bullets.length ? (
        <ul>
          {answer.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      {answer.scenario && mounted ? (
        <div style={{ height: 120, marginTop: 8 }}>
          <ResponsiveContainer>
            <LineChart data={answer.scenario.base.map((w, i) => ({ week: formatDateTr(w.weekStart).slice(0, 6), base: w.balanceBase, changed: answer.scenario!.changed[i]?.balanceBase ?? 0 }))} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: "#c3d4bd", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="base" name="Bugünkü tahmin" stroke="#d8eea6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="changed" name={answer.scenario.label} stroke="#f2a48f" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </>
  );
}

type ActionState = Record<string, { state?: "sent" | "snoozed"; text?: string }>;

const KIND_LABEL = { reminder: "Vadeden önce hatırlat", promise_check: "Söz kontrolü", escalate: "Görüşme öner", instrument_check: "Çek/senet teyidi" } as const;
const KIND_TONE = { reminder: "qd-pill--warn", promise_check: "qd-pill--bad", escalate: "qd-pill--bad", instrument_check: "qd-pill--warn" } as const;

/** The agent's proposals. Approving only simulates sending: nothing leaves the demo. */
export function ActionQueue({ actions, storageKey, onToast, onAction }: { actions: AgentAction[]; storageKey: string; onToast: (t: string) => void; onAction?: (action: "agent_approve" | "agent_edit" | "agent_snooze", id: string) => void }) {
  const [state, setState] = useLocalState<ActionState>(storageKey, {});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  return (
    <div className="qd-actions">
      {actions.map((a, i) => {
        const s = state[a.id];
        const text = s?.text ?? a.draftMessage;
        return (
          <article key={a.id} className="qd-action qd-enter" data-state={s?.state ?? "open"} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="qd-action__top">
              <div>
                <div className="qd-action__name">{a.customer.name}</div>
                <div className="qd-action__reason">{a.reason}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`qd-pill ${KIND_TONE[a.kind]}`}>{KIND_LABEL[a.kind]}</span>
                <div className="qd-num" style={{ fontWeight: 700, marginTop: 6 }}>{money(a.receivable.amount)}</div>
              </div>
            </div>
            {editing === a.id ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Mesaj taslağı" />
            ) : (
              <div className="qd-action__draft">{text}</div>
            )}
            <div className="qd-action__buttons">
              {s?.state === "sent" ? (
                <span className="qd-pill qd-pill--good">
                  <Check size={12} /> Onaylandı · demo gönderimi
                </span>
              ) : editing === a.id ? (
                <>
                  <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" onClick={() => { setState({ ...state, [a.id]: { ...s, text: draft } }); setEditing(null); onAction?.("agent_edit", a.receivable.id); onToast("Taslak güncellendi."); }}>
                    Kaydet
                  </button>
                  <button type="button" className="qd-btn qd-btn--sm" onClick={() => setEditing(null)}>Vazgeç</button>
                </>
              ) : (
                <>
                  <button type="button" className="qd-btn qd-btn--primary qd-btn--sm" onClick={() => { setState({ ...state, [a.id]: { state: "sent", text } }); onAction?.("agent_approve", a.receivable.id); onToast(`${a.customer.name} için WhatsApp mesajı onaylandı (demo, gönderilmedi).`); }}>
                    {a.kind === "escalate" ? <PhoneCall size={13} /> : <MessageCircle size={13} />} Onayla
                  </button>
                  <button type="button" className="qd-btn qd-btn--sm" onClick={() => { setDraft(text); setEditing(a.id); }}>
                    <Pencil size={13} /> Düzenle
                  </button>
                  <button type="button" className="qd-btn qd-btn--ghost qd-btn--sm" onClick={() => { setState({ ...state, [a.id]: { state: "snoozed", text } }); onAction?.("agent_snooze", a.receivable.id); onToast("3 gün sonra tekrar hatırlatılacak."); }}>
                    <Clock3 size={13} /> Ertele
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
      {actions.length === 0 ? <p style={{ color: "var(--qd-muted)" }}>Bugün takip gereken ödeme yok.</p> : null}
    </div>
  );
}
