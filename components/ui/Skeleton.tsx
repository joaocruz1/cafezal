"use client";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-md)] bg-stone-200 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-stone-200 bg-white p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-stone-200 bg-white overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="bg-stone-50 border-b border-stone-200 p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (<Skeleton key={i} className="h-4 flex-1" />))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-stone-100 p-3 flex gap-4 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (<Skeleton key={c} className="h-4 flex-1" />))}
        </div>
      ))}
    </div>
  );
}
