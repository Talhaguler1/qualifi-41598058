import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BusinessPanel } from "@/components/demo/business-panel";
import { demoHead } from "@/components/demo/head";
import { DemoLinks } from "@/components/demo/demo-links";
import { DEFAULT_DEMO_DATE, isDemoDate, langOf, normaliseTenant, setDemoLang, type DemoDate } from "@/lib/demo";

function tenantOf(value: unknown): string {
  try {
    return normaliseTenant(String(value ?? "017"));
  } catch {
    return "017";
  }
}

export const Route = createFileRoute("/demo/isletme")({
  validateSearch: (s: Record<string, unknown>): { t: string; d: DemoDate; l?: "en" } => {
    const base = { t: tenantOf(s["t"]), d: isDemoDate(s["d"]) ? s["d"] : DEFAULT_DEMO_DATE };
    return langOf(s["l"]) === "en" ? { ...base, l: "en" } : base;
  },
  head: ({ match }) =>
    (match.search as { l?: string }).l === "en"
      ? demoHead("Business panel", "QualiFi demo business panel: payer scorecard, cash forecast and follow-up agent. All data is for demo purposes.", "en")
      : demoHead("İşletme paneli", "QualiFi demo işletme paneli: ödeme karnesi, nakit tahmini ve takip ajanı. Tüm veriler demo amaçlıdır."),
  component: BusinessDemoPage,
});

function BusinessDemoPage() {
  const { t, d, l } = Route.useSearch();
  setDemoLang(langOf(l));
  const keep = l ? { l } : {};
  const navigate = useNavigate({ from: "/demo/isletme" });
  return (
    <BusinessPanel
      tenant={t}
      date={d}
      onDate={(next) => void navigate({ search: { t, d: next, ...keep }, replace: true, resetScroll: false })}
      accountSlot={<DemoLinks />}
    />
  );
}
