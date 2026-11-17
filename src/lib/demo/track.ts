// Records what people do in the demo panels (for feedback), via POST /api/demo-interactions.
// No names, emails or phone numbers: only the panel, demo date, action and a short target.
// The session id lives in sessionStorage, so it ends when the tab closes.

export type DemoAction =
  | "agent_approve"
  | "agent_edit"
  | "agent_snooze"
  | "agent_question"
  | "scenario_run"
  | "date_change"
  | "customer_open"
  | "firm_open"
  | "tab_open";

export interface DemoEvent {
  panel: "business" | "bank";
  tenant: string;
  demo_date: string;
  action: DemoAction;
  target?: string | null;
  detail?: string | null;
}

const KEY = "qd-session";

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}

let memorySession: string | null = null;
let authToken: string | null = null;

/** Signed-in pages pass the session token so the server can attach the user to each event. */
export function setDemoAuthToken(token: string | null): void {
  authToken = token;
}

export function demoSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomUuid();
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    memorySession ??= randomUuid();
    return memorySession;
  }
}

/** Fire-and-forget. A failed or rate-limited log never affects the demo. */
export function trackDemo(event: DemoEvent): void {
  if (typeof window === "undefined") return;
  const body = {
    session_id: demoSessionId(),
    panel: event.panel,
    tenant: event.tenant,
    demo_date: event.demo_date,
    action: event.action,
    target: event.target ? event.target.slice(0, 120) : null,
    detail: event.detail ? event.detail.slice(0, 300) : null,
  };
  try {
    void fetch("/api/demo-interactions", {
      method: "POST",
      headers: authToken ? { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` } : { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}
