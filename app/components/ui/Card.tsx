"use client";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {title && (
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="font-medium text-neutral-800">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
