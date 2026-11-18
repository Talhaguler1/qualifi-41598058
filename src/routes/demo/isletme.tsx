import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BusinessPanel } from "@/components/demo/business-panel";
import { demoHead } from "@/components/demo/head";
import { DemoLinks } from "@/components/demo/demo-links";
import { DEFAULT_DEMO_DATE, isDemoDate, normaliseTenant, type DemoDate } from "@/lib/demo";

function tenantOf(value: unknown): string {
  try {
    return normaliseTenant(String(value ?? "017"));
  } catch {
    return "017";
  }
}

export const Route = createFileRoute("/demo/isletme")({
  validateSearch: (s: Record<string, unknown>): { t: string; d: DemoDate } => ({ t: tenantOf(s["t"]), d: isDemoDate(s["d"]) ? s["d"] : DEFAULT_DEMO_DATE }),
  head: () => demoHead("İşletme paneli", "QualiFi demo işletme paneli: ödeme karnesi, nakit tahmini ve takip ajanı. Tüm veriler demo amaçlıdır."),
  component: BusinessDemoPage,
});

function BusinessDemoPage() {
  const { t, d } = Route.useSearch();
  const navigate = useNavigate({ from: "/demo/isletme" });
  return (
    <BusinessPanel
      tenant={t}
      date={d}
      onDate={(next) => void navigate({ search: { t, d: next }, replace: true, resetScroll: false })}
      accountSlot={<DemoLinks />}
    />
  );
}
