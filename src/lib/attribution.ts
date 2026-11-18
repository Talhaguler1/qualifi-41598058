// First-touch attribution: where a visitor first came from (e.g. a Meta ad), kept in this
// browser and attached to the account when they sign up. Only campaign labels are stored
// (no identifiers, nothing sent to third parties), so sign-ups can be counted per source.

export interface FirstTouch {
  source: string;
  medium?: string;
  campaign?: string;
  landing: string;
  at: string;
}

const KEY = "qf-first-touch";
const SAFE = /^[\p{L}\p{N}_.\- ]{1,60}$/u;

const clean = (v: string | null | undefined): string | undefined => {
  const t = (v ?? "").trim();
  return t && SAFE.test(t) ? t : undefined;
};

/** Reads utm_* / fbclid from a URL. Returns null when the visit carries no campaign signal. */
export function touchFromUrl(href: string, now = new Date()): FirstTouch | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const p = url.searchParams;
  const source = clean(p.get("utm_source")) ?? (p.get("fbclid") ? "meta" : undefined) ?? (p.get("gclid") ? "google" : undefined);
  if (!source) return null;
  const medium = clean(p.get("utm_medium")) ?? (p.get("fbclid") || p.get("gclid") ? "paid" : undefined);
  const campaign = clean(p.get("utm_campaign"));
  return { source: source.toLowerCase(), ...(medium ? { medium } : {}), ...(campaign ? { campaign } : {}), landing: url.pathname.slice(0, 80), at: now.toISOString() };
}

/** Keeps the first campaign visit (first touch wins), safe when storage is blocked. */
export function captureFirstTouch(): void {
  try {
    if (window.localStorage.getItem(KEY)) return;
    const touch = touchFromUrl(window.location.href);
    if (touch) window.localStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    /* storage blocked: attribution is optional */
  }
}

export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as Partial<FirstTouch>;
    const source = clean(t.source);
    return source ? { source, ...(clean(t.medium) ? { medium: clean(t.medium) as string } : {}), ...(clean(t.campaign) ? { campaign: clean(t.campaign) as string } : {}), landing: String(t.landing ?? "").slice(0, 80), at: String(t.at ?? "") } : null;
  } catch {
    return null;
  }
}

/** Server side: the display-only source fields copied from sign-up metadata. */
export function sourceFromMetadata(meta: Record<string, unknown> | undefined): { qualifi_source?: string; qualifi_campaign?: string } {
  const source = clean(typeof meta?.["source"] === "string" ? (meta["source"] as string) : undefined);
  const campaign = clean(typeof meta?.["campaign"] === "string" ? (meta["campaign"] as string) : undefined);
  return { ...(source ? { qualifi_source: source.toLowerCase() } : {}), ...(campaign ? { qualifi_campaign: campaign } : {}) };
}
