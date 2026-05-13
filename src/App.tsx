import { useState } from "react";
import { Search, SlidersHorizontal, GraduationCap, Crosshair, BarChart3 } from "lucide-react";
import BasariSirasiInput from "@/components/BasariSirasiInput";
import NetHedefleyici from "@/components/NetHedefleyici";
import ScoreCalculator from "@/components/ScoreCalculator";
import FilterPanel, { defaultFilters, type Filters } from "@/components/FilterPanel";
import ProgramList from "@/components/ProgramList";
import { searchPrograms } from "@/lib/yokatlas";
import type { Program, PuanTuru } from "@/lib/types";

type Tab = "net" | "hedef" | "filters" | "results";

export default function App() {
  const [tab, setTab] = useState<Tab>("net");
  const [puanTuru, setPuanTuru] = useState<PuanTuru>("SAY");
  const [userBS, setUserBS] = useState<number | null>(null);
  const [userYP, setUserYP] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleBSApply = (bs: number) => {
    setUserBS(bs);
    setUserYP(null);
    void handleSearch();
  };

  const handleNetApply = (_tytHam: number, _aytHam: number, _obp: number, yp: number) => {
    setUserYP(yp);
    setUserBS(null);
    void handleSearch();
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const all: Program[] = [];
      let page = 0;
      const size = 500;
      while (true) {
        const res = await searchPrograms({
          puan_turu: filters.puan_turu,
          universite_turu: filters.universite_turu,
          birim_turu_id: filters.birim_turu_id,
          universite_id: filters.universite_id.length ? filters.universite_id : undefined,
          il_kodu: filters.il_kodu.length ? filters.il_kodu : undefined,
          birim_grup_id: filters.birim_grup_id.length ? filters.birim_grup_id : undefined,
          ogrenim_turu_id: filters.ogrenim_turu_id,
          min_basari_sirasi: filters.min_basari_sirasi,
          max_basari_sirasi: filters.max_basari_sirasi,
          page,
          size,
        });
        all.push(...res.content);
        if (res.last || res.content.length === 0 || all.length >= 3000) break;
        page++;
      }
      setPrograms(all);
      setTab("results");
    } catch (e) {
      alert("Programlar alınırken hata oluştu: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tercih Robotu</h1>
              <p className="text-xs text-slate-500">YÖK Atlas başarı sırasına göre tercih önerisi</p>
            </div>
          </div>
          {(userBS != null || userYP != null) && (
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-primary-50 border border-primary-200 px-3 py-1.5">
              {userYP != null ? (
                <>
                  <span className="text-xs font-medium text-slate-600">Tahmini YP:</span>
                  <span className="text-sm font-bold text-primary-700">{userYP.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-slate-600">Başarı Sıran:</span>
                  <span className="text-sm font-bold text-primary-700">{userBS!.toLocaleString("tr-TR")}</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-1 rounded-lg bg-white border border-slate-200 p-1 mb-6 overflow-x-auto">
          <TabButton active={tab === "net"} onClick={() => setTab("net")} icon={<BarChart3 className="w-4 h-4" />} label="Net Girişi" />
          <TabButton active={tab === "hedef"} onClick={() => setTab("hedef")} icon={<Crosshair className="w-4 h-4" />} label="Net Hedefleyici" />
          <TabButton active={tab === "filters"} onClick={() => setTab("filters")} icon={<SlidersHorizontal className="w-4 h-4" />} label="Filtrele" />
          <TabButton active={tab === "results"} onClick={() => setTab("results")} icon={<Search className="w-4 h-4" />} label="Sonuçlar" badge={searched ? programs.length : undefined} />
        </div>

        {tab === "net" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Puan Türü Seç</h2>
              <div className="flex flex-wrap gap-2">
                {(["SAY", "SÖZ", "EA", "DİL", "TYT"] as PuanTuru[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => {
                      setPuanTuru(pt);
                      setFilters((f) => ({ ...f, puan_turu: pt }));
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                      puanTuru === pt
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Tahmini Net Girişi</h2>
              <p className="text-sm text-slate-600 mb-3">
                TYT/AYT/YDT netlerini girerek tahmini puanını hesapla ve buna uygun bölümleri listele.
              </p>
              <ScoreCalculator puanTuru={puanTuru} onChange={handleNetApply} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Alternatif: Başarı Sırası Girişi</h2>
              <BasariSirasiInput onApply={handleBSApply} />
            </div>
          </div>
        )}

        {tab === "hedef" && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Net Hedefleyici — Bölüm için Gereken Netler</h2>
            <NetHedefleyici />
          </div>
        )}

        {tab === "filters" && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <FilterPanel filters={filters} onChange={setFilters} onSearch={handleSearch} loading={loading} />
          </div>
        )}

        {tab === "results" && (
          <div className="space-y-4">
            {!searched ? (
              <div className="text-center py-12 text-slate-400 text-sm">Önce filtreleme yaparak programları çekin.</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{programs.length}</span> program bulundu
                  </div>
                  {(userBS != null || userYP != null) && (
                    <div className="text-sm font-medium text-primary-700">
                      {userYP != null ? `YP: ${userYP.toFixed(2)}` : `BS: ${userBS!.toLocaleString("tr-TR")}`}
                    </div>
                  )}
                </div>
                <ProgramList
                  programs={programs}
                  userBS={userBS}
                  userYP={userYP}
                  sadeceYerlesenVerisi={filters.sadece_yerlesen_verisi}
                  minBSFilter={filters.min_basari_sirasi}
                  maxBSFilter={filters.max_basari_sirasi}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
      {badge != null && (
        <span className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
