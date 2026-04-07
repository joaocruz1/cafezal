"use client";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down";
  className?: string;
}

export function KpiCard({ icon: Icon, label, value, trend, trendDirection, className = "" }: KpiCardProps) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-stone-200 bg-white p-5 ${className}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <div className="rounded-lg bg-amber-50 p-2">
          <Icon className="h-5 w-5 text-amber-700" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-stone-800">{value}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium mb-1 ${trendDirection === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {trendDirection === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
