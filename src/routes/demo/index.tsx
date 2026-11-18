import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Landmark } from "lucide-react";
import { Brand, LangSwitch } from "@/components/demo/shared";
import { demoHead } from "@/components/demo/head";
import { DEFAULT_DEMO_DATE, generateBusiness, L, langOf, setDemoLang } from "@/lib/demo";

export const Route = createFileRoute("/demo/")({
  head: ({ match }) =>
    (match.search as { l?: string }).l === "en"
      ? demoHead("Live demo", "QualiFi demo: a finance agent that learns who pays when and follows up on payments.", "en")
      : demoHead("Canlı demo", "QualiFi demo: kimin ne zaman ödeyeceğini öğrenen ve ödemeleri takip eden finans ajanı."),
  validateSearch: (s: Record<string, unknown>): { l?: "en" } => (langOf(s["l"]) === "en" ? { l: "en" } : {}),
  component: DemoChooser,
});

/** The demo company's real customer count, so the start page and the panel always agree. */
const CUSTOMERS = generateBusiness("017").customers.length;

function DemoChooser() {
  const { l } = Route.useSearch();
  setDemoLang(langOf(l));
  const keep = l ? { l } : {};
  return (
    <div className="qd">
      <header className="qd-top">
        <Brand />
        <span className="qd-badge">{L("Demo verisi", "Demo data")}</span>
        <div className="qd-spacer" />
        <a className="qd-btn qd-btn--ghost qd-btn--sm" href="/isletmeler">{L("Ana sayfa", "Home")}</a>
        <a className="qd-btn qd-btn--ghost qd-btn--sm" href="/app/giris">{L("Giriş", "Sign in")}</a>
        <a className="qd-btn qd-btn--sm" href="/app/kayit">{L("Ücretsiz hesap aç", "Open a free account")}</a>
        <LangSwitch />
      </header>
      <section className="qd-hero">
        <span className="qd-eyebrow">{L("QualiFi canlı demo", "QualiFi live demo")}</span>
        <h1>{L("Faturayı kestiniz. Peki müşteriniz ne zaman ödeyecek?", "You've sent the invoice. So when will your customer pay?")}</h1>
        <p>
          {L(
            "ERP ve ön muhasebe ne kadar alacağınız olduğunu bilir. QualiFi her müşterinin ne zaman ödediğini öğrenir, ödemeleri bir ajanla takip eder ve önümüzdeki haftaların nakit tablosunu çıkarır. Bu demodaki şirketler, sohbetler ve kaynaklar (mockerp, mockonmuhasebe, mockbanka) gerçek değildir.",
            "Your ERP and bookkeeping know how much you are owed. QualiFi learns when each customer actually pays, follows up with an agent and maps your cash for the coming weeks. The companies, chats and sources in this demo (mockerp, mockonmuhasebe, mockbanka) are not real.",
          )}
        </p>
        <div className="qd-choices">
          <Link className="qd-card qd-choice qd-enter" to="/demo/isletme" search={{ t: "017", d: DEFAULT_DEMO_DATE, ...keep }}>
            <span className="qd-agent__avatar"><Building2 size={18} /></span>
            <h2>{L("İşletme paneli", "Business panel")}</h2>
            <p>{L(`${CUSTOMERS} müşteriye satış yapan bir yazılım şirketi.`, `A software company selling to ${CUSTOMERS} customers.`)}</p>
            <ul>
              <li>{L("Müşteri ödeme karnesi ve gecikme geçmişi", "Customer payer scorecard and delay history")}</li>
              <li>{L("8 haftalık nakit tahmini ve senaryo", "8-week cash forecast and scenarios")}</li>
              <li>{L("Takip ajanı ve WhatsApp mesaj taslakları", "Follow-up agent and WhatsApp message drafts")}</li>
            </ul>
            <span className="qd-btn qd-btn--primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>{L("Paneli aç", "Open panel")} <ArrowRight size={14} /></span>
          </Link>
          <Link className="qd-card qd-choice qd-enter" style={{ animationDelay: "80ms" }} to="/demo/banka" search={{ b: "01", d: DEFAULT_DEMO_DATE, ...keep }}>
            <span className="qd-agent__avatar"><Landmark size={18} /></span>
            <h2>{L("Bankacı paneli", "Banker panel")}</h2>
            <p>{L("Kredi risk biriminde 300 firmayı izleyen bir uzman.", "A credit-risk specialist monitoring 300 firms.")}</p>
            <ul>
              <li>{L("Firmanın kendi alacaklarından erken uyarı", "Early warning from each firm's own receivables")}</li>
              <li>{L("Sektör analizi ve WhatsApp içgörüleri", "Sector analysis and WhatsApp insights")}</li>
              <li>{L("Taahhüt takibi ve günlük arama listesi", "Commitment tracking and a daily call list")}</li>
            </ul>
            <span className="qd-btn qd-btn--primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>{L("Paneli aç", "Open panel")} <ArrowRight size={14} /></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
