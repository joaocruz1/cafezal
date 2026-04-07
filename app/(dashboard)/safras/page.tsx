"use client";

import { useAuth } from "../../providers";
import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Button,
  Card,
  Input,
  Modal,
  PageContainer,
  PageTitle,
  Table,
  TableRow,
  TableCell,
  Badge,
  SearchInput,
  EmptyState,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Sprout, Plus, Pencil, Save, X, ArrowUpDown, AlertTriangle, Package } from "lucide-react";

type Safra = {
  id: string;
  name: string;
  year: number;
  pricePerKg: string;
  kgPerBag: string;
  minStockKg: string;
  active: boolean;
  currentStockKg?: number | null;
};
type Movement = {
  id: string;
  quantityKg: number;
  type: string;
  reason: string | null;
  createdAt: string;
  createdByUser: { name: string };
};

export default function SafrasPage() {
  const { user } = useAuth();
  const canEdit = user && ["ADMIN", "GERENTE"].includes(user.profile);
  const canAdjustStock = user && ["ADMIN", "GERENTE", "ESTOQUE"].includes(user.profile);

  const [safras, setSafras] = useState<Safra[]>([]);
  const [editing, setEditing] = useState<Safra | null>(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [form, setForm] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    pricePerKg: "",
    kgPerBag: "60",
    minStockKg: "0",
    active: true,
    initialStockKg: "",
  });
  const [loading, setLoading] = useState(false);

  // Adjust stock modal
  const [adjustSafra, setAdjustSafra] = useState<Safra | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const load = useCallback(async () => {
    // Use stock endpoint to get safras with current stock
    const res = await fetchWithAuth("/api/stock?low=false");
    if (res.ok) {
      const data = await res.json();
      setSafras(data);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editing ? `/api/safras/${editing.id}` : "/api/safras";
      const method = editing ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        name: form.name,
        year: Number(form.year),
        pricePerKg: Number(form.pricePerKg),
        kgPerBag: Number(form.kgPerBag),
        minStockKg: Number(form.minStockKg),
        active: form.active,
      };
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao salvar");
        return;
      }
      const saved = await res.json();

      // If creating and initial stock was provided, create adjustment
      if (!editing && form.initialStockKg && Number(form.initialStockKg) > 0) {
        await fetchWithAuth("/api/stock/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            safraId: saved.id,
            quantityKg: Number(form.initialStockKg),
            reason: "Estoque inicial",
          }),
        });
      }

      toast.success(editing ? "Safra atualizada" : "Safra criada");
      setEditing(null);
      setForm({
        name: "",
        year: new Date().getFullYear().toString(),
        pricePerKg: "",
        kgPerBag: "60",
        minStockKg: "0",
        active: true,
        initialStockKg: "",
      });
      load();
    } finally {
      setLoading(false);
    }
  }

  function openEdit(s: Safra) {
    setEditing(s);
    setForm({
      name: s.name,
      year: String(s.year),
      pricePerKg: String(s.pricePerKg),
      kgPerBag: String(s.kgPerBag),
      minStockKg: String(s.minStockKg),
      active: s.active,
      initialStockKg: "",
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({
      name: "",
      year: new Date().getFullYear().toString(),
      pricePerKg: "",
      kgPerBag: "60",
      minStockKg: "0",
      active: true,
      initialStockKg: "",
    });
  }

  // Stock adjustment
  async function loadMovements(safraId: string) {
    const res = await fetchWithAuth(`/api/stock/safra/${safraId}/movements`);
    if (res.ok) setMovements(await res.json());
  }

  function openAdjust(s: Safra) {
    setAdjustSafra(s);
    setMovements([]);
    setAdjustQty("");
    setAdjustReason("");
    loadMovements(s.id);
  }

  async function submitAdjust() {
    if (!adjustSafra || !adjustQty || Number(adjustQty) === 0 || !adjustReason.trim()) {
      toast.error("Preencha quantidade e motivo.");
      return;
    }
    setAdjustLoading(true);
    try {
      const res = await fetchWithAuth("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          safraId: adjustSafra.id,
          quantityKg: Number(adjustQty),
          reason: adjustReason.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao ajustar");
        return;
      }
      toast.success("Estoque ajustado");
      setAdjustSafra(null);
      setAdjustQty("");
      setAdjustReason("");
      load();
    } finally {
      setAdjustLoading(false);
    }
  }

  const isLow = (s: Safra) =>
    s.currentStockKg != null && Number(s.minStockKg) > 0 && s.currentStockKg <= Number(s.minStockKg);

  const filtered = safras
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => !lowOnly || isLow(s));

  return (
    <PageContainer>
      <PageTitle title="Safras & Estoque" subtitle="Cadastro de safras, precos e controle de estoque" />

      {canEdit && (
        <Card title={editing ? "Editar safra" : "Nova safra"} icon={Sprout} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Input
                label="Nome"
                required
                placeholder="Ex: Safra 2024/2025"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                type="number"
                label="Ano"
                required
                placeholder="2024"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                label="Preco por kg (R$)"
                required
                placeholder="0,00"
                value={form.pricePerKg}
                onChange={(e) => setForm((f) => ({ ...f, pricePerKg: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                label="Kg por saco"
                required
                placeholder="60"
                value={form.kgPerBag}
                onChange={(e) => setForm((f) => ({ ...f, kgPerBag: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                min={0}
                label="Estoque minimo (kg)"
                placeholder="0"
                value={form.minStockKg}
                onChange={(e) => setForm((f) => ({ ...f, minStockKg: e.target.value }))}
              />
              {!editing && (
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  label="Estoque inicial (kg)"
                  placeholder="0 (opcional)"
                  value={form.initialStockKg}
                  onChange={(e) => setForm((f) => ({ ...f, initialStockKg: e.target.value }))}
                  leftIcon={Package}
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-stone-300"
              />
              Ativo (aparece no PDV)
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} loading={loading} icon={editing ? Save : Plus}>
                {editing ? "Salvar" : "Criar safra"}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" icon={X} onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <Card
        title="Safras"
        icon={Sprout}
        headerActions={
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-sm text-stone-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={lowOnly}
                onChange={(e) => setLowOnly(e.target.checked)}
                className="rounded border-stone-300"
              />
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Estoque baixo
            </label>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar safra..."
              className="w-full sm:w-72"
            />
          </div>
        }
      >
        <Table
          headers={[
            "Safra",
            "Ano",
            "Preco/kg",
            "Kg/saco",
            "Estoque (kg)",
            "Minimo (kg)",
            "Status",
            ...(canEdit || canAdjustStock ? ["Acoes"] : []),
          ]}
          emptyMessage={lowOnly ? "Nenhuma safra com estoque baixo." : "Nenhuma safra cadastrada."}
          isEmpty={filtered.length === 0}
        >
          {filtered.map((s) => (
            <TableRow key={s.id} className={isLow(s) ? "bg-amber-50/50" : ""}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.year}</TableCell>
              <TableCell align="right">R$ {Number(s.pricePerKg).toFixed(2)}</TableCell>
              <TableCell align="right">{Number(s.kgPerBag).toFixed(2)}</TableCell>
              <TableCell align="right">
                <span className={isLow(s) ? "text-amber-700 font-semibold" : ""}>
                  {s.currentStockKg != null ? s.currentStockKg.toFixed(2) : "—"}
                </span>
              </TableCell>
              <TableCell align="right">{Number(s.minStockKg).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Badge variant={s.active ? "success" : "neutral"}>{s.active ? "Ativo" : "Inativo"}</Badge>
                  {isLow(s) && <Badge variant="warning">Baixo</Badge>}
                </div>
              </TableCell>
              {(canEdit || canAdjustStock) && (
                <TableCell>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button type="button" variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                    )}
                    {canAdjustStock && (
                      <Button type="button" variant="ghost" size="sm" icon={ArrowUpDown} onClick={() => openAdjust(s)}>
                        Estoque
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </Table>
      </Card>

      {/* Stock adjustment modal */}
      <Modal
        open={!!adjustSafra}
        onClose={() => {
          setAdjustSafra(null);
          setAdjustQty("");
          setAdjustReason("");
        }}
        title={`Ajuste de estoque — ${adjustSafra?.name ?? ""}`}
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAdjustSafra(null);
                setAdjustQty("");
                setAdjustReason("");
              }}
            >
              Fechar
            </Button>
            <Button onClick={submitAdjust} disabled={adjustLoading} loading={adjustLoading}>
              Aplicar ajuste
            </Button>
          </>
        }
      >
        {adjustSafra && (
          <>
            <div className="rounded-[var(--radius-md)] bg-stone-50 border border-stone-200 p-3 mb-4">
              <p className="text-sm text-stone-600">
                Estoque atual:{" "}
                <strong>{adjustSafra.currentStockKg != null ? adjustSafra.currentStockKg.toFixed(2) : "—"} kg</strong>
              </p>
            </div>
            <div className="space-y-4 mb-4">
              <Input
                type="number"
                step="0.01"
                label="Quantidade em kg (+ ou -)"
                placeholder="Ex: 10 ou -5"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
              <Input
                label="Motivo (obrigatorio)"
                placeholder="Ex: Inventario"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <h4 className="font-medium text-stone-800 mb-2">Historico</h4>
            <ul className="space-y-1 text-sm max-h-48 overflow-y-auto border border-stone-100 rounded-[var(--radius-md)] p-2">
              {movements.length ? (
                movements.map((m) => (
                  <li key={m.id} className="flex justify-between py-1.5 border-b border-stone-50 last:border-0">
                    <span className="text-stone-600">
                      <Badge
                        variant={m.type === "SALE" ? "danger" : m.type === "SALE_REVERT" ? "info" : "neutral"}
                        className="mr-2"
                      >
                        {m.type === "SALE" ? "Venda" : m.type === "SALE_REVERT" ? "Estorno" : "Ajuste"}
                      </Badge>
                      {m.reason || ""} ({m.createdByUser?.name}, {new Date(m.createdAt).toLocaleString("pt-BR")})
                    </span>
                    <span className={`font-medium ${Number(m.quantityKg) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {Number(m.quantityKg) >= 0 ? "+" : ""}
                      {Number(m.quantityKg).toFixed(2)} kg
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-stone-500 py-2 text-center">Nenhum movimento.</li>
              )}
            </ul>
          </>
        )}
      </Modal>
    </PageContainer>
  );
}
