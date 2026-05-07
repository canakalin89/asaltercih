import { useState } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  onApply: (tytHam: number, aytHam: number, obp: number, yp: number) => void;
}

export default function DirectScoreInput({ onApply }: Props) {
  const [tyt, setTyt] = useState("");
  const [ayt, setAyt] = useState("");
  const [obp, setObp] = useState("");

  const handleApply = () => {
    const t = Number(tyt) || 0;
    const a = Number(ayt) || 0;
    const o = Number(obp) || 0;
    const yp = t + a + o * 0.12;
    onApply(t, a, o, yp);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">TYT Ham Puan</label>
          <input
            type="number"
            value={tyt}
            onChange={(e) => setTyt(e.target.value)}
            placeholder="örn. 380"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">AYT Ham Puan</label>
          <input
            type="number"
            value={ayt}
            onChange={(e) => setAyt(e.target.value)}
            placeholder="örn. 280"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">OBP (0-100)</label>
          <input
            type="number"
            value={obp}
            onChange={(e) => setObp(e.target.value)}
            placeholder="örn. 85"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <button
        onClick={handleApply}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition"
      >
        <ArrowRight className="w-4 h-4" />
        Puanı Kullan
      </button>
    </div>
  );
}
