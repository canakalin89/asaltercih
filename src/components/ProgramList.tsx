import { useMemo, useState } from "react";
import type { Program } from "@/lib/types";
import ProgramCard, { type MatchType } from "./ProgramCard";
import { Shield, AlertCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
const SCORE_RATIO_SAFE_THRESHOLD = 1.05;
const SCORE_RATIO_NORMAL_THRESHOLD = 0.95;
const MIN_VALID_PROGRAM_SCORE = 0.01;

interface Props {
  programs: Program[];
  userBS: number | null;
  userYP: number | null;
  sadeceYerlesenVerisi: boolean;
  minBSFilter: number | null;
  maxBSFilter: number | null;
}

export default function ProgramList({ programs, userBS, userYP, sadeceYerlesenVerisi, minBSFilter, maxBSFilter }: Props) {
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
      if (sadeceYerlesenVerisi && (s.basari_sirasi == null || s.basari_sirasi <= 0)) continue;
      if (minBSFilter != null && (s.basari_sirasi == null || s.basari_sirasi < minBSFilter)) continue;
      if (maxBSFilter != null && (s.basari_sirasi == null || s.basari_sirasi > maxBSFilter)) continue;

      const mt = getMatchType(userYP, s.min_puan, userBS, s.basari_sirasi);
      map[mt].push(p);
    }

    // Puan varsa taban puana yakınlığa göre, yoksa başarı sırasına göre sırala
    for (const k of Object.keys(map) as MatchType[]) {
      if (userYP != null) {
        map[k].sort((a, b) => Math.abs((a.current.min_puan ?? Infinity) - userYP) - Math.abs((b.current.min_puan ?? Infinity) - userYP));
      } else {
        map[k].sort((a, b) => (a.current.basari_sirasi ?? Infinity) - (b.current.basari_sirasi ?? Infinity));
      }
    }

    return map;
  }, [programs, userBS, userYP, sadeceYerlesenVerisi, minBSFilter, maxBSFilter]);

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
                    <ProgramCard key={p.kilavuz_kodu} program={p} matchType={sec.key} userBS={userBS} userYP={userYP} />
                  ))
                )}
              </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getMatchType(userYP: number | null, programPuan: number | null, userBS: number | null, programBS: number | null): MatchType {
  if (userYP != null && programPuan != null && programPuan > MIN_VALID_PROGRAM_SCORE) {
    const oran = userYP / programPuan;
    if (oran >= SCORE_RATIO_SAFE_THRESHOLD) return "safe";
    if (oran >= SCORE_RATIO_NORMAL_THRESHOLD) return "normal";
    return "risk";
  }

  if (userBS == null || programBS == null || programBS <= 0) return "unknown";
  const oran = userBS / programBS;
  if (oran <= 0.8) return "safe";
  if (oran <= 1.2) return "normal";
  return "risk";
}
