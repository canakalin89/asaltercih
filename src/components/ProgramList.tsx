import { useMemo, useState } from "react";
import type { Program } from "@/lib/types";
import ProgramCard, { type MatchType } from "./ProgramCard";
import { Shield, AlertCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  programs: Program[];
  userBS: number | null;
  sadeceKontenjan: boolean;
  minPuanFilter: number | null;
  maxPuanFilter: number | null;
}

export default function ProgramList({ programs, userBS, sadeceKontenjan, minPuanFilter, maxPuanFilter }: Props) {
  const [expanded, setExpanded] = useState<Record<MatchType, boolean>>({
    safe: true,
    normal: true,
    risk: true,
    unknown: true,
  });

  const grouped = useMemo(() => {
    const map: Record<MatchType, Program[]> = { safe: [], normal: [], risk: [], unknown: [] };

    for (const p of programs) {
      const s = p.current;
      if (sadeceKontenjan && (s.kontenjan == null || s.kontenjan <= 0)) continue;
      if (minPuanFilter != null && (s.min_puan == null || s.min_puan < minPuanFilter)) continue;
      if (maxPuanFilter != null && (s.min_puan == null || s.min_puan > maxPuanFilter)) continue;

      const mt = getMatchType(userBS, s.basari_sirasi);
      map[mt].push(p);
    }

    // Sırala: başarı sırasına göre (iyi → kötü, yani küçükten büyüğe)
    for (const k of Object.keys(map) as MatchType[]) {
      map[k].sort((a, b) => (a.current.basari_sirasi ?? Infinity) - (b.current.basari_sirasi ?? Infinity));
    }

    return map;
  }, [programs, userBS, sadeceKontenjan, minPuanFilter, maxPuanFilter]);

  const sections: { key: MatchType; title: string; icon: React.ReactNode; color: string }[] = [
    { key: "safe", title: `Güvenli (${grouped.safe.length})`, icon: <Shield className="w-4 h-4" />, color: "text-safe-600" },
    { key: "normal", title: `Normal (${grouped.normal.length})`, icon: <AlertCircle className="w-4 h-4" />, color: "text-normal-600" },
    { key: "risk", title: `Riskli (${grouped.risk.length})`, icon: <AlertTriangle className="w-4 h-4" />, color: "text-risk-600" },
    { key: "unknown", title: `Veri Eksik / Belirsiz (${grouped.unknown.length})`, icon: <HelpCircle className="w-4 h-4" />, color: "text-slate-500" },
  ];

  return (
    <div className="space-y-3">
      {sections.map((sec) => (
        <div key={sec.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [sec.key]: !prev[sec.key] }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
          >
            <span className={`flex items-center gap-2 text-sm font-bold ${sec.color}`}>
              {sec.icon}
              {sec.title}
            </span>
            {expanded[sec.key] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded[sec.key] && (
            <div className="p-3 space-y-2">
              {grouped[sec.key].length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Program bulunamadı</div>
              ) : (
                grouped[sec.key].map((p) => (
                  <ProgramCard key={p.kilavuz_kodu} program={p} matchType={sec.key} userBS={userBS} />
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getMatchType(userBS: number | null, programBS: number | null): MatchType {
  if (userBS == null || programBS == null || programBS <= 0) return "unknown";
  const oran = userBS / programBS;
  if (oran <= 0.8) return "safe";   // Öğrenci daha iyi sıralamada
  if (oran <= 1.2) return "normal"; // Yakın sıralama
  return "risk";                     // Öğrenci daha kötü sıralamada
}
