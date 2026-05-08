import { useEffect, useMemo, useState } from "react";
import { listProgramGroups, listUniversities, searchPrograms } from "@/lib/yokatlas";
import { karsilastirHedef, type MevcutNetler } from "@/lib/score";
import type { Program, PuanTuru } from "@/lib/types";
import { Calculator, Loader2, Target, TrendingUp, BarChart3, CheckCircle2, AlertCircle } from "lucide-react";

const MAX_SORU: Record<string, number> = {
  tytTurkce: 40, tytSosyal: 20, tytMatematik: 40, tytFen: 20,
  aytMatematik: 40, aytFizik: 14, aytKimya: 13, aytBiyoloji: 13,
  aytEdebiyat: 24, aytTarih1: 10, aytCografya1: 6, aytTarih2: 10,
  aytCografya2: 6, aytFelsefe: 12, aytDin: 6, aytDil: 80,
};

const TYT_DERSLER = [
  { key: "tytTurkce" as const, ad: "TYT Türkçe" },
  { key: "tytMatematik" as const, ad: "TYT Matematik" },
  { key: "tytSosyal" as const, ad: "TYT Sosyal" },
  { key: "tytFen" as const, ad: "TYT Fen" },
];

const AYT_DERS_MAP: Record<PuanTuru, { key: keyof MevcutNetler; ad: string }[]> = {
  SAY: [
    { key: "aytMatematik", ad: "AYT Matematik" },
    { key: "aytFizik", ad: "Fizik" },
    { key: "aytKimya", ad: "Kimya" },
    { key: "aytBiyoloji", ad: "Biyoloji" },
  ],
  SÖZ: [
    { key: "aytEdebiyat", ad: "Edebiyat" },
    { key: "aytTarih1", ad: "Tarih-1" },
    { key: "aytCografya1", ad: "Coğrafya-1" },
    { key: "aytTarih2", ad: "Tarih-2" },
    { key: "aytCografya2", ad: "Coğrafya-2" },
    { key: "aytFelsefe", ad: "Felsefe" },
    { key: "aytDin", ad: "Din K./A.B." },
  ],
  EA: [
    { key: "aytMatematik", ad: "AYT Matematik" },
    { key: "aytEdebiyat", ad: "Edebiyat" },
    { key: "aytTarih1", ad: "Tarih-1" },
    { key: "aytCografya1", ad: "Coğrafya-1" },
  ],
  DİL: [
    { key: "aytDil", ad: "Yabancı Dil" },
  ],
  TYT: [],
};

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

  const [netler, setNetler] = useState<MevcutNetler>({
    tytTurkce: 25, tytMatematik: 25, tytSosyal: 12, tytFen: 12,
    aytMatematik: 20, aytFizik: 8, aytKimya: 8, aytBiyoloji: 8,
    aytEdebiyat: 15, aytTarih1: 6, aytCografya1: 4, aytTarih2: 6,
    aytCografya2: 4, aytFelsefe: 8, aytDin: 4, aytDil: 50,
  });

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
    return karsilastirHedef(hedefPuan, obp, netler, puanTuru);
  }, [hedefPuan, obp, netler, puanTuru]);

  const aytDersler = useMemo(() => AYT_DERS_MAP[puanTuru] ?? [], [puanTuru]);

  const updateNet = (key: keyof MevcutNetler, val: number) => {
    const max = MAX_SORU[key] ?? 120;
    setNetler((prev) => ({ ...prev, [key]: Math.min(max, Math.max(0, Number(val) || 0)) }));
  };

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
          Bir üniversite ve bölüm seçin. TYT ve AYT derslerindeki mevcut netlerinizi girin. Sistem, o programa girebilmek için ne kadar daha net yapmanız gerektiğini hesaplar.
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
                {p.universite_adi} — {p.birim_adi} ({p.current.min_puan?.toFixed(2) ?? "?"} puan)
              </option>
            ))}
          </select>
        </div>
      )}

      {hedefProgram && (
        <div className="space-y-4 border-t pt-4">
          {/* Diploma Notu + Güvenli Marj */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                Örneğin programın taban puanı 450 ise, 5 puan marj koyarsan hedefin 455 olur.
                Bu sayede kontenjan dalgalanmalarına, puanların yıl içinde artmasına karşı güvende olursun.
                Riskli programlarda 10-15 puan, emin programlarda 3-5 puan marj önerilir.
              </p>
            </div>
          </div>

          {/* TYT Net Girişleri */}
          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" />
              TYT Netlerin (Mevcut)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TYT_DERSLER.map((d) => (
                <div key={d.key}>
                  <label className={labelCls}>{d.ad}</label>
                  <input
                    type="number"
                    min={0}
                    max={MAX_SORU[d.key]}
                    step={0.25}
                    value={netler[d.key]}
                    onChange={(e) => updateNet(d.key, Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AYT Net Girişleri */}
          {puanTuru !== "TYT" && aytDersler.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                {puanTuru} AYT Netlerin (Mevcut)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {aytDersler.map((d) => (
                  <div key={d.key}>
                    <label className={labelCls}>{d.ad}</label>
                    <input
                      type="number"
                      min={0}
                      max={MAX_SORU[d.key] ?? 80}
                      step={0.25}
                      value={netler[d.key] ?? 0}
                      onChange={(e) => updateNet(d.key, Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sonuç */}
          {sonuc && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-4">
              {/* Başlık */}
              <div className="flex items-center gap-2 text-primary-800 font-bold">
                {sonuc.mumkun ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                Hedef: {hedefProgram.universite_adi} — {hedefProgram.birim_adi}
              </div>

              {/* Özet Kartlar */}
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
                  <div className="text-xs text-slate-500">Mevcut Puanın</div>
                  <div className={`font-bold ${sonuc.mumkun ? "text-green-700" : "text-amber-700"}`}>{sonuc.mevcutYP.toFixed(3)}</div>
                </div>
                <div className="bg-white rounded-lg border border-primary-100 p-2 text-center">
                  <div className="text-xs text-slate-500">Fark</div>
                  <div className={`font-bold ${sonuc.fark >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {sonuc.fark >= 0 ? "+" : ""}{sonuc.fark.toFixed(2)} puan
                  </div>
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

              {/* Mesaj */}
              <div className={`text-sm rounded-lg p-3 border ${sonuc.mumkun ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                {sonuc.mesaj}
              </div>

              {/* TYT Karşılaştırma */}
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">TYT Netlerin</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sonuc.tytDersler.map((d) => (
                    <div key={d.ad} className="bg-white rounded-lg border border-slate-200 p-2">
                      <div className="text-[10px] text-slate-500">{d.ad}</div>
                      <div className="text-sm font-bold text-slate-800">{d.mevcut.toFixed(1)} net</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AYT Karşılaştırma — sadece eksik varsa hedef göster */}
              {sonuc.aytDersler.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    {sonuc.mumkun ? "AYT Netlerin" : `AYT Netlerin — ${sonuc.ekAytToplamNet.toFixed(1)} net daha artırman lazım`}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sonuc.aytDersler.map((d) => (
                      <div key={d.ad} className={`rounded-lg border p-2 ${d.fark > 0.01 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500">{d.ad}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-800">{d.mevcut.toFixed(1)}</span>
                          {d.fark > 0.01 && (
                            <>
                              <span className="text-xs text-slate-400">→</span>
                              <span className="text-sm font-bold text-amber-700">{d.hedef.toFixed(1)}</span>
                              <span className="text-[10px] text-amber-600">(+{d.fark.toFixed(1)})</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Bu hesaplama yaklaşıktır. AYT katsayıları ve soru sayıları ders bazında değişir.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
