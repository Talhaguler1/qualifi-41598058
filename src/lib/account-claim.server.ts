// Self sign-up: a confirmed user with no QualiFi role gets the "blank" workspace role.
// Only the server writes app_metadata; a user can never claim demo, banker or admin here.
// Also: a per-account daily cap on AI document reads, so open sign-up cannot drain AI credits.

import type { AuthUser } from "./accounts.server";

export const DAILY_EXTRACT_LIMIT = 15;

export interface ClaimDeps {
  getUser(token: string): Promise<AuthUser & { user_metadata?: Record<string, unknown> } | null>;
  setAppMetadata(userId: string, meta: Record<string, unknown>): Promise<void>;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

function bearer(request: Request): string | null {
  const m = /^Bearer ([^\s]{1,8192})$/.exec(request.headers.get("Authorization") ?? "");
  return m?.[1] ?? null;
}

export async function handleClaim(request: Request, deps: ClaimDeps): Promise<Response> {
  const token = bearer(request);
  if (!token) return json({ error: "authentication_required" }, 401);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin_not_allowed" }, 403);
  const user = await deps.getUser(token);
  if (!user?.id) return json({ error: "authentication_required" }, 401);
  if (!user.email_confirmed_at) return json({ error: "email_not_confirmed" }, 403);
  const meta = user.app_metadata ?? {};
  if (meta["qualifi_admin"] === true || typeof meta["qualifi_role"] === "string") return json({ role: meta["qualifi_admin"] === true ? "admin" : meta["qualifi_role"], changed: false });
  // Company name comes from the sign-up form (user_metadata): display only, never used for access.
  const rawCompany = user.user_metadata?.["company"];
  const company = typeof rawCompany === "string" ? rawCompany.replace(/[<>]/g, "").trim().slice(0, 120) : "";
  await deps.setAppMetadata(user.id, { ...meta, qualifi_role: "blank", qualifi_self_signup: true, ...(company ? { qualifi_company: company } : {}) });
  return json({ role: "blank", changed: true });
}

export async function createClaimDeps(): Promise<ClaimDeps> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async getUser(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      return error ? null : (data.user as unknown as AuthUser & { user_metadata?: Record<string, unknown> });
    },
    async setAppMetadata(userId, meta) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: meta });
      if (error) throw error;
    },
  };
}

export interface ExtractQuotaDeps {
  userIdFromToken(token: string): Promise<string | null>;
  isAdmin(userId: string): Promise<boolean>;
  readsSince(userId: string, sinceIso: string): Promise<number>;
}

/** Returns a 429 response when the account has used today's AI reads; null when it may continue. */
export async function extractQuotaCheck(request: Request, deps: ExtractQuotaDeps, now = new Date()): Promise<Response | null> {
  const token = bearer(request);
  if (!token) return null; // the extract handler answers 401 itself
  const userId = await deps.userIdFromToken(token);
  if (!userId || (await deps.isAdmin(userId))) return null;
  const used = await deps.readsSince(userId, new Date(now.getTime() - 86_400_000).toISOString());
  if (used < DAILY_EXTRACT_LIMIT) return null;
  return json({ error: "daily_limit", message: `Bugünlük belge okuma sınırına (${DAILY_EXTRACT_LIMIT}) ulaştınız. Yarın tekrar deneyebilir veya taahhütleri elle ekleyebilirsiniz.` }, 429);
}

export async function createExtractQuotaDeps(): Promise<ExtractQuotaDeps> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async userIdFromToken(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async isAdmin(userId) {
      const { data } = await supabaseAdmin.from("user_roles").select("user_id").eq("user_id", userId).eq("role", "admin").maybeSingle();
      return Boolean(data);
    },
    async readsSince(userId, sinceIso) {
      const { count, error } = await supabaseAdmin
        .from("qualifi_workspace_files")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["processing", "extracted", "failed"])
        .gte("created_at", sinceIso);
      if (error) throw error;
      return count ?? 0;
    },
  };
}
