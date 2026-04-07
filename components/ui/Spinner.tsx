"use client";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Carregando"
    />
  );
}
