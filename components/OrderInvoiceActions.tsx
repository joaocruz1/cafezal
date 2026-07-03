"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/app/providers";
import { fetchWithAuth } from "@/lib/auth-client";
import { Button, ConfirmModal } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Paperclip, Download, Trash2 } from "lucide-react";

// Vercel limita o body de funções serverless a 4.5MB — comunicamos 4MB ao usuário
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type InvoiceMeta = {
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
};

export function OrderInvoiceActions({
  orderId,
  invoice,
  onChange,
}: {
  orderId: string;
  invoice: InvoiceMeta | null;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canDelete = user != null && ["ADMIN", "GERENTE", "FINANCEIRO"].includes(user.profile);

  async function handleUpload(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Arquivo excede o limite de 4MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetchWithAuth(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        toast.success("Nota anexada");
        onChange();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Erro ao anexar nota");
      }
    } catch {
      toast.error("Erro de conexao");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    try {
      const res = await fetchWithAuth(`/api/orders/${orderId}/invoice`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Erro ao baixar nota");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoice?.fileName ?? "nota.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro de conexao");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/orders/${orderId}/invoice`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Nota removida");
        setConfirmDelete(false);
        onChange();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Erro ao remover nota");
      }
    } catch {
      toast.error("Erro de conexao");
    } finally {
      setDeleting(false);
    }
  }

  if (!invoice) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) handleUpload(f);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={Paperclip}
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Anexar nota
        </Button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-stone-500 max-w-[10rem] truncate" title={invoice.fileName}>
        {invoice.fileName}
      </span>
      <Button type="button" size="sm" variant="ghost" icon={Download} onClick={handleDownload}>
        Baixar
      </Button>
      {canDelete && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={Trash2}
          onClick={() => setConfirmDelete(true)}
        >
          Excluir
        </Button>
      )}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Remover nota"
        message={`Remover a nota "${invoice.fileName}" desta comanda?`}
        confirmLabel="Remover"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
