import { ShieldCheck, EyeOff } from "lucide-react";
import { days, formatDateTr, L, money, pct as pctOf, type BankShareSummary } from "@/lib/demo";

const GRADES = [
  ["A", ["Dakik", "Punctual"], "#2f7d4f"],
  ["B", ["Hafif gecikmeli", "Slightly late"], "#8fbf4d"],
  ["C", ["Gecikmeli", "Late"], "#d9a14a"],
  ["D", ["Riskli", "Risky"], "#c0503a"],
  ["-", ["Geçmişi yok", "No history"], "#c9d2c2"],
] as const;

const pct = (n: number) => pctOf(Math.round(n * 100));

/** The scorecard as both sides see it: the business before sharing, the banker after. */
export function ShareSummaryView({ summary, audience }: { summary: BankShareSummary; audience: "business" | "bank" }) {
  const total = summary.openReceivables || 1;
  const trend = summary.medianDelayNow - summary.medianDelayBefore;
  const bounceRate = summary.instruments.dueLast12m ? summary.instruments.bouncedLast12m / summary.instruments.dueLast12m : 0;
  return (
    <div className="qd-share">
      <div>
        <span className="qd-eyebrow">{L("Açık alacakların müşteri notuna göre dağılımı", "Open receivables by customer grade")}</span>
        <div className="qd-stack" role="img" aria-label={L("Müşteri notuna göre alacak dağılımı", "Receivables by customer grade")}>
          {GRADES.map(([g, , color]) => (summary.byGrade[g] > 0 ? <i key={g} style={{ width: `${(summary.byGrade[g] / total) * 100}%`, background: color }} /> : null))}
        </div>
        <div className="qd-legend" style={{ marginTop: 6 }}>
          {GRADES.map(([g, label, color]) => (
            <span key={g}>
              <i style={{ background: color }} />
              {g} {L(label[0], label[1])} {pct(summary.byGrade[g] / total)}
            </span>
          ))}
        </div>
      </div>
      <div className="qd-stat-row">
        <div className="qd-stat"><span>{L("Açık alacak", "Open receivables")}</span><b className="qd-num">{money(summary.openReceivables)}</b><span>{summary.customers} {L("müşteri", "customers")}</span></div>
        <div className="qd-stat"><span>{L("Tahsil süresi (son 3 ay)", "Collection time (last 3 months)")}</span><b className="qd-num">{days(summary.medianDelayNow)}</b><span>{trend > 0 ? L(`${trend} gün uzadı`, `${trend} days longer`) : trend < 0 ? L(`${-trend} gün kısaldı`, `${-trend} days shorter`) : L("değişmedi", "unchanged")}</span></div>
        <div className="qd-stat"><span>{L("Ödeme sözü tutma", "Promises kept")}</span><b className="qd-num">{summary.promises.total ? pct(summary.promises.kept / summary.promises.total) : "—"}</b><span>{summary.promises.total} {L("söz", "promises")}</span></div>
        <div className="qd-stat"><span>{L("Çek/senet portföyü", "Cheque/note portfolio")}</span><b className="qd-num">{money(summary.instruments.openAmount)}</b><span>{summary.instruments.open} {L("adet", "items")}</span></div>
        <div className="qd-stat"><span>{L("Karşılıksız (12 ay)", "Bounced (12 months)")}</span><b className="qd-num">{pct(bounceRate)}</b><span>{summary.instruments.bouncedLast12m} / {summary.instruments.dueLast12m}</span></div>
        <div className="qd-stat"><span>{L("En büyük müşteri payı", "Largest customer share")}</span><b className="qd-num">{pct(summary.topCustomerShare)}</b><span>{L("açık alacak içinde", "of open receivables")}</span></div>
      </div>
      <div className="qd-stat-row" style={{ marginTop: 0 }}>
        <div className="qd-stat"><span>{L("Vadesi geçmemiş", "Not yet due")}</span><b className="qd-num">{money(summary.aging.current)}</b></div>
        <div className="qd-stat"><span>{L("1–30 gün gecikmiş", "1–30 days overdue")}</span><b className="qd-num">{money(summary.aging.d1_30)}</b></div>
        <div className="qd-stat"><span>{L("30 günden fazla", "Over 30 days")}</span><b className="qd-num">{money(summary.aging.d31_60 + summary.aging.d60plus)}</b></div>
      </div>
      <p style={{ fontSize: 13 }}>
        <b>{L("8 haftalık nakit görünümü:", "8-week cash outlook:")}</b>{" "}
        {L(
          `en dar hafta ${formatDateTr(summary.outlook.tightestWeek)} (kötü senaryoda ${money(summary.outlook.tightestLow)}); 8. hafta sonunda ${money(summary.outlook.endLow)} – ${money(summary.outlook.endHigh)}.`,
          `tightest week ${formatDateTr(summary.outlook.tightestWeek)} (${money(summary.outlook.tightestLow)} in the downside case); ${money(summary.outlook.endLow)} – ${money(summary.outlook.endHigh)} at the end of week 8.`,
        )}
      </p>
      <div className="qd-private">
        <span>
          {audience === "business" ? <EyeOff size={14} /> : <ShieldCheck size={14} />}
          {audience === "business" ? L("Bankaya gitmeyenler:", "Not sent to the bank:") : L("İşletme bunları paylaşmadı:", "The business did not share:")}
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
