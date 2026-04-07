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
  EmptyState,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Wallet, DollarSign, ArrowDownCircle, ArrowUpCircle, Clock, Lock } from "lucide-react";

type CashRegister = {
  id: string;
  openedAt: string;
  closedAt?: string | null;
  openingBalance: string;
  closingBalance?: string | null;
  status: string;
  openedByUser: { name: string };
  closedByUser?: { name: string } | null;
  cashMovements?: { id: string; type: string; amount: string; description: string | null; createdAt: string }[];
};

export default function CaixaPage() {
  const [openCash, setOpenCash] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closeBalance, setCloseBalance] = useState("");
  const [movementType, setMovementType] = useState<"MANUAL_IN" | "MANUAL_OUT">("MANUAL_IN");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOpen = useCallback(async () => {
    const res = await fetchWithAuth("/api/cash");
    if (res.ok) setOpenCash(await res.json());
    else setOpenCash(null);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetchWithAuth("/api/cash/history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => { loadOpen(); loadHistory(); }, [loadOpen, loadHistory]);

  async function openCashRegister() {
    const val = Number(openingBalance);
    if (Number.isNaN(val) || val < 0) { toast.error("Valor inicial invalido"); return; }
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", openingBalance: val }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao abrir caixa"); return; }
      setOpeningBalance("");
      loadOpen();
      toast.success("Caixa aberto com sucesso!");
    } finally { setLoading(false); }
  }

  async function closeCashRegister() {
    const val = closeBalance === "" ? null : Number(closeBalance);
    if (val !== null && (Number.isNaN(val) || val < 0)) { toast.error("Valor de conferencia invalido"); return; }
    if (!openCash) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/cash/${openCash.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close", closingBalance: val }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao fechar caixa"); return; }
      setCloseBalance("");
      loadOpen();
      loadHistory();
      toast.success("Caixa fechado");
    } finally { setLoading(false); }
  }

  async function addMovement() {
    const amount = Number(movementAmount);
    if (Number.isNaN(amount) || amount <= 0 || !movementDesc.trim()) { toast.error("Valor positivo e descricao sao obrigatorios"); return; }
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/cash/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: movementType, amount, description: movementDesc.trim() }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao registrar movimento"); return; }
      setMovementAmount("");
      setMovementDesc("");
      loadOpen();
      toast.success("Movimento registrado");
    } finally { setLoading(false); }
  }

  const totalIn = openCash?.cashMovements?.filter((m) => m.type === "SALE" || m.type === "MANUAL_IN").reduce((s, m) => s + Number(m.amount), 0) ?? 0;
  const totalOut = openCash?.cashMovements?.filter((m) => m.type === "MANUAL_OUT").reduce((s, m) => s + Number(m.amount), 0) ?? 0;
  const expectedBalance = Number(openCash?.openingBalance ?? 0) + totalIn - totalOut;

  return (
    <PageContainer>
      <PageTitle title="Caixa" subtitle="Abertura, fechamento e movimentacoes" />

      {!openCash ? (
        <Card title="Abrir caixa" icon={Wallet} accent="warning">
          <p className="text-sm text-stone-600 mb-4">Nenhum caixa aberto. Informe o valor inicial para abrir.</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[10rem] max-w-xs">
              <Input type="number" step="0.01" min={0} label="Valor inicial (R$)" placeholder="0,00" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} leftIcon={DollarSign} />
            </div>
            <Button onClick={openCashRegister} disabled={loading} loading={loading} icon={Wallet}>Abrir caixa</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card title="Caixa aberto" icon={Wallet} accent="success" headerActions={<Badge variant="success">Aberto</Badge>}>
            <p className="text-sm text-stone-600 mb-3">
              Aberto em {new Date(openCash.openedAt).toLocaleString("pt-BR")} por {openCash.openedByUser?.name}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-[var(--radius-md)] bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Saldo inicial</p>
                <p className="text-sm font-semibold text-stone-700">R$ {Number(openCash.openingBalance).toFixed(2)}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">Entradas</p>
                <p className="text-sm font-semibold text-emerald-700">R$ {totalIn.toFixed(2)}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-red-50 p-3">
                <p className="text-xs text-red-600">Saidas</p>
                <p className="text-sm font-semibold text-red-700">R$ {totalOut.toFixed(2)}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-amber-50 p-3">
                <p className="text-xs text-amber-600">Saldo esperado</p>
                <p className="text-sm font-semibold text-amber-700">R$ {expectedBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[10rem] max-w-xs">
                <Input type="number" step="0.01" label="Valor conferido" placeholder="0,00" value={closeBalance} onChange={(e) => setCloseBalance(e.target.value)} />
              </div>
              <Button onClick={closeCashRegister} disabled={loading} loading={loading} variant="warning" icon={Lock}>Fechar caixa</Button>
            </div>
          </Card>

          <Card title="Entrada / Saida manual" icon={DollarSign}>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[8rem] max-w-[10rem]">
                <Select label="Tipo" value={movementType} onChange={(e) => setMovementType(e.target.value as "MANUAL_IN" | "MANUAL_OUT")} options={[{ value: "MANUAL_IN", label: "Entrada" }, { value: "MANUAL_OUT", label: "Saida" }]} />
              </div>
              <div className="flex-1 min-w-[7rem] max-w-[10rem]">
                <Input type="number" step="0.01" min={0.01} label="Valor" placeholder="0,00" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input label="Descricao / motivo" placeholder="Ex: Sangria" value={movementDesc} onChange={(e) => setMovementDesc(e.target.value)} />
              </div>
              <Button onClick={addMovement} disabled={loading} loading={loading} icon={ArrowDownCircle}>Registrar</Button>
            </div>
          </Card>

          <Card title="Movimentacoes do dia" icon={Clock}>
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {openCash.cashMovements?.length ? (
                openCash.cashMovements.map((m) => (
                  <li key={m.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={m.type === "MANUAL_OUT" ? "danger" : "success"}>
                        {m.type === "SALE" ? "Venda" : m.type === "MANUAL_IN" ? "Entrada" : "Saida"}
                      </Badge>
                      <span className="text-stone-600">{m.description || ""}</span>
                    </div>
                    <span className={`font-medium ${m.type === "MANUAL_OUT" ? "text-red-600" : "text-emerald-600"}`}>
                      {m.type === "MANUAL_OUT" ? "-" : "+"} R$ {Number(m.amount).toFixed(2)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-stone-500 py-4 text-center">Nenhum movimento ainda.</li>
              )}
            </ul>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <Card title="Historico de caixas">
          <Table headers={["Aberto em", "Fechado em", "Abertura", "Fechamento", "Aberto por"]} emptyMessage="Nenhum caixa fechado." isEmpty={history.length === 0}>
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{new Date(h.openedAt).toLocaleString("pt-BR")}</TableCell>
                <TableCell>{h.closedAt ? new Date(h.closedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                <TableCell align="right">R$ {Number(h.openingBalance).toFixed(2)}</TableCell>
                <TableCell align="right">{h.closingBalance != null ? `R$ ${Number(h.closingBalance).toFixed(2)}` : "—"}</TableCell>
                <TableCell>{h.openedByUser?.name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
      </div>
    </PageContainer>
  );
}
