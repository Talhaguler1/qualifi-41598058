import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  applyAnalysis,
  buildPrompt,
  handleReply,
  handleVerify,
  handleWebhook,
  istanbul,
  validSignature,
  type Analysis,
  type OpenCommitment,
  type ReplyStore,
  type WhatsAppDeps,
  type WhatsAppStore,
} from "@/lib/whatsapp.server";

const SECRET = "test-app-secret";
const sign = (body: string) => "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
const OPEN: OpenCommitment[] = [
  {
    id: "c-kalinbel",
    counterparty: "Kalinbel E-Ticaret",
    amount: 38600,
    currency: "TRY",
    due_date: "2026-11-27",
    kind: "invoice",
  },
  {
    id: "c-tale",
    counterparty: "Tale Yazılım",
    amount: 13400,
    currency: "TRY",
    due_date: "2026-12-01",
    kind: "invoice",
  },
];

function fakeStore(over: Partial<WhatsAppStore> = {}) {
  const calls = {
    updates: [] as unknown[],
    inserts: [] as unknown[],
    saved: [] as unknown[],
    incoming: [] as unknown[],
    delivery: [] as unknown[],
  };
  const seen = new Set<string>();
  const store: WhatsAppStore = {
    ownerUserId: async () => "owner-1",
    insertIncoming: async (row) => {
      if (seen.has(row.wa_message_id)) return null;
      seen.add(row.wa_message_id);
      calls.incoming.push(row);
      return "msg-" + row.wa_message_id;
    },
    history: async () => [],
    linkedCommitments: async () => [],
    openReceivables: async () => OPEN,
    updateCommitment: async (userId, id, patch) => {
      calls.updates.push({ userId, id, patch });
    },
    insertPromise: async (row) => {
      calls.inserts.push(row);
      return "c-new";
    },
    saveAnalysis: async (id, patch) => {
      calls.saved.push({ id, patch });
    },
    setDelivery: async (id, status, err) => {
      calls.delivery.push({ id, status, err });
    },
    ...over,
  };
  return { store, calls };
}

const analysis = (a: Partial<Analysis>): Analysis => ({
  intent: "promise",
  commitment_id: "c-kalinbel",
  new_due_date: "2026-11-30",
  amount: null,
  confidence: 0.9,
  summary: "Talha 30 Kasım'da ödeyecek.",
  reply: "Teşekkürler, 30 Kasım'ı not aldık.",
  ...a,
});

function deps(store: WhatsAppStore, analyze = vi.fn(async () => analysis({}))): WhatsAppDeps {
  return {
    store,
    analyze,
    markRead: async () => {},
    now: () => new Date("2026-11-20T18:20:00Z"),
    config: {
      verifyToken: "vt",
      appSecret: SECRET,
      phoneNumberId: "PNID",
      business: "Ekin Ambalaj",
    },
  };
}

const metaBody = (text: string, id = "wamid.1", phone = "PNID") =>
  JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: phone },
              contacts: [{ wa_id: "905551112233", profile: { name: "Talha" } }],
              messages: [
                {
                  id,
                  from: "905551112233",
                  timestamp: String(Date.parse("2026-11-20T18:20:00Z") / 1000),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  });
const post = (body: string, sig = sign(body)) =>
  new Request("https://x/api/whatsapp/webhook", {
    method: "POST",
    body,
    headers: { "x-hub-signature-256": sig },
  });

describe("whatsapp webhook", () => {
  it("answers Meta's subscription check only with the right token", () => {
    expect(
      handleVerify(
        new URL("https://x/w?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=42"),
        "vt",
      ).status,
    ).toBe(200);
    expect(
      handleVerify(
        new URL("https://x/w?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42"),
        "vt",
      ).status,
    ).toBe(403);
    expect(
      handleVerify(new URL("https://x/w?hub.mode=subscribe&hub.verify_token=&hub.challenge=42"), "")
        .status,
    ).toBe(403);
  });

  it("rejects bodies without a valid Meta signature", async () => {
    const { store, calls } = fakeStore();
    const body = metaBody("cuma öderim");
    expect((await handleWebhook(post(body, "sha256=deadbeef"), deps(store))).status).toBe(401);
    expect((await handleWebhook(post(body, ""), deps(store))).status).toBe(401);
    expect(calls.incoming).toHaveLength(0);
    expect(await validSignature(SECRET, body, sign(body))).toBe(true);
  });

  it("stores the message, lets the AI read it and moves the matched due date", async () => {
    const { store, calls } = fakeStore();
    const analyze = vi.fn(async () => analysis({}));
    const text = "27 kasım tarihinde ödenmesi gereken faturamı ancak 30 kasımda ödeyebileceğim";
    const res = await handleWebhook(post(metaBody(text)), deps(store, analyze));
    expect(res.status).toBe(200);
    expect(calls.incoming).toEqual([
      expect.objectContaining({
        user_id: "owner-1",
        contact_wa_id: "905551112233",
        contact_name: "Talha",
        body: text,
      }),
    ]);
    const input = (
      analyze.mock.calls[0] as unknown as [
        { today: string; message: string; open: OpenCommitment[] },
      ]
    )[0];
    expect(input).toMatchObject({ today: "2026-11-20", message: text });
    expect(input.open).toHaveLength(2);
    expect(calls.updates).toEqual([
      {
        userId: "owner-1",
        id: "c-kalinbel",
        patch: expect.objectContaining({ due_date: "2026-11-30", needs_review: false }),
      },
    ]);
    expect(calls.saved[0]).toMatchObject({
      id: "msg-wamid.1",
      patch: {
        intent: "promise",
        previous_due_date: "2026-11-27",
        new_due_date: "2026-11-30",
        reply_state: "waiting",
      },
    });
  });

  it("ignores Meta retries and other phone numbers", async () => {
    const { store, calls } = fakeStore();
    const analyze = vi.fn(async () => analysis({}));
    const body = metaBody("cuma öderim");
    await handleWebhook(post(body), deps(store, analyze));
    await handleWebhook(post(body), deps(store, analyze));
    const other = metaBody("cuma öderim", "wamid.2", "SOMEONE-ELSE");
    await handleWebhook(post(other), deps(store, analyze));
    expect(calls.incoming).toHaveLength(1);
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it("keeps the message when the AI is down and changes nothing", async () => {
    const { store, calls } = fakeStore();
    const res = await handleWebhook(
      post(metaBody("cuma öderim")),
      deps(
        store,
        vi.fn(async () => {
          throw new Error("gateway down");
        }),
      ),
    );
    expect(res.status).toBe(200);
    expect(calls.updates).toHaveLength(0);
    expect(calls.saved[0]).toMatchObject({ patch: { error: "ai_unavailable" } });
  });

  it("records delivery status updates", async () => {
    const { store, calls } = fakeStore();
    const body = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "PNID" },
                statuses: [{ id: "wamid.out", status: "read" }],
              },
            },
          ],
        },
      ],
    });
    await handleWebhook(post(body), deps(store));
    expect(calls.delivery).toEqual([{ id: "wamid.out", status: "read", err: null }]);
  });
});

describe("applying the AI's reading", () => {
  const ctx = (store: WhatsAppStore) => ({
    store,
    userId: "owner-1",
    open: OPEN,
    body: "cuma öderim",
    contactName: "Talha",
  });

  it("never touches a commitment the AI invented", async () => {
    const { store, calls } = fakeStore();
    const out = await applyAnalysis(analysis({ commitment_id: "not-in-list" }), ctx(store));
    expect(out.commitment_id).toBeNull();
    expect(calls.updates).toHaveLength(0);
  });

  it("ignores an invalid date", async () => {
    const { store, calls } = fakeStore();
    await applyAnalysis(analysis({ new_due_date: "30 Kasım" }), ctx(store));
    expect(calls.updates).toHaveLength(0);
  });

  it("flags low confidence for review instead of trusting it", async () => {
    const { store, calls } = fakeStore();
    await applyAnalysis(analysis({ confidence: 0.5 }), ctx(store));
    expect(calls.updates[0]).toMatchObject({ patch: { needs_review: true } });
  });

  it("does not mark an invoice paid from a message; it asks for a check", async () => {
    const { store, calls } = fakeStore();
    await applyAnalysis(analysis({ intent: "paid", new_due_date: null }), ctx(store));
    expect(calls.updates).toEqual([
      {
        userId: "owner-1",
        id: "c-kalinbel",
        patch: expect.objectContaining({ needs_review: true }),
      },
    ]);
    expect(JSON.stringify(calls.updates)).not.toContain("paid");
  });

  it("creates a review-flagged promise when no invoice matches but an amount was given", async () => {
    const { store, calls } = fakeStore();
    const out = await applyAnalysis(analysis({ commitment_id: null, amount: 20000 }), ctx(store));
    expect(calls.inserts).toEqual([
      expect.objectContaining({ counterparty: "Talha", amount: 20000, due_date: "2026-11-30" }),
    ]);
    expect(out.commitment_id).toBe("c-new");
  });

  it("gives the AI today's date in Istanbul and the open receivables", () => {
    expect(istanbul(new Date("2026-11-20T22:30:00Z")).date).toBe("2026-11-21");
    const p = buildPrompt({
      today: "2026-11-20",
      weekday: "Cuma",
      messageAt: "2026-11-20 21:20 (Cuma)",
      contactName: "Talha",
      business: "Ekin",
      message: "x",
      history: [],
      open: OPEN,
      linkedIds: [],
    });
    expect(p).toContain("id=c-kalinbel");
    expect(p).toContain("Bugün: 2026-11-20 (Cuma)");
  });
});

describe("owner reply", () => {
  function replyStore(state = "waiting") {
    const calls = { set: [] as unknown[], out: [] as unknown[] };
    const store: ReplyStore = {
      userIdFromToken: async (t) => (t === "good" ? "owner-1" : null),
      getMessage: async (id, userId) =>
        userId === "owner-1" && id === "11111111-1111-4111-8111-111111111111"
          ? {
              id,
              user_id: userId,
              direction: "in",
              contact_wa_id: "905551112233",
              contact_name: "Talha",
              body: "x",
              commitment_id: "c-kalinbel",
              reply_draft: "Taslak",
              reply_state: state,
            }
          : null,
      setReply: async (id, patch) => {
        calls.set.push({ id, patch });
      },
      insertOutgoing: async (row) => {
        calls.out.push(row);
      },
    };
    return { store, calls };
  }
  const req = (body: unknown, token = "good") =>
    new Request("https://x/api/whatsapp/reply", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const MID = "11111111-1111-4111-8111-111111111111";

  it("needs a signed-in owner", async () => {
    const { store } = replyStore();
    expect(
      (await handleReply(req({ message_id: MID, action: "send" }, "bad"), { store, send: vi.fn() }))
        .status,
    ).toBe(401);
  });

  it("sends the edited text and records it", async () => {
    const { store, calls } = replyStore();
    const send = vi.fn(async () => "wamid.out");
    const res = await handleReply(
      req({ message_id: MID, action: "send", text: "Düzenlenmiş cevap" }),
      { store, send },
    );
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledWith("905551112233", "Düzenlenmiş cevap");
    expect(calls.out[0]).toMatchObject({ body: "Düzenlenmiş cevap", wa_message_id: "wamid.out" });
    expect(calls.set[0]).toMatchObject({ patch: { reply_state: "sent" } });
  });

  it("never sends a draft twice", async () => {
    const { store } = replyStore("sent");
    const send = vi.fn();
    expect(
      (await handleReply(req({ message_id: MID, action: "send" }), { store, send })).status,
    ).toBe(409);
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the draft for a retry when WhatsApp refuses", async () => {
    const { store, calls } = replyStore();
    const res = await handleReply(req({ message_id: MID, action: "send" }), {
      store,
      send: async () => {
        throw new Error("131047: 24 saat geçti");
      },
    });
    expect(res.status).toBe(502);
    expect(calls.set[0]).toMatchObject({ patch: { reply_state: "failed" } });
  });
});
