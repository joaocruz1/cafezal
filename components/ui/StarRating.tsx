"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readOnly = false, size = 28 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" role={readOnly ? undefined : "radiogroup"} aria-label="Nota da venda">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} de 5 estrelas`}
          aria-pressed={value === n}
          className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 rounded"}`}
        >
          <Star
            width={size}
            height={size}
            className={n <= value ? "fill-amber-400 text-amber-400" : "fill-none text-stone-300"}
          />
        </button>
      ))}
    </div>
  );
}
