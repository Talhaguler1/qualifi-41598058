import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  contactStatusSchema,
  dateBoundary,
  EXPORT_LIMIT,
  leadSchema,
  leadsCsv,
  listResultSchema,
  PAGE_SIZE,
  parseFilters,
} from "./lead-admin";
import type { ContactStatus, Lead, LeadFilters, LeadList } from "./lead-admin";

type Identity = {
  id: string;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown>;
};
export interface AdminBackend {
  getUser(): Promise<Identity | null>;
  list(filters: LeadFilters, size: number): Promise<LeadList>;
  update(id: string, status: ContactStatus): Promise<Lead>;
}
export type BackendFactory = (token: string) => AdminBackend;
const FIELDS =
  "id,email,company,kind,page_id,campaign_id,locale,solution,utm_source,utm_medium,utm_campaign,utm_content,contact_status,created_at";
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  Vary: "Authorization",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function createBackend(token: string): AdminBackend {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new AdminError(503, "storage_not_configured");
  // Use the verified user's token and RLS, never a browser/service-role shortcut.
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  function query(filters: LeadFilters, head = false) {
    let result = client.from("qualifi_leads").select(FIELDS, { count: "exact", head });
    if (filters.email)
      result = result.ilike(
        "email",
        `%${filters.email.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
      );
    if (filters.locale !== "all") result = result.eq("locale", filters.locale);
    if (filters.status !== "all") result = result.eq("contact_status", filters.status);
    const from = dateBoundary(filters.from);
    const to = dateBoundary(filters.to, true);
    if (from) result = result.gte("created_at", from);
    if (to) result = result.lt("created_at", to);
    return result;
  }
  function check(error: { code?: string } | null) {
    if (!error) return;
    if (["42P01", "42703", "PGRST205", "PGRST204"].includes(error.code ?? ""))
      throw new AdminError(503, "storage_not_configured");
    throw new AdminError(503, "database_unavailable");
  }
  async function countStatus(filters: LeadFilters, status: ContactStatus) {
    if (filters.status !== "all" && filters.status !== status) return 0;
    const result = await query({ ...filters, status }, true);
    check(result.error);
    if (result.count === null) throw new AdminError(503, "database_unavailable");
    return result.count;
  }
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser(token);
      return error ? null : data.user;
    },
    async list(filters, size) {
      const offset = (filters.page - 1) * size;
      const [result, newCount, scheduledCount] = await Promise.all([
        query(filters)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + size - 1),
        countStatus(filters, "new"),
        countStatus(filters, "demo_scheduled"),
      ]);
      check(result.error);
      if (result.count === null) throw new AdminError(503, "database_unavailable");
      const parsed = listResultSchema.safeParse({
        rows: result.data,
        total: result.count,
        newCount,
        scheduledCount,
      });
      if (!parsed.success) throw new AdminError(503, "database_unavailable");
      return parsed.data;
    },
    async update(id, status) {
      const result = await client
        .from("qualifi_leads")
        .update({ contact_status: status })
        .eq("id", id)
        .select(FIELDS)
        .maybeSingle();
      check(result.error);
      if (!result.data) throw new AdminError(404, "lead_not_found");
      const parsed = leadSchema.safeParse(result.data);
      if (!parsed.success) throw new AdminError(503, "database_unavailable");
      return parsed.data;
    },
  };
}

async function authorize(request: Request, factory: BackendFactory) {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer ([^\s]{1,8192})$/.exec(header);
  if (!match?.[1]) throw new AdminError(401, "authentication_required");
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new AdminError(403, "origin_not_allowed");
  const backend = factory(match[1]);
  const user = await backend.getUser();
  if (!user?.id) throw new AdminError(401, "authentication_required");
  // app_metadata is server-managed. Never authorize using user_metadata or a form field.
  if (!user.email_confirmed_at || user.app_metadata?.["qualifi_admin"] !== true)
    throw new AdminError(403, "admin_required");
  return backend;
}

async function jsonBody(request: Request) {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))
    throw new AdminError(415, "json_required");
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError(400, "invalid_request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw new AdminError(413, "request_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new AdminError(400, "invalid_request");
  }
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: PRIVATE_HEADERS });
}
function failure(error: unknown) {
  if (error instanceof AdminError) return json({ error: error.message }, error.status);
  if (
    error instanceof z.ZodError ||
    (error instanceof Error && error.message === "invalid_filters")
  )
    return json({ error: "invalid_request" }, 400);
  // No contact details, bearer tokens, SQL errors or request bodies in logs/responses.
  return json({ error: "database_unavailable" }, 503);
}

export async function searchLeads(request: Request, factory: BackendFactory = createBackend) {
  try {
    const backend = await authorize(request, factory);
    const filters = parseFilters(await jsonBody(request));
    return json(await backend.list(filters, PAGE_SIZE));
  } catch (error) {
    return failure(error);
  }
}

export async function updateLead(request: Request, factory: BackendFactory = createBackend) {
  try {
    const backend = await authorize(request, factory);
    const input = z
      .object({ id: z.string().uuid(), status: contactStatusSchema })
      .parse(await jsonBody(request));
    return json({ lead: await backend.update(input.id, input.status) });
  } catch (error) {
    return failure(error);
  }
}

export async function exportLeads(request: Request, factory: BackendFactory = createBackend) {
  try {
    const backend = await authorize(request, factory);
    const filters = { ...parseFilters(await jsonBody(request)), page: 1 };
    const result = await backend.list(filters, EXPORT_LIMIT);
    if (result.total > EXPORT_LIMIT) throw new AdminError(413, "export_limit");
    if (result.rows.length !== result.total) throw new AdminError(503, "export_incomplete");
    return new Response(leadsCsv(result.rows), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qualifi-basvurular-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
