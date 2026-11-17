import { useEffect, useRef, useState, type ReactNode } from "react";
import { Building2, Calculator, FileText, Landmark, MessageCircle, Sparkles, TrendingUp, UserCheck, BellRing } from "lucide-react";
import { DEMO_DATES, DEMO_DATE_LABELS, formatDateTr, type AgentTool, type DemoDate } from "@/lib/demo";

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts from the previous value to the new one, so numbers visibly move when time moves. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      const eased = 1 - (1 - t) ** 3;
      setShown(a + (value - a) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="qd-num">{format(shown)}</span>;
}

export function Brand() {
  return (
    <a className="qd-brand" href="/" aria-label="QualiFi ana sayfa">
      <img src="/favicon.svg" alt="" />
      QualiFi<span>.</span>
    </a>
  );
}

export function DateSwitcher({ value, onChange }: { value: DemoDate; onChange: (d: DemoDate) => void }) {
  const index = DEMO_DATES.indexOf(value);
  return (
    <div className="qd-dates" role="group" aria-label="Demo tarihi">
      <span className="qd-dates__thumb" style={{ width: `calc((100% - 8px) / ${DEMO_DATES.length})`, transform: `translateX(${index * 100}%)` }} />
      {DEMO_DATES.map((d) => (
        <button key={d} type="button" aria-pressed={d === value} onClick={() => onChange(d)}>
          <b>{formatDateTr(d)}</b>
          <small>{DEMO_DATE_LABELS[d]}</small>
        </button>
      ))}
    </div>
  );
}

export function TopBar({ title, subtitle, date, onDate, children }: { title: string; subtitle: string; date: DemoDate; onDate: (d: DemoDate) => void; children?: ReactNode }) {
  return (
    <header className="qd-top">
      <Brand />
      <div className="qd-company">
        <h1>{title}</h1>
        <small>{subtitle}</small>
      </div>
      <span className="qd-badge" title="Bu hesaptaki tüm kaynaklar ve kayıtlar demo amaçlı üretilmiştir.">
        <Sparkles size={12} /> Demo verisi
      </span>
      <div className="qd-spacer" />
      {children}
      <DateSwitcher value={date} onChange={onDate} />
    </header>
  );
}

export const TOOL_ICONS: Record<AgentTool, ReactNode> = {
  erp: <Building2 size={14} />,
  muhasebe: <Calculator size={14} />,
  banka: <Landmark size={14} />,
  whatsapp: <MessageCircle size={14} />,
  karne: <UserCheck size={14} />,
  tahmin: <TrendingUp size={14} />,
  takip: <BellRing size={14} />,
};

export function Grade({ grade }: { grade: string }) {
  return <span className={`qd-grade qd-grade--${grade}`}>{grade}</span>;
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "alert" | "accent" }) {
  return (
    <div className={`qd-card qd-kpi${tone ? ` qd-kpi--${tone}` : ""}`}>
      <div className="qd-kpi__label">{label}</div>
      <div className="qd-kpi__value">{value}</div>
      {sub ? <div className="qd-kpi__sub">{sub}</div> : null}
    </div>
  );
}

export function SourceChip({ icon, name }: { icon: ReactNode; name: string }) {
  return (
    <span className="qd-source">
      <i>{icon}</i>
      {name}
      <em>demo bağlantı</em>
    </span>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: ReadonlyArray<readonly [T, string]> }) {
  return (
    <div className="qd-tabs" role="tablist">
      {items.map(([key, label]) => (
        <button key={key} role="tab" type="button" aria-selected={key === value} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return (
    <div className="qd-toast" role="status">
      {text}
    </div>
  );
}

export function FileIcon() {
  return <FileText size={14} />;
}

/** Per-viewer memory for demo clicks (approved messages etc.). Safe when storage is blocked. */
export function useLocalState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : initial);
    } catch {
      setValue(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* storage blocked: keep in memory */
    }
  };
  return [value, set];
}
