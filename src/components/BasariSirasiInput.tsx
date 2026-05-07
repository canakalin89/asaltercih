import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

interface Props {
  onApply: (bs: number) => void;
}

export default function BasariSirasiInput({ onApply }: Props) {
  const [bs, setBs] = useState("");

  const handleApply = () => {
    const n = Number(bs);
    if (!n || n <= 0) {
      alert("Lütfen geçerli bir başarı sırası girin.");
      return;
    }
    onApply(n);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
        <p className="text-sm text-primary-800">
          ÖSYM sonuç belgenizdeki <strong>başarı sıranızı</strong> girin. Başarı sırası puan türüne göre daha stabil bir göstergedir.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Başarı Sıranız</label>
        <input
          type="number"
          min={1}
          value={bs}
          onChange={(e) => setBs(e.target.value)}
          placeholder="örn. 45000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-slate-400 mt-1">Küçük sayı = daha iyi sıralama</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition"
        >
          <ArrowRight className="w-4 h-4" />
          Bu Sırayı Kullan
        </button>
        <button
          onClick={() => setBs("")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Sıfırla
        </button>
      </div>
    </div>
  );
}
