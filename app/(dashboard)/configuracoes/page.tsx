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
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Settings, Save } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ establishmentName: "", stockDeductionRule: "on_pay", allowNegativeStock: "false", requireOpenCashToSell: "true" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchWithAuth("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setForm({ establishmentName: data.establishmentName ?? "Cafe", stockDeductionRule: data.stockDeductionRule ?? "on_pay", allowNegativeStock: data.allowNegativeStock ?? "false", requireOpenCashToSell: data.requireOpenCashToSell ?? "true" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao salvar"); return; }
      toast.success("Configuracoes salvas!");
    } finally { setLoading(false); }
  }

  if (!user || !["ADMIN", "GERENTE"].includes(user.profile)) {
    return (<PageContainer ><Alert variant="error">Acesso negado.</Alert></PageContainer>);
  }

  return (
    <PageContainer >
      <PageTitle title="Configuracoes" subtitle="Nome do estabelecimento e regras de negocio" />

      <Card title="Geral" icon={Settings} className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome do estabelecimento" placeholder="Ex: Cafe do Bairro" value={form.establishmentName} onChange={(e) => setForm((f) => ({ ...f, establishmentName: e.target.value }))} />
          <Select
            label="Baixa de estoque"
            value={form.stockDeductionRule}
            onChange={(e) => setForm((f) => ({ ...f, stockDeductionRule: e.target.value }))}
            options={[{ value: "on_add", label: "Ao adicionar item na comanda" }, { value: "on_pay", label: "Ao pagar a comanda" }]}
          />
          <div className="space-y-3 rounded-[var(--radius-md)] bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-700 mb-2">Regras de negocio</p>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={form.allowNegativeStock === "true"} onChange={(e) => setForm((f) => ({ ...f, allowNegativeStock: e.target.checked ? "true" : "false" }))} className="rounded border-stone-300" />
              Permitir estoque negativo
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={form.requireOpenCashToSell === "true"} onChange={(e) => setForm((f) => ({ ...f, requireOpenCashToSell: e.target.checked ? "true" : "false" }))} className="rounded border-stone-300" />
              Exigir caixa aberto para registrar venda
            </label>
          </div>
          <Button type="submit" disabled={loading} loading={loading} icon={Save}>Salvar</Button>
        </form>
      </Card>
    </PageContainer>
  );
}
