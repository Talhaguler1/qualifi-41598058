import { leadSchema, listResultSchema } from "./lead-admin";
import type { ContactStatus, LeadFilters } from "./lead-admin";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function send(
  path: string,
  token: string,
  body: unknown,
  method = "POST",
  signal?: AbortSignal,
) {
  const response = await fetch(path, {
    method,
    credentials: "omit",
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    const value = await response.json().catch(() => ({}));
    throw new AdminApiError(
      response.status,
      typeof value.error === "string" ? value.error : "request_failed",
    );
  }
  return response;
}

export const leadAdminApi = {
  async search(token: string, filters: LeadFilters, signal?: AbortSignal) {
    const response = await send("/api/admin/leads", token, filters, "POST", signal);
    return listResultSchema.parse(await response.json());
  },
  async update(token: string, id: string, status: ContactStatus, signal?: AbortSignal) {
    const response = await send("/api/admin/leads", token, { id, status }, "PATCH", signal);
    const value = await response.json();
    return leadSchema.parse(value.lead);
  },
  async export(token: string, filters: LeadFilters, signal?: AbortSignal) {
    const response = await send("/api/admin/leads/export", token, filters, "POST", signal);
    if (!response.headers.get("Content-Type")?.includes("text/csv"))
      throw new AdminApiError(503, "export_incomplete");
    return response.blob();
  },
};

export function adminErrorText(error: unknown) {
  if (error instanceof AdminApiError) {
    if (error.status === 401) return "Oturumun sona erdi. Yeniden giriş yapabilirsin.";
    if (error.status === 403) return "Bu hesabın başvurulara erişim yetkisi yok.";
    if (error.code === "storage_not_configured")
      return "Başvuru bağlantısı henüz hazır değil. Kayıt listesi şu anda gösterilemiyor.";
    if (error.code === "export_limit")
      return "Tek seferde en fazla 1.000 kayıt indirebilirsin. Tarih aralığını daraltıp tekrar dene.";
    if (error.status === 400)
      return "Filtreleri kontrol et. Başlangıç tarihi bitiş tarihinden sonra olmamalı.";
  }
  return "İşlemin sonucu doğrulanamadı. Listeyi yenileyip durumu kontrol edebilirsin.";
}
