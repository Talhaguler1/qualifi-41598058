// Meta Pixel, loaded only after the visitor accepts (KVKK). Until META_PIXEL_ID is set this file
// does nothing: no banner, no third-party request.

/** Meta Events Manager → Data sources → dataset (pixel) ID for qualifilab.com. Not a secret. */
export const META_PIXEL_ID = "";
/** Business Settings → Brand safety → Domains → qualifilab.com → meta-tag `content` value. */
export const META_DOMAIN_VERIFICATION = "";

export type Consent = "granted" | "denied";
const CONSENT_KEY = "qf-consent-v1";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const trackingEnabled = (): boolean => META_PIXEL_ID.length > 0;

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage blocked: ask again next time */
  }
  if (value === "granted") loadPixel();
}

/** Standard Meta snippet, run only after consent. */
export function loadPixel(): void {
  if (!trackingEnabled() || typeof window === "undefined" || window.fbq) return;
  const n: Fbq = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue?.push(args);
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  window.fbq = n;
  window._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", META_PIXEL_ID);
  n("track", "PageView");
}

/** Sends a standard event (ViewContent, Lead, CompleteRegistration…) if the visitor consented. */
export function track(event: string, params?: Record<string, string | number>): void {
  if (!trackingEnabled() || readConsent() !== "granted") return;
  loadPixel();
  window.fbq?.("track", event, params ?? {});
}

/** Sends a custom event (e.g. DemoTried) if the visitor consented. */
export function trackCustom(event: string, params?: Record<string, string | number>): void {
  if (!trackingEnabled() || readConsent() !== "granted") return;
  loadPixel();
  window.fbq?.("trackCustom", event, params ?? {});
}
