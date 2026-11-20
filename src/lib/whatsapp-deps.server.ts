// Real dependencies for the WhatsApp webhook: Supabase (service role), the Lovable AI gateway
// and Meta's Graph API. Secrets come from Lovable Secrets; nothing here reaches the browser.
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "@/lib/ai/run-id.server";
import { EXTRACT_TEXT_MODEL } from "@/lib/workspace-extract-deps.server";
import {
  ANALYZE_INSTRUCTIONS,
  analysisSchema,
  buildPrompt,
  type AnalyzeInput,
  type Analysis,
  type ChatLine,
  type OpenCommitment,
  type ReplyStore,
  type StoredMessage,
  type WhatsAppDeps,
  type WhatsAppStore,
} from "@/lib/whatsapp.server";

const GRAPH = "https://graph.facebook.com/v25.0";
const TABLE = "qualifi_whatsapp_messages";

export interface WhatsAppEnv {
  token: string;
  appSecret: string;
  verifyToken: string;
  phoneNumberId: string;
  ownerEmail: string;
  business: string;
  aiKey: string;
}

export function readEnv(): WhatsAppEnv {
  const e = (k: string) => (process.env[k] ?? "").trim();
  return {
    token: e("WHATSAPP_TOKEN"),
    appSecret: e("WHATSAPP_APP_SECRET"),
    verifyToken: e("WHATSAPP_VERIFY_TOKEN"),
    phoneNumberId: e("WHATSAPP_PHONE_NUMBER_ID"),
    ownerEmail: e("WHATSAPP_OWNER_EMAIL").toLowerCase(),
    business: e("WHATSAPP_BUSINESS_NAME") || "QualiFi kullanıcısı",
    aiKey: e("LOVABLE_API_KEY"),
  };
}

// The generated Database types don't know the new table yet; keep the untyped access in one place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = { from: (t: string) => any; auth: any };
async function admin(): Promise<Loose> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Loose;
}

let ownerCache: { email: string; id: string } | null = null;
async function findOwner(email: string): Promise<string | null> {
  if (!email) return null;
  if (ownerCache?.email === email) return ownerCache.id;
  const db = await admin();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = (data?.users ?? []) as Array<{ id: string; email?: string }>;
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) {
      ownerCache = { email, id: hit.id };
      return hit.id;
    }
    if (users.length < 200) break;
  }
  return null;
}

export async function graphPost(
  env: WhatsAppEnv,
  body: unknown,
): Promise<{ messages?: Array<{ id: string }> }> {
  const r = await fetch(`${GRAPH}/${env.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as {
    error?: { code?: number; message?: string; error_user_msg?: string };
    messages?: Array<{ id: string }>;
  };
  if (!r.ok)
    throw new Error(
      `${j.error?.code ?? r.status}: ${j.error?.error_user_msg ?? j.error?.message ?? "WhatsApp mesajı gönderilemedi"}`,
    );
  return j;
}

export async function sendText(env: WhatsAppEnv, to: string, text: string): Promise<string> {
  const j = await graphPost(env, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text },
  });
  const id = j.messages?.[0]?.id;
  if (!id) throw new Error("WhatsApp mesaj kimliği dönmedi");
  return id;
}

export function createAnalyzer(apiKey: string): (input: AnalyzeInput) => Promise<Analysis> {
  return async (input) => {
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    let failure: unknown;
    const result = streamText({
      model: provider.responses(EXTRACT_TEXT_MODEL),
      instructions: ANALYZE_INSTRUCTIONS,
      messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(input) }] }],
      output: Output.object({ schema: analysisSchema }),
      maxRetries: 1,
      onError: ({ error }) => {
        failure = error;
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    try {
      return await result.output;
    } catch (e) {
      throw failure ?? e;
    }
  };
}

export function createWhatsAppStore(env: WhatsAppEnv): WhatsAppStore {
  return {
    ownerUserId: () => findOwner(env.ownerEmail),
    async insertIncoming(row) {
      const db = await admin();
      const { data, error } = await db
        .from(TABLE)
        .insert({ ...row, direction: "in" })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") return null; // duplicate wa_message_id: Meta retried
        throw error;
      }
      return data.id as string;
    },
    async history(userId, contact, limit): Promise<ChatLine[]> {
      const db = await admin();
      const { data, error } = await db
        .from(TABLE)
        .select("direction,body,created_at")
        .eq("user_id", userId)
        .eq("contact_wa_id", contact)
        .order("created_at", { ascending: false })
        .limit(limit + 1);
      if (error) throw error;
      return ((data ?? []) as Array<{ direction: "in" | "out"; body: string; created_at: string }>)
        .slice(1)
        .reverse()
        .map((r) => ({ direction: r.direction, body: r.body, at: r.created_at }));
    },
    async linkedCommitments(userId, contact) {
      const db = await admin();
      const { data, error } = await db
        .from(TABLE)
        .select("commitment_id")
        .eq("user_id", userId)
        .eq("contact_wa_id", contact)
        .not("commitment_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return [
        ...new Set(((data ?? []) as Array<{ commitment_id: string }>).map((r) => r.commitment_id)),
      ];
    },
    async openReceivables(userId): Promise<OpenCommitment[]> {
      const db = await admin();
      const { data, error } = await db
        .from("qualifi_commitments")
        .select("id,counterparty,amount,currency,due_date,kind")
        .eq("user_id", userId)
        .eq("direction", "in")
        .eq("status", "open")
        .order("due_date", { ascending: true })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as OpenCommitment[];
    },
    async updateCommitment(userId, id, patch) {
      const db = await admin();
      const { error } = await db
        .from("qualifi_commitments")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    async insertPromise(row) {
      const db = await admin();
      const { data, error } = await db
        .from("qualifi_commitments")
        .insert({
          ...row,
          direction: "in",
          currency: "TRY",
          kind: "promise",
          status: "open",
          needs_review: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      return (data?.id as string) ?? null;
    },
    async saveAnalysis(messageId, patch) {
      const db = await admin();
      const { error } = await db.from(TABLE).update(patch).eq("id", messageId);
      if (error) throw error;
    },
    async setDelivery(waMessageId, status, err) {
      const db = await admin();
      const order = ["sent", "delivered", "read"];
      const { data } = await db
        .from(TABLE)
        .select("id,delivery_status")
        .eq("wa_message_id", waMessageId)
        .maybeSingle();
      if (!data) return;
      // Meta can deliver status updates out of order; never move backwards (failed always wins).
      if (status !== "failed" && order.indexOf(status) <= order.indexOf(data.delivery_status ?? ""))
        return;
      await db.from(TABLE).update({ delivery_status: status, error: err }).eq("id", data.id);
    },
  };
}

export function createReplyStore(): ReplyStore {
  return {
    async userIdFromToken(token) {
      const db = await admin();
      const { data, error } = await db.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async getMessage(id, userId): Promise<StoredMessage | null> {
      const db = await admin();
      const { data, error } = await db
        .from(TABLE)
        .select(
          "id,user_id,direction,contact_wa_id,contact_name,body,commitment_id,reply_draft,reply_state",
        )
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as StoredMessage) ?? null;
    },
    async setReply(id, patch) {
      const db = await admin();
      const { error } = await db.from(TABLE).update(patch).eq("id", id);
      if (error) throw error;
    },
    async insertOutgoing(row) {
      const db = await admin();
      const { error } = await db
        .from(TABLE)
        .insert({ ...row, direction: "out", reply_state: "none" });
      if (error) throw error;
    },
  };
}

export function createWebhookDeps(env: WhatsAppEnv): WhatsAppDeps {
  return {
    store: createWhatsAppStore(env),
    analyze: createAnalyzer(env.aiKey),
    markRead: async (id) => {
      await graphPost(env, { messaging_product: "whatsapp", status: "read", message_id: id });
    },
    now: () => new Date(),
    config: {
      verifyToken: env.verifyToken,
      appSecret: env.appSecret,
      phoneNumberId: env.phoneNumberId,
      business: env.business,
    },
  };
}
