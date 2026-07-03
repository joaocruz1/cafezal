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
  Table,
  TableRow,
  TableCell,
  Badge,
  SearchInput,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Tags, Plus, ShieldCheck, ShieldOff } from "lucide-react";

type Category = { id: string; name: string; active: boolean };

export default function CategoriasPage() {
  const { user: me } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toggleCategory, setToggleCategory] = useState<Category | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetchWithAuth("/api/categories?active=false");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao criar categoria"); return; }
      toast.success("Categoria criada");
      setName("");
      load();
    } finally { setLoading(false); }
  }

  async function confirmToggleActive() {
    if (!toggleCategory) return;
    setToggleLoading(true);
    try {
      const res = await fetchWithAuth(`/api/categories/${toggleCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !toggleCategory.active }),
      });
      if (res.ok) { load(); setToggleCategory(null); toast.success(`Categoria ${toggleCategory.active ? "desativada" : "ativada"}`); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Erro ao atualizar"); }
    } finally { setToggleLoading(false); }
  }

  if (!me || !["ADMIN", "GERENTE"].includes(me.profile)) {
    return (
      <PageContainer>
        <Alert variant="error">Acesso negado. Apenas administradores e gerentes.</Alert>
      </PageContainer>
    );
  }

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer>
      <PageTitle title="Categorias" subtitle="Categorias de sacos (ex: Cafe especial, Caixa, Cafe expresso)" />

      <Card title="Nova categoria" icon={Tags} className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Input label="Nome" required placeholder="Ex: Cafe especial" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} loading={loading} icon={Plus}>Criar categoria</Button>
        </form>
      </Card>

      <Card title="Lista de categorias" icon={Tags} headerActions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar categoria..." className="w-full sm:w-72" />}>
        <Table headers={["Nome", "Status", "Acoes"]} emptyMessage="Nenhuma categoria cadastrada." isEmpty={filtered.length === 0}>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell><Badge variant={c.active ? "success" : "neutral"}>{c.active ? "Ativa" : "Inativa"}</Badge></TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="sm" icon={c.active ? ShieldOff : ShieldCheck} onClick={() => setToggleCategory(c)}>
                  {c.active ? "Desativar" : "Ativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      <ConfirmModal
        open={!!toggleCategory}
        onClose={() => setToggleCategory(null)}
        onConfirm={confirmToggleActive}
        title={toggleCategory?.active ? "Desativar categoria" : "Ativar categoria"}
        message={toggleCategory ? `Tem certeza que deseja ${toggleCategory.active ? "desativar" : "ativar"} a categoria ${toggleCategory.name}?` : ""}
        confirmLabel={toggleCategory?.active ? "Desativar" : "Ativar"}
        variant="danger"
        loading={toggleLoading}
      />
    </PageContainer>
  );
}
