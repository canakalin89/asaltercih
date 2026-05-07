import { useEffect, useMemo, useState } from "react";
import { listCities, listProgramGroups, listUniversities } from "@/lib/yokatlas";
import type { PuanTuru } from "@/lib/types";
import { Filter, Loader2 } from "lucide-react";

export interface Filters {
  puan_turu: PuanTuru;
  universite_turu: "DEVLET" | "VAKIF" | null;
  birim_turu_id: number | null; // 46=LISANS, 47=ONLISANS
  universite_id: number[];
  il_kodu: number[];
  birim_grup_id: number[];
  ogrenim_turu_id: number | null; // örgün vs
  sadece_kontenjan_olan: boolean;
  min_puan: number | null;
  max_puan: number | null;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onSearch: () => void;
  loading: boolean;
}

export const defaultFilters: Filters = {
  puan_turu: "SAY",
  universite_turu: null,
  birim_turu_id: null,
  universite_id: [],
  il_kodu: [],
  birim_grup_id: [],
  ogrenim_turu_id: null,
  sadece_kontenjan_olan: false,
  min_puan: null,
  max_puan: null,
};

export default function FilterPanel({ filters, onChange, onSearch, loading }: Props) {
  const [universities, setUniversities] = useState<{ universite_id: number; universite_adi: string }[]>([]);
  const [cities, setCities] = useState<{ il_kodu: number; il_adi: string }[]>([]);
  const [programGroups, setProgramGroups] = useState<{ birim_grup_id: number; birim_grup_adi: string; puan_turu: string }[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    setMetaLoading(true);
    Promise.all([listUniversities(), listCities(), listProgramGroups()])
      .then(([u, c, p]) => {
        setUniversities(u.sort((a, b) => a.universite_adi.localeCompare(b.universite_adi, "tr")));
        setCities(c.sort((a, b) => a.il_adi.localeCompare(b.il_adi, "tr")));
        setProgramGroups(p.sort((a, b) => a.birim_grup_adi.localeCompare(b.birim_grup_adi, "tr")));
      })
      .catch(() => {
        alert("YÖK Atlas lookup verileri alınamadı. Sunucu proxy ayarlarını kontrol edin.");
      })
      .finally(() => setMetaLoading(false));
  }, []);

  const filteredProgramGroups = useMemo(() => {
    return programGroups.filter((p) => !filters.puan_turu || p.puan_turu === filters.puan_turu);
  }, [programGroups, filters.puan_turu]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Puan Türü</label>
          <select
            value={filters.puan_turu}
            onChange={(e) => onChange({ ...filters, puan_turu: e.target.value as PuanTuru })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="SAY">Sayısal (SAY)</option>
            <option value="SÖZ">Sözel (SÖZ)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="DİL">Dil (DİL)</option>
            <option value="TYT">TYT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Üniversite Türü</label>
          <select
            value={filters.universite_turu ?? ""}
            onChange={(e) => onChange({ ...filters, universite_turu: (e.target.value as any) || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tümü</option>
            <option value="DEVLET">Devlet</option>
            <option value="VAKIF">Vakıf</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Öğretim Türü</label>
          <select
            value={filters.birim_turu_id ?? ""}
            onChange={(e) => onChange({ ...filters, birim_turu_id: Number(e.target.value) || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tümü</option>
            <option value={46}>Lisans</option>
            <option value={47}>Önlisans</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Şehir</label>
          <select
            multiple
            size={4}
            value={filters.il_kodu.map(String)}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
              onChange({ ...filters, il_kodu: opts });
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {cities.map((c) => (
              <option key={c.il_kodu} value={c.il_kodu}>
                {c.il_adi}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">Ctrl/Cmd ile çoklu seçim</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Program Grubu</label>
          <select
            multiple
            size={4}
            value={filters.birim_grup_id.map(String)}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
              onChange({ ...filters, birim_grup_id: opts });
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {filteredProgramGroups.map((p) => (
              <option key={p.birim_grup_id} value={p.birim_grup_id}>
                {p.birim_grup_adi}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">Ctrl/Cmd ile çoklu seçim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Üniversite</label>
          <select
            multiple
            size={4}
            value={filters.universite_id.map(String)}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
              onChange({ ...filters, universite_id: opts });
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {universities.map((u) => (
              <option key={u.universite_id} value={u.universite_id}>
                {u.universite_adi}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Taban Puan</label>
          <input
            type="number"
            placeholder="örn. 300"
            value={filters.min_puan ?? ""}
            onChange={(e) => onChange({ ...filters, min_puan: Number(e.target.value) || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Max. Taban Puan</label>
          <input
            type="number"
            placeholder="örn. 500"
            value={filters.max_puan ?? ""}
            onChange={(e) => onChange({ ...filters, max_puan: Number(e.target.value) || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.sadece_kontenjan_olan}
            onChange={(e) => onChange({ ...filters, sadece_kontenjan_olan: e.target.checked })}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Sadece kontenjanı olanları göster
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSearch}
          disabled={loading || metaLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition"
        >
          {loading || metaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
          Programları Çek
        </button>
      </div>
    </div>
  );
}
