"use client";
import { Search, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Buscar...", debounceMs = 300, className = "" }: SearchInputProps) {
  const [internal, setInternal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setInternal(value); }, [value]);

  function handleChange(v: string) {
    setInternal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
      <input
        type="text"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-stone-300 bg-white pl-9 pr-8 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
      />
      {internal && (
        <button type="button" onClick={() => handleChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600" aria-label="Limpar busca">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
