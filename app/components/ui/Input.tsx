"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const inputBase =
  "w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-50 disabled:text-neutral-500";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-neutral-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${inputBase} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={props.id ? `${props.id}-error` : undefined} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
