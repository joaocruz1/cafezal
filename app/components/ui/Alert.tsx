"use client";

type Variant = "error" | "success" | "info";

interface AlertProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  error: "bg-red-50 text-red-700 border-red-100",
  success: "bg-green-50 text-green-800 border-green-100",
  info: "bg-neutral-50 text-neutral-700 border-neutral-200",
};

export function Alert({ variant = "info", children, className = "" }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-[var(--radius-md)] border p-3 text-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
