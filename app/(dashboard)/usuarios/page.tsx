"use client";

import { useAuth } from "../../providers";
import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";
import {
  Alert,
  Button,
  Card,
  ConfirmModal,
  Input,
  PageContainer,
  PageTitle,
  Select,
  Table,
  TableRow,
  TableCell,
  Badge,
  SearchInput,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Users, UserPlus, ShieldCheck, ShieldOff } from "lucide-react";

type User = { id: string; email: string; name: string; profile: string; active: boolean };

const profileLabels: Record<string, string> = { ADMIN: "Admin", GERENTE: "Gerente", FINANCEIRO: "Financeiro", VENDEDOR: "Vendedor", ESTOQUE: "Estoque" };
const profileOptions = [
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "ESTOQUE", label: "Estoque" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "GERENTE", label: "Gerente" },
  { value: "ADMIN", label: "Admin" },
];

export default function UsuariosPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", profile: "VENDEDOR" });
  const [loading, setLoading] = useState(false);
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetchWithAuth("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim(), password: form.password, profile: form.profile }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao criar usuario"); return; }
      toast.success("Usuario criado com sucesso");
      setForm({ email: "", name: "", password: "", profile: "VENDEDOR" });
      load();
    } finally { setLoading(false); }
  }

  async function confirmToggleActive() {
    if (!toggleUser) return;
    setToggleLoading(true);
    try {
      const res = await fetchWithAuth(`/api/users/${toggleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !toggleUser.active }),
      });
      if (res.ok) { load(); setToggleUser(null); toast.success(`Usuario ${toggleUser.active ? "bloqueado" : "ativado"}`); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao atualizar"); }
    } finally { setToggleLoading(false); }
  }

  if (!me || !["ADMIN", "GERENTE"].includes(me.profile)) {
    return (
      <PageContainer >
        <Alert variant="error">Acesso negado. Apenas administradores e gerentes.</Alert>
      </PageContainer>
    );
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer >
      <PageTitle title="Usuarios" subtitle="Cadastro e gestao de usuarios" />

      <Card title="Novo usuario" icon={UserPlus} className="mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input type="email" label="Email" required placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Nome" required placeholder="Nome completo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input type="password" label="Senha" required minLength={6} placeholder="Minimo 6 caracteres" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            <Select label="Perfil" value={form.profile} onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value }))} options={profileOptions} />
          </div>
          <Button type="submit" disabled={loading} loading={loading} icon={UserPlus}>Criar usuario</Button>
        </form>
      </Card>

      <Card title="Lista de usuarios" icon={Users} headerActions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar usuario..." className="w-full sm:w-72" />}>
        <Table headers={["Nome", "Email", "Perfil", "Status", "Acoes"]} emptyMessage="Nenhum usuario cadastrado." isEmpty={filtered.length === 0}>
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell><Badge variant="neutral">{profileLabels[u.profile] ?? u.profile}</Badge></TableCell>
              <TableCell><Badge variant={u.active ? "success" : "danger"}>{u.active ? "Ativo" : "Bloqueado"}</Badge></TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="sm" icon={u.active ? ShieldOff : ShieldCheck} disabled={u.id === me?.id} onClick={() => setToggleUser(u)}>
                  {u.active ? "Bloquear" : "Ativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      <ConfirmModal
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={confirmToggleActive}
        title={toggleUser?.active ? "Bloquear usuario" : "Ativar usuario"}
        message={toggleUser ? `Tem certeza que deseja ${toggleUser.active ? "bloquear" : "ativar"} o usuario ${toggleUser.name}?` : ""}
        confirmLabel={toggleUser?.active ? "Bloquear" : "Ativar"}
        variant="danger"
        loading={toggleLoading}
      />
    </PageContainer>
  );
}
