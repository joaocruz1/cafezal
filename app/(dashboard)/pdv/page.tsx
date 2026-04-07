"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Button,
  Card,
  Input,
  Modal,
  PageContainer,
  Select,
  Badge,
  EmptyState,
  SearchInput,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import {
  ShoppingCart,
  Plus,
  Trash2,
  CreditCard,
  XCircle,
  CheckCircle,
  Sprout,
  Package,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Safra = {
  id: string;
  name: string;
  year: number;
  pricePerKg: string;
  kgPerBag: string;
  active: boolean;
  currentStockKg: number;
  minStockKg: string | null;
};

type OrderItem = {
  id: string;
  safraId: string;
  quantityKg: string;
  bags: number;
  unitPrice: string;
  observation?: string | null;
  safra: { id: string; name: string };
};

type Order = {
  id: string;
  identifier: string;
  status: string;
  total?: string | null;
  items: OrderItem[];
  payments: { id: string; paymentMethod: string; amount: string }[];
};

const paymentMethodOptions = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CARD", label: "Cartão" },
  { value: "PIX", label: "Pix" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function stockBadge(current: number, min: number | null) {
  if (current <= 0) return <Badge variant="danger">Sem estoque</Badge>;
  if (min && current <= min) return <Badge variant="warning">Baixo</Badge>;
  return <Badge variant="success">Disponível</Badge>;
}

function fmt(n: number | string) {
  return Number(n).toFixed(2);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PdvPage() {
  /* ---- state ---- */
  const [safras, setSafras] = useState<Safra[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [newIdLabel, setNewIdLabel] = useState("");

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<
    { method: string; amount: string }[]
  >([{ method: "CASH", amount: "" }]);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [loading, setLoading] = useState(false);

  const [addItemModal, setAddItemModal] = useState<Safra | null>(null);
  const [addItemMode, setAddItemMode] = useState<"kg" | "bags">("kg");
  const [addItemQty, setAddItemQty] = useState("");

  const [safraSearch, setSafraSearch] = useState("");

  /* ---- data loading ---- */
  const loadSafras = useCallback(async () => {
    const res = await fetchWithAuth("/api/stock?low=false");
    if (res.ok) {
      const data: Safra[] = await res.json();
      setSafras(data.filter((s) => s.active));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await fetchWithAuth("/api/orders?status=OPEN");
    if (res.ok) setOrders(await res.json());
  }, []);

  useEffect(() => {
    loadSafras();
    loadOrders();
  }, [loadSafras, loadOrders]);

  const filteredSafras = safras.filter((s) =>
    s.name.toLowerCase().includes(safraSearch.toLowerCase())
  );

  /* ---- actions ---- */
  async function openOrder() {
    const id = newIdLabel.trim() || "Balcão";
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao abrir comanda");
        return;
      }
      const order = await res.json();
      setCurrentOrder(order);
      setOrders((prev) => [order, ...prev]);
      setNewIdLabel("");
      toast.success(`Comanda "${order.identifier}" aberta`);
    } finally {
      setLoading(false);
    }
  }

  function openAddItem(safra: Safra) {
    setAddItemModal(safra);
    setAddItemMode("kg");
    setAddItemQty("");
  }

  async function submitAddItem() {
    if (!currentOrder || currentOrder.status !== "OPEN" || !addItemModal) return;
    const qty = Number(addItemQty);
    if (!qty || qty <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }
    try {
      const body: { safraId: string; quantityKg?: number; bags?: number } = {
        safraId: addItemModal.id,
      };
      if (addItemMode === "kg") body.quantityKg = qty;
      else body.bags = qty;

      const res = await fetchWithAuth(`/api/orders/${currentOrder.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao adicionar item");
        return;
      }
      const item = await res.json();
      setCurrentOrder((o) => (o ? { ...o, items: [...o.items, item] } : o));
      setAddItemModal(null);
      toast.success(`${addItemModal.name} adicionado`);
    } catch {
      toast.error("Erro de conexão");
    }
  }

  async function removeItem(itemId: string) {
    if (!currentOrder) return;
    try {
      await fetchWithAuth(`/api/orders/${currentOrder.id}/items/${itemId}`, {
        method: "DELETE",
      });
      setCurrentOrder((o) =>
        o ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o
      );
      toast.success("Item removido");
    } catch {
      toast.error("Erro ao remover item");
    }
  }

  async function finalizeOrder() {
    if (!currentOrder || currentOrder.items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao finalizar");
        return;
      }
      const updated = await res.json();
      setCurrentOrder(updated);
      setPaymentModal(true);
      const total = Number(updated.total ?? 0);
      setPaymentForm([{ method: "CASH", amount: total.toFixed(2) }]);
    } finally {
      setLoading(false);
    }
  }

  async function submitPayment() {
    if (!currentOrder) return;
    const total = Number(currentOrder.total ?? 0);
    const sum = paymentForm.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if (sum < total) {
      toast.error("Valor pago menor que o total");
      return;
    }
    setLoading(true);
    try {
      const changeTotal = sum - total;
      const res = await fetchWithAuth(`/api/orders/${currentOrder.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: paymentForm
            .filter((p) => Number(p.amount) > 0)
            .map((p) => ({
              paymentMethod: p.method,
              amount: Number(p.amount),
              changeGiven:
                p.method === "CASH" && changeTotal > 0 ? changeTotal : undefined,
            })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao registrar pagamento");
        return;
      }
      setPaymentModal(false);
      setCurrentOrder(null);
      loadOrders();
      loadSafras();
      toast.success("Pagamento registrado com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancelOrder() {
    if (!currentOrder || !cancelReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          cancelReason: cancelReason.trim(),
        }),
      });
      if (res.ok) {
        setCurrentOrder(null);
        setCancelModal(false);
        setCancelReason("");
        loadOrders();
        toast.success("Comanda cancelada");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Erro ao cancelar");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ---- derived ---- */
  const totalCurrent =
    currentOrder?.items.reduce(
      (s, i) => s + Number(i.unitPrice) * Number(i.quantityKg),
      0
    ) ?? 0;

  const displayTotal =
    currentOrder?.status === "FINALIZED"
      ? Number(currentOrder.total)
      : totalCurrent;

  // Payment auto-change calculation
  const paymentTotal = paymentForm.reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0
  );
  const orderTotal = Number(currentOrder?.total ?? 0);
  const paymentDiff = paymentTotal - orderTotal;

  // Add item preview
  const addItemPreview = (() => {
    if (!addItemModal || !addItemQty || Number(addItemQty) <= 0) return null;
    const price = Number(addItemModal.pricePerKg);
    const kgPerBag = Number(addItemModal.kgPerBag);
    const qty = Number(addItemQty);
    if (addItemMode === "kg") {
      return { kg: qty, total: qty * price };
    }
    const totalKg = qty * kgPerBag;
    return { kg: totalKg, total: totalKg * price };
  })();

  const addItemExceedsStock = (() => {
    if (!addItemModal || !addItemPreview) return false;
    return addItemPreview.kg > addItemModal.currentStockKg;
  })();

  /* ---- status step indicator ---- */
  function StatusSteps({ status }: { status: string }) {
    const steps = [
      { key: "OPEN", label: "Aberta" },
      { key: "FINALIZED", label: "Finalizada" },
      { key: "PAID", label: "Paga" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === status);
    return (
      <div className="flex items-center gap-1 text-xs">
        {steps.map((step, idx) => (
          <span key={step.key} className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                idx <= currentIdx
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <span className="text-stone-300">→</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============= LEFT COLUMN — Comanda bar + Safra grid ============= */}
        <div className="space-y-4">
          {/* Comanda selection / creation bar */}
          <Card>
            <div className="space-y-3">
              {/* Select open orders (primary action) */}
              <Select
                value={currentOrder?.id ?? ""}
                onChange={async (e) => {
                  const id = e.target.value;
                  if (!id) {
                    setCurrentOrder(null);
                    return;
                  }
                  const res = await fetchWithAuth(`/api/orders/${id}`);
                  if (res.ok) setCurrentOrder(await res.json());
                  else setCurrentOrder(orders.find((o) => o.id === id) ?? null);
                }}
                options={[
                  { value: "", label: "Selecionar comanda aberta..." },
                  ...orders.map((o) => ({
                    value: o.id,
                    label: `${o.identifier} (#${o.id.slice(0, 8)})`,
                  })),
                ]}
              />

              {/* New order row */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Nova comanda (ex: Mesa 3)"
                    value={newIdLabel}
                    onChange={(e) => setNewIdLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && openOrder()}
                  />
                </div>
                <Button
                  onClick={openOrder}
                  disabled={loading}
                  loading={loading}
                  icon={Plus}
                  size="sm"
                >
                  Nova
                </Button>
              </div>

              {/* Current order indicator */}
              {currentOrder && (
                <div className="flex items-center justify-between bg-amber-50 rounded-[var(--radius-md)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium text-amber-900">
                      {currentOrder.identifier}
                    </span>
                  </div>
                  <StatusSteps status={currentOrder.status} />
                </div>
              )}
            </div>
          </Card>

          {/* Safra grid */}
          {currentOrder && currentOrder.status === "OPEN" && (
            <Card
              title="Safras disponíveis"
              icon={Sprout}
            >
              <SearchInput
                value={safraSearch}
                onChange={setSafraSearch}
                placeholder="Buscar safra..."
                className="mb-4"
              />
              {filteredSafras.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Nenhuma safra encontrada"
                  description={
                    safraSearch
                      ? "Tente outro termo de busca."
                      : "Cadastre safras para começar a vender."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                  {filteredSafras.map((s) => {
                    const minStock = s.minStockKg ? Number(s.minStockKg) : null;
                    const noStock = s.currentStockKg <= 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => !noStock && openAddItem(s)}
                        disabled={noStock}
                        className={`rounded-[var(--radius-md)] border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 group ${
                          noStock
                            ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                            : "border-stone-200 hover:bg-amber-50 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Sprout className="h-4 w-4 text-stone-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
                            <span className="font-medium text-stone-800">
                              {s.name}
                            </span>
                          </div>
                          <span className="text-xs text-stone-400">{s.year}</span>
                        </div>

                        <div className="text-lg font-bold text-amber-800 mb-2">
                          R$ {fmt(s.pricePerKg)}
                          <span className="text-xs font-normal text-stone-500">
                            /kg
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-stone-500">
                            {Number(s.kgPerBag).toFixed(0)} kg/saco
                          </span>
                          {stockBadge(s.currentStockKg, minStock)}
                        </div>

                        <div className="mt-1 text-xs text-stone-400">
                          {s.currentStockKg.toFixed(1)} kg em estoque
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Show payment button for finalized orders without payment */}
          {currentOrder && currentOrder.status === "FINALIZED" && (
            <Card>
              <div className="text-center space-y-3">
                <p className="text-sm text-stone-600">
                  Comanda finalizada — aguardando pagamento
                </p>
                <Button
                  onClick={() => {
                    setPaymentModal(true);
                    setPaymentForm([
                      { method: "CASH", amount: fmt(Number(currentOrder.total ?? 0)) },
                    ]);
                  }}
                  icon={CreditCard}
                  className="w-full"
                >
                  Registrar Pagamento
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ============= RIGHT COLUMN — Items panel ============= */}
        <Card
          title="Itens da comanda"
          icon={ShoppingCart}
          accent={currentOrder ? "primary" : undefined}
          footer={
            currentOrder ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-stone-500">Total</span>
                  <span
                    className="text-2xl font-bold text-stone-800"
                    aria-live="polite"
                  >
                    R$ {fmt(displayTotal)}
                  </span>
                </div>
                {currentOrder.status === "OPEN" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={finalizeOrder}
                      disabled={currentOrder.items.length === 0 || loading}
                      loading={loading}
                      variant="success"
                      icon={CheckCircle}
                      className="flex-1"
                    >
                      Finalizar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={XCircle}
                      onClick={() => setCancelModal(true)}
                      disabled={loading}
                      className="!text-red-500"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {currentOrder.status === "FINALIZED" && (
                  <Button
                    onClick={() => {
                      setPaymentModal(true);
                      setPaymentForm([
                        {
                          method: "CASH",
                          amount: fmt(Number(currentOrder.total ?? 0)),
                        },
                      ]);
                    }}
                    icon={CreditCard}
                    className="w-full"
                  >
                    Registrar Pagamento
                  </Button>
                )}
              </div>
            ) : undefined
          }
        >
          {!currentOrder ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhuma comanda selecionada"
              description="Abra ou selecione uma comanda para adicionar itens."
            />
          ) : currentOrder.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum item"
              description="Selecione uma safra à esquerda para adicionar."
            />
          ) : (
            <ul className="space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-22rem)]">
              {currentOrder.items.map((i) => {
                const subtotal = Number(i.unitPrice) * Number(i.quantityKg);
                return (
                  <li
                    key={i.id}
                    className="flex justify-between items-center py-3 px-3 border-b border-stone-100 last:border-0 rounded-[var(--radius-md)] hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-stone-700 block">
                        {i.safra.name}
                      </span>
                      <span className="text-xs text-stone-500">
                        {fmt(i.quantityKg)} kg
                        {i.bags > 0
                          ? ` (${i.bags} saco${i.bags > 1 ? "s" : ""})`
                          : ""}{" "}
                        × R$ {fmt(i.unitPrice)}/kg
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-stone-800 text-sm">
                        R$ {fmt(subtotal)}
                      </span>
                      {currentOrder.status === "OPEN" && (
                        <button
                          type="button"
                          onClick={() => removeItem(i.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                          aria-label={`Remover ${i.safra.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ============= ADD ITEM MODAL ============= */}
      <Modal
        open={!!addItemModal}
        onClose={() => setAddItemModal(null)}
        title={addItemModal ? `Adicionar: ${addItemModal.name}` : ""}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddItemModal(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitAddItem}
              icon={Plus}
              disabled={!addItemQty || Number(addItemQty) <= 0}
            >
              Adicionar
            </Button>
          </>
        }
      >
        {addItemModal && (
          <div className="space-y-4">
            {/* Info bar */}
            <div className="rounded-[var(--radius-md)] bg-stone-50 border border-stone-200 p-3 text-sm flex items-center justify-between">
              <span className="text-stone-600">
                R$ {fmt(addItemModal.pricePerKg)}/kg •{" "}
                {Number(addItemModal.kgPerBag).toFixed(0)} kg/saco
              </span>
              {stockBadge(
                addItemModal.currentStockKg,
                addItemModal.minStockKg ? Number(addItemModal.minStockKg) : null
              )}
            </div>

            <div className="text-xs text-stone-400">
              Estoque: {addItemModal.currentStockKg.toFixed(1)} kg
            </div>

            {/* Toggle tabs */}
            <div className="flex rounded-[var(--radius-md)] border border-stone-200 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setAddItemMode("kg");
                  setAddItemQty("");
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  addItemMode === "kg"
                    ? "bg-amber-600 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                Por Kg
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddItemMode("bags");
                  setAddItemQty("");
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  addItemMode === "bags"
                    ? "bg-amber-600 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                Por Sacos
              </button>
            </div>

            {/* Quantity input */}
            <Input
              type="number"
              step={addItemMode === "kg" ? "0.01" : "1"}
              min="0"
              label={addItemMode === "kg" ? "Quantidade (kg)" : "Sacos"}
              placeholder={addItemMode === "kg" ? "Ex: 60" : "Ex: 1"}
              value={addItemQty}
              onChange={(e) => setAddItemQty(e.target.value)}
            />

            {/* Live price preview */}
            {addItemPreview && (
              <div
                className={`rounded-[var(--radius-md)] p-3 text-sm border ${
                  addItemExceedsStock
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {addItemExceedsStock && (
                  <p className="font-medium mb-1">
                    ⚠ Quantidade excede o estoque disponível (
                    {addItemModal.currentStockKg.toFixed(1)} kg)
                  </p>
                )}
                <p>
                  {addItemPreview.kg.toFixed(2)} kg × R${" "}
                  {fmt(addItemModal.pricePerKg)}/kg ={" "}
                  <span className="font-bold">
                    R$ {fmt(addItemPreview.total)}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============= PAYMENT MODAL ============= */}
      <Modal
        open={paymentModal && !!currentOrder}
        onClose={() => setPaymentModal(false)}
        title="Registrar pagamento"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentModal(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={submitPayment}
              disabled={loading || paymentDiff < 0}
              loading={loading}
              icon={CreditCard}
            >
              Confirmar pagamento
            </Button>
          </>
        }
      >
        {currentOrder && (
          <div className="space-y-4">
            {/* Payment summary */}
            <div className="rounded-[var(--radius-md)] border border-stone-200 overflow-hidden">
              <div className="bg-stone-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-stone-500">Total da comanda</span>
                <span className="text-xl font-bold text-stone-800">
                  R$ {fmt(orderTotal)}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-stone-500">Valor pago</span>
                <span className="text-lg font-semibold text-stone-700">
                  R$ {fmt(paymentTotal)}
                </span>
              </div>
              <div
                className={`px-4 py-3 flex items-center justify-between border-t ${
                  paymentDiff >= 0
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <span className="text-sm font-medium">
                  {paymentDiff >= 0 ? "Troco" : "Falta"}
                </span>
                <span
                  className={`text-lg font-bold ${
                    paymentDiff >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  R$ {fmt(Math.abs(paymentDiff))}
                  {paymentDiff >= 0 && paymentDiff > 0 && " ✓"}
                </span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              {paymentForm.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 min-w-[7rem]">
                    <Select
                      label={idx === 0 ? "Forma" : undefined}
                      value={p.method}
                      onChange={(e) =>
                        setPaymentForm((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, method: e.target.value } : x
                          )
                        )
                      }
                      options={paymentMethodOptions}
                    />
                  </div>
                  <div className="flex-1 min-w-[7rem]">
                    <Input
                      type="number"
                      step="0.01"
                      label={idx === 0 ? "Valor (R$)" : undefined}
                      placeholder="0,00"
                      value={p.amount}
                      onChange={(e) =>
                        setPaymentForm((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, amount: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  {paymentForm.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentForm((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 rounded-[var(--radius-md)] text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mb-0.5"
                      aria-label="Remover forma de pagamento"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={() =>
                  setPaymentForm((prev) => [
                    ...prev,
                    { method: "PIX", amount: "" },
                  ])
                }
              >
                Adicionar forma de pagamento
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============= CANCEL MODAL ============= */}
      <Modal
        open={cancelModal}
        onClose={() => {
          setCancelModal(false);
          setCancelReason("");
        }}
        title="Cancelar comanda"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCancelModal(false);
                setCancelReason("");
              }}
            >
              Voltar
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              onClick={confirmCancelOrder}
              disabled={!cancelReason.trim() || loading}
              loading={loading}
            >
              Cancelar comanda
            </Button>
          </>
        }
      >
        <Input
          label="Motivo do cancelamento (obrigatório)"
          placeholder="Ex: Pedido duplicado"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </PageContainer>
  );
}
