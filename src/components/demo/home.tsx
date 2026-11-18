import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { L, type AgentStep } from "@/lib/demo";
import { TOOL_ICONS } from "./shared";

/**
 * Demo home layout: the agent speaks first (one sentence + a question box), then a grid of
 * story cards with one number and one sentence each. A card opens its detail in a side panel
 * (bottom sheet on phones), so the screen starts calm and the depth is one click away.
 */

/** The agent's round as a row of icons that light up one by one; the full log opens on demand. */
function AgentTicker({ steps, runKey }: { steps: AgentStep[]; runKey: string }) {
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setProgress(0);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(steps.length + 1);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setProgress(i);
      if (i > steps.length) clearInterval(timer);
    }, 380);
    return () => clearInterval(timer);
  }, [runKey, steps.length]);
  const working = progress <= steps.length;
  const current = steps[Math.min(progress, steps.length) - 1];
  return (
    <div className="qd-ticker">
      <button type="button" className="qd-ticker__row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="qd-ticker__icons" aria-hidden="true">
          {steps.map((s, i) => {
            const state = i + 1 < progress ? "done" : i + 1 === progress ? "running" : "pending";
            return (
              <i key={`${runKey}-${s.id}`} data-state={state} title={s.title}>
                {state === "running" ? <Loader2 size={12} className="qd-spin" /> : state === "done" ? <Check size={12} /> : TOOL_ICONS[s.tool]}
              </i>
            );
          })}
        </span>
        <span className="qd-ticker__label" aria-live="polite">
          {working && current ? current.title : L(`${steps.length} adımlık tur tamamlandı`, `Round of ${steps.length} steps complete`)}
        </span>
        <span className="qd-ticker__more">
          {open ? L("Gizle", "Hide") : L("Ne yaptı?", "What did it do?")} <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </span>
      </button>
      {open ? (
        <ol className="qd-ticker__log qd-enter">
          {steps.map((s) => (
            <li key={s.id}>
              <span>{TOOL_ICONS[s.tool]}</span>
              <div>
                <b>{s.title}</b>
                <small>{s.detail}</small>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export interface HeroStat {
  label: string;
  value: ReactNode;
  sub?: string;
}

export function AgentHero({
  title,
  headline,
  tone,
  points,
  stats,
  steps,
  runKey,
  children,
}: {
  title: string;
  headline: string;
  tone: "calm" | "watch" | "alert";
  points: string[];
  stats: HeroStat[];
  steps: AgentStep[];
  runKey: string;
  children?: ReactNode;
}) {
  return (
    <section className="qd-ahero qd-enter" data-tone={tone}>
      <div className="qd-ahero__lead">
        <div className="qd-agent__title">
          <span className="qd-agent__avatar">
            <Bot size={18} />
          </span>
          <span>
            <b>{title}</b>
            <small>{L("Bugünün özeti", "Today's summary")}</small>
          </span>
        </div>
        <h2 key={runKey}>{headline}</h2>
        {points.length ? (
          <ul className="qd-ahero__points">
            {points.slice(0, 2).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="qd-ahero__stats">
        {stats.map((s) => (
          <div key={s.label} className="qd-ahero__stat">
            <span>{s.label}</span>
            <b className="qd-num">{s.value}</b>
            {s.sub ? <small>{s.sub}</small> : null}
          </div>
        ))}
      </div>
      <div className="qd-ahero__wide">
        <AgentTicker steps={steps} runKey={runKey} />
        {children}
      </div>
    </section>
  );
}

export interface StoryCard {
  key: string;
  icon: ReactNode;
  eyebrow: string;
  value: ReactNode;
  text: string;
  tone?: "alert" | "good" | "accent";
  /** Label for the open link; defaults to "Aç". */
  cta?: string;
  /** Cards that open something else (a sheet) instead of the detail area. */
  onActivate?: () => void;
}

export function StoryGrid({ cards, open, onToggle }: { cards: StoryCard[]; open: string | null; onToggle: (key: string) => void }) {
  return (
    <div className="qd-stories">
      {cards.map((c, i) => (
        <button
          key={c.key}
          type="button"
          className="qd-story qd-enter"
          style={{ animationDelay: `${i * 50}ms` }}
          data-tone={c.tone}
          aria-expanded={c.onActivate ? undefined : open === c.key}
                    onClick={() => (c.onActivate ? c.onActivate() : onToggle(c.key))}
        >
          <span className="qd-story__top">
            <i>{c.icon}</i>
            <span className="qd-eyebrow">{c.eyebrow}</span>
          </span>
          <span className="qd-story__value qd-num">{c.value}</span>
          <span className="qd-story__text">{c.text}</span>
          <span className="qd-story__more">
            {c.cta ?? L("Aç", "Open")} <ChevronRight size={14} />
          </span>
        </button>
      ))}
    </div>
  );
}

/** True on phone widths, where details open as a bottom sheet instead of a side panel. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

/**
 * The opened card's detail: a wide side panel on desktop, a bottom sheet on phones, so the
 * user never has to scroll to find what they clicked and the cards stay in place behind it.
 */
export function FocusSheet({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const narrow = useNarrow();
  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent side={narrow ? "bottom" : "right"} className={`qd qd-sheet qd-sheet--focus${narrow ? " qd-sheet--bottom" : ""}`}>
        <SheetHeader className="qd-sheet__head">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={subtitle ? undefined : "sr-only"}>{subtitle ?? title}</SheetDescription>
        </SheetHeader>
        <div className="qd-sheet__body">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/** Opens a card by key, logs it, and closes it when tapped again. */
export function useStoryFocus(initial: string | null, log: (key: string) => void) {
  const [open, setOpen] = useState<string | null>(initial);
  // The last opened card stays rendered while the sheet animates out.
  const [last, setLast] = useState<string | null>(initial);
  const toggle = (key: string) => {
    if (open === key) {
      setOpen(null);
      return;
    }
    log(key);
    setLast(key);
    setOpen(key);
  };
  return { open, last, toggle, close: () => setOpen(null) };
}
