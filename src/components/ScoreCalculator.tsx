import { useMemo, useState } from "react";
import type { NetGiris, PuanTuru } from "@/lib/types";
import {
  defaultNetGiris,
  hesaplaTytHam,
  hesaplaSayHam,
  hesaplaSozHam,
  hesaplaEaHam,
  hesaplaDilHam,
  hesaplaYerlestirmePuan,
} from "@/lib/score";
import { Calculator, RotateCcw } from "lucide-react";

interface Props {
  puanTuru: PuanTuru;
  onChange: (tytHam: number, aytHam: number, obp: number, yp: number) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

export default function ScoreCalculator({ puanTuru, onChange }: Props) {
  const [nets, setNets] = useState<NetGiris>(defaultNetGiris);
  const [obp, setObp] = useState(0);

  const tytHam = useMemo(() => hesaplaTytHam(nets), [nets]);
  const aytHam = useMemo(() => {
    switch (puanTuru) {
      case "SAY":
        return hesaplaSayHam(nets);
      case "SÖZ":
        return hesaplaSozHam(nets);
      case "EA":
        return hesaplaEaHam(nets);
      case "DİL":
        return hesaplaDilHam(nets);
      case "TYT":
        return 0;
      default:
        return 0;
    }
  }, [nets, puanTuru]);

  const yp = useMemo(() => hesaplaYerlestirmePuan(tytHam, aytHam, obp), [tytHam, aytHam, obp]);

  const update = (key: keyof NetGiris, val: number) => {
    setNets((prev) => ({ ...prev, [key]: clamp(val, 0, 999) }));
  };

  const handleApply = () => {
    onChange(tytHam, aytHam, obp, yp);
  };

  const handleReset = () => {
    setNets(defaultNetGiris());
    setObp(0);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NetField label="Türkçe" max={40} dKey="turkceDogru" yKey="turkceYanlis" nets={nets} onChange={update} />
        <NetField label="Sosyal Bil." max={20} dKey="sosyalDogru" yKey="sosyalYanlis" nets={nets} onChange={update} />
        <NetField label="TYT Mat" max={40} dKey="matTytDogru" yKey="matTytYanlis" nets={nets} onChange={update} />
        <NetField label="Fen Bil." max={20} dKey="fenDogru" yKey="fenYanlis" nets={nets} onChange={update} />
      </div>

      {puanTuru !== "TYT" && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            {puanTuru} AYT Netleri
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {puanTuru === "SAY" && (
              <>
                <NetField label="AYT Mat" max={40} dKey="matAytDogru" yKey="matAytYanlis" nets={nets} onChange={update} />
                <NetField label="Fizik" max={14} dKey="fizikDogru" yKey="fizikYanlis" nets={nets} onChange={update} />
                <NetField label="Kimya" max={13} dKey="kimyaDogru" yKey="kimyaYanlis" nets={nets} onChange={update} />
                <NetField label="Biyoloji" max={13} dKey="biyolojiDogru" yKey="biyolojiYanlis" nets={nets} onChange={update} />
              </>
            )}
            {puanTuru === "SÖZ" && (
              <>
                <NetField label="Edebiyat" max={24} dKey="edebiyatDogru" yKey="edebiyatYanlis" nets={nets} onChange={update} />
                <NetField label="Tarih-1" max={10} dKey="tarih1Dogru" yKey="tarih1Yanlis" nets={nets} onChange={update} />
                <NetField label="Coğ.-1" max={6} dKey="cografya1Dogru" yKey="cografya1Yanlis" nets={nets} onChange={update} />
                <NetField label="Tarih-2" max={10} dKey="tarih2Dogru" yKey="tarih2Yanlis" nets={nets} onChange={update} />
                <NetField label="Coğ.-2" max={6} dKey="cografya2Dogru" yKey="cografya2Yanlis" nets={nets} onChange={update} />
                <NetField label="Felsefe" max={12} dKey="felsefeDogru" yKey="felsefeYanlis" nets={nets} onChange={update} />
                <NetField label="D.K./A.B." max={6} dKey="dinDogru" yKey="dinYanlis" nets={nets} onChange={update} />
              </>
            )}
            {puanTuru === "EA" && (
              <>
                <NetField label="AYT Mat" max={40} dKey="matAytDogru" yKey="matAytYanlis" nets={nets} onChange={update} />
                <NetField label="Edebiyat" max={24} dKey="edebiyatDogru" yKey="edebiyatYanlis" nets={nets} onChange={update} />
                <NetField label="Tarih-1" max={10} dKey="tarih1Dogru" yKey="tarih1Yanlis" nets={nets} onChange={update} />
                <NetField label="Coğ.-1" max={6} dKey="cografya1Dogru" yKey="cografya1Yanlis" nets={nets} onChange={update} />
              </>
            )}
            {puanTuru === "DİL" && (
              <NetField label="Y.D." max={80} dKey="dilDogru" yKey="dilYanlis" nets={nets} onChange={update} />
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 border-t pt-3">
        <label className="text-sm font-medium text-slate-700">OBP (0-100)</label>
        <input
          type="number"
          min={0}
          max={100}
          value={obp}
          onChange={(e) => setObp(clamp(Number(e.target.value), 0, 100))}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreBox label="TYT Ham" value={tytHam.toFixed(3)} />
        <ScoreBox label={`${puanTuru} AYT Ham`} value={aytHam.toFixed(3)} />
        <ScoreBox label="Yerleştirme Puanı" value={yp.toFixed(3)} highlight />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition"
        >
          <Calculator className="w-4 h-4" />
          Bu Puanı Kullan
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Sıfırla
        </button>
      </div>
    </div>
  );
}

function NetField({
  label,
  max,
  dKey,
  yKey,
  nets,
  onChange,
}: {
  label: string;
  max: number;
  dKey: keyof NetGiris;
  yKey: keyof NetGiris;
  nets: NetGiris;
  onChange: (k: keyof NetGiris, v: number) => void;
}) {
  const net = Math.max(0, (nets[dKey] as number) - (nets[yKey] as number) / 4);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="text-xs font-semibold text-slate-600 mb-1 flex justify-between">
        <span>{label}</span>
        <span className="text-slate-400">max {max}</span>
      </div>
      <div className="flex gap-1">
        <input
          type="number"
          min={0}
          max={max}
          placeholder="D"
          value={nets[dKey] || ""}
          onChange={(e) => onChange(dKey, Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <input
          type="number"
          min={0}
          max={max}
          placeholder="Y"
          value={nets[yKey] || ""}
          onChange={(e) => onChange(yKey, Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div className="mt-1 text-right text-xs font-medium text-primary-700">Net: {net.toFixed(2)}</div>
    </div>
  );
}

function ScoreBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${highlight ? "border-primary-300 bg-primary-50" : "border-slate-200 bg-white"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${highlight ? "text-primary-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}
