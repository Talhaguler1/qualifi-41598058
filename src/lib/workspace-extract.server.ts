import { z } from "zod";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_CHARS = 120_000;
export const EVIDENCE_MAX_WORDS = 20;

export type FileKind = "contract" | "invoice_image" | "spreadsheet" | "whatsapp";
export interface WorkspaceFile { id: string; user_id: string; kind: FileKind; storage_path: string; original_name: string; status: string }

export type ExtractInput =
  | { type: "image"; mediaType: string; base64: string; kind: FileKind; name: string }
  | { type: "pdf"; base64: string; kind: FileKind; name: string }
  | { type: "text"; text: string; kind: FileKind; name: string };

export const commitmentItemSchema = z.object({
  counterparty: z.string().nullable(),
  direction: z.enum(["in", "out"]).nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  due_date: z.string().nullable(),
  kind: z.enum(["invoice", "contract_installment", "promise", "expense"]),
  confidence: z.number().nullable(),
  evidence: z.string().nullable(),
  needs_review: z.boolean(),
});
export const extractionSchema = z.object({ commitments: z.array(commitmentItemSchema) });
export type ExtractedItem = z.infer<typeof commitmentItemSchema>;

export interface CommitmentRow {
  user_id: string; file_id: string; counterparty: string; direction: "in" | "out"; amount: number;
  currency: string; due_date: string | null; kind: ExtractedItem["kind"]; confidence: number | null;
  evidence: string | null; needs_review: boolean;
}

export interface ExtractStore {
  userIdFromToken(token: string): Promise<string | null>;
  getOwnFile(fileId: string, userId: string): Promise<WorkspaceFile | null>;
  setStatus(fileId: string, status: "processing" | "extracted" | "failed", error: string | null): Promise<void>;
  download(path: string): Promise<Uint8Array>;
  replaceCommitments(fileId: string, userId: string, rows: CommitmentRow[]): Promise<void>;
}
export type Extractor = (input: ExtractInput) => Promise<ExtractedItem[]>;
export type SpreadsheetToText = (bytes: Uint8Array) => string;

export class ExtractError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const err = (status: number, code: string, message: string) =>
  Response.json({ error: code, message }, { status });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (d: string | null) => !!d && DATE_RE.test(d) && !Number.isNaN(Date.parse(d));

export function trimEvidence(text: string | null): string | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(0, EVIDENCE_MAX_WORDS).join(" ") : null;
}

/** Re-checks model output; never invents values. Items without counterparty, direction or amount are dropped. */
export function normalizeItems(items: ExtractedItem[], userId: string, fileId: string): CommitmentRow[] {
  const rows: CommitmentRow[] = [];
  for (const it of items) {
    const counterparty = it.counterparty?.trim();
    if (!counterparty || !it.direction || it.amount == null || !Number.isFinite(it.amount) || it.amount < 0) continue;
    const due = validDate(it.due_date) ? it.due_date : null;
    const conf = it.confidence == null || !Number.isFinite(it.confidence) ? null : Math.min(1, Math.max(0, it.confidence));
    const evidence = trimEvidence(it.evidence);
    const currency = (it.currency?.trim().toUpperCase() || "TRY").slice(0, 3);
    rows.push({
      user_id: userId, file_id: fileId, counterparty: counterparty.slice(0, 200), direction: it.direction,
      amount: Math.round(it.amount * 100) / 100, currency, due_date: due, kind: it.kind, confidence: conf, evidence,
      needs_review: it.needs_review || !due || !evidence || conf == null || conf < 0.7,
    });
  }
  return rows;
}

function extension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export function buildInput(file: WorkspaceFile, bytes: Uint8Array, toText: SpreadsheetToText): ExtractInput {
  if (bytes.byteLength > MAX_FILE_BYTES) throw new ExtractError(413, "file_too_large", "Dosya 10 MB sınırını aşıyor.");
  if (bytes.byteLength === 0) throw new ExtractError(422, "empty_file", "Dosya boş görünüyor.");
  const ext = extension(file.storage_path) || extension(file.original_name);
  const name = file.original_name;
  const b64 = () => Buffer.from(bytes).toString("base64");
  const text = (t: string) => {
    if (!t.trim()) throw new ExtractError(422, "unreadable_file", "Dosyadan okunabilir metin çıkarılamadı.");
    return { type: "text" as const, text: t.slice(0, MAX_TEXT_CHARS), kind: file.kind, name };
  };
  if (["png", "jpg", "jpeg"].includes(ext)) return { type: "image", mediaType: ext === "png" ? "image/png" : "image/jpeg", base64: b64(), kind: file.kind, name };
  if (ext === "pdf") return { type: "pdf", base64: b64(), kind: file.kind, name };
  if (ext === "txt" || ext === "csv") return text(new TextDecoder("utf-8").decode(bytes));
  if (ext === "xlsx") {
    try { return text(toText(bytes)); } catch (e) {
      if (e instanceof ExtractError) throw e;
      throw new ExtractError(422, "unreadable_file", "Excel dosyası okunamadı.");
    }
  }
  throw new ExtractError(415, "unsupported_type", "Bu dosya türü desteklenmiyor.");
}

/** Maps AI gateway failures to codes; keeps the gateway status. */
export function aiError(e: unknown): ExtractError {
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 402) return new ExtractError(402, "ai_credits", "Yapay zekâ kredisi yetersiz; işlem yapılamadı.");
  if (status === 429) return new ExtractError(429, "ai_rate_limited", "Yapay zekâ şu anda yoğun; biraz sonra tekrar deneyin.");
  if (status === 403) return new ExtractError(403, "ai_denied", "Yapay zekâ bu belgeyi işlemeyi reddetti.");
  if (status === 400) return new ExtractError(422, "ai_rejected", "Belge yapay zekâ tarafından işlenemedi.");
  return new ExtractError(503, "ai_unavailable", "Yapay zekâ hizmetine şu anda ulaşılamıyor.");
}

const bodySchema = z.object({ file_id: z.string().uuid() }).strict();

export async function handleExtract(request: Request, deps: { store: ExtractStore; extract: Extractor; toText: SpreadsheetToText }) {
  const { store } = deps;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return err(401, "unauthorized", "Oturum açmanız gerekiyor.");
  const userId = await store.userIdFromToken(auth.slice(7));
  if (!userId) return err(401, "unauthorized", "Oturum geçersiz veya süresi dolmuş.");

  let body: unknown;
  try { body = await request.json(); } catch { return err(400, "invalid_json", "İstek gövdesi geçerli JSON değil."); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return err(400, "invalid_fields", "file_id geçerli bir kimlik olmalı.");
  const fileId = parsed.data.file_id;

  const file = await store.getOwnFile(fileId, userId);
  if (!file) return err(404, "file_not_found", "Dosya bulunamadı.");
  if (file.status === "processing") return err(409, "already_processing", "Bu dosya zaten işleniyor.");

  await store.setStatus(fileId, "processing", null);
  try {
    let bytes: Uint8Array;
    try { bytes = await store.download(file.storage_path); } catch {
      throw new ExtractError(422, "file_unavailable", "Dosya depodan okunamadı.");
    }
    const input = buildInput(file, bytes, deps.toText);
    let items: ExtractedItem[];
    try { items = await deps.extract(input); } catch (e) { throw aiError(e); }
    const rows = normalizeItems(items, userId, fileId);
    await store.replaceCommitments(fileId, userId, rows);
    await store.setStatus(fileId, "extracted", null);
    return Response.json({ status: "extracted", count: rows.length }, { status: 200 });
  } catch (e) {
    const x = e instanceof ExtractError ? e : new ExtractError(500, "extract_failed", "Taahhütler çıkarılırken bir hata oluştu.");
    if (!(e instanceof ExtractError)) console.error("workspace extract failed", e);
    try { await store.setStatus(fileId, "failed", x.message); } catch (s) { console.error("status update failed", s); }
    return err(x.status, x.code, x.message);
  }
}

export const EXTRACT_INSTRUCTIONS = `Sen bir Türk KOBİ'si için finansal belge okuyucusun. Belgeden ödeme taahhütlerini çıkar.
Kurallar:
- Yalnız belgede açıkça geçen bilgileri kullan. Belgede olmayan tutar, tarih veya karşı tarafı ASLA uydurma; bilinmeyen alanı null bırak.
- Emin olmadığın her kalemde needs_review = true yap.
- direction: belge sahibine para gelecekse "in", belge sahibi ödeyecekse "out". Belirsizse en olası yönü seç ve needs_review = true yap.
- kind: fatura -> "invoice"; sözleşmedeki taksit/ödeme planı -> "contract_installment"; sohbette verilen ödeme sözü -> "promise"; gider/ödenecek masraf -> "expense".
- amount: sayı (ondalık nokta ile), para birimi sembolü olmadan. currency: ISO kodu (TRY, USD, EUR); yoksa null.
- due_date: YYYY-MM-DD.
- WhatsApp sohbetlerinde "cuma gönderiyoruz", "yarın yatırırım", "ay sonu öderiz" gibi ödeme sözlerini kind="promise" olarak çıkar ve due_date'i mesajın kendi tarihine göre hesapla (ör. mesaj 2026-11-18 Çarşamba ise "cuma" = 2026-11-20). Tutar söylenmemişse amount=null bırak.
- evidence: belgeden aynen alınmış en fazla 20 kelimelik kısa alıntı.
- confidence: 0 ile 1 arası.
- Hiç taahhüt yoksa boş liste döndür.`;
