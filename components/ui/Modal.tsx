"use client";

import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({ open, onClose, title, size = "md", children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", handleKeyDown);
    const prev = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[fadeIn_150ms_ease-out]"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        ref={panelRef}
        className={`w-full ${sizeClasses[size]} rounded-[var(--radius-lg)] bg-white shadow-lg animate-[slideUp_150ms_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h3 id={titleId} className="font-semibold text-stone-800">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-[var(--radius-md)] p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer !== undefined && (
          <div className="flex gap-2 justify-end border-t border-stone-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  variant = "primary", loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button type="button" variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-sm text-stone-600">{message}</p>
    </Modal>
  );
}
