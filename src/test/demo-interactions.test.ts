import { describe, expect, it } from "vitest";
import { handleDemoInteraction, type DemoInteractionStore } from "../lib/demo-interactions.server";

const base = { session_id: "6f1c8a0e-1b2c-4d3e-8f90-123456789abc", panel: "business", tenant: "017", demo_date: "2026-11-24", action: "agent_question" };
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://x/api/demo-interactions", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
function store(recent = 0) {
  const rows: any[] = [];
  const s: DemoInteractionStore = { userIdFromToken: async (t) => (t === "good" ? "user-1" : null), countRecent: async () => recent, insert: async (r) => { rows.push(r); } };
  return { s, rows };
}

describe("demo interaction log", () => {
  it("saves a valid record without a user", async () => {
    const { s, rows } = store();
    expect((await handleDemoInteraction(req({ ...base, detail: "Nakit ne zaman daralır?" }), s)).status).toBe(201);
    expect(rows[0].user_id).toBeNull();
  });
  it("takes the user only from a valid token", async () => {
    const { s, rows } = store();
    await handleDemoInteraction(req(base, { authorization: "Bearer good" }), s);
    expect(rows[0].user_id).toBe("user-1");
  });
  it("rejects a user_id sent in the body", async () => {
    const { s } = store();
    expect((await handleDemoInteraction(req({ ...base, user_id: "x" }), s)).status).toBe(400);
  });
  it("rejects an unknown action", async () => {
    const { s } = store();
    expect((await handleDemoInteraction(req({ ...base, action: "hack" }), s)).status).toBe(400);
  });
  it("rejects detail over 300 characters", async () => {
    const { s } = store();
    expect((await handleDemoInteraction(req({ ...base, detail: "a".repeat(301) }), s)).status).toBe(400);
  });
  it("rejects an email in detail", async () => {
    const { s, rows } = store();
    const r = await handleDemoInteraction(req({ ...base, detail: "bana ali@firma.com yaz" }), s);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("personal_data_not_allowed");
    expect(rows).toHaveLength(0);
  });
  it("rejects a phone number in detail", async () => {
    const { s } = store();
    expect((await handleDemoInteraction(req({ ...base, detail: "ara 0532 123 45 67" }), s)).status).toBe(400);
  });
  it("allows the 60th record in a minute", async () => {
    const { s } = store(59);
    expect((await handleDemoInteraction(req(base), s)).status).toBe(201);
  });
  it("rejects more than 60 records per session per minute", async () => {
    const { s, rows } = store(60);
    expect((await handleDemoInteraction(req(base), s)).status).toBe(429);
    expect(rows).toHaveLength(0);
  });
});
