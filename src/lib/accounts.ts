// Account types and the CSV the admin uploads to open them. Shared by the browser and the server.
// Roles live in Supabase app_metadata (server-managed); a CSV can never create an admin.

import { z } from "zod";

export const ACCOUNT_ROLES = ["demo", "blank", "banker"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export const MAX_ACCOUNTS_PER_UPLOAD = 120;

export const ROLE_LABEL: Record<AccountRole, string> = {
  demo: "Demo işletme",
  blank: "Boş işletme",
  banker: "Bankacı",
};

export const accountRowSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    role: z.enum(ACCOUNT_ROLES),
    tenant: z.string().trim().regex(/^\d{1,3}$/).optional(),
    company: z.string().trim().max(120).optional(),
    sector: z.string().trim().max(60).optional(),
    region: z.string().trim().regex(/^[\p{L}\d -]{1,40}$/u).optional(),
    banker_no: z.string().trim().regex(/^\d{1,2}$/).optional(),
  })
  .superRefine((row, ctx) => {
    if (row.role === "demo" && !row.tenant) ctx.addIssue({ code: "custom", path: ["tenant"], message: "Demo hesabı için tenant (ör. 017) gerekli." });
    if (row.role === "banker" && (!row.region || !row.banker_no)) ctx.addIssue({ code: "custom", path: ["banker_no"], message: "Bankacı için region ve banker_no gerekli." });
  });

export type AccountRow = z.infer<typeof accountRowSchema>;

/** The app_metadata written for a row. Never includes qualifi_admin. */
export function accountMetadata(row: AccountRow): Record<string, string> {
  const meta: Record<string, string> = { qualifi_role: row.role };
  if (row.role === "demo" && row.tenant) meta["qualifi_tenant"] = row.tenant.padStart(3, "0");
  if (row.role === "banker") {
    meta["qualifi_region"] = row.region ?? "";
    meta["qualifi_banker_no"] = (row.banker_no ?? "").padStart(2, "0");
  }
  if (row.company) meta["qualifi_company"] = row.company;
  if (row.sector) meta["qualifi_sector"] = row.sector;
  return meta;
}

export interface ParsedCsv {
  rows: AccountRow[];
  errors: { line: number; message: string }[];
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Reads the admin CSV (comma or semicolon, header row required). Duplicate emails are reported. */
export function parseAccountsCsv(text: string): ParsedCsv {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const errors: ParsedCsv["errors"] = [];
  const rows: AccountRow[] = [];
  const header = lines[0];
  if (!header) return { rows, errors: [{ line: 1, message: "Dosya boş." }] };
  const sep = (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ";" : ",";
  const cols = splitLine(header, sep).map((c) => c.toLowerCase());
  if (!cols.includes("email") || !cols.includes("role")) return { rows, errors: [{ line: 1, message: "Başlık satırında en az email ve role sütunları olmalı." }] };
  const seen = new Set<string>();
  lines.slice(1).forEach((line, i) => {
    const cells = splitLine(line, sep);
    const raw: Record<string, string> = {};
    cols.forEach((c, j) => {
      const v = cells[j];
      if (v) raw[c] = v;
    });
    const parsed = accountRowSchema.safeParse(raw);
    const lineNo = i + 2;
    if (!parsed.success) {
      errors.push({ line: lineNo, message: parsed.error.issues.map((x) => x.message).join("; ") });
      return;
    }
    if (seen.has(parsed.data.email)) {
      errors.push({ line: lineNo, message: `${parsed.data.email} dosyada iki kez geçiyor.` });
      return;
    }
    seen.add(parsed.data.email);
    rows.push(parsed.data);
  });
  if (rows.length > MAX_ACCOUNTS_PER_UPLOAD) errors.push({ line: 0, message: `Tek seferde en fazla ${MAX_ACCOUNTS_PER_UPLOAD} hesap açılabilir.` });
  return { rows, errors };
}

/** What a signed-in user is, read only from server-managed app_metadata. */
export interface AppIdentity {
  role: AccountRole | "admin" | "none";
  tenant?: string;
  region?: string;
  bankerNo?: string;
  company?: string;
}

export function identityFrom(appMetadata: Record<string, unknown> | undefined, emailConfirmed: boolean): AppIdentity {
  const m = appMetadata ?? {};
  if (m["qualifi_admin"] === true && emailConfirmed) return { role: "admin" };
  const role = m["qualifi_role"];
  const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : undefined);
  if (role === "demo" && str("qualifi_tenant")) return { role, tenant: str("qualifi_tenant") as string, ...(str("qualifi_company") ? { company: str("qualifi_company") as string } : {}) };
  if (role === "banker" && str("qualifi_region") && str("qualifi_banker_no")) return { role, region: str("qualifi_region") as string, bankerNo: str("qualifi_banker_no") as string };
  if (role === "blank") return { role, ...(str("qualifi_company") ? { company: str("qualifi_company") as string } : {}) };
  return { role: "none" };
}

export const SAMPLE_CSV = `email,role,tenant,company,sector,region,banker_no
ornek@firma.com,demo,017,Örnek Yazılım A.Ş.,Yazılım,,
deneme@firma.com,blank,,Deneme Ltd.,E-ticaret,,
uzman1@banka.com,banker,,,,Marmara-1,01
`;
