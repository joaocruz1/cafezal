"use client";

import { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
  secondary:
    "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
  ghost:
    "text-stone-600 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
  warning:
    "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      ) : null}
      {children}
    </button>
  );
}
