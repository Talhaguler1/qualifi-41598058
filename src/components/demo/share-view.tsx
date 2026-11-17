import { ShieldCheck, EyeOff } from "lucide-react";
import { formatDateTr, money, type BankShareSummary } from "@/lib/demo";

const GRADES = [
  ["A", "Dakik", "#2f7d4f"],
  ["B", "Hafif gecikmeli", "#8fbf4d"],
  ["C", "Gecikmeli", "#d9a14a"],
  ["D", "Riskli", "#b4442f"],
  ["-", "Geçmişi yok", "#c9d2c2"],
] as const;

const pct = (n: number) => `%${Math.round(n * 100)}`;

/** The scorecard as both sides see it: the business before sharing, the banker after. */
export function ShareSummaryView({ summary, audience }: { summary: BankShareSummary; audience: "business" | "bank" }) {
  const total = summary.openReceivables || 1;
  const trend = summary.medianDelayNow - summary.medianDelayBefore;
  const bounceRate = summary.instruments.dueLast12m ? summary.instruments.bouncedLast12m / summary.instruments.dueLast12m : 0;
  return (
    <div className="qd-share">
      <div>
        <span className="qd-eyebrow">Açık alacakların müşteri notuna göre dağılımı</span>
        <div className="qd-stack" role="img" aria-label="Müşteri notuna göre alacak dağılımı">
          {GRADES.map(([g, , color]) => (summary.byGrade[g] > 0 ? <i key={g} style={{ width: `${(summary.byGrade[g] / total) * 100}%`, background: color }} /> : null))}
        </div>
        <div className="qd-legend" style={{ marginTop: 6 }}>
          {GRADES.map(([g, label, color]) => (
            <span key={g}>
              <i style={{ background: color }} />
              {g} {label} {pct(summary.byGrade[g] / total)}
            </span>
          ))}
        </div>
      </div>
      <div className="qd-stat-row">
        <div className="qd-stat"><span>Açık alacak</span><b className="qd-num">{money(summary.openReceivables)}</b><span>{summary.customers} müşteri</span></div>
        <div className="qd-stat"><span>Tahsil süresi (son 3 ay)</span><b className="qd-num">{summary.medianDelayNow} gün</b><span>{trend > 0 ? `${trend} gün uzadı` : trend < 0 ? `${-trend} gün kısaldı` : "değişmedi"}</span></div>
        <div className="qd-stat"><span>Ödeme sözü tutma</span><b className="qd-num">{summary.promises.total ? pct(summary.promises.kept / summary.promises.total) : "—"}</b><span>{summary.promises.total} söz</span></div>
        <div className="qd-stat"><span>Çek/senet portföyü</span><b className="qd-num">{money(summary.instruments.openAmount)}</b><span>{summary.instruments.open} adet</span></div>
        <div className="qd-stat"><span>Karşılıksız (12 ay)</span><b className="qd-num">{pct(bounceRate)}</b><span>{summary.instruments.bouncedLast12m} / {summary.instruments.dueLast12m}</span></div>
        <div className="qd-stat"><span>En büyük müşteri payı</span><b className="qd-num">{pct(summary.topCustomerShare)}</b><span>açık alacak içinde</span></div>
      </div>
      <div className="qd-stat-row" style={{ marginTop: 0 }}>
        <div className="qd-stat"><span>Vadesi geçmemiş</span><b className="qd-num">{money(summary.aging.current)}</b></div>
        <div className="qd-stat"><span>1–30 gün gecikmiş</span><b className="qd-num">{money(summary.aging.d1_30)}</b></div>
        <div className="qd-stat"><span>30 günden fazla</span><b className="qd-num">{money(summary.aging.d31_60 + summary.aging.d60plus)}</b></div>
      </div>
      <p style={{ fontSize: 13 }}>
        <b>8 haftalık nakit görünümü:</b> en dar hafta {formatDateTr(summary.outlook.tightestWeek)} (kötü senaryoda {money(summary.outlook.tightestLow)}); 8. hafta sonunda {money(summary.outlook.endLow)} – {money(summary.outlook.endHigh)}.
      </p>
      <div className="qd-private">
        <span>
          {audience === "business" ? <EyeOff size={14} /> : <ShieldCheck size={14} />}
          {audience === "business" ? "Bankaya gitmeyenler:" : "İşletme bunları paylaşmadı:"}
        </span>
        <ul>
          {summary.notShared.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
