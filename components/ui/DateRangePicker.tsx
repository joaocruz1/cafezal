"use client";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export function DateRangePicker({ from, to, onChange, className = "" }: DateRangePickerProps) {
  const presets = [
    { label: "Hoje", fn: () => { const t = toDateStr(new Date()); onChange(t, t); } },
    { label: "7 dias", fn: () => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 7); onChange(toDateStr(f), toDateStr(t)); } },
    { label: "30 dias", fn: () => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 30); onChange(toDateStr(f), toDateStr(t)); } },
    { label: "Este mes", fn: () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1); onChange(toDateStr(f), toDateStr(t)); } },
  ];

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <div className="w-40">
        <label className="mb-1 block text-sm font-medium text-stone-600">De</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="w-full rounded-[var(--radius-md)] border border-stone-300 bg-white pl-9 pr-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500" />
        </div>
      </div>
      <div className="w-40">
        <label className="mb-1 block text-sm font-medium text-stone-600">Ate</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="w-full rounded-[var(--radius-md)] border border-stone-300 bg-white pl-9 pr-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500" />
        </div>
      </div>
      <div className="flex gap-1">
        {presets.map((p) => (
          <button key={p.label} type="button" onClick={p.fn} className="rounded-[var(--radius-md)] border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
