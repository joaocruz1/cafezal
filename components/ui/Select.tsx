"use client";
import { SelectHTMLAttributes, forwardRef, useId } from "react";
import type { LucideIcon } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  leftIcon?: LucideIcon;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, leftIcon: LeftIcon, className = "", id: propId, ...props }, ref) => {
    const autoId = useId();
    const id = propId || autoId;
    const errorId = `${id}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-600">{label}</label>
        )}
        <div className="relative">
          {LeftIcon && <LeftIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />}
          <select
            ref={ref}
            id={id}
            className={`w-full rounded-[var(--radius-md)] border border-stone-300 bg-white ${LeftIcon ? "pl-9" : "px-3"} pr-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 disabled:bg-stone-50 disabled:text-stone-500 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {error && <p id={errorId} className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
