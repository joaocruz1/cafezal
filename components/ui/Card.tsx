"use client";
import type { LucideIcon } from "lucide-react";

type Accent = "primary" | "success" | "danger" | "warning" | "info";

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  accent?: Accent;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const accentBorder: Record<Accent, string> = {
  primary: "border-l-amber-600",
  success: "border-l-emerald-500",
  danger: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

export function Card({ title, icon: Icon, accent, headerActions, footer, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-stone-200 bg-white overflow-hidden ${accent ? `border-l-[3px] ${accentBorder[accent]}` : ""} ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5 lg:px-6">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4.5 w-4.5 text-stone-500" />}
            {title && <h2 className="font-medium text-stone-800">{title}</h2>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="p-5 lg:p-6">{children}</div>
      {footer && (
        <div className="border-t border-stone-100 px-5 py-3.5 lg:px-6 bg-stone-50/50">{footer}</div>
      )}
    </div>
  );
}
