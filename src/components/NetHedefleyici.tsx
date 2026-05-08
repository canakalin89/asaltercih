import { useEffect, useMemo, useState } from "react";
import { listProgramGroups, listUniversities, searchPrograms } from "@/lib/yokatlas";
import { hesaplaGerekenNetler } from "@/lib/score";
import type { Program, PuanTuru } from "@/lib/types";
import { Calculator, Loader2, Target, TrendingUp, BarChart3 } from "lucide-react";

export default function NetHedefleyici() {
  const [puanTuru, setPuanTuru] = useState<PuanTuru>("SAY");
  const [universiteler, setUniversiteler] = useState<{ universite_id: number; universite_adi: string }[]>([]);
  const [gruplar, setGruplar] = useState<{ birim_grup_id: number; birim_grup_adi: string; puan_turu: string }[]>([]);
  const [programlar, setProgramlar] = useState<Program[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [uniId, setUniId] = useState<number | "">("");
  const [grupId, setGrupId] = useState<number | "">("");
  const [programId, setProgramId] = useState<number | "">("");

  const [obp, setObp] = useState(80);
  const [tytNet, setTytNet] = useState(80);
  const [marj, setMarj] = useState(5);

  useEffect(() => {
    Promise.all([listUniversities(), listProgramGroups()]).then(
      ([u, g]) => {
        setUniversiteler(u.sort((a, b) => a.universite_adi.localeCompare(b.universite_adi, "tr")));
        setGruplar(g.sort((a, b) => a.birim_grup_adi.localeCompare(b.birim_grup_adi, "tr")));
      }
    );
  }, []);

  const filtreliGruplar = useMemo(() => {
    return gruplar.filter((g) => g.puan_turu === puanTuru);
  }, [gruplar, puanTuru]);

  const hedefProgram = useMemo(() => {
    if (!programId) return null;
    return programlar.find((p) => p.kilavuz_kodu === programId) || null;
  }, [programlar, programId]);

  const hedefPuan = useMemo(() => {
    if (!hedefProgram) return null;
    return (hedefProgram.current.min_puan ?? 0) + marj;
  }, [hedefProgram, marj]);

  const sonuc = useMemo(() => {
    if (!hedefPuan) return null;
    return hesaplaGerekenNetler(hedefPuan, obp, tytNet, puanTuru);
  }, [hedefPuan, obp, tytNet, puanTuru]);

  const programlariCek = async () => {
    setYukleniyor(true);
    try {
      const all: Program[] = [];
      let page = 0;
      while (true) {
        const res = await searchPrograms({
          puan_turu: puanTuru,
          universite_id: uniId ? [Number(uniId)] : undefined,
          birim_grup_id: grupId ? [Number(grupId)] : undefined,
          page,
          size: 500,
        });
        all.push(...res.content);
        if (res.last || res.content.length === 0 || all.length >= 2000) break;
        page++;
      }
      setProgramlar(all);
    } catch (e) {
      alert("Programlar alınamadı: " + (e as Error).message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
        <p className="text-sm text-primary-800">
          Bir üniversite ve bölüm seçin. Sistem, o programa girebilmek için yaklaşık kaç net yapmanız gerektiğini hesaplar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Puan Türü</label>
          <select
            value={puanTuru}
            onChange={(e) => {
              setPuanTuru(e.target.value as PuanTuru);
              setProgramId("");
              setProgramlar([]);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="SAY">Sayısal (SAY)</option>
            <option value="SÖZ">Sözel (SÖZ)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="DİL">Dil (DİL)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Üniversite</label>
          <select
            value={uniId}
            onChange={(e) => { setUniId(Number(e.target.value) || ""); setProgramId(""); setProgramlar([]); }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tümü</option>
            {universiteler.map((u) => (
              <option key={u.universite_id} value={u.universite_id}>{u.universite_adi}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Program Grubu</label>
          <select
            value={grupId}
            onChange={(e) => { setGrupId(Number(e.target.value) || ""); setProgramId(""); setProgramlar([]); }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tümü</option>
            {filtreliGruplar.map((g) => (
              <option key={g.birim_grup_id} value={g.birim_grup_id}>{g.birim_grup_adi}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={programlariCek}
        disabled={yukleniyor}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition"
      >
        {yukleniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
        Programları Çek
      </button>

      {programlar.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Hedef Program</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(Number(e.target.value) || "")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Program seçin...</option>
            {programlar.map((p) => (
              <option key={p.kilavuz_kodu} value={p.kilavuz_kodu}>
                {p.universite_adi} — {p.birim_adi} ({p.current.min_puan?.toFixed(2) ?? "?"} puan)
              </option>
            ))}
          </select>
        </div>
      )}

      {hedefProgram && (
        <div className="space-y-3 border-t pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Diploma Notu (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={obp}
                onChange={(e) => setObp(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">TYT Net (tahmini)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={tytNet}
                onChange={(e) => setTytNet(Math.min(120, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Güvenli Marj (puan)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={marj}
                onChange={(e) => setMarj(Math.min(50, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {sonuc && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary-800 font-bold">
                <Calculator className="w-5 h-5" />
                Hedef: {hedefProgram.universite_adi} — {hedefProgram.birim_adi}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-white rounded-lg border border-primary-100 p-2 text-center">
                  <div className="text-xs text-slate-500">Program Taban</div>
                  <div className="font-bold text-slate-800">{hedefProgram.current.min_puan?.toFixed(3) ?? "-"}</div>
                </div>
                <div className="bg-white rounded-lg border border-primary-100 p-2 text-center">
                  <div className="text-xs text-slate-500">Hedef Puan</div>
                  <div className="font-bold text-primary-700">{sonuc.hedefYP.toFixed(3)}</div>
                </div>
                <div className="bg-white rounded-lg border border-primary-100 p-2 text-center">
                  <div className="text-xs text-slate-500">TYT Net</div>
                  <div className="font-bold text-slate-800">{sonuc.tytNet.toFixed(1)}</div>
                </div>
                <div className="bg-white rounded-lg border border-primary-100 p-2 text-center">
                  <div className="text-xs text-slate-500">AYT Toplam Net</div>
                  <div className="font-bold text-slate-800">{sonuc.aytToplamNet.toFixed(1)}</div>
                </div>
              </div>

              {/* Program İstatistikleri */}
              <div className="bg-white rounded-lg border border-primary-100 p-3">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Program Geçmiş Yıllar İstatistiği
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[hedefProgram.current, ...hedefProgram.history].map((y) => (
                    <div key={y.year} className="bg-slate-50 rounded border border-slate-100 p-1.5 text-center">
                      <div className="text-slate-500">{y.year}</div>
                      <div className="font-bold text-slate-800">{y.min_puan?.toFixed(2) ?? "-"}</div>
                      <div className="text-[10px] text-slate-400">{y.basari_sirasi ? y.basari_sirasi.toLocaleString("tr-TR") : "-"} BS</div>
                    </div>
                  ))}
                </div>
              </div>

              {sonuc.mesaj ? (
                <div className="text-sm text-primary-800 bg-white rounded-lg p-3 border border-primary-100">
                  {sonuc.mesaj}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">TYT Ders Dağılımı (yaklaşık)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sonuc.tytDersler.map((d) => (
                      <div key={d.ad} className="bg-white rounded-lg border border-slate-200 p-2">
                        <div className="text-[10px] text-slate-500">{d.ad}</div>
                        <div className="text-sm font-bold text-slate-800">{d.net.toFixed(1)} net</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AYT Ders Dağılımı (yaklaşık)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sonuc.aytDersler.map((d) => (
                      <div key={d.ad} className="bg-white rounded-lg border border-slate-200 p-2">
                        <div className="text-[10px] text-slate-500">{d.ad}</div>
                        <div className="text-sm font-bold text-slate-800">{d.net.toFixed(1)} net</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Bu hesaplama yaklaşıktır. OBP ve TYT performansınıza göre değişir.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
