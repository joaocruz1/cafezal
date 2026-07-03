"use client";

import { useAuth } from "../../providers";
import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Alert,
  Button,
  Card,
  Input,
  PageContainer,
  PageTitle,
  Select,
  Table,
  TableRow,
  TableCell,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { PackagePlus, Plus } from "lucide-react";

type Safra = { id: string; name: string; active: boolean };
type Entry = {
  id: string;
  quantityKg: string;
  reason: string | null;
  createdAt: string;
  safra: { id: string; name: string };
  createdByUser: { name: string };
};

export default function EstoqueEntradaPage() {
  const { user } = useAuth();
  const [safras, setSafras] = useState<Safra[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState({ safraId: "", quantityKg: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const loadSafras = useCallback(async () => {
    const res = await fetchWithAuth("/api/safras?active=true");
    if (res.ok) setSafras(await res.json());
  }, []);

  const loadEntries = useCallback(async () => {
    const res = await fetchWithAuth("/api/stock/entry");
    if (res.ok) setEntries(await res.json());
  }, []);

  useEffect(() => { loadSafras(); loadEntries(); }, [loadSafras, loadEntries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/stock/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          safraId: form.safraId,
          quantityKg: Number(form.quantityKg),
          reason: form.reason.trim(),
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao registrar entrada"); return; }
      toast.success("Entrada de estoque registrada");
      setForm({ safraId: "", quantityKg: "", reason: "" });
      loadEntries();
    } finally { setLoading(false); }
  }

  if (!user || !["ADMIN", "GERENTE", "ESTOQUE"].includes(user.profile)) {
    return (
      <PageContainer>
        <Alert variant="error">Acesso negado. Apenas administradores, gerentes e estoque.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle title="Entrada de Estoque" subtitle="Registrar recebimento de mercadoria no estoque central" />

      <Card title="Nova entrada" icon={PackagePlus} className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Saco"
              required
              value={form.safraId}
              onChange={(e) => setForm((f) => ({ ...f, safraId: e.target.value }))}
              options={[{ value: "", label: "Selecione..." }, ...safras.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Input
              type="number"
              step="0.01"
              min="0.01"
              label="Quantidade (kg)"
              required
              placeholder="Ex: 300"
              value={form.quantityKg}
              onChange={(e) => setForm((f) => ({ ...f, quantityKg: e.target.value }))}
            />
            <Input
              label="Nota / motivo do recebimento"
              required
              placeholder="Ex: NF 12345 - Fornecedor X"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={loading || !form.safraId} loading={loading} icon={Plus}>
            Registrar entrada
          </Button>
        </form>
      </Card>

      <Card title="Historico de entradas" icon={PackagePlus}>
        <Table headers={["Saco", "Quantidade", "Nota/motivo", "Registrado por", "Data"]} emptyMessage="Nenhuma entrada registrada." isEmpty={entries.length === 0}>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.safra.name}</TableCell>
              <TableCell align="right" className="text-emerald-600 font-medium">+{Number(e.quantityKg).toFixed(2)} kg</TableCell>
              <TableCell>{e.reason || "—"}</TableCell>
              <TableCell>{e.createdByUser?.name}</TableCell>
              <TableCell>{new Date(e.createdAt).toLocaleString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </PageContainer>
  );
}
