// Admin-only account management and demo activity. Every handler re-checks the caller:
// confirmed email + server-managed app_metadata.qualifi_admin + a row in user_roles.

import { z } from "zod";
import { accountMetadata, accountRowSchema, MAX_ACCOUNTS_PER_UPLOAD, type AccountRow } from "./accounts";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", Vary: "Authorization" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: PRIVATE_HEADERS });

export class AccountsError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export interface AuthUser {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string;
  invited_at?: string | null;
  app_metadata?: Record<string, unknown>;
}

export interface AccountsDeps {
  getUser(token: string): Promise<AuthUser | null>;
  hasAdminRole(userId: string): Promise<boolean>;
  listUsers(): Promise<AuthUser[]>;
  invite(email: string, redirectTo: string): Promise<AuthUser>;
  inviteLink(email: string, redirectTo: string): Promise<{ user: AuthUser; link: string }>;
  setAppMetadata(userId: string, meta: Record<string, unknown>): Promise<void>;
  activity(sinceIso: string): Promise<DemoActivityRow[]>;
}

export interface DemoActivityRow {
  user_id: string | null;
  session_id: string;
  panel: string;
  tenant: string;
  demo_date: string;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: string;
}

export async function requireAdmin(request: Request, deps: AccountsDeps): Promise<AuthUser> {
  const match = /^Bearer ([^\s]{1,8192})$/.exec(request.headers.get("Authorization") ?? "");
  if (!match?.[1]) throw new AccountsError(401, "authentication_required");
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) throw new AccountsError(403, "origin_not_allowed");
  const user = await deps.getUser(match[1]);
  if (!user?.id) throw new AccountsError(401, "authentication_required");
  if (!user.email_confirmed_at || user.app_metadata?.["qualifi_admin"] !== true) throw new AccountsError(403, "admin_required");
  if (!(await deps.hasAdminRole(user.id))) throw new AccountsError(403, "admin_required");
  return user;
}

async function readJson(request: Request, limit: number): Promise<unknown> {
  const text = await request.text();
  if (text.length > limit) throw new AccountsError(413, "request_too_large");
  try {
    return JSON.parse(text);
  } catch {
    throw new AccountsError(400, "invalid_json");
  }
}

const createSchema = z.object({
  mode: z.enum(["invite", "link"]),
  rows: z.array(accountRowSchema).min(1).max(MAX_ACCOUNTS_PER_UPLOAD),
});

export type CreateResult = { email: string; status: "invited" | "link" | "updated" | "skipped_admin" | "failed"; link?: string; error?: string };

function fail(error: unknown) {
  if (error instanceof AccountsError) return json({ error: error.code }, error.status);
  console.error("accounts handler failed", error);
  return json({ error: "server_error" }, 500);
}

/** POST /api/admin/accounts — open or update accounts from the CSV rows. */
export async function handleCreateAccounts(request: Request, deps: AccountsDeps): Promise<Response> {
  try {
    await requireAdmin(request, deps);
    const parsed = createSchema.safeParse(await readJson(request, 64_000));
    if (!parsed.success) return json({ error: "invalid_rows" }, 400);
    const redirectTo = `${new URL(request.url).origin}/reset-password`;
    const existing = new Map((await deps.listUsers()).filter((u) => u.email).map((u) => [String(u.email).toLowerCase(), u]));
    const results: CreateResult[] = [];
    for (const row of parsed.data.rows) results.push(await openOne(row, parsed.data.mode, redirectTo, existing, deps));
    return json({ results });
  } catch (error) {
    return fail(error);
  }
}

async function openOne(row: AccountRow, mode: "invite" | "link", redirectTo: string, existing: Map<string, AuthUser>, deps: AccountsDeps): Promise<CreateResult> {
  const meta = accountMetadata(row);
  try {
    const found = existing.get(row.email);
    if (found) {
      // Never demote or re-role an admin from a CSV.
      if (found.app_metadata?.["qualifi_admin"] === true) return { email: row.email, status: "skipped_admin" };
      await deps.setAppMetadata(found.id, { ...clearRoleKeys(found.app_metadata), ...meta });
      return { email: row.email, status: "updated" };
    }
    if (mode === "invite") {
      const user = await deps.invite(row.email, redirectTo);
      await deps.setAppMetadata(user.id, meta);
      return { email: row.email, status: "invited" };
    }
    const { user, link } = await deps.inviteLink(row.email, redirectTo);
    await deps.setAppMetadata(user.id, meta);
    return { email: row.email, status: "link", link };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 160) : "unknown";
    return { email: row.email, status: "failed", error: message };
  }
}

function clearRoleKeys(meta: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = { ...(meta ?? {}) };
  for (const k of ["qualifi_role", "qualifi_tenant", "qualifi_region", "qualifi_banker_no", "qualifi_company", "qualifi_sector"]) delete out[k];
  return out;
}

/** GET /api/admin/accounts — accounts that have a QualiFi role. */
export async function handleListAccounts(request: Request, deps: AccountsDeps): Promise<Response> {
  try {
    await requireAdmin(request, deps);
    const users = (await deps.listUsers())
      .filter((u) => u.app_metadata?.["qualifi_role"] || u.app_metadata?.["qualifi_admin"] === true)
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        role: u.app_metadata?.["qualifi_admin"] === true ? "admin" : String(u.app_metadata?.["qualifi_role"] ?? ""),
        tenant: (u.app_metadata?.["qualifi_tenant"] as string | undefined) ?? null,
        region: (u.app_metadata?.["qualifi_region"] as string | undefined) ?? null,
        banker_no: (u.app_metadata?.["qualifi_banker_no"] as string | undefined) ?? null,
        company: (u.app_metadata?.["qualifi_company"] as string | undefined) ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        last_sign_in_at: u.last_sign_in_at ?? null,
        created_at: u.created_at ?? null,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
    return json({ users });
  } catch (error) {
    return fail(error);
  }
}

/** GET /api/admin/demo-activity?days=7 — what people did in the demo panels. */
export async function handleDemoActivity(request: Request, deps: AccountsDeps, now = new Date()): Promise<Response> {
  try {
    await requireAdmin(request, deps);
    const days = Math.min(60, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 7) || 7));
    const rows = await deps.activity(new Date(now.getTime() - days * 86_400_000).toISOString());
    const byAction: Record<string, number> = {};
    for (const r of rows) byAction[r.action] = (byAction[r.action] ?? 0) + 1;
    const questions = rows.filter((r) => r.action === "agent_question" && r.detail).map((r) => r.detail as string);
    const sessions = new Set(rows.map((r) => r.session_id)).size;
    const signedIn = new Set(rows.filter((r) => r.user_id).map((r) => r.user_id)).size;
    return json({ days, total: rows.length, sessions, signedIn, byAction, questions: questions.slice(0, 100), recent: rows.slice(0, 200) });
  } catch (error) {
    return fail(error);
  }
}

/** Route wrapper: rejects requests without a bearer token before touching the backend,
 * and turns a missing backend configuration into 503 instead of a crash. */
export async function withAccountsDeps(request: Request, handler: (request: Request, deps: AccountsDeps) => Promise<Response>): Promise<Response> {
  if (!/^Bearer [^\s]{1,8192}$/.test(request.headers.get("Authorization") ?? "")) return json({ error: "authentication_required" }, 401);
  let deps: AccountsDeps;
  try {
    deps = await createAccountsDeps();
  } catch (error) {
    console.error("accounts backend unavailable", error);
    return json({ error: "storage_unavailable" }, 503);
  }
  return handler(request, deps);
}

/** Real dependencies, loaded inside the handler so the service-role key never reaches the browser bundle. */
export async function createAccountsDeps(): Promise<AccountsDeps> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin.auth.admin;
  return {
    async getUser(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      return error ? null : (data.user as AuthUser | null);
    },
    async hasAdminRole(userId) {
      const { data, error } = await supabaseAdmin.from("user_roles").select("user_id").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    async listUsers() {
      const all: AuthUser[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        all.push(...(data.users as AuthUser[]));
        if (data.users.length < 200) break;
      }
      return all;
    },
    async invite(email, redirectTo) {
      const { data, error } = await admin.inviteUserByEmail(email, { redirectTo });
      if (error || !data.user) throw error ?? new Error("invite_failed");
      return data.user as AuthUser;
    },
    async inviteLink(email, redirectTo) {
      const { data, error } = await admin.generateLink({ type: "invite", email, options: { redirectTo } });
      if (error || !data.user) throw error ?? new Error("link_failed");
      return { user: data.user as AuthUser, link: data.properties.action_link };
    },
    async setAppMetadata(userId, meta) {
      const { error } = await admin.updateUserById(userId, { app_metadata: meta });
      if (error) throw error;
    },
    async activity(sinceIso) {
      const { data, error } = await supabaseAdmin
        .from("qualifi_demo_interactions")
        .select("user_id,session_id,panel,tenant,demo_date,action,target,detail,created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as DemoActivityRow[];
    },
  };
}
