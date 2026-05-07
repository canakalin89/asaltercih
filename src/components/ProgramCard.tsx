import type { Program } from "@/lib/types";
import { Building2, MapPin, BookOpen, Users, Award, TrendingDown, TrendingUp, Minus } from "lucide-react";

export type MatchType = "safe" | "normal" | "risk" | "unknown";

interface Props {
  program: Program;
  matchType: MatchType;
  userBS: number | null;
}

export default function ProgramCard({ program, matchType, userBS }: Props) {
  const s = program.current;
  const diff = userBS != null && s.basari_sirasi != null && s.basari_sirasi > 0
    ? userBS - s.basari_sirasi
    : null;

  const matchBadge = {
    safe: { text: "Güvenli", className: "bg-safe-100 text-safe-600 border-safe-200" },
    normal: { text: "Normal", className: "bg-normal-100 text-normal-600 border-normal-200" },
    risk: { text: "Riskli", className: "bg-risk-100 text-risk-600 border-risk-200" },
    unknown: { text: "Belirsiz", className: "bg-slate-100 text-slate-600 border-slate-200" },
  }[matchType];

  const historyTrend = program.history.length >= 2
    ? (program.history[0].basari_sirasi ?? 0) - (program.history[1].basari_sirasi ?? 0)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">{program.birim_adi}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {program.universite_adi}
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {program.il_adi ?? "-"}
            </span>
            {program.ogrenim_dili_adi && (
              <>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {program.ogrenim_dili_adi}
                </span>
              </>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${matchBadge.className}`}>
          {matchBadge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <StatBox icon={<Award className="w-4 h-4 text-primary-500" />} label="Taban Puan" value={s.min_puan?.toFixed(3) ?? "-"} />
        <StatBox icon={<Users className="w-4 h-4 text-primary-500" />} label="Başarı Sırası" value={s.basari_sirasi ? s.basari_sirasi.toLocaleString("tr-TR") : "-"} />
        <StatBox icon={<Users className="w-4 h-4 text-primary-500" />} label="Kontenjan" value={s.kontenjan?.toString() ?? "-"} />
        <StatBox icon={<Users className="w-4 h-4 text-primary-500" />} label="Yerleşen" value={s.yerlesen?.toString() ?? "-"} />
      </div>

      {diff != null && (
        <div className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${
          diff < 0 ? "text-safe-600" : diff <= s.basari_sirasi! * 0.2 ? "text-normal-600" : "text-risk-600"
        }`}>
          {diff < 0 ? <TrendingUp className="w-4 h-4" /> : diff > 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {diff < 0
            ? `${Math.abs(diff).toLocaleString("tr-TR")} sıra öndesin`
            : diff > 0
            ? `${diff.toLocaleString("tr-TR")} sıra geridesin`
            : "Aynı sıradasın"}
        </div>
      )}

      {historyTrend != null && (
        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          Geçen yıla göre başarı sırası: {" "}
          <span className={historyTrend < 0 ? "text-safe-600" : historyTrend > 0 ? "text-risk-600" : "text-slate-500"}>
            {historyTrend > 0 ? "↑" : historyTrend < 0 ? "↓" : "→"} {Math.abs(historyTrend).toLocaleString("tr-TR")}
          </span>
          {" "}(↑ daha zor, ↓ daha kolay)
        </div>
      )}

      <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>Kılavuz: {program.kilavuz_kodu}</span>
        <span>{program.birim_turu_adi}</span>
        <span>{program.universite_turu}</span>
        {program.ogrenim_turu_adi && <span>{program.ogrenim_turu_adi}</span>}
        {program.burs_orani_adi && <span>{program.burs_orani_adi}</span>}
        {program.ogrenim_suresi && <span>{program.ogrenim_suresi} Yıl</span>}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
