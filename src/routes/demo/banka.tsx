import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BankPanel } from "@/components/demo/bank-panel";
import { demoHead } from "@/components/demo/head";
import { BANKERS_PER_REGION, DEFAULT_DEMO_DATE, isDemoDate, type DemoDate } from "@/lib/demo";

function bankerOf(value: unknown): string {
  if (value === "all") return "all";
  const n = Number(String(value ?? "1").replace(/\D/g, ""));
  return String(n >= 1 && n <= BANKERS_PER_REGION ? n : 1).padStart(2, "0");
}

export const Route = createFileRoute("/demo/banka")({
  validateSearch: (s: Record<string, unknown>): { b: string; d: DemoDate } => ({ b: bankerOf(s["b"]), d: isDemoDate(s["d"]) ? s["d"] : DEFAULT_DEMO_DATE }),
  head: () => demoHead("Bankacı paneli", "QualiFi demo kredi risk paneli: portföy, sektör analizi, WhatsApp içgörüleri ve taahhüt takibi. Tüm veriler demo amaçlıdır."),
  component: BankDemoPage,
});

function BankDemoPage() {
  const { b, d } = Route.useSearch();
  const navigate = useNavigate({ from: "/demo/banka" });
  return (
    <BankPanel
      region="Marmara-1"
      banker={b}
      date={d}
      onDate={(next) => void navigate({ search: { b, d: next }, replace: true, resetScroll: false })}
      onBanker={(next) => void navigate({ search: { b: next, d }, replace: true, resetScroll: false })}
    />
  );
}
