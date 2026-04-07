"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
  secondary:
    "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
  ghost:
    "text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variantClass = variantClasses[variant];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
