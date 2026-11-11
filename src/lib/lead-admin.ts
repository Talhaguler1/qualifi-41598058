import { z } from "zod";

export const CONTACT_STATUSES = {
  new: "Yeni",
  contacted: "İletişime geçildi",
  demo_scheduled: "Görüşme planlandı",
  not_a_fit: "Uygun değil",
} as const;
export const contactStatusSchema = z.enum(["new", "contacted", "demo_scheduled", "not_a_fit"]);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

const optionalText = z.string().max(200).nullable();
export const leadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  company: optionalText,
  kind: z.enum(["waitlist", "pilot", "meeting"]),
  page_id: z.string().max(150),
  campaign_id: optionalText,
  locale: z.enum(["tr", "en"]),
  solution: z.string().max(80),
  utm_source: optionalText,
  utm_medium: optionalText,
  utm_campaign: optionalText,
  utm_content: optionalText,
  contact_status: contactStatusSchema,
  created_at: z.string().datetime({ offset: true }),
});
export type Lead = z.infer<typeof leadSchema>;
export const filtersSchema = z.object({
  email: z.string().trim().max(100).default(""),
  locale: z.enum(["all", "tr", "en"]).default("all"),
  status: z.union([z.literal("all"), contactStatusSchema]).default("all"),
  from: z.string().default(""),
  to: z.string().default(""),
  page: z.number().int().min(1).max(100000).default(1),
});
export type LeadFilters = z.infer<typeof filtersSchema>;
export const PAGE_SIZE = 25;
export const EXPORT_LIMIT = 1000;
export const REPORT_TIMEZONE = "Europe/Istanbul";
export const listResultSchema = z.object({
  rows: z.array(leadSchema),
  total: z.number().int().nonnegative(),
  newCount: z.number().int().nonnegative(),
  scheduledCount: z.number().int().nonnegative(),
});
export type LeadList = z.infer<typeof listResultSchema>;

export function dateBoundary(day: string, nextDay = false): string | null {
  if (!day) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("invalid_filters");
  const check = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(check.getTime()) || check.toISOString().slice(0, 10) !== day)
    throw new Error("invalid_filters");
  const midnight = new Date(`${day}T00:00:00+03:00`);
  return new Date(midnight.getTime() + (nextDay ? 86400000 : 0)).toISOString();
}

export function parseFilters(value: unknown): LeadFilters {
  const filters = filtersSchema.parse(value);
  dateBoundary(filters.from);
  dateBoundary(filters.to, true);
  if (filters.from && filters.to && filters.from > filters.to) throw new Error("invalid_filters");
  return filters;
}

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function leadsCsv(rows: Lead[]): string {
  const header = [
    "E-posta",
    "Şirket",
    "Talep türü",
    "Sayfa",
    "Çözüm",
    "Dil",
    "Kaynak",
    "Medium",
    "Kampanya",
    "İçerik",
    "Durum",
    "Kayıt tarihi (UTC)",
  ];
  return (
    "\uFEFF" +
    [
      header,
      ...rows.map((row) => [
        row.email,
        row.company,
        row.kind,
        row.page_id,
        row.solution,
        row.locale,
        row.utm_source,
        row.utm_medium,
        row.utm_campaign,
        row.utm_content,
        CONTACT_STATUSES[row.contact_status],
        row.created_at,
      ]),
    ]
      .map((cells) => cells.map(csvCell).join(","))
      .join("\r\n")
  );
}
