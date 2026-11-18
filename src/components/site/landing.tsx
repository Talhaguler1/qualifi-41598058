import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  Calculator,
  CalendarClock,
  ChartLine,
  Check,
  ChevronDown,
  EyeOff,
  FileText,
  Landmark,
  Lock,
  Mail,
  Menu,
  MessageCircle,
  Plug,
  Share2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserCheck,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AUDIENCE_PATH, AUDIENCES, COPY, HOME_PATH, type Audience, type SiteLang } from "@/lib/site/copy";
import { HeroVisual } from "./visuals";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const I = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Fades content in once it scrolls into view. Server HTML is already visible (no LCP delay). */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  // Only hide content after hydration, and only if it is still below the fold.
  useEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!reduce && r && r.top > window.innerHeight) setArmed(true);
  }, [reduce]);
  return (
    <div ref={ref} className={`reveal${className ? ` ${className}` : ""}`} data-armed={armed} data-in={inView} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function LangSwitch({ lang, audience }: { lang: SiteLang; audience: Audience }) {
  const navigate = useNavigate();
  const go = (to: SiteLang) => (e: MouseEvent) => {
    e.preventDefault();
    if (to === lang) return;
    void navigate({ to: audience === "business" ? HOME_PATH[to] : AUDIENCE_PATH[to][audience], viewTransition: true, resetScroll: false });
  };
  return (
    <div className="lang" role="group" aria-label={lang === "tr" ? "Dil" : "Language"}>
      {(["tr", "en"] as const).map((l) => (
        <a key={l} href={audience === "business" ? HOME_PATH[l] : AUDIENCE_PATH[l][audience]} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} onClick={go(l)}>
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

function Header({ lang, audience, onAudience }: { lang: SiteLang; audience: Audience; onAudience: (a: Audience) => void }) {
  const c = COPY[lang];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const demo = c.hero[audience].primary.href;
  const links: Array<[string, string, (() => void) | undefined]> = [
    [c.nav.product, "#urun", undefined],
    [c.nav.how, "#nasil", undefined],
    [c.nav.banks, AUDIENCE_PATH[lang].bank, () => onAudience("bank")],
    [c.nav.faq, "#sss", undefined],
  ];
  const click = (fn?: () => void) => (e: MouseEvent) => {
    setOpen(false);
    if (fn) {
      e.preventDefault();
      fn();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="wrap site-header__in">
        <Logo href={HOME_PATH[lang]} label={lang === "tr" ? "QualiFi ana sayfa" : "QualiFi home"} />
        <nav className="site-nav" aria-label={lang === "tr" ? "Ana menü" : "Main menu"}>
          {links.map(([label, href, fn]) => (
            <a key={label} href={href} onClick={click(fn)}>
              {label}
            </a>
          ))}
          <a href={demo}>{c.nav.demo}</a>
        </nav>
        <div className="site-header__end">
          <LangSwitch lang={lang} audience={audience} />
          <a className="btn btn--ghost btn--sm hide-sm" href="/app/giris">
            {c.nav.signIn}
          </a>
          <a className="btn btn--primary btn--sm hide-sm" href="/app/kayit">
            {c.nav.signUp}
          </a>
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-menu" aria-label={open ? c.nav.close : c.nav.menu} onClick={() => setOpen(!open)}>
            {open ? <X {...I} /> : <Menu {...I} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div id="site-menu" className="site-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <nav aria-label={lang === "tr" ? "Mobil menü" : "Mobile menu"}>
              {[...links, [c.nav.demo, demo, undefined] as [string, string, undefined]].map(([label, href, fn], i) => (
                <motion.a key={label} href={href} onClick={click(fn)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 * i, ease: EASE_OUT }}>
                  {label}
                </motion.a>
              ))}
            </nav>
            <div className="site-menu__actions">
              <a className="btn btn--primary btn--lg" href="/app/kayit">{c.nav.signUp}</a>
              <a className="btn btn--secondary btn--lg" href="/app/giris">{c.nav.signIn}</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function AudienceTabs({ lang, value, onChange }: { lang: SiteLang; value: Audience; onChange: (a: Audience) => void }) {
  const c = COPY[lang];
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? (i + 1) % AUDIENCES.length : e.key === "ArrowLeft" ? (i - 1 + AUDIENCES.length) % AUDIENCES.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(AUDIENCES[next]!);
    refs.current[next]?.focus();
  };
  return (
    <LayoutGroup id="audience">
      <div className="tabs" role="tablist" aria-label={c.audienceLabel}>
        {AUDIENCES.map((a, i) => (
          <button
            key={a}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${a}`}
            aria-selected={a === value}
            aria-controls="hero-panel"
            tabIndex={a === value ? 0 : -1}
            onClick={() => onChange(a)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {a === value ? <motion.span layoutId="tab-pill" className="tabs__pill" transition={{ type: "spring", bounce: 0, duration: 0.35 }} /> : null}
            <span className="tabs__label">{c.hero[a].tab}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

function Hero({ lang, audience, onAudience }: { lang: SiteLang; audience: Audience; onAudience: (a: Audience) => void }) {
  const c = COPY[lang];
  const h = c.hero[audience];
  const reduce = useReducedMotion();
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <AudienceTabs lang={lang} value={audience} onChange={onAudience} />
          <div id="hero-panel" role="tabpanel" aria-labelledby={`tab-${audience}`} className="hero__panel">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={audience} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
                <h1>{h.title}</h1>
                <p className="hero__sub">{h.sub}</p>
                <div className="hero__ctas">
                  <a className="btn btn--primary btn--lg" href={h.primary.href}>
                    {h.primary.label} <ArrowRight size={18} strokeWidth={1.75} className="btn__arrow" aria-hidden="true" />
                  </a>
                  <a className="btn btn--secondary btn--lg" href={h.secondary.href}>
                    {h.secondary.label}
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <HeroVisual audience={audience} copy={c} en={lang === "en"} />
      </div>
    </section>
  );
}

const SOURCE_ICONS = [Building2, Calculator, Landmark, MessageCircle, Mail, FileText];

function Sources({ lang }: { lang: SiteLang }) {
  const s = COPY[lang].sources;
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="section__head">
          <h2>{s.title}</h2>
          <p>{s.sub}</p>
        </Reveal>
        <Reveal className="flow">
          <ul className="flow__sources">
            {s.items.map((item, i) => {
              const Icon = SOURCE_ICONS[i] ?? Plug;
              return (
                <li key={item} style={{ animationDelay: `${i * 0.35}s` }}>
                  <Icon {...I} size={18} /> {item}
                </li>
              );
            })}
          </ul>
          <svg className="flow__beams" viewBox="0 0 120 300" preserveAspectRatio="none" aria-hidden="true">
            {s.items.map((_, i) => {
              const y = 25 + i * 50;
              return <path key={i} d={`M0,${y} C60,${y} 60,150 120,150`} className="flow__beam" style={{ animationDelay: `${i * 0.35}s` }} />;
            })}
          </svg>
          <div className="flow__agent">
            <Sparkles {...I} size={22} />
            <b>{s.agent}</b>
          </div>
          <svg className="flow__beams flow__beams--out" viewBox="0 0 120 300" preserveAspectRatio="none" aria-hidden="true">
            {s.outputs.map((_, i) => {
              const y = 75 + i * 75;
              return <path key={i} d={`M0,150 C60,150 60,${y} 120,${y}`} className="flow__beam flow__beam--out" style={{ animationDelay: `${1 + i * 0.4}s` }} />;
            })}
          </svg>
          <ul className="flow__outputs">
            {s.outputs.map((o, i) => (
              <li key={o}>
                {[<CalendarClock key="a" {...I} size={18} />, <ChartLine key="b" {...I} size={18} />, <BellRing key="c" {...I} size={18} />][i]}
                {o}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function BeforeAfter({ lang }: { lang: SiteLang }) {
  const b = COPY[lang].before;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section className="section section--soft">
      <div className="wrap">
        <Reveal className="section__head">
          <h2>{b.title}</h2>
          <p>{b.sub}</p>
        </Reveal>
        <div ref={ref} className="compare" data-in={inView}>
          <div className="compare__card compare__card--old">
            <span className="eyebrow">{b.oldLabel}</span>
            <ol>
              {b.oldSteps.map((step, i) => (
                <li key={step} style={{ transitionDelay: `${300 + i * 260}ms` }}>
                  <span className="compare__n">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="compare__time">{b.time[0]}</p>
          </div>
          <div className="compare__card compare__card--new">
            <span className="eyebrow">{b.newLabel}</span>
            <ol>
              {b.newSteps.map((step, i) => (
                <li key={step} style={{ transitionDelay: `${1500 + i * 300}ms` }}>
                  <span className="compare__n">{i === 0 ? <MessageCircle size={14} strokeWidth={1.75} aria-hidden="true" /> : <Check size={14} strokeWidth={2} aria-hidden="true" />}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="compare__time">{b.time[1]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ lang }: { lang: SiteLang }) {
  const h = COPY[lang].how;
  const v = COPY[lang].visual;
  const s = COPY[lang].sources;
  const [active, setActive] = useState(0);
  const items = useRef<Array<HTMLLIElement | null>>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset["i"]));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const panels = [
    <div key="0" className="how__panel how__panel--sources">
      {s.items.slice(0, 5).map((it, i) => {
        const Icon = SOURCE_ICONS[i] ?? Plug;
        return (
          <span key={it} className="chip">
            <Icon size={15} strokeWidth={1.75} aria-hidden="true" /> {it}
          </span>
        );
      })}
    </div>,
    <div key="1" className="how__panel">
      <div className="mini-bubble">{v.message}</div>
      <div className="mini-move">
        <CalendarClock size={15} strokeWidth={1.75} aria-hidden="true" /> {v.moved}
      </div>
    </div>,
    <div key="2" className="how__panel">
      <svg viewBox="-4 -6 308 108" className="mini-chart" aria-hidden="true">
        <path d={path(AFTER_H)} className="sv-line" />
      </svg>
      <div className="mini-warn">
        <TriangleAlert size={15} strokeWidth={1.75} aria-hidden="true" /> {v.warnTitle}
      </div>
    </div>,
    <div key="3" className="how__panel">
      <div className="mini-share">
        <Share2 size={16} strokeWidth={1.75} aria-hidden="true" />
        <b>{lang === "tr" ? "Ödeme karnesi · A" : "Payment scorecard · A"}</b>
        <span>{lang === "tr" ? "Banka A'dan teklif geldi" : "Offer received from Banka A"}</span>
      </div>
    </div>,
  ];
  return (
    <section className="section" id="nasil">
      <div className="wrap">
        <Reveal className="section__head">
          <h2>{h.title}</h2>
        </Reveal>
        <div className="how">
          <ol className="how__steps">
            {h.steps.map((st, i) => (
              <li
                key={st.title}
                ref={(el) => {
                  items.current[i] = el;
                }}
                data-i={i}
                data-active={active === i}
              >
                <span className="how__n">{i + 1}</span>
                <div>
                  <h3>{st.title}</h3>
                  <p>{st.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="how__visual" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
                {panels[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

const AFTER_H = [2.1, 2.3, 3.1, 3.4, 3.3, 1.75, 2.45, 2.9];
function path(values: number[]) {
  return values.map((val, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 300).toFixed(1)},${(((3.8 - val) / 2.6) * 96).toFixed(1)}`).join(" ");
}

function Bento({ lang }: { lang: SiteLang }) {
  const b = COPY[lang].bento;
  const v = COPY[lang].visual;
  const tr = lang === "tr";
  const minis: ReactNode[] = [
    <div key="0" className="bento__mini">
      <div className="mini-bubble mini-bubble--sm">{tr ? "2 hafta sonra öderiz" : "We'll pay in 2 weeks"}</div>
      <div className="mini-move mini-move--anim">
        <CalendarClock size={14} strokeWidth={1.75} aria-hidden="true" /> 2 → 16 {tr ? "Oca" : "Jan"}
      </div>
    </div>,
    <div key="1" className="bento__mini">
      <div className="mini-draft">{tr ? "\"16 Oca tarihini teyit eder misiniz?\"" : "\"Could you confirm 16 Jan?\""}</div>
      <span className="btn btn--primary btn--sm" aria-hidden="true">{tr ? "Onayla" : "Approve"}</span>
    </div>,
    <div key="2" className="bento__mini">
      <svg viewBox="-4 -6 308 108" className="mini-chart mini-chart--draw" aria-hidden="true">
        <path d={path(AFTER_H)} className="sv-line" pathLength={1} />
      </svg>
    </div>,
    <div key="3" className="bento__mini bento__grades">
      {(["A", "B", "C", "D"] as const).map((g, i) => (
        <span key={g} data-g={g}>
          <b>{g}</b>
          <i style={{ width: `${[64, 22, 9, 5][i]}%` }} />
        </span>
      ))}
    </div>,
    <div key="4" className="bento__mini">
      <div className="mini-warn">
        <TriangleAlert size={15} strokeWidth={1.75} aria-hidden="true" /> {v.warnTitle}
      </div>
    </div>,
    <div key="5" className="bento__mini bento__offers">
      {[["Banka C", tr ? "%3,41" : "3.41%"], ["Banka B", tr ? "%3,49" : "3.49%"], ["Banka A", tr ? "%3,82" : "3.82%"]].map(([bank, rate], i) => (
        <span key={bank} data-best={i === 0}>
          {bank} <b className="num">{rate}</b>
        </span>
      ))}
    </div>,
  ];
  const icons = [MessageCircle, BellRing, ChartLine, UserCheck, TriangleAlert, Landmark];
  return (
    <section className="section section--soft" id="urun">
      <div className="wrap">
        <Reveal className="section__head">
          <h2>{b.title}</h2>
        </Reveal>
        <div className="bento">
          {b.tiles.map((t, i) => {
            const Icon = icons[i] ?? Sparkles;
            return (
              <Reveal key={t.title} className="bento__tile" delay={i * 50}>
                <span className="icon-chip">
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                {minis[i]}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Banks({ lang }: { lang: SiteLang }) {
  const b = COPY[lang].banks;
  const icons = [TriangleAlert, Sparkles, EyeOff];
  return (
    <section className="section section--dark">
      <div className="wrap banks">
        <Reveal className="section__head section__head--left">
          <h2>{b.title}</h2>
          <p>{b.sub}</p>
          <a className="btn btn--accent btn--lg" href={COPY[lang].hero.bank.primary.href}>
            {b.cta} <ArrowRight size={18} strokeWidth={1.75} className="btn__arrow" aria-hidden="true" />
          </a>
        </Reveal>
        <div className="banks__points">
          {b.points.map((p, i) => {
            const Icon = icons[i] ?? Sparkles;
            return (
              <Reveal key={p.title} className="banks__point" delay={i * 60}>
                <Icon {...I} />
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Trust({ lang }: { lang: SiteLang }) {
  const t = COPY[lang].trust;
  const icons = [ShieldCheck, Lock, Share2];
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="section__head">
          <h2>{t.title}</h2>
        </Reveal>
        <div className="trust">
          {t.items.map((it, i) => {
            const Icon = icons[i] ?? ShieldCheck;
            return (
              <Reveal key={it.title} className="trust__item" delay={i * 60}>
                <span className="icon-chip">
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Faq({ lang }: { lang: SiteLang }) {
  const f = COPY[lang].faq;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section section--soft" id="sss">
      <div className="wrap wrap--narrow">
        <Reveal className="section__head">
          <h2>{f.title}</h2>
        </Reveal>
        <div className="faq">
          {f.items.map((it, i) => (
            <div key={it.q} className="faq__item" data-open={open === i}>
              <h3>
                <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                  {it.q}
                  <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open === i ? (
                  <motion.div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq__a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
                    <p>{it.a}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Final({ lang, audience }: { lang: SiteLang; audience: Audience }) {
  const c = COPY[lang];
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="final">
          <h2>{c.final.title}</h2>
          <p>{c.final.sub}</p>
          <div className="hero__ctas">
            <a className="btn btn--accent btn--lg" href={c.hero[audience].primary.href}>
              {c.hero[audience].primary.label} <ArrowRight size={18} strokeWidth={1.75} className="btn__arrow" aria-hidden="true" />
            </a>
            <a className="btn btn--on-dark btn--lg" href="/app/kayit">
              {c.nav.signUp}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer({ lang }: { lang: SiteLang }) {
  const f = COPY[lang].footer;
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__in">
        <div>
          <Logo href={null} />
          <p>{f.tagline}</p>
        </div>
        <nav aria-label={lang === "tr" ? "Site haritası" : "Site map"}>
          {f.links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="wrap site-footer__fine">
        <span>{f.disclaimer}</span>
        <span>© 2026 QualiFi</span>
      </div>
    </footer>
  );
}

/**
 * The landing page. Audience tabs switch on the client (no reload) and update the URL in place;
 * the language switch uses a View Transition. One page serves every audience URL.
 */
export function Landing({ lang, initialAudience }: { lang: SiteLang; initialAudience: Audience }) {
  const [audience, setAudience] = useState<Audience>(initialAudience);
  useEffect(() => setAudience(initialAudience), [initialAudience]);
  const change = (a: Audience) => {
    if (a === audience) return;
    setAudience(a);
    const url = a === "business" && (window.location.pathname === HOME_PATH[lang] || window.location.pathname === "/tr") ? window.location.pathname : AUDIENCE_PATH[lang][a];
    window.history.replaceState(window.history.state, "", url + window.location.hash);
  };
  return (
    <div className="site">
      <a className="skip" href="#main">
        {lang === "tr" ? "İçeriğe geç" : "Skip to content"}
      </a>
      <Header lang={lang} audience={audience} onAudience={change} />
      <main id="main">
        <Hero lang={lang} audience={audience} onAudience={change} />
        <Sources lang={lang} />
        <BeforeAfter lang={lang} />
        <HowItWorks lang={lang} />
        <Bento lang={lang} />
        <Banks lang={lang} />
        <Trust lang={lang} />
        <Faq lang={lang} />
        <Final lang={lang} audience={audience} />
      </main>
      <Footer lang={lang} />
    </div>
  );
}
