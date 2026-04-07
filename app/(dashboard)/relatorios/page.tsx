"use client";

import { useAuth } from "../../providers";
import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Button,
  Card,
  PageContainer,
  PageTitle,
  Badge,
  Table,
  TableRow,
  TableCell,
  DateRangePicker,
  EmptyState,
} from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Award,
  Ban,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const toDate = (d: Date) => d.toISOString().slice(0, 10);
const today = toDate(new Date());
const firstDay = toDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

type TabKey = "sales" | "payment" | "top" | "cancelled" | "cash" | "low";

const tabs: { key: TabKey; label: string; icon: typeof BarChart3; roles?: string[] }[] = [
  { key: "sales", label: "Vendas", icon: TrendingUp },
  { key: "payment", label: "Pagamentos", icon: CreditCard },
  { key: "top", label: "Mais vendidos", icon: Award },
  { key: "cash", label: "Mov. caixa", icon: Wallet },
  { key: "low", label: "Estoque baixo", icon: AlertTriangle },
  { key: "cancelled", label: "Canceladas", icon: Ban, roles: ["ADMIN", "GERENTE"] },
];

const PIE_COLORS = ["#78350f", "#b45309", "#d97706", "#059669", "#2563eb"];
const METHOD_LABELS: Record<string, string> = { CASH: "Dinheiro", CARD: "Cartao", PIX: "Pix" };

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [tab, setTab] = useState<TabKey>("sales");
  const [sales, setSales] = useState<{ orders: { id: string; identifier: string; total: string; finalizedAt: string }[]; total: number } | null>(null);
  const [byPayment, setByPayment] = useState<{ byMethod: Record<string, number>; total: number } | null>(null);
  const [topSafras, setTopSafras] = useState<{ safraId: string; name: string; quantityKg: number; bags: number; revenue: number }[]>([]);
  const [cancelled, setCancelled] = useState<{ id: string; cancelReason: string; cancelledByUser?: { name: string }; cancelledAt: string }[]>([]);
  const [cashMovements, setCashMovements] = useState<{ type: string; description: string; amount: string; createdAt: string }[]>([]);
  const [lowStock, setLowStock] = useState<{ name: string; currentStockKg: number; minStockKg: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "sales") {
        const res = await fetchWithAuth(`/api/reports/sales?from=${from}&to=${to}`);
        if (res.ok) setSales(await res.json());
      } else if (tab === "payment") {
        const res = await fetchWithAuth(`/api/reports/by-payment?from=${from}&to=${to}`);
        if (res.ok) setByPayment(await res.json());
      } else if (tab === "top") {
        const res = await fetchWithAuth(`/api/reports/top-products?from=${from}&to=${to}&limit=20`);
        if (res.ok) setTopSafras(await res.json());
      } else if (tab === "cancelled") {
        const res = await fetchWithAuth(`/api/reports/cancelled?from=${from}&to=${to}`);
        if (res.ok) setCancelled(await res.json());
      } else if (tab === "cash") {
        const res = await fetchWithAuth(`/api/reports/cash-movements?from=${from}&to=${to}`);
        if (res.ok) setCashMovements(await res.json());
      } else if (tab === "low") {
        const res = await fetchWithAuth("/api/reports/low-stock");
        if (res.ok) setLowStock(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [from, to, tab]);

  useEffect(() => { load(); }, [load]);

  const visibleTabs = tabs.filter((t) => !t.roles || (user && t.roles.includes(user.profile)));

  return (
    <PageContainer>
      <PageTitle title="Relatorios" subtitle="Vendas, pagamentos e estoque por periodo" />

      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            <Button type="button" onClick={load} disabled={loading} loading={loading} icon={BarChart3}>
              Atualizar
            </Button>
          </div>
          <div role="tablist" aria-label="Tipo de relatorio" className="flex gap-1 flex-wrap border-t border-stone-100 pt-3">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`panel-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-amber-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <Spinner className="text-stone-400" />
          <span className="text-sm text-stone-500">Carregando...</span>
        </div>
      )}

      {/* Sales tab */}
      {!loading && tab === "sales" && sales && (
        <div role="tabpanel" id="panel-sales" className="space-y-4">
          <Card title={`Total no periodo: R$ ${sales.total.toFixed(2)}`} accent="primary">
            {sales.orders.length > 0 ? (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sales.orders.slice(0, 30).map((o) => ({ name: o.identifier, total: Number(o.total) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "Total"]} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e7e5e4", fontSize: "0.875rem" }} />
                    <Bar dataKey="total" fill="#78350f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            <Table headers={["Identificador", "Total", "Data"]} emptyMessage="Nenhuma venda no periodo." isEmpty={sales.orders.length === 0}>
              {sales.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.identifier}</TableCell>
                  <TableCell align="right">R$ {Number(o.total).toFixed(2)}</TableCell>
                  <TableCell>{o.finalizedAt ? new Date(o.finalizedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Payment tab */}
      {!loading && tab === "payment" && byPayment && (
        <div role="tabpanel" id="panel-payment">
          <Card title={`Total: R$ ${byPayment.total.toFixed(2)}`} accent="info">
            {Object.keys(byPayment.byMethod).length > 0 ? (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(byPayment.byMethod).map(([method, value]) => ({ name: METHOD_LABELS[method] || method, value }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {Object.keys(byPayment.byMethod).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `R$ ${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e7e5e4", fontSize: "0.875rem" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={CreditCard} title="Nenhum dado no periodo" />
            )}
          </Card>
        </div>
      )}

      {/* Top products tab */}
      {!loading && tab === "top" && (
        <div role="tabpanel" id="panel-top">
          <Card title="Mais vendidos (por safra)" accent="success">
            {topSafras.length > 0 ? (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSafras} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} width={120} />
                    <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "Faturamento"]} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e7e5e4", fontSize: "0.875rem" }} />
                    <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            <Table headers={["Safra", "Kg", "Sacos", "Faturamento"]} emptyMessage="Nenhum dado no periodo." isEmpty={topSafras.length === 0}>
              {topSafras.map((p) => (
                <TableRow key={p.safraId}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell align="right">{p.quantityKg.toFixed(2)}</TableCell>
                  <TableCell align="right">{p.bags}</TableCell>
                  <TableCell align="right">R$ {p.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Cancelled tab */}
      {!loading && tab === "cancelled" && (
        <div role="tabpanel" id="panel-cancelled">
          <Card title="Comandas canceladas" accent="danger">
            <Table headers={["Motivo", "Cancelado por", "Data"]} emptyMessage="Nenhuma comanda cancelada no periodo." isEmpty={cancelled.length === 0}>
              {cancelled.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.cancelReason ?? "—"}</TableCell>
                  <TableCell>{o.cancelledByUser?.name ?? "—"}</TableCell>
                  <TableCell>{o.cancelledAt ? new Date(o.cancelledAt).toLocaleString("pt-BR") : "—"}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Cash movements tab */}
      {!loading && tab === "cash" && (
        <div role="tabpanel" id="panel-cash">
          <Card title="Movimentacoes de caixa" accent="warning">
            <Table headers={["Tipo", "Descricao", "Valor", "Data"]} emptyMessage="Nenhum movimento no periodo." isEmpty={cashMovements.length === 0}>
              {cashMovements.map((m, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge variant={m.type === "SALE" ? "success" : m.type === "MANUAL_IN" ? "info" : "danger"}>
                      {m.type === "SALE" ? "Venda" : m.type === "MANUAL_IN" ? "Entrada" : "Saida"}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.description ?? "—"}</TableCell>
                  <TableCell align="right">R$ {Number(m.amount).toFixed(2)}</TableCell>
                  <TableCell>{new Date(m.createdAt).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Low stock tab */}
      {!loading && tab === "low" && (
        <div role="tabpanel" id="panel-low">
          <Card title="Estoque baixo" accent="warning">
            <Table headers={["Safra", "Estoque (kg)", "Minimo (kg)"]} emptyMessage="Nenhuma safra com estoque baixo." isEmpty={lowStock.length === 0}>
              {lowStock.map((p, i) => (
                <TableRow key={i} className="bg-amber-50/50">
                  <TableCell className="font-medium text-amber-900">{p.name}</TableCell>
                  <TableCell align="right">{p.currentStockKg.toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(p.minStockKg).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
