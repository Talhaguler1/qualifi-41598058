import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Landmark } from "lucide-react";
import { Brand } from "@/components/demo/shared";
import { demoHead } from "@/components/demo/head";
import { DEFAULT_DEMO_DATE } from "@/lib/demo";

export const Route = createFileRoute("/demo/")({
  head: () => demoHead("Canlı demo", "QualiFi demo: kimin ne zaman ödeyeceğini öğrenen ve ödemeleri takip eden finans ajanı."),
  component: DemoChooser,
});

function DemoChooser() {
  return (
    <div className="qd">
      <header className="qd-top">
        <Brand />
        <span className="qd-badge">Demo verisi</span>
      </header>
      <section className="qd-hero">
        <span className="qd-eyebrow">QualiFi canlı demo</span>
        <h1>Faturayı kestiniz. Peki müşteriniz ne zaman ödeyecek?</h1>
        <p>
          ERP ve ön muhasebe ne kadar alacağınız olduğunu bilir. QualiFi her müşterinin ne zaman ödediğini öğrenir, ödemeleri bir ajanla takip eder ve
          önümüzdeki haftaların nakit tablosunu çıkarır. Bu demodaki şirketler, sohbetler ve kaynaklar (mockerp, mockonmuhasebe, mockbanka) gerçek değildir.
        </p>
        <div className="qd-choices">
          <Link className="qd-card qd-choice qd-enter" to="/demo/isletme" search={{ t: "017", d: DEFAULT_DEMO_DATE }}>
            <span className="qd-agent__avatar"><Building2 size={18} /></span>
            <h2>İşletme paneli</h2>
            <p>150 müşteriye satış yapan bir yazılım şirketi.</p>
            <ul>
              <li>Müşteri ödeme karnesi ve gecikme geçmişi</li>
              <li>8 haftalık nakit tahmini ve senaryo</li>
              <li>Takip ajanı ve WhatsApp mesaj taslakları</li>
            </ul>
            <span className="qd-btn qd-btn--primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>Paneli aç <ArrowRight size={14} /></span>
          </Link>
          <Link className="qd-card qd-choice qd-enter" style={{ animationDelay: "80ms" }} to="/demo/banka" search={{ b: "01", d: DEFAULT_DEMO_DATE }}>
            <span className="qd-agent__avatar"><Landmark size={18} /></span>
            <h2>Bankacı paneli</h2>
            <p>Kredi risk biriminde 300 firmayı izleyen bir uzman.</p>
            <ul>
              <li>Firmanın kendi alacaklarından erken uyarı</li>
              <li>Sektör analizi ve WhatsApp içgörüleri</li>
              <li>Taahhüt takibi ve günlük arama listesi</li>
            </ul>
            <span className="qd-btn qd-btn--primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>Paneli aç <ArrowRight size={14} /></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
