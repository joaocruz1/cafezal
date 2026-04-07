"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../providers";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Card,
  KpiCard,
  PageContainer,
  SkeletonCard,
} from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Wallet,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardData = {
  todaySales: number;
  openOrders: number;
  lowStockCount: number;
  cashStatus: "OPEN" | "CLOSED";
  cashBalance: number;
  last7Days: { date: string; total: number }[];
  recentOrders: {
    id: string;
    identifier: string;
    status: string;
    total: number | null;
    openedAt: string;
  }[];
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {getGreeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Aqui esta o resumo do seu negocio hoje.
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={DollarSign}
            label="Vendas hoje"
            value={`R$ ${data.todaySales.toFixed(2)}`}
          />
          <KpiCard
            icon={ShoppingCart}
            label="Comandas abertas"
            value={data.openOrders}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Estoque baixo"
            value={data.lowStockCount}
          />
          <KpiCard
            icon={Wallet}
            label="Caixa"
            value={
              data.cashStatus === "OPEN"
                ? `R$ ${data.cashBalance.toFixed(2)}`
                : "Fechado"
            }
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <Card title="Vendas - ultimos 7 dias" className="lg:col-span-2">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-stone-400 text-sm">
              Carregando...
            </div>
          ) : data && data.last7Days.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#78716c" }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T12:00:00");
                      return d.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#78716c" }}
                    tickFormatter={(v: number) => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Vendas"]}
                    labelFormatter={(v) => {
                      const d = new Date(String(v) + "T12:00:00");
                      return d.toLocaleDateString("pt-BR");
                    }}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid #e7e5e4",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Bar dataKey="total" fill="#78350f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-stone-400 text-sm">
              Nenhuma venda nos ultimos 7 dias.
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card title="Acoes rapidas">
            <div className="space-y-2">
              <Link href="/pdv" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-stone-200 hover:bg-stone-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-stone-700">Abrir PDV</span>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </Link>
              <Link href="/caixa" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-stone-200 hover:bg-stone-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-stone-700">Gerenciar caixa</span>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </Link>
              <Link href="/relatorios" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-stone-200 hover:bg-stone-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-stone-700">Ver relatorios</span>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      {data && data.recentOrders.length > 0 && (
        <Card
          title="Comandas recentes"
          headerActions={
            <Link href="/comandas" className="text-sm text-amber-700 hover:text-amber-800 font-medium">
              Ver todas
            </Link>
          }
        >
          <div className="divide-y divide-stone-100">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
                    <ClipboardList className="h-4 w-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{o.identifier}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(o.openedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {o.total != null && (
                    <span className="text-sm font-medium text-stone-700">
                      R$ {Number(o.total).toFixed(2)}
                    </span>
                  )}
                  <Badge
                    variant={
                      o.status === "OPEN"
                        ? "warning"
                        : o.status === "CANCELLED"
                          ? "danger"
                          : "success"
                    }
                  >
                    {o.status === "OPEN"
                      ? "Aberta"
                      : o.status === "CANCELLED"
                        ? "Cancelada"
                        : "Finalizada"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
