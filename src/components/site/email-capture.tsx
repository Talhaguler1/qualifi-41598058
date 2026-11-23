import { useState, type FormEvent } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { track } from "@/lib/tracking";
import { AUDIENCE_PATH, type Audience, type SiteLang } from "@/lib/site/copy";
import { PAGE_CONFIG } from "@/lib/qualifi-page-config";

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}

const TEXT = {
  tr: {
    label: "E-posta adresiniz",
    placeholder: "ornek@isletmeniz.com",
    lead: "E-postanızı bırakın; kurucumuz size yazıp QualiFi'yi bizzat göstersin.",
    submit: "Ürünü bana gösterin",
    sending: "Gönderiliyor…",
    note: "E-postanızı yalnızca size yazmak için kullanırız.",
    privacy: "KVKK ve gizlilik",
    done: "Teşekkürler, e-postanızı aldık.",
    doneSub: "Kısa süre içinde size yazacağız. Bu arada demoyu deneyebilirsiniz.",
    demo: "Canlı demoyu deneyin",
    error: "Gönderilemedi. Lütfen tekrar deneyin.",
    seeFirst: "Önce görmek ister misiniz? Canlı demoyu deneyin",
  },
  en: {
    label: "Your email",
    placeholder: "you@yourbusiness.com",
    lead: "Leave your email; our founder will write and show you QualiFi personally.",
    submit: "Show me the product",
    sending: "Sending…",
    note: "We use your email only to write to you.",
    privacy: "Privacy",
    done: "Thanks, we have your email.",
    doneSub: "We'll write to you shortly. Meanwhile, try the demo.",
    demo: "Try the live demo",
    error: "Couldn't send. Please try again.",
    seeFirst: "Want to see it first? Try the live demo",
  },
} as const;

/** The smallest possible step for a visitor: one email field, one button (posts to the existing /api/leads). */
export function EmailCapture({ lang, audience, demoHref, position, dark = false }: { lang: SiteLang; audience: Audience; demoHref: string; position: "hero" | "bottom"; dark?: boolean }) {
  const t = TEXT[lang];
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [id] = useState(uuid);
  // The lead endpoint validates the page; use this audience's page and fall back to the business page.
  const path = AUDIENCE_PATH[lang][audience] in PAGE_CONFIG ? AUDIENCE_PATH[lang][audience] : AUDIENCE_PATH[lang].business;
  const page = PAGE_CONFIG[path as keyof typeof PAGE_CONFIG];

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (String(data.get("website") ?? "")) return; // honeypot
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          email: String(data.get("email") ?? ""),
          consent: true,
          kind: "waitlist",
          solution: page.solutions[0],
          context: {
            pagePath: path,
            locale: page.locale,
            segment: page.segment,
            ...(page.campaignId ? { campaignId: page.campaignId } : {}),
            analyticsConsent: false,
            ...utm(),
          },
        }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) track("Lead", { content_name: `email-${position}` });
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className={`capture capture--done${dark ? " capture--dark" : ""}`} role="status">
        <CircleCheck size={22} strokeWidth={1.75} aria-hidden="true" />
        <div>
          <b>{t.done}</b>
          <span>
            {t.doneSub}{" "}
            <a href={demoHref}>{t.demo} →</a>
          </span>
        </div>
      </div>
    );
  }
  return (
    <form className={`capture${dark ? " capture--dark" : ""}`} onSubmit={submit}>
      {position === "hero" ? <p className="capture__lead">{t.lead}</p> : null}
      <div className="capture__row">
        <label className="capture__field">
          <span className="sr-only">{t.label}</span>
          <input name="email" type="email" required autoComplete="email" inputMode="email" maxLength={254} placeholder={t.placeholder} aria-label={t.label} />
        </label>
        <button type="submit" className={`btn btn--lg ${dark ? "btn--accent" : "btn--primary"}`} disabled={state === "sending"}>
          {state === "sending" ? t.sending : t.submit} <ArrowRight size={18} strokeWidth={1.75} className="btn__arrow" aria-hidden="true" />
        </button>
      </div>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="pilot__hp" aria-hidden="true" />
      <p className="capture__note">
        {t.note} <a href="/gizlilik">{t.privacy}</a>
      </p>
      {state === "error" ? (
        <p className="capture__error" role="alert">
          {t.error}
        </p>
      ) : null}
      {position === "hero" ? (
        <a className="hero__demo" href={demoHref}>
          {t.seeFirst} →
        </a>
      ) : null}
    </form>
  );
}

/** Campaign source from the address bar (e.g. utm_source=instagram), so leads can be counted per channel. */
function utm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = q.get(k);
    if (v && /^[a-zA-Z0-9_. -]{1,100}$/.test(v)) out[k] = v;
  }
  return out;
}
