"use client";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

type Variant = "error" | "success" | "info" | "warning";

interface AlertProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const config: Record<Variant, { classes: string; icon: typeof AlertCircle; role: string }> = {
  error: { classes: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, role: "alert" },
  success: { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, role: "status" },
  info: { classes: "bg-blue-50 text-blue-700 border-blue-200", icon: Info, role: "status" },
  warning: { classes: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle, role: "alert" },
};

export function Alert({ variant = "info", children, className = "", dismissible, onDismiss }: AlertProps) {
  const { classes, icon: Icon, role } = config[variant];
  return (
    <div role={role} className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-sm ${classes} ${className}`}>
      <Icon className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button type="button" onClick={onDismiss} className="flex-shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
