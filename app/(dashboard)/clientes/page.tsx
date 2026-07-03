"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Button,
  Card,
  ConfirmModal,
  Input,
  PageContainer,
  PageTitle,
  Table,
  TableRow,
  TableCell,
  Badge,
  SearchInput,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Contact, UserPlus, ShieldCheck, ShieldOff } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", document: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [toggleCustomer, setToggleCustomer] = useState<Customer | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetchWithAuth("/api/customers?active=false");
    if (res.ok) setCustomers(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          document: form.document.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao criar cliente"); return; }
      toast.success("Cliente criado");
      setForm({ name: "", document: "", phone: "", address: "" });
      load();
    } finally { setLoading(false); }
  }

  async function confirmToggleActive() {
    if (!toggleCustomer) return;
    setToggleLoading(true);
    try {
      const res = await fetchWithAuth(`/api/customers/${toggleCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !toggleCustomer.active }),
      });
      if (res.ok) { load(); setToggleCustomer(null); toast.success(`Cliente ${toggleCustomer.active ? "desativado" : "ativado"}`); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao atualizar"); }
    } finally { setToggleLoading(false); }
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.document ?? "").includes(search) ||
    (c.phone ?? "").includes(search)
  );

  return (
    <PageContainer>
      <PageTitle title="Clientes" subtitle="Cadastro de clientes para vincular as vendas" />

      <Card title="Novo cliente" icon={UserPlus} className="mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Nome" required placeholder="Nome do cliente" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="CNPJ/CPF" placeholder="00.000.000/0000-00" value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} />
            <Input label="Telefone" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="Endereco" placeholder="Rua, numero, bairro, cidade" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <Button type="submit" disabled={loading} loading={loading} icon={UserPlus}>Criar cliente</Button>
        </form>
      </Card>

      <Card title="Lista de clientes" icon={Contact} headerActions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." className="w-full sm:w-72" />}>
        <Table headers={["Nome", "CNPJ/CPF", "Telefone", "Status", "Acoes"]} emptyMessage="Nenhum cliente cadastrado." isEmpty={filtered.length === 0}>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.document || "—"}</TableCell>
              <TableCell>{c.phone || "—"}</TableCell>
              <TableCell><Badge variant={c.active ? "success" : "neutral"}>{c.active ? "Ativo" : "Inativo"}</Badge></TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="sm" icon={c.active ? ShieldOff : ShieldCheck} onClick={() => setToggleCustomer(c)}>
                  {c.active ? "Desativar" : "Ativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      <ConfirmModal
        open={!!toggleCustomer}
        onClose={() => setToggleCustomer(null)}
        onConfirm={confirmToggleActive}
        title={toggleCustomer?.active ? "Desativar cliente" : "Ativar cliente"}
        message={toggleCustomer ? `Tem certeza que deseja ${toggleCustomer.active ? "desativar" : "ativar"} o cliente ${toggleCustomer.name}?` : ""}
        confirmLabel={toggleCustomer?.active ? "Desativar" : "Ativar"}
        variant="danger"
        loading={toggleLoading}
      />
    </PageContainer>
  );
}
