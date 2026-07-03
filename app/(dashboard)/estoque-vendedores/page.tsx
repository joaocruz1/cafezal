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
  Badge,
  EmptyState,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Truck, ArrowRightLeft, ArrowLeftRight } from "lucide-react";

type Vendedor = { id: string; name: string };
type SafraStock = { id: string; name: string; currentStockKg: number };
type Movement = {
  id: string;
  quantityKg: string;
  type: string;
  reason: string | null;
  createdAt: string;
  safra: { name: string };
  createdByUser: { name: string };
};

const movementLabels: Record<string, string> = {
  LOAD: "Carregado",
  UNLOAD: "Descarregado",
  SALE: "Venda",
  SALE_REVERT: "Estorno",
  ADJUSTMENT: "Ajuste",
};

export default function EstoqueVendedoresPage() {
  const { user } = useAuth();
  const isManager = !!user && ["ADMIN", "GERENTE", "ESTOQUE"].includes(user.profile);
  const isVendedor = user?.profile === "VENDEDOR";

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [stock, setStock] = useState<SafraStock[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [loadForm, setLoadForm] = useState({ safraId: "", quantityKg: "", reason: "" });
  const [unloadForm, setUnloadForm] = useState({ safraId: "", quantityKg: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const loadVendedores = useCallback(async () => {
    if (!isManager) return;
    const res = await fetchWithAuth("/api/vendor-stock/vendedores");
    if (res.ok) setVendedores(await res.json());
  }, [isManager]);

  const loadStock = useCallback(async (vendorId: string) => {
    if (!vendorId) { setStock([]); return; }
    const url = isVendedor ? "/api/vendor-stock?mine=true" : `/api/vendor-stock?vendorUserId=${vendorId}`;
    const res = await fetchWithAuth(url);
    if (res.ok) setStock(await res.json());
  }, [isVendedor]);

  const loadMovements = useCallback(async (vendorId: string) => {
    if (!vendorId) { setMovements([]); return; }
    const url = isVendedor ? "/api/vendor-stock/movements" : `/api/vendor-stock/movements?vendorUserId=${vendorId}`;
    const res = await fetchWithAuth(url);
    if (res.ok) setMovements(await res.json());
  }, [isVendedor]);

  useEffect(() => { loadVendedores(); }, [loadVendedores]);

  useEffect(() => {
    if (isVendedor && user) {
      setSelectedVendorId(user.id);
    }
  }, [isVendedor, user]);

  useEffect(() => {
    loadStock(selectedVendorId);
    loadMovements(selectedVendorId);
  }, [selectedVendorId, loadStock, loadMovements]);

  async function submitLoad(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/vendor-stock/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorUserId: selectedVendorId,
          safraId: loadForm.safraId,
          quantityKg: Number(loadForm.quantityKg),
          reason: loadForm.reason.trim() || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao carregar estoque"); return; }
      toast.success("Estoque carregado no carro do vendedor");
      setLoadForm({ safraId: "", quantityKg: "", reason: "" });
      loadStock(selectedVendorId);
      loadMovements(selectedVendorId);
    } finally { setLoading(false); }
  }

  async function submitUnload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/vendor-stock/unload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorUserId: selectedVendorId,
          safraId: unloadForm.safraId,
          quantityKg: Number(unloadForm.quantityKg),
          reason: unloadForm.reason.trim() || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao descarregar estoque"); return; }
      toast.success("Estoque descarregado do carro do vendedor");
      setUnloadForm({ safraId: "", quantityKg: "", reason: "" });
      loadStock(selectedVendorId);
      loadMovements(selectedVendorId);
    } finally { setLoading(false); }
  }

  if (!user || (!isManager && !isVendedor)) {
    return (
      <PageContainer>
        <Alert variant="error">Acesso negado.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle title="Estoque de Vendedores" subtitle="Estoque pessoal carregado no carro de cada vendedor" />

      {isManager && (
        <Card title="Selecionar vendedor" icon={Truck} className="mb-6">
          <Select
            label="Vendedor"
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            options={[{ value: "", label: "Selecione um vendedor..." }, ...vendedores.map((v) => ({ value: v.id, label: v.name }))]}
          />
        </Card>
      )}

      {selectedVendorId && (
        <>
          {isManager && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card title="Carregar carro" icon={ArrowRightLeft}>
                <form onSubmit={submitLoad} className="space-y-4">
                  <Select
                    label="Saco"
                    required
                    value={loadForm.safraId}
                    onChange={(e) => setLoadForm((f) => ({ ...f, safraId: e.target.value }))}
                    options={[{ value: "", label: "Selecione..." }, ...stock.map((s) => ({ value: s.id, label: s.name }))]}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    label="Quantidade (kg)"
                    required
                    placeholder="Ex: 60"
                    value={loadForm.quantityKg}
                    onChange={(e) => setLoadForm((f) => ({ ...f, quantityKg: e.target.value }))}
                  />
                  <Input
                    label="Motivo (opcional)"
                    placeholder="Ex: Saida de rota da manha"
                    value={loadForm.reason}
                    onChange={(e) => setLoadForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                  <Button type="submit" disabled={loading || !loadForm.safraId} loading={loading} icon={ArrowRightLeft}>
                    Carregar
                  </Button>
                </form>
              </Card>

              <Card title="Descarregar carro" icon={ArrowLeftRight}>
                <form onSubmit={submitUnload} className="space-y-4">
                  <Select
                    label="Saco"
                    required
                    value={unloadForm.safraId}
                    onChange={(e) => setUnloadForm((f) => ({ ...f, safraId: e.target.value }))}
                    options={[{ value: "", label: "Selecione..." }, ...stock.map((s) => ({ value: s.id, label: s.name }))]}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    label="Quantidade (kg)"
                    required
                    placeholder="Ex: 10"
                    value={unloadForm.quantityKg}
                    onChange={(e) => setUnloadForm((f) => ({ ...f, quantityKg: e.target.value }))}
                  />
                  <Input
                    label="Motivo (opcional)"
                    placeholder="Ex: Retorno de rota"
                    value={unloadForm.reason}
                    onChange={(e) => setUnloadForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                  <Button type="submit" disabled={loading || !unloadForm.safraId} loading={loading} icon={ArrowLeftRight}>
                    Descarregar
                  </Button>
                </form>
              </Card>
            </div>
          )}

          <Card title="Saldo atual" icon={Truck} className="mb-6">
            <Table headers={["Saco", "Estoque no carro (kg)"]} emptyMessage="Nenhum saco com saldo." isEmpty={stock.filter((s) => s.currentStockKg > 0).length === 0}>
              {stock.filter((s) => s.currentStockKg > 0).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell align="right">{s.currentStockKg.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>

          <Card title="Historico de movimentos" icon={Truck}>
            {movements.length === 0 ? (
              <EmptyState icon={Truck} title="Nenhum movimento" />
            ) : (
              <ul className="space-y-1 text-sm max-h-96 overflow-y-auto">
                {movements.map((m) => (
                  <li key={m.id} className="flex justify-between py-1.5 border-b border-stone-50 last:border-0">
                    <span className="text-stone-600">
                      <Badge variant={Number(m.quantityKg) >= 0 ? "success" : "danger"} className="mr-2">
                        {movementLabels[m.type] ?? m.type}
                      </Badge>
                      {m.safra.name} — {m.reason || ""} ({m.createdByUser?.name}, {new Date(m.createdAt).toLocaleString("pt-BR")})
                    </span>
                    <span className={`font-medium ${Number(m.quantityKg) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {Number(m.quantityKg) >= 0 ? "+" : ""}
                      {Number(m.quantityKg).toFixed(2)} kg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
