import { describe, expect, it } from "vitest";
import { handleExtract, normalizeItems, trimEvidence, type ExtractStore, type ExtractedItem, type WorkspaceFile, type CommitmentRow } from "../lib/workspace-extract.server";

const FID = "11111111-2222-4333-8444-555555555555";
const file = (over: Partial<WorkspaceFile> = {}): WorkspaceFile => ({ id: FID, user_id: "u1", kind: "whatsapp", storage_path: "u1/chat.txt", original_name: "chat.txt", status: "uploaded", ...over });
const item = (over: Partial<ExtractedItem> = {}): ExtractedItem => ({ counterparty: "Rako Gıda", direction: "in", amount: 1000, currency: "TRY", due_date: "2026-11-20", kind: "promise", confidence: 0.9, evidence: "cuma gönderiyoruz", needs_review: false, ...over });

function setup(opts: { f?: WorkspaceFile | null; bytes?: Uint8Array; downloadFails?: boolean } = {}) {
  const statuses: [string, string | null][] = [];
  const db: CommitmentRow[] = [{ user_id: "u1", file_id: FID, counterparty: "eski", direction: "in", amount: 1, currency: "TRY", due_date: null, kind: "invoice", confidence: null, evidence: null, needs_review: true }];
  const store: ExtractStore = {
    userIdFromToken: async (t) => (t === "good" ? "u1" : t === "other" ? "u2" : null),
    getOwnFile: async (id, uid) => { const f = opts.f === undefined ? file() : opts.f; return f && f.id === id && f.user_id === uid ? f : null; },
    setStatus: async (_id, s, e) => { statuses.push([s, e]); },
    download: async () => { if (opts.downloadFails) throw new Error("x"); return opts.bytes ?? new TextEncoder().encode("[18.11.2026 10:00] Rako: cuma gönderiyoruz 1000 TL"); },
    replaceCommitments: async (fid, uid, rows) => { for (let i = db.length - 1; i >= 0; i--) if (db[i]!.file_id === fid && db[i]!.user_id === uid) db.splice(i, 1); db.push(...rows); },
  };
  return { store, statuses, db };
}
const req = (body: unknown, token?: string) => new Request("http://x/api/workspace/extract", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) });
const ok = async () => [item()];
const toText = () => "a,b\n1,2";

describe("workspace extract", () => {
  it("401 without a token", async () => {
    const { store } = setup();
    expect((await handleExtract(req({ file_id: FID }), { store, extract: ok, toText })).status).toBe(401);
  });
  it("401 with an invalid token", async () => {
    const { store } = setup();
    expect((await handleExtract(req({ file_id: FID }, "bad"), { store, extract: ok, toText })).status).toBe(401);
  });
  it("400 for a bad file_id or extra fields", async () => {
    const { store } = setup();
    expect((await handleExtract(req({ file_id: "x" }, "good"), { store, extract: ok, toText })).status).toBe(400);
    expect((await handleExtract(req({ file_id: FID, user_id: "u2" }, "good"), { store, extract: ok, toText })).status).toBe(400);
    expect((await handleExtract(req("{", "good"), { store, extract: ok, toText })).status).toBe(400);
  });
  it("404 for another user's file and does not touch it", async () => {
    const { store, statuses } = setup();
    const r = await handleExtract(req({ file_id: FID }, "other"), { store, extract: ok, toText });
    expect(r.status).toBe(404);
    expect(statuses).toHaveLength(0);
  });
  it("409 when already processing", async () => {
    const { store } = setup({ f: file({ status: "processing" }) });
    expect((await handleExtract(req({ file_id: FID }, "good"), { store, extract: ok, toText })).status).toBe(409);
  });
  it("extracts, replaces old commitments for the file and marks extracted", async () => {
    const { store, statuses, db } = setup();
    const r = await handleExtract(req({ file_id: FID }, "good"), { store, extract: async () => [item(), item({ amount: 50 })], toText });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ status: "extracted", count: 2 });
    expect(db.map((d) => d.counterparty)).toEqual(["Rako Gıda", "Rako Gıda"]);
    expect(statuses.map((s) => s[0])).toEqual(["processing", "extracted"]);
  });
  it("re-running the same file does not duplicate commitments", async () => {
    const { store, db } = setup();
    await handleExtract(req({ file_id: FID }, "good"), { store, extract: ok, toText });
    await handleExtract(req({ file_id: FID }, "good"), { store, extract: ok, toText });
    expect(db).toHaveLength(1);
  });
  it("415 + failed status for an unsupported type", async () => {
    const { store, statuses } = setup({ f: file({ storage_path: "u1/a.docx", original_name: "a.docx" }) });
    const r = await handleExtract(req({ file_id: FID }, "good"), { store, extract: ok, toText });
    expect(r.status).toBe(415);
    const body = await r.json();
    expect(body.error).toBe("unsupported_type");
    expect(statuses.at(-1)).toEqual(["failed", body.message]);
  });
  it("marks failed when storage download fails", async () => {
    const { store, statuses } = setup({ downloadFails: true });
    expect((await handleExtract(req({ file_id: FID }, "good"), { store, extract: ok, toText })).status).toBe(422);
    expect(statuses.at(-1)?.[0]).toBe("failed");
  });
  it.each([[402, 402, "ai_credits"], [429, 429, "ai_rate_limited"], [500, 503, "ai_unavailable"]])("AI %i -> %i %s, status failed, Turkish message", async (upstream, status, code) => {
    const { store, statuses, db } = setup();
    const r = await handleExtract(req({ file_id: FID }, "good"), { store, extract: async () => { throw Object.assign(new Error("x"), { statusCode: upstream }); }, toText });
    expect(r.status).toBe(status);
    const body = await r.json();
    expect(body.error).toBe(code);
    expect(body.message).toMatch(/[çğıöşüÇĞİÖŞÜ]|yapay zekâ/i);
    expect(statuses.at(-1)?.[0]).toBe("failed");
    expect(db[0]!.counterparty).toBe("eski"); // old rows untouched on failure
  });
  it("sends WhatsApp txt as text and xlsx through the converter", async () => {
    const seen: string[] = [];
    const { store } = setup();
    await handleExtract(req({ file_id: FID }, "good"), { store, extract: async (i) => { seen.push(i.type === "text" ? i.text : i.type); return []; }, toText });
    expect(seen[0]).toContain("18.11.2026");
    const x = setup({ f: file({ kind: "spreadsheet", storage_path: "u1/a.xlsx", original_name: "a.xlsx" }) });
    await handleExtract(req({ file_id: FID }, "good"), { store: x.store, extract: async (i) => { seen.push(i.type === "text" ? i.text : i.type); return []; }, toText });
    expect(seen[1]).toBe("a,b\n1,2");
    const p = setup({ f: file({ kind: "invoice_image", storage_path: "u1/f.png", original_name: "f.png" }) });
    await handleExtract(req({ file_id: FID }, "good"), { store: p.store, extract: async (i) => { seen.push(i.type); return []; }, toText });
    expect(seen[2]).toBe("image");
  });
});

describe("normalizing model output", () => {
  it("cuts evidence to 20 words", () => {
    expect(trimEvidence(Array.from({ length: 30 }, (_, i) => `k${i}`).join(" "))!.split(" ")).toHaveLength(20);
  });
  it("keeps a promise's due date and flags uncertain items", () => {
    const [r] = normalizeItems([item({ due_date: "2026-11-20", confidence: 0.5 })], "u1", FID);
    expect(r!.kind).toBe("promise");
    expect(r!.due_date).toBe("2026-11-20");
    expect(r!.needs_review).toBe(true);
  });
  it("flags a missing or invalid due date for review instead of inventing one", () => {
    const [r] = normalizeItems([item({ due_date: "cuma" })], "u1", FID);
    expect(r!.due_date).toBeNull();
    expect(r!.needs_review).toBe(true);
  });
  it("drops items without amount, counterparty or direction", () => {
    expect(normalizeItems([item({ amount: null }), item({ counterparty: " " }), item({ direction: null }), item({ amount: -5 })], "u1", FID)).toHaveLength(0);
  });
  it("defaults currency to TRY and clamps confidence", () => {
    const [r] = normalizeItems([item({ currency: null, confidence: 3 })], "u1", FID);
    expect(r!.currency).toBe("TRY");
    expect(r!.confidence).toBe(1);
  });
});
