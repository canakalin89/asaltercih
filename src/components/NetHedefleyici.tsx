import { useEffect, useMemo, useState } from "react";
import { listProgramGroups, listUniversities, searchPrograms, fetchProgramNets, type ProgramNets } from "@/lib/yokatlas";
import { hesaplaGerekenNetler } from "@/lib/score";
import type { Program, PuanTuru } from "@/lib/types";
import { Calculator, Loader2, Target, TrendingUp, BarChart3, Crosshair, BookOpen, Atom, Brain } from "lucide-react";

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
  const [marj, setMarj] = useState(5);
  const [tytNet, setTytNet] = useState(60);

  const [sonGirenNets, setSonGirenNets] = useState<ProgramNets | null>(null);
  const [netsYukleniyor, setNetsYukleniyor] = useState(false);

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

  // Seçili program değişince son giren netleri çek
  useEffect(() => {
    if (!hedefProgram) {
      setSonGirenNets(null);
      return;
    }
    setSonGirenNets(null);
    setNetsYukleniyor(true);
    fetchProgramNets(hedefProgram.kilavuz_kodu, hedefProgram.current.year ?? 2024)
      .then((n) => setSonGirenNets(n))
      .finally(() => setNetsYukleniyor(false));
  }, [hedefProgram]);

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

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
        <p className="text-sm text-primary-800">
          <strong>Bölüm için gereken net sayıları:</strong> Bir üniversite ve bölüm seçin. Sistem, o programa girebilmek için TYT ve AYT'de kaç net yapmanız gerektiğini hesaplar.
        </p>
      </div>

      {/* Program seçimi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Puan Türü</label>
          <select
            value={puanTuru}
            onChange={(e) => {
              setPuanTuru(e.target.value as PuanTuru);
              setProgramId("");
              setProgramlar([]);
            }}
            className={inputCls}
          >
            <option value="SAY">Sayısal (SAY)</option>
            <option value="SÖZ">Sözel (SÖZ)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="DİL">Dil (DİL)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Üniversite</label>
          <select
            value={uniId}
            onChange={(e) => { setUniId(Number(e.target.value) || ""); setProgramId(""); setProgramlar([]); }}
            className={inputCls}
          >
            <option value="">Tümü</option>
            {universiteler.map((u) => (
              <option key={u.universite_id} value={u.universite_id}>{u.universite_adi}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Program Grubu</label>
          <select
            value={grupId}
            onChange={(e) => { setGrupId(Number(e.target.value) || ""); setProgramId(""); setProgramlar([]); }}
            className={inputCls}
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
          <label className={labelCls}>Hedef Program</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(Number(e.target.value) || "")}
            className={inputCls}
          >
            <option value="">Program seçin...</option>
            {programlar.map((p) => (
              <option key={p.kilavuz_kodu} value={p.kilavuz_kodu}>
                {p.universite_adi} — {p.birim_adi} ({p.current.basari_sirasi ? p.current.basari_sirasi.toLocaleString("tr-TR") + " BS" : "? BS"})
              </option>
            ))}
          </select>
        </div>
      )}

      {hedefProgram && (
        <div className="space-y-4 border-t pt-4">
          {/* Girişler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Diploma Notu (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={obp}
                onChange={(e) => setObp(Math.min(100, Math.max(0, Number(e.target.value))))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>TYT Net Tahmini (toplam)</label>
              <input
                type="number"
                min={0}
                max={120}
                step={0.25}
                value={tytNet}
                onChange={(e) => setTytNet(Math.min(120, Math.max(0, Number(e.target.value))))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Güvenli Marj (puan)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={marj}
                onChange={(e) => setMarj(Math.min(50, Math.max(0, Number(e.target.value))))}
                className={inputCls}
              />
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                <strong>Güvenli marj nedir?</strong> Programın geçen yılki taban puanına ek olarak kaç puan üstünde olmak istediğini belirtirsin.
                Örneğin taban puanı 450 ise, 5 puan marj koyarsan hedefin 455 olur.
                Kontenjan dalgalanmalarına, puan artışına karşı güvende olursun.
                Riskli programlarda 10-15 puan, emin programlarda 3-5 puan marj önerilir.
              </p>
            </div>
          </div>

          {/* SONUÇ — Bölüm için gereken netler */}
          {sonuc && (
            <div className="rounded-xl border-2 border-primary-300 bg-white p-5 space-y-5">
              {/* Başlık */}
              <div className="flex items-center gap-2 text-primary-900">
                <Crosshair className="w-6 h-6 text-primary-600" />
                <div>
                  <div className="text-lg font-bold">{hedefProgram.universite_adi}</div>
                  <div className="text-sm font-semibold text-primary-700">{hedefProgram.birim_adi}</div>
                </div>
              </div>

              {/* Özet Kartlar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-xs text-slate-500">Program Taban</div>
                  <div className="font-bold text-slate-800">{hedefProgram.current.min_puan?.toFixed(2) ?? "-"}</div>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-xs text-slate-500">Hedef Puan</div>
                  <div className="font-bold text-primary-700">{sonuc.hedefYP.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-xs text-slate-500">Başarı Sırası</div>
                  <div className="font-bold text-slate-800">
                    {hedefProgram.current.basari_sirasi ? hedefProgram.current.basari_sirasi.toLocaleString("tr-TR") : "-"}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-xs text-slate-500">Kontenjan</div>
                  <div className="font-bold text-slate-800">{hedefProgram.current.kontenjan ?? "-"}</div>
                </div>
              </div>

              {/* Program İstatistikleri */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Program Geçmiş Yıllar İstatistiği
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[hedefProgram.current, ...hedefProgram.history].map((y) => (
                    <div key={y.year} className="bg-white rounded border border-slate-100 p-1.5 text-center">
                      <div className="text-slate-500">{y.year}</div>
                      <div className="font-bold text-slate-800">{y.min_puan?.toFixed(2) ?? "-"}</div>
                      <div className="text-[10px] text-slate-400">{y.basari_sirasi ? y.basari_sirasi.toLocaleString("tr-TR") : "-"} BS</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mesaj */}
              {sonuc.mesaj && (
                <div className="text-sm rounded-lg p-3 border bg-blue-50 border-blue-200 text-blue-800">
                  {sonuc.mesaj}
                </div>
              )}

              {/* === SON GİREN KİŞİNİN NETLERİ === */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                  <Brain className="w-4 h-4 text-amber-600" />
                  Son Giren Kişinin Netleri
                  {netsYukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />}
                </div>
                {netsYukleniyor ? (
                  <p className="text-xs text-amber-700">Yükleniyor…</p>
                ) : sonGirenNets && (sonGirenNets.tyt_net != null || sonGirenNets.ayt_net != null || sonGirenNets.ydt_net != null) ? (
                  <div className="flex flex-wrap gap-3">
                    {sonGirenNets.tyt_net != null && (
                      <div className="bg-white rounded-lg border border-blue-200 px-3 py-2 text-center min-w-[72px]">
                        <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">TYT</div>
                        <div className="text-xl font-bold text-blue-900">{sonGirenNets.tyt_net.toFixed(1)}</div>
                        <div className="text-[9px] text-blue-500">/ 120 net</div>
                      </div>
                    )}
                    {sonGirenNets.ayt_net != null && puanTuru !== "DİL" && (
                      <div className="bg-white rounded-lg border border-purple-200 px-3 py-2 text-center min-w-[72px]">
                        <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">AYT</div>
                        <div className="text-xl font-bold text-purple-900">{sonGirenNets.ayt_net.toFixed(1)}</div>
                        <div className="text-[9px] text-purple-500">/ 80 net</div>
                      </div>
                    )}
                    {(sonGirenNets.ydt_net != null || (puanTuru === "DİL" && sonGirenNets.ayt_net != null)) && (
                      <div className="bg-white rounded-lg border border-emerald-200 px-3 py-2 text-center min-w-[72px]">
                        <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">YDT</div>
                        <div className="text-xl font-bold text-emerald-900">
                          {(sonGirenNets.ydt_net ?? sonGirenNets.ayt_net)!.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-emerald-500">/ 80 net</div>
                      </div>
                    )}
                    <div className="text-[10px] text-amber-700 self-end pb-1">
                      {hedefProgram.current.year} yılı · son yerleşen kişi referansı
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">Bu program için YÖK Atlas'ta net verisi bulunamadı.</p>
                )}
              </div>

              {/* === GEREKEN NETLER === */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Calculator className="w-5 h-5 text-primary-600" />
                  Bu Bölüm İçin Gereken Netler
                </div>

                {/* TYT */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    TYT — Toplam {sonuc.tytNet.toFixed(1)} net
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sonuc.tytDersler.map((d) => (
                      <div key={d.ad} className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
                        <div className="text-[11px] text-blue-700 font-medium">{d.ad}</div>
                        <div className="text-xl font-bold text-blue-900">{d.net.toFixed(1)}</div>
                        <div className="text-[10px] text-blue-600">net</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AYT */}
                {sonuc.aytDersler.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Atom className="w-4 h-4 text-purple-600" />
                      AYT — Toplam {sonuc.aytToplamNet.toFixed(1)} net
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sonuc.aytDersler.map((d) => (
                        <div key={d.ad} className="bg-purple-50 rounded-lg border border-purple-200 p-3 text-center">
                          <div className="text-[11px] text-purple-700 font-medium">{d.ad}</div>
                          <div className="text-xl font-bold text-purple-900">{d.net.toFixed(1)}</div>
                          <div className="text-[10px] text-purple-600">net</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Bu hesaplama yaklaşıktır. TYT ve AYT katsayıları ders bazında değişir.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
