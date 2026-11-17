import { z } from "zod";

export const DEMO_RATE_LIMIT_PER_MINUTE = 60;
export const DEMO_DETAIL_MAX = 300;

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// 10+ digits, allowing spaces, dashes, dots, parentheses and a leading +
const PHONE_RE = /(?:\+?\d[\s\-.()]*){10,}/;

export function containsPersonalData(text: string): boolean {
  return EMAIL_RE.test(text) || PHONE_RE.test(text);
}

const noPersonal = (s: string) => !containsPersonalData(s);

export const demoInteractionSchema = z
  .object({
    session_id: z.string().uuid(),
    panel: z.enum(["business", "bank"]),
    tenant: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/),
    demo_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    action: z.enum([
      "agent_approve", "agent_edit", "agent_snooze", "agent_question",
      "scenario_run", "date_change", "customer_open", "firm_open", "tab_open",
    ]),
    target: z.string().trim().max(120).refine(noPersonal, "personal_data").optional().nullable(),
    detail: z.string().trim().max(DEMO_DETAIL_MAX).refine(noPersonal, "personal_data").optional().nullable(),
  })
  .strict();

export type DemoInteraction = z.infer<typeof demoInteractionSchema>;

export interface DemoInteractionStore {
  userIdFromToken(token: string): Promise<string | null>;
  countRecent(sessionId: string, sinceIso: string): Promise<number>;
  insert(row: Omit<DemoInteraction, "target" | "detail"> & { target: string | null; detail: string | null; user_id: string | null }): Promise<void>;
}

const json = (body: unknown, status: number) => Response.json(body, { status });

export async function handleDemoInteraction(request: Request, store: DemoInteractionStore, now = new Date()) {
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = demoInteractionSchema.safeParse(body);
  if (!parsed.success) {
    const personal = parsed.error.issues.some((i) => i.message === "personal_data");
    return json({ error: personal ? "personal_data_not_allowed" : "invalid_fields" }, 400);
  }
  if (Number.isNaN(Date.parse(parsed.data.demo_date))) return json({ error: "invalid_fields" }, 400);

  const auth = request.headers.get("authorization");
  let userId: string | null = null;
  if (auth?.startsWith("Bearer ")) userId = await store.userIdFromToken(auth.slice(7));

  const since = new Date(now.getTime() - 60_000).toISOString();
  if ((await store.countRecent(parsed.data.session_id, since)) >= DEMO_RATE_LIMIT_PER_MINUTE)
    return json({ error: "rate_limited" }, 429);

  await store.insert({ ...parsed.data, target: parsed.data.target ?? null, detail: parsed.data.detail ?? null, user_id: userId });
  return json({ ok: true }, 201);
}

export async function createDemoInteractionStore(): Promise<DemoInteractionStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async userIdFromToken(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async countRecent(sessionId, sinceIso) {
      const { count, error } = await supabaseAdmin
        .from("qualifi_demo_interactions")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    },
    async insert(row) {
      const { error } = await supabaseAdmin.from("qualifi_demo_interactions").insert(row);
      if (error) throw error;
    },
  };
}
