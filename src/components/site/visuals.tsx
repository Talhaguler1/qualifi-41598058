import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { BellRing, CalendarClock, Check, EyeOff, MessageCircle, Sparkles, TriangleAlert } from "lucide-react";
import type { Audience, SiteCopy } from "@/lib/site/copy";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_MOVE = [0.65, 0, 0.35, 1] as const;
const ICON = { size: 16, strokeWidth: 1.75 } as const;

/** Steps through 0..max while visible, holds on the last step, then loops. Static when reduced motion. */
function useLoop(max: number, stepMs: number, holdMs: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(max);
  useEffect(() => {
    if (reduce || !inView) {
      setStep(max);
      return;
    }
    let s = 0;
    setStep(0);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      s = s >= max ? 0 : s + 1;
      setStep(s);
      timer = setTimeout(tick, s === max ? holdMs : stepMs);
    };
    timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [inView, reduce, max, stepMs, holdMs]);
  return { ref, step };
}

// Forecast lines (8 weeks), before and after the "2 weeks later" message; same shape as the demo.
const BEFORE = [2.1, 2.3, 3.1, 3.4, 3.3, 2.45, 2.7, 2.9];
const AFTER = [2.1, 2.3, 3.1, 3.4, 3.3, 1.75, 2.45, 2.9];
function path(values: number[], w: number, h: number) {
  const max = 3.8;
  const min = 1.2;
  return values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * w).toFixed(1)},${(((max - v) / (max - min)) * h).toFixed(1)}`).join(" ");
}

/** The core story: a WhatsApp promise moves the invoice date and bends the forecast. */
function BusinessStory({ v }: { v: SiteCopy["visual"] }) {
  const { ref, step } = useLoop(4, 1100, 3200);
  const W = 300;
  const H = 96;
  return (
    <div ref={ref} className="sv sv--story" aria-hidden="true">
      <div className="sv-bubble" data-on={step >= 0}>
        <small>
          <MessageCircle size={13} strokeWidth={1.75} /> {v.whatsapp}
        </small>
        {v.message}
      </div>
      <div className="sv-read" data-on={step >= 1}>
        <Sparkles size={13} strokeWidth={1.75} /> {v.read}
      </div>
      <div className="sv-track">
        <div className="sv-axis">
          {["25", "2", "9", "16", "23", "30", "6", "13"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <span className="sv-ghost" data-on={step >= 2}>2</span>
        <motion.span className="sv-chip" initial={false} animate={{ left: step >= 2 ? "80%" : "64%" }} transition={{ duration: 0.8, ease: EASE_MOVE }}>
          <CalendarClock size={12} strokeWidth={1.75} /> {v.moved}
        </motion.span>
      </div>
      <div className="sv-chart">
        <span className="sv-label">{v.forecast}</span>
        <svg viewBox={`-4 -6 ${W + 8} ${H + 12}`}>
          <rect x={(5 / 7) * W - 18} y={-6} width={36} height={H + 12} rx={8} className="sv-tight" data-on={step >= 3} />
          <path d={path(BEFORE, W, H)} className="sv-line-before" />
          <motion.path initial={false} animate={{ d: path(step >= 3 ? AFTER : BEFORE, W, H) }} transition={{ duration: 0.9, ease: EASE_MOVE }} className="sv-line" />
        </svg>
      </div>
      <div className="sv-warn" data-on={step >= 4}>
        <TriangleAlert size={16} strokeWidth={1.75} />
        <div>
          <b>{v.warnTitle}</b>
          <span>{v.warnAdvice}</span>
        </div>
      </div>
    </div>
  );
}

function FreelancerStory({ v }: { v: SiteCopy["visual"] }) {
  const { ref, step } = useLoop(2, 1300, 3000);
  const rows: Array<[string, string, string]> = [
    [v.milestones[0] ?? "", "₺48.000", "12 Kas"],
    [v.milestones[1] ?? "", "₺96.000", "5 Ara"],
    [v.milestones[2] ?? "", "₺36.000", "9 Oca"],
  ];
  return (
    <div ref={ref} className="sv sv--list" aria-hidden="true">
      {rows.map(([name, amount, date], i) => (
        <div key={name} className="sv-row" data-state={i === 0 ? "done" : i === 1 && step >= 1 ? "late" : "open"}>
          <span className="sv-dot">{i === 0 ? <Check size={12} strokeWidth={2} /> : null}</span>
          <div>
            <b>{name}</b>
            <small>{date}</small>
          </div>
          <b className="sv-num">{amount}</b>
          {i === 1 ? <span className="sv-pill sv-pill--risk" data-on={step >= 1}>{v.milestoneLate}</span> : null}
        </div>
      ))}
      <div className="sv-reminder" data-on={step >= 2}>
        <BellRing {...ICON} /> {v.reminder}
      </div>
    </div>
  );
}

function FinanceStory({ v, en }: { v: SiteCopy["visual"]; en: boolean }) {
  const { ref, step } = useLoop(1, 900, 3600);
  const shares = [62, 24, 9, 5];
  return (
    <div ref={ref} className="sv sv--aging" aria-hidden="true">
      <span className="sv-label">{v.agingTitle}</span>
      {v.aging.map((label, i) => (
        <div key={label} className="sv-bar">
          <span>{label}</span>
          <i>
            <motion.b initial={false} animate={{ width: step >= 1 ? `${shares[i]}%` : "0%" }} transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT }} data-tone={i >= 2 ? "risk" : i === 1 ? "warn" : "ok"} />
          </i>
          <b className="sv-num">{en ? `${shares[i]}%` : `%${shares[i]}`}</b>
        </div>
      ))}
      <div className="sv-reminder" data-on={step >= 1}>
        <MessageCircle {...ICON} /> {v.promisesWeek}
      </div>
    </div>
  );
}

function BankStory({ v }: { v: SiteCopy["visual"] }) {
  const { ref, step } = useLoop(2, 1000, 3400);
  const C = 2 * Math.PI * 34;
  return (
    <div ref={ref} className="sv sv--bank" aria-hidden="true">
      <div className="sv-score">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" className="sv-ring-bg" />
          <motion.circle cx="40" cy="40" r="34" className="sv-ring" strokeDasharray={C} initial={false} animate={{ strokeDashoffset: step >= 1 ? C * (1 - 0.74) : C }} transition={{ duration: 0.9, ease: EASE_OUT }} />
        </svg>
        <div>
          <span className="sv-label">{v.score}</span>
          <b className="sv-num">74</b>
          <span className="sv-pill sv-pill--risk">{v.riskHigh}</span>
        </div>
      </div>
      <ul className="sv-factors">
        {v.factors.map((f, i) => (
          <li key={f} data-on={step >= 1} style={{ transitionDelay: `${i * 80}ms` }}>
            {f}
          </li>
        ))}
      </ul>
      <div className="sv-reminder" data-on={step >= 2}>
        <Sparkles {...ICON} /> {v.product}
      </div>
      <div className="sv-masked">
        <EyeOff size={13} strokeWidth={1.75} /> {v.masked}
      </div>
    </div>
  );
}

/** The hero product visual, morphing per audience. */
export function HeroVisual({ audience, copy, en }: { audience: Audience; copy: SiteCopy; en: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="hero-visual">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          className="hero-visual__frame"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {audience === "business" ? <BusinessStory v={copy.visual} /> : null}
          {audience === "freelancer" ? <FreelancerStory v={copy.visual} /> : null}
          {audience === "finance" ? <FinanceStory v={copy.visual} en={en} /> : null}
          {audience === "bank" ? <BankStory v={copy.visual} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
