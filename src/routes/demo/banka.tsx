import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BankPanel } from "@/components/demo/bank-panel";
import { demoHead } from "@/components/demo/head";
import { BANKERS_PER_REGION, DEFAULT_DEMO_DATE, isDemoDate, langOf, normaliseTenant, setDemoLang, type DemoDate } from "@/lib/demo";

function sharedOf(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  try {
    return normaliseTenant(String(value));
  } catch {
    return undefined;
  }
}

function bankerOf(value: unknown): string {
  if (value === "all") return "all";
  const n = Number(String(value ?? "1").replace(/\D/g, ""));
  return String(n >= 1 && n <= BANKERS_PER_REGION ? n : 1).padStart(2, "0");
}

export const Route = createFileRoute("/demo/banka")({
  validateSearch: (s: Record<string, unknown>): { b: string; d: DemoDate; s?: string; l?: "en" } => {
    const base: { b: string; d: DemoDate; s?: string; l?: "en" } = { b: bankerOf(s["b"]), d: isDemoDate(s["d"]) ? s["d"] : DEFAULT_DEMO_DATE };
    const shared = sharedOf(s["s"]);
    if (shared) base.s = shared;
    if (langOf(s["l"]) === "en") base.l = "en";
    return base;
  },
  head: ({ match }) =>
    (match.search as { l?: string }).l === "en"
      ? demoHead("Banker panel", "QualiFi demo credit-risk panel: portfolio, sector analysis, WhatsApp insights and commitment tracking. All data is for demo purposes.", "en")
      : demoHead("Bankacı paneli", "QualiFi demo kredi risk paneli: portföy, sektör analizi, WhatsApp içgörüleri ve taahhüt takibi. Tüm veriler demo amaçlıdır."),
  component: BankDemoPage,
});

function BankDemoPage() {
  const { b, d, s, l } = Route.useSearch();
  setDemoLang(langOf(l));
  const keep = { ...(s ? { s } : {}), ...(l ? { l } : {}) };
  const navigate = useNavigate({ from: "/demo/banka" });
  return (
    <BankPanel
      region="Marmara-1"
      sharedTenant={s}
      banker={b}
      date={d}
      onDate={(next) => void navigate({ search: { b, d: next, ...keep }, replace: true, resetScroll: false })}
      onBanker={(next) => void navigate({ search: { b: next, d, ...keep }, replace: true, resetScroll: false })}
    />
  );
}
