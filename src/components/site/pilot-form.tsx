import { useState, type FormEvent } from "react";
import { ArrowRight, Check, CircleCheck } from "lucide-react";
import { BANK_COPY } from "@/lib/site/bank-copy";
import { AUDIENCE_PATH, type SiteLang } from "@/lib/site/copy";

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}

/** Corporate pilot request for banks, on the bank page itself (posts to the existing /api/leads). */
export function PilotForm({ lang }: { lang: SiteLang }) {
  const p = BANK_COPY[lang].pilot;
  const f = BANK_COPY[lang].final;
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [id] = useState(uuid);
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
          company: String(data.get("company") ?? "") || undefined,
          consent: true,
          kind: "pilot",
          solution: "risk",
          context: { pagePath: AUDIENCE_PATH[lang].bank, locale: lang, segment: "banks", analyticsConsent: false },
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };
  return (
    <section className="section" id={p.id}>
      <div className="wrap">
        <div className="final pilot">
          <div className="pilot__copy">
            <h2>{f.title}</h2>
            <p>{f.sub}</p>
            <ul>
              {p.points.map((pt) => (
                <li key={pt}>
                  <Check size={16} strokeWidth={2} aria-hidden="true" /> {pt}
                </li>
              ))}
            </ul>
          </div>
          <div className="pilot__card">
            {state === "done" ? (
              <div className="pilot__done" role="status">
                <CircleCheck size={28} strokeWidth={1.75} aria-hidden="true" />
                <b>{p.done}</b>
                <span>{p.doneSub}</span>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3>{p.title}</h3>
                <p>{p.sub}</p>
                <label>
                  <span>{p.email}</span>
                  <input name="email" type="email" required autoComplete="email" maxLength={254} />
                </label>
                <label>
                  <span>{p.company}</span>
                  <input name="company" type="text" autoComplete="organization" maxLength={200} />
                </label>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" className="pilot__hp" aria-hidden="true" />
                <label className="pilot__consent">
                  <input type="checkbox" required />
                  <span>{p.consent}</span>
                </label>
                <button type="submit" className="btn btn--primary btn--lg" disabled={state === "sending"}>
                  {state === "sending" ? p.sending : p.submit} <ArrowRight size={18} strokeWidth={1.75} className="btn__arrow" aria-hidden="true" />
                </button>
                {state === "error" ? <p className="pilot__error" role="alert">{p.error}</p> : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
