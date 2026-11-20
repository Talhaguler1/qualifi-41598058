import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTr } from "@/lib/demo";

interface WaMessage {
  id: string;
  direction: "in" | "out";
  contact_wa_id: string;
  contact_name: string | null;
  body: string;
  intent: string | null;
  previous_due_date: string | null;
  new_due_date: string | null;
  ai_summary: string | null;
  confidence: number | null;
  reply_draft: string | null;
  reply_state: string;
  delivery_status: string | null;
  error: string | null;
  created_at: string;
}

const INTENT: Record<string, { label: string; tone: string }> = {
  promise: { label: "Ödeme sözü", tone: "qd-pill--good" },
  paid: { label: "Ödendi diyor · bankada kontrol", tone: "qd-pill--warn" },
  refuse: { label: "Ödeyemiyor", tone: "qd-pill--bad" },
  question: { label: "Soru", tone: "qd-pill--muted" },
  other: { label: "Bilgi", tone: "qd-pill--muted" },
};

// The generated Database types don't include this table yet.
const table = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as unknown as { from: (t: string) => any }).from("qualifi_whatsapp_messages");
const hm = (iso: string) =>
  new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

/**
 * Live WhatsApp messages for this account: what the customer wrote, how the agent read it,
 * which due date moved, and a reply the owner approves before it is sent.
 * Hidden entirely until the account has a message (or if the table isn't there yet).
 */
export function WhatsAppInbox({
  userId,
  token,
  readOnly,
  onChange,
}: {
  userId: string;
  token: string;
  readOnly?: boolean;
  onChange: () => void;
}) {
  const [rows, setRows] = useState<WaMessage[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await table()
      .select(
        "id,direction,contact_wa_id,contact_name,body,intent,previous_due_date,new_due_date,ai_summary,confidence,reply_draft,reply_state,delivery_status,error,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (e) {
      setRows([]);
      return;
    }
    const list = (data ?? []) as WaMessage[];
    setRows(list);
    // A new or newly analysed message may have moved a due date: refresh the table and chart.
    const key = list
      .map((m) => `${m.id}:${m.new_due_date ?? ""}:${m.ai_summary ? 1 : 0}`)
      .join("|");
    if (last.current !== null && key !== last.current) onChange();
    last.current = key;
  }, [userId, onChange]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 4000);
    return () => window.clearInterval(t);
  }, [load]);

  const act = async (m: WaMessage, action: "send" | "dismiss") => {
    setBusy(m.id);
    setError(null);
    const res = await fetch("/api/whatsapp/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message_id: m.id,
        action,
        ...(action === "send" ? { text: drafts[m.id] ?? m.reply_draft ?? "" } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) setError(body.message ?? "İşlem yapılamadı.");
    setBusy(null);
    await load();
  };

  if (!rows || !rows.length) return null;
  const shown = [...rows].reverse();
  return (
    <section className="qd-card" id="qd-whatsapp">
      <div className="qd-card__head">
        <div>
          <span className="qd-eyebrow">Canlı · WhatsApp Business</span>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={18} /> Müşteri mesajları
          </h2>
          <p>
            Ajan her mesajı okur, ödeme sözünü ilgili faturaya işler. Cevaplar siz onaylamadan
            gitmez.
          </p>
        </div>
      </div>
      {error ? (
        <div className="qd-alert" role="alert">
          {error}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 620,
          overflowY: "auto",
          padding: 12,
          background: "#efeae2",
          borderRadius: 14,
        }}
      >
        {shown.map((m) => {
          const intent = m.intent ? INTENT[m.intent] : null;
          const waiting = !readOnly && (m.reply_state === "waiting" || m.reply_state === "failed");
          return (
            <div
              key={m.id}
              style={{
                alignSelf: m.direction === "in" ? "flex-start" : "flex-end",
                maxWidth: "88%",
                background: m.direction === "in" ? "#fff" : "#dcf8c6",
                borderRadius: 12,
                padding: "9px 12px 7px",
                boxShadow: "0 1px 1px #0000001a",
                fontSize: 14.5,
                lineHeight: 1.45,
              }}
            >
              {m.direction === "in" ? (
                <div style={{ fontWeight: 700, fontSize: 12.5, color: "#2f7d4f" }}>
                  {m.contact_name ?? `+${m.contact_wa_id}`}
                </div>
              ) : null}
              <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "#667781",
                  textAlign: "right",
                  marginTop: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {hm(m.created_at)}
                {m.direction === "out" ? (
                  m.delivery_status === "read" ? (
                    <CheckCheck size={14} color="#34b7f1" />
                  ) : m.delivery_status === "delivered" ? (
                    <CheckCheck size={14} />
                  ) : m.delivery_status === "failed" ? (
                    <X size={14} color="#c0503a" />
                  ) : (
                    <Check size={14} />
                  )
                ) : null}
              </div>
              {m.direction === "in" && !m.ai_summary && !m.error ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12.5,
                    color: "var(--qd-muted)",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <Loader2 size={12} className="qd-spin" /> Ajan okuyor…
                </div>
              ) : null}
              {m.direction === "in" && m.ai_summary ? (
                <div style={{ marginTop: 8, borderTop: "1px solid #e2e6db", paddingTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    {intent ? (
                      <span className={`qd-pill ${intent.tone}`}>{intent.label}</span>
                    ) : null}
                    {m.new_due_date ? (
                      <span className="qd-pill qd-pill--warn">
                        {m.previous_due_date && m.previous_due_date !== m.new_due_date ? (
                          <>
                            <s style={{ opacity: 0.6 }}>{formatDateTr(m.previous_due_date)}</s>{" "}
                            →{" "}
                          </>
                        ) : (
                          "Yeni tarih "
                        )}
                        {formatDateTr(m.new_due_date)}
                      </span>
                    ) : null}
                    {m.confidence != null ? (
                      <span style={{ fontSize: 11.5, color: "var(--qd-muted)" }}>
                        güven %{Math.round(m.confidence * 100)}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--qd-muted)" }}>{m.ai_summary}</div>
                </div>
              ) : null}
              {m.direction === "out" && m.error ? (
                <div style={{ fontSize: 12, color: "var(--qd-bad)" }}>{m.error}</div>
              ) : null}
              {waiting && m.reply_draft ? (
                <div
                  style={{ marginTop: 10, background: "#f7f6f1", borderRadius: 10, padding: 10 }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Ajanın cevap taslağı{" "}
                    {m.reply_state === "failed" ? (
                      <span style={{ color: "var(--qd-bad)" }}>
                        · gönderilemedi, tekrar deneyin
                      </span>
                    ) : null}
                  </div>
                  <textarea
                    className="qd-input"
                    style={{ width: "100%", minHeight: 76, resize: "vertical", fontSize: 13.5 }}
                    value={drafts[m.id] ?? m.reply_draft}
                    onChange={(e) => setDrafts({ ...drafts, [m.id]: e.target.value })}
                    maxLength={1000}
                    aria-label="Cevap taslağı"
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="qd-btn qd-btn--primary qd-btn--sm"
                      disabled={busy === m.id}
                      onClick={() => void act(m, "send")}
                    >
                      {busy === m.id ? (
                        <Loader2 size={13} className="qd-spin" />
                      ) : (
                        <Send size={13} />
                      )}{" "}
                      Onayla ve gönder
                    </button>
                    <button
                      type="button"
                      className="qd-btn qd-btn--ghost qd-btn--sm"
                      disabled={busy === m.id}
                      onClick={() => void act(m, "dismiss")}
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
