"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
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
  SearchInput,
  EmptyState,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { ClipboardList, Filter, RefreshCw } from "lucide-react";

type Order = {
  id: string;
  identifier: string;
  status: string;
  total?: string | null;
  openedAt: string;
  openedByUser: { name: string };
};

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "OPEN", label: "Aberta" },
  { value: "FINALIZED", label: "Finalizada" },
  { value: "CANCELLED", label: "Cancelada" },
];

const statusBadge: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
  OPEN: { variant: "warning", label: "Aberta" },
  FINALIZED: { variant: "success", label: "Finalizada" },
  CANCELLED: { variant: "danger", label: "Cancelada" },
};

export default function ComandasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetchWithAuth(`/api/orders?${params}`);
      if (res.ok) { setOrders(await res.json()); setPage(1); }
      else toast.error("Erro ao carregar comandas");
    } catch {
      toast.error("Erro de conexao");
    }
  }, [status, from, to]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) =>
    o.identifier.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageTitle title="Comandas" subtitle="Consulte e filtre comandas por status e periodo" />

      <Card icon={Filter} title="Filtros" className="mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[10rem]">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <Input type="date" label="De" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <Input type="date" label="Ate" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="button" onClick={load} icon={RefreshCw}>Filtrar</Button>
        </div>
      </Card>

      <Card title="Comandas" headerActions={
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por identificador..." className="w-full sm:w-72" />
      }>
        <Table
          headers={["Identificador", "Status", "Total", "Aberta por", "Data"]}
          emptyMessage="Nenhuma comanda encontrada."
          isEmpty={paged.length === 0}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        >
          {paged.map((o) => {
            const badge = statusBadge[o.status] ?? { variant: "neutral" as const, label: o.status };
            return (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.identifier}</TableCell>
                <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                <TableCell align="right">{o.total != null ? `R$ ${Number(o.total).toFixed(2)}` : "—"}</TableCell>
                <TableCell>{o.openedByUser?.name ?? "—"}</TableCell>
                <TableCell className="text-stone-500 text-sm">{new Date(o.openedAt).toLocaleString("pt-BR")}</TableCell>
              </TableRow>
            );
          })}
        </Table>
      </Card>
    </PageContainer>
  );
}
