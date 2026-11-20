// Live WhatsApp (Meta Cloud API) → QualiFi account.
// Meta posts each incoming message to /api/whatsapp/webhook. The message, the recent
// conversation and the owner's open receivables go to the AI reader, which says what the
// customer means (promise, paid, refusal, question). A clear promise moves the matching
// commitment's due date; anything unsure is flagged for review, never guessed. Replies are
// only drafted here: the owner approves them in the panel before anything is sent.
import { z } from "zod";

// ---------- types ----------
export type Intent = "promise" | "paid" | "refuse" | "question" | "other";

export interface OpenCommitment {
  id: string;
  counterparty: string;
  amount: number;
  currency: string | null;
  due_date: string | null;
  kind: string;
}

export interface ChatLine {
  direction: "in" | "out";
  body: string;
  at: string; // ISO timestamp
}

export interface StoredMessage {
  id: string;
  user_id: string;
  direction: "in" | "out";
  contact_wa_id: string;
  contact_name: string | null;
  body: string;
  commitment_id: string | null;
  reply_draft: string | null;
  reply_state: string;
}

export const analysisSchema = z.object({
  intent: z.enum(["promise", "paid", "refuse", "question", "other"]),
  commitment_id: z.string().nullable(),
  new_due_date: z.string().nullable(),
  amount: z.number().nullable(),
  confidence: z.number(),
  summary: z.string(),
  reply: z.string().nullable(),
});
export type Analysis = z.infer<typeof analysisSchema>;

export interface AnalyzeInput {
  today: string; // YYYY-MM-DD, Europe/Istanbul
  messageAt: string; // YYYY-MM-DD HH:mm, Europe/Istanbul
  weekday: string;
  contactName: string | null;
  business: string;
  message: string;
  history: ChatLine[];
  open: OpenCommitment[];
  linkedIds: string[];
}

export interface WhatsAppStore {
  ownerUserId(): Promise<string | null>;
  insertIncoming(row: {
    user_id: string;
    wa_message_id: string;
    contact_wa_id: string;
    contact_name: string | null;
    body: string;
  }): Promise<string | null>; // null = duplicate
  history(userId: string, contact: string, limit: number): Promise<ChatLine[]>;
  linkedCommitments(userId: string, contact: string): Promise<string[]>;
  openReceivables(userId: string): Promise<OpenCommitment[]>;
  updateCommitment(
    userId: string,
    id: string,
    patch: { due_date?: string; needs_review?: boolean; evidence?: string; confidence?: number },
  ): Promise<void>;
  insertPromise(row: {
    user_id: string;
    counterparty: string;
    amount: number;
    due_date: string;
    evidence: string;
    confidence: number;
  }): Promise<string | null>;
  saveAnalysis(messageId: string, patch: Record<string, unknown>): Promise<void>;
  setDelivery(waMessageId: string, status: string, error: string | null): Promise<void>;
}

export interface WhatsAppDeps {
  store: WhatsAppStore;
  analyze: (input: AnalyzeInput) => Promise<Analysis>;
  markRead: (waMessageId: string) => Promise<void>;
  now: () => Date;
  config: { verifyToken: string; appSecret: string; phoneNumberId: string; business: string };
}

// ---------- helpers ----------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const validDate = (d: string | null | undefined): d is string =>
  !!d && DATE_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

/** Date and time in Istanbul, regardless of where the server runs. */
export function istanbul(now: Date): { date: string; time: string; weekday: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekday = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
  }).format(now);
  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    time: `${parts["hour"] === "24" ? "00" : parts["hour"]}:${parts["minute"]}`,
    weekday,
  };
}

export function quote(text: string, words = 20): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  return w.slice(0, words).join(" ") + (w.length > words ? "…" : "");
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function validSignature(
  secret: string,
  body: string,
  header: string | null,
): Promise<boolean> {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const want = await hmacHex(secret, body);
  const got = header.slice(7);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

// ---------- AI instructions ----------
export const ANALYZE_INSTRUCTIONS = `Sen bir Türk işletmesinin alacak takibini yapan asistansın. Müşterinin WhatsApp mesajını, konuşmanın önceki kısmını ve işletmenin açık alacaklarını görüyorsun.
Görevin müşterinin gerçekte ne demek istediğini anlamak.
- intent: "promise" (belirli bir tarihte ödeyeceğini söylüyor), "paid" (ödediğini söylüyor), "refuse" (ödemeyeceğini ya da şu an ödeyemeyeceğini, tarih vermeden söylüyor), "question" (soru soruyor, fatura istiyor vb.), "other" (selamlaşma, ilgisiz).
- Bir mesajda birden çok tarih olabilir. Eski vadeyi, geçmişte konuşulanı ya da "şu tarihte değil" diye reddedilen tarihi seçme; müşterinin ŞİMDİ verdiği ödeme tarihini seç. "Cuma değil pazartesi" → pazartesi.
- Göreli ifadeleri mesajın tarihine göre çöz (mesaj Cuma 20 Kasım ise "haftaya salı" = 24 Kasım, "iki hafta sonra" = 4 Aralık, "ay sonu" = 30 Kasım). new_due_date: YYYY-MM-DD.
- commitment_id: yalnız listede olan bir kimlik. Müşterinin adı, mesajda geçen tutar/fatura/tarih ya da bu kişiyle daha önce eşleşen kayıtlar açıkça gösteriyorsa seç; emin değilsen null bırak. Uydurma.
- amount: müşteri tutar söylediyse (ör. "yarısını", "20 bin") TL olarak sayı; söylemediyse null.
- confidence: 0-1 arası; tarih ve eşleşme net değilse düşük ver.
- summary: işletme sahibine tek cümlelik Türkçe özet (ör. "Talha, 27 Kasım vadeli faturayı 30 Kasım'da ödeyeceğini söylüyor.").
- reply: işletme adına müşteriye kibar, kısa bir Türkçe cevap taslağı. Sözü tekrar edip teşekkür et; tarih belirsizse nazikçe net tarih iste; ödendi diyorsa kontrol edip döneceğini yaz. Söz vermediğin bir şeyi taahhüt etme. Gerek yoksa null.`;

export function buildPrompt(i: AnalyzeInput): string {
  const lines =
    i.history
      .map(
        (h) =>
          `[${h.at.slice(0, 16).replace("T", " ")}] ${h.direction === "in" ? "Müşteri" : "İşletme"}: ${h.body}`,
      )
      .join("\n") || "(önceki mesaj yok)";
  const open =
    i.open
      .map(
        (c) =>
          `- id=${c.id} | ${c.counterparty} | ${c.amount} ${c.currency ?? "TRY"} | vade ${c.due_date ?? "yok"} | ${c.kind}`,
      )
      .join("\n") || "(açık alacak yok)";
  return `İşletme: ${i.business}
Bugün: ${i.today} (${i.weekday})
Mesaj zamanı: ${i.messageAt}
Gönderen: ${i.contactName ?? "bilinmiyor"}
Bu kişiyle daha önce eşleşen kayıtlar: ${i.linkedIds.join(", ") || "yok"}

Açık alacaklar:
${open}

Önceki konuşma:
${lines}

YENİ MESAJ:
${i.message}`;
}

// ---------- applying the reader's answer ----------
export interface Applied {
  intent: Intent;
  commitment_id: string | null;
  previous_due_date: string | null;
  new_due_date: string | null;
  confidence: number;
  summary: string;
  reply_draft: string | null;
}

/** Re-checks the model's answer and changes the account only when it is safe. */
export async function applyAnalysis(
  a: Analysis,
  ctx: {
    store: WhatsAppStore;
    userId: string;
    open: OpenCommitment[];
    body: string;
    contactName: string | null;
  },
): Promise<Applied> {
  const conf = Number.isFinite(a.confidence) ? Math.min(1, Math.max(0, a.confidence)) : 0;
  const match = a.commitment_id ? (ctx.open.find((c) => c.id === a.commitment_id) ?? null) : null;
  const date = validDate(a.new_due_date) ? a.new_due_date : null;
  const evidence = `WhatsApp: “${quote(ctx.body)}”`;
  const out: Applied = {
    intent: a.intent,
    commitment_id: match?.id ?? null,
    previous_due_date: match?.due_date ?? null,
    new_due_date: null,
    confidence: conf,
    summary: a.summary.trim().slice(0, 400) || "Mesaj okundu.",
    reply_draft: a.reply?.trim() ? a.reply.trim().slice(0, 1000) : null,
  };
  if (a.intent === "promise" && date) {
    if (match) {
      await ctx.store.updateCommitment(ctx.userId, match.id, {
        due_date: date,
        needs_review: conf < 0.75,
        evidence,
        confidence: conf,
      });
      out.new_due_date = date;
    } else if (a.amount != null && Number.isFinite(a.amount) && a.amount > 0) {
      const id = await ctx.store.insertPromise({
        user_id: ctx.userId,
        counterparty: (ctx.contactName ?? "WhatsApp müşterisi").slice(0, 200),
        amount: Math.round(a.amount * 100) / 100,
        due_date: date,
        evidence,
        confidence: conf,
      });
      out.commitment_id = id;
      out.new_due_date = date;
    }
  } else if (a.intent === "paid" && match) {
    // Never mark paid from a message alone: flag it so the owner checks the bank.
    await ctx.store.updateCommitment(ctx.userId, match.id, { needs_review: true, evidence });
  }
  return out;
}

// ---------- webhook ----------
interface MetaValue {
  metadata?: { phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<{
    id: string;
    from: string;
    timestamp?: string;
    type: string;
    text?: { body?: string };
  }>;
  statuses?: Array<{
    id: string;
    status: string;
    errors?: Array<{ title?: string; message?: string }>;
  }>;
}

export function handleVerify(url: URL, verifyToken: string): Response {
  if (
    verifyToken &&
    url.searchParams.get("hub.mode") === "subscribe" &&
    url.searchParams.get("hub.verify_token") === verifyToken
  ) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("forbidden", { status: 403 });
}

export async function handleWebhook(request: Request, deps: WhatsAppDeps): Promise<Response> {
  const raw = await request.text();
  if (
    !(await validSignature(deps.config.appSecret, raw, request.headers.get("x-hub-signature-256")))
  ) {
    return new Response("bad signature", { status: 401 });
  }
  let body: { entry?: Array<{ changes?: Array<{ value?: MetaValue }> }> };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const userId = await deps.store.ownerUserId();
  if (!userId) {
    console.error("whatsapp webhook: owner account not found");
    return new Response("ok", { status: 200 }); // don't make Meta retry forever
  }
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      if (v.metadata?.phone_number_id && v.metadata.phone_number_id !== deps.config.phoneNumberId)
        continue;
      for (const st of v.statuses ?? []) {
        if (["sent", "delivered", "read", "failed"].includes(st.status)) {
          await deps.store.setDelivery(
            st.id,
            st.status,
            st.status === "failed"
              ? (st.errors?.[0]?.title ?? st.errors?.[0]?.message ?? "iletilemedi").slice(0, 300)
              : null,
          );
        }
      }
      const names = new Map(
        (v.contacts ?? []).map((c) => [c.wa_id ?? "", c.profile?.name ?? null]),
      );
      for (const m of v.messages ?? []) {
        try {
          await processMessage(m, names.get(m.from) ?? null, userId, deps);
        } catch (e) {
          console.error("whatsapp message failed", e);
        }
      }
    }
  }
  return new Response("ok", { status: 200 });
}

async function processMessage(
  m: NonNullable<MetaValue["messages"]>[number],
  contactName: string | null,
  userId: string,
  deps: WhatsAppDeps,
) {
  const text = m.type === "text" ? (m.text?.body ?? "").slice(0, 4096) : `[${m.type} mesajı]`;
  const contact = m.from.replace(/\D/g, "").slice(0, 32);
  const name = contactName?.slice(0, 100) ?? null;
  const id = await deps.store.insertIncoming({
    user_id: userId,
    wa_message_id: m.id,
    contact_wa_id: contact,
    contact_name: name,
    body: text,
  });
  if (!id) return; // Meta retry of a message we already have
  void deps.markRead(m.id).catch(() => {});
  if (m.type !== "text" || !text.trim()) {
    await deps.store.saveAnalysis(id, {
      intent: "other",
      ai_summary: "Metin dışı mesaj; okunmadı.",
      reply_state: "none",
    });
    return;
  }
  const at = m.timestamp ? new Date(Number(m.timestamp) * 1000) : deps.now();
  const now = istanbul(deps.now());
  const sent = istanbul(at);
  const [history, linkedIds, open] = await Promise.all([
    deps.store.history(userId, contact, 8),
    deps.store.linkedCommitments(userId, contact),
    deps.store.openReceivables(userId),
  ]);
  let analysis: Analysis;
  try {
    analysis = await deps.analyze({
      today: now.date,
      weekday: now.weekday,
      messageAt: `${sent.date} ${sent.time} (${sent.weekday})`,
      contactName: name,
      business: deps.config.business,
      message: text,
      history: history.filter((h) => h.body !== text).slice(-8),
      open,
      linkedIds,
    });
  } catch (e) {
    console.error("whatsapp analyze failed", e);
    await deps.store.saveAnalysis(id, {
      ai_summary: "Yapay zekâ şu anda mesajı okuyamadı; elle kontrol edin.",
      error: "ai_unavailable",
      reply_state: "none",
    });
    return;
  }
  const applied = await applyAnalysis(analysis, {
    store: deps.store,
    userId,
    open,
    body: text,
    contactName: name,
  });
  await deps.store.saveAnalysis(id, {
    intent: applied.intent,
    commitment_id: applied.commitment_id,
    previous_due_date: applied.previous_due_date,
    new_due_date: applied.new_due_date,
    ai_summary: applied.summary,
    confidence: applied.confidence,
    reply_draft: applied.reply_draft,
    reply_state: applied.reply_draft ? "waiting" : "none",
  });
}

// ---------- owner reply (approve / dismiss) ----------
export interface ReplyStore {
  userIdFromToken(token: string): Promise<string | null>;
  getMessage(id: string, userId: string): Promise<StoredMessage | null>;
  setReply(id: string, patch: Record<string, unknown>): Promise<void>;
  insertOutgoing(row: {
    user_id: string;
    contact_wa_id: string;
    contact_name: string | null;
    body: string;
    wa_message_id: string | null;
    commitment_id: string | null;
    delivery_status: string | null;
    error: string | null;
  }): Promise<void>;
}

const replySchema = z
  .object({
    message_id: z.string().uuid(),
    action: z.enum(["send", "dismiss"]),
    text: z.string().max(1000).optional(),
  })
  .strict();

export async function handleReply(
  request: Request,
  deps: { store: ReplyStore; send: (to: string, text: string) => Promise<string> },
): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer "))
    return Response.json(
      { error: "unauthorized", message: "Oturum açmanız gerekiyor." },
      { status: 401 },
    );
  const userId = await deps.store.userIdFromToken(auth.slice(7));
  if (!userId)
    return Response.json({ error: "unauthorized", message: "Oturum geçersiz." }, { status: 401 });
  let parsed;
  try {
    parsed = replySchema.safeParse(await request.json());
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: "invalid_fields" }, { status: 400 });
  const msg = await deps.store.getMessage(parsed.data.message_id, userId);
  if (!msg)
    return Response.json({ error: "not_found", message: "Mesaj bulunamadı." }, { status: 404 });
  if (msg.reply_state !== "waiting" && msg.reply_state !== "failed")
    return Response.json(
      { error: "not_waiting", message: "Bu taslak artık beklemede değil." },
      { status: 409 },
    );
  if (parsed.data.action === "dismiss") {
    await deps.store.setReply(msg.id, { reply_state: "dismissed" });
    return Response.json({ ok: true });
  }
  const text = (parsed.data.text ?? msg.reply_draft ?? "").trim();
  if (!text)
    return Response.json({ error: "empty", message: "Gönderilecek metin boş." }, { status: 400 });
  try {
    const waId = await deps.send(msg.contact_wa_id, text);
    await deps.store.insertOutgoing({
      user_id: userId,
      contact_wa_id: msg.contact_wa_id,
      contact_name: msg.contact_name,
      body: text,
      wa_message_id: waId,
      commitment_id: msg.commitment_id,
      delivery_status: "sent",
      error: null,
    });
    await deps.store.setReply(msg.id, { reply_state: "sent", reply_draft: text });
    return Response.json({ ok: true });
  } catch (e) {
    const message = (e instanceof Error ? e.message : "Gönderilemedi").slice(0, 300);
    await deps.store.setReply(msg.id, { reply_state: "failed", error: message });
    return Response.json({ error: "send_failed", message }, { status: 502 });
  }
}
