"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import { useSocket } from "@/lib/socket-client";
import {
  Card,
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
import { TrendingUp, Wifi, WifiOff } from "lucide-react";

type SellerSummary = {
  sellerId: string;
  sellerName: string;
  kg: number;
  bags: number;
  total: number;
  lastSale: string;
};
type RecentSale = {
  id: string;
  identifier: string;
  sellerName: string;
  finalizedAt: string | null;
  total: number;
  items: { safraName: string; kg: number; bags: number; total: number }[];
};

export default function VendasPage() {
  const { socket, connected } = useSocket();
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/reports/vendas-vendedores?period=${period}`);
      if (!res.ok) { toast.error("Erro ao carregar vendas"); return; }
      const data = await res.json();
      setSellers(data.sellers.map((s: SellerSummary & { lastSale: Date }) => ({
        ...s,
        lastSale: typeof s.lastSale === "string" ? s.lastSale : new Date(s.lastSale).toISOString(),
      })));
      setRecentSales(data.recentSales ?? []);
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    const onSaleNew = (data: { sellerId: string; sellerName: string; kg: number; bags: number; total: number }) => {
      setSellers((prev) => {
        const idx = prev.findIndex((s) => s.sellerId === data.sellerId);
        const now = new Date().toISOString();
        if (idx >= 0) {
          const s = prev[idx];
          const next = [...prev];
          next[idx] = { ...s, kg: s.kg + data.kg, bags: s.bags + data.bags, total: s.total + data.total, lastSale: now };
          return next.sort((a, b) => new Date(b.lastSale).getTime() - new Date(a.lastSale).getTime());
        }
        return [{ sellerId: data.sellerId, sellerName: data.sellerName, kg: data.kg, bags: data.bags, total: data.total, lastSale: now }, ...prev];
      });
      setRecentSales((prev) => [{
        id: "", identifier: "—", sellerName: data.sellerName, finalizedAt: new Date().toISOString(),
        total: data.total, items: [{ safraName: "", kg: data.kg, bags: data.bags, total: data.total }],
      }, ...prev.slice(0, 19)]);
    };
    socket.on("sale:new", onSaleNew);
    return () => { socket.off("sale:new", onSaleNew); };
  }, [socket]);

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <PageTitle title="Vendas em tempo real" subtitle="Acompanhe as vendas por vendedor" />
        <div className="flex items-center gap-3">
          <Badge variant={connected ? "success" : "warning"} className="gap-1.5">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[{ value: "today", label: "Hoje" }, { value: "week", label: "Ultimos 7 dias" }]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-live="polite">
        <Card title="Vendas por vendedor" icon={TrendingUp}>
          {loading ? (
            <p className="text-stone-500 text-sm py-8 text-center">Carregando...</p>
          ) : sellers.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhuma venda no periodo" />
          ) : (
            <Table headers={["Vendedor", "Sacos", "Kg", "Total (R$)", "Ultima venda"]} isEmpty={false}>
              {sellers.map((s) => (
                <TableRow key={s.sellerId}>
                  <TableCell className="font-medium">{s.sellerName}</TableCell>
                  <TableCell align="right">{s.bags}</TableCell>
                  <TableCell align="right">{s.kg.toFixed(2)}</TableCell>
                  <TableCell align="right">R$ {s.total.toFixed(2)}</TableCell>
                  <TableCell className="text-stone-500 text-sm">{new Date(s.lastSale).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Vendas recentes">
          {recentSales.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhuma venda recente" />
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {recentSales.map((sale, idx) => (
                <li key={sale.id || `recent-${idx}`} className="border-b border-stone-100 pb-3 last:border-0">
                  <div className="flex justify-between items-start text-sm">
                    <span className="font-medium text-stone-700">{sale.sellerName}</span>
                    <span className="font-medium text-stone-700">R$ {sale.total.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {sale.items.map((i, iIdx) => (
                      <span key={iIdx}>
                        {i.safraName || "Venda"}: {i.kg.toFixed(2)} kg
                        {i.bags > 0 ? ` (${i.bags} saco${i.bags > 1 ? "s" : ""})` : ""}
                        {iIdx < sale.items.length - 1 ? " • " : ""}
                      </span>
                    ))}
                  </div>
                  {sale.finalizedAt && (
                    <div className="text-xs text-stone-400 mt-0.5">{new Date(sale.finalizedAt).toLocaleString("pt-BR")}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
