"use client";

import { useRef, useState } from "react";
import { PageContainer, PageTitle, Card, Badge } from "@/components/ui";
import {
  BookOpen,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  Wallet,
  Sprout,
  PackagePlus,
  Truck,
  Contact,
  Tags,
  Users,
  BarChart3,
  Settings,
  CalendarCheck,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tipos e helpers                                                    */
/* ------------------------------------------------------------------ */

type Profile = "ADMIN" | "GERENTE" | "FINANCEIRO" | "VENDEDOR" | "ESTOQUE";

const ALL_PROFILES: Profile[] = ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR", "ESTOQUE"];

const profileLabels: Record<Profile, string> = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  FINANCEIRO: "Financeiro",
  VENDEDOR: "Vendedor",
  ESTOQUE: "Estoque",
};

function ProfileChips({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === ALL_PROFILES.length) {
    return <Badge variant="neutral">Todos os perfis</Badge>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {profiles.map((p) => (
        <Badge key={p} variant="info">
          {profileLabels[p]}
        </Badge>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Seções (índice)                                                    */
/* ------------------------------------------------------------------ */

type SectionDef = {
  id: string;
  title: string;
  icon: LucideIcon;
  profiles: Profile[];
};

const SECTIONS: SectionDef[] = [
  { id: "introducao", title: "Introdução", icon: BookOpen, profiles: ALL_PROFILES },
  { id: "perfis", title: "Perfis e permissões", icon: ShieldCheck, profiles: ALL_PROFILES },
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, profiles: ALL_PROFILES },
  { id: "pdv", title: "PDV — fluxo completo da venda", icon: ShoppingCart, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { id: "comandas", title: "Comandas (histórico)", icon: ClipboardList, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { id: "vendas", title: "Vendas em tempo real", icon: TrendingUp, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { id: "caixa", title: "Caixa", icon: Wallet, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { id: "sacos", title: "Sacos & Estoque", icon: Sprout, profiles: ALL_PROFILES },
  { id: "entrada", title: "Entrada de Estoque", icon: PackagePlus, profiles: ["ADMIN", "GERENTE", "ESTOQUE"] },
  { id: "estoque-vendedores", title: "Estoque de Vendedores", icon: Truck, profiles: ["ADMIN", "GERENTE", "ESTOQUE", "VENDEDOR"] },
  { id: "clientes", title: "Clientes", icon: Contact, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { id: "categorias", title: "Categorias", icon: Tags, profiles: ["ADMIN", "GERENTE"] },
  { id: "usuarios", title: "Usuários", icon: Users, profiles: ["ADMIN", "GERENTE"] },
  { id: "relatorios", title: "Relatórios", icon: BarChart3, profiles: ["ADMIN", "GERENTE", "FINANCEIRO", "ESTOQUE"] },
  { id: "configuracoes", title: "Configurações", icon: Settings, profiles: ["ADMIN", "GERENTE"] },
  { id: "rotina", title: "Rotina típica de um dia", icon: CalendarCheck, profiles: ALL_PROFILES },
];

/* ------------------------------------------------------------------ */
/*  Componente de seção (acordeão)                                     */
/* ------------------------------------------------------------------ */

function GuideSection({
  section,
  open,
  onToggle,
  children,
}: {
  section: SectionDef;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  return (
    <div
      id={section.id}
      className="mb-3 rounded-xl border border-stone-200 bg-white shadow-sm scroll-mt-4"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 rounded-xl transition-colors"
      >
        <Icon className="h-5 w-5 text-amber-700 flex-shrink-0" />
        <span className="font-semibold text-stone-800 flex-1">{section.title}</span>
        <span className="hidden sm:block">
          <ProfileChips profiles={section.profiles} />
        </span>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-stone-100 text-sm text-stone-700 leading-relaxed space-y-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-stone-900">
          <div className="sm:hidden pt-2">
            <ProfileChips profiles={section.profiles} />
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900">
      💡 {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */

export default function GuiaPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    introducao: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  function toggle(id: string) {
    setOpenSections((s) => ({ ...s, [id]: !s[id] }));
  }

  function goTo(id: string) {
    setOpenSections((s) => ({ ...s, [id]: true }));
    // aguarda o conteúdo abrir antes de rolar
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <PageContainer>
      <PageTitle
        title="Guia do Sistema"
        subtitle="Tutorial completo — como usar cada aba e cada fluxo do sistema"
      />

      {/* Índice */}
      <Card title="Índice" icon={BookOpen} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <span className="text-xs text-stone-400 w-5 text-right">{i + 1}.</span>
                <Icon className="h-4 w-4 text-amber-700 flex-shrink-0" />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div ref={containerRef}>
        {/* 1. Introdução */}
        <GuideSection section={SECTIONS[0]} open={!!openSections["introducao"]} onToggle={() => toggle("introducao")}>
          <p>
            Este sistema controla toda a operação de venda de café: <strong>comandas e pagamentos (PDV)</strong>,{" "}
            <strong>caixa</strong>, <strong>estoque central e estoque dos vendedores</strong>, cadastros
            (sacos, categorias, clientes, usuários) e <strong>relatórios</strong>.
          </p>
          <p>
            O guia está organizado por aba do menu lateral, na mesma ordem em que elas aparecem. Cada seção
            mostra <strong>etiquetas de perfil</strong> indicando quais tipos de usuário têm acesso àquela tela
            — se uma aba não aparece no seu menu, é porque o seu perfil não tem permissão para ela.
          </p>
          <Tip>
            Use o índice acima para pular direto para a seção desejada. A seção{" "}
            <strong>&quot;Rotina típica de um dia&quot;</strong> no final mostra o fluxo completo de trabalho, do
            início ao fim do expediente.
          </Tip>
        </GuideSection>

        {/* 2. Perfis */}
        <GuideSection section={SECTIONS[1]} open={!!openSections["perfis"]} onToggle={() => toggle("perfis")}>
          <p>Existem 5 perfis de usuário. Cada um vê apenas as abas e ações do seu papel:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="py-2 pr-4 font-medium">Perfil</th>
                  <th className="py-2 font-medium">O que pode fazer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-2 pr-4 align-top"><Badge variant="info">Admin</Badge></td>
                  <td className="py-2">Acesso total: todas as telas, usuários, configurações e exclusões.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 align-top"><Badge variant="info">Gerente</Badge></td>
                  <td className="py-2">
                    Praticamente tudo: vendas, caixa, estoque, cadastros, usuários, configurações e relatórios.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 align-top"><Badge variant="info">Financeiro</Badge></td>
                  <td className="py-2">
                    Vende no PDV, opera o caixa, consulta comandas/vendas/relatórios e pode excluir nota fiscal
                    anexada. Não mexe em estoque nem cadastros de sacos.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 align-top"><Badge variant="info">Vendedor</Badge></td>
                  <td className="py-2">
                    Vende no PDV usando o <strong>estoque do próprio carro</strong>, consulta suas comandas e
                    vendas, cadastra clientes e acompanha seu estoque. Não acessa relatórios nem configurações.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 align-top"><Badge variant="info">Estoque</Badge></td>
                  <td className="py-2">
                    Cuida do estoque: ajustes nos sacos, entrada de mercadoria, carga/descarga dos vendedores e
                    relatórios. Não vende no PDV.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GuideSection>

        {/* 3. Dashboard */}
        <GuideSection section={SECTIONS[2]} open={!!openSections["dashboard"]} onToggle={() => toggle("dashboard")}>
          <p>É a tela inicial, com o resumo do dia:</p>
          <ul>
            <li><strong>Vendas hoje</strong> — total em R$ vendido no dia.</li>
            <li><strong>Comandas abertas</strong> — quantas comandas ainda não foram finalizadas.</li>
            <li><strong>Estoque baixo</strong> — quantos sacos estão abaixo do estoque mínimo cadastrado.</li>
            <li><strong>Caixa</strong> — saldo do caixa aberto, ou &quot;Fechado&quot; se não houver caixa aberto.</li>
          </ul>
          <p>
            Abaixo dos indicadores há o <strong>gráfico de vendas dos últimos 7 dias</strong>, atalhos rápidos
            (PDV, Caixa, Relatórios) e a lista das <strong>comandas recentes</strong> com status e valor.
          </p>
        </GuideSection>

        {/* 4. PDV */}
        <GuideSection section={SECTIONS[3]} open={!!openSections["pdv"]} onToggle={() => toggle("pdv")}>
          <p>
            O PDV é onde a venda acontece. A tela tem duas colunas: à esquerda os <strong>sacos disponíveis</strong>{" "}
            e à direita os <strong>itens da comanda</strong> selecionada. O fluxo completo:
          </p>
          <ol>
            <li>
              <strong>Abrir a comanda</strong> — digite um identificador (ex: nome do cliente ou &quot;Balcão&quot;) e
              clique em criar. Opcionalmente, selecione um <strong>cliente cadastrado</strong> no seletor — dá para
              vincular ou trocar o cliente enquanto a comanda estiver aberta.
            </li>
            <li>
              <strong>Adicionar itens</strong> — clique em um saco na lista. No modal, escolha informar a
              quantidade <strong>por Kg</strong> ou <strong>por Sacos</strong> (o sistema converte usando o
              kg/saco cadastrado). O preço é calculado na hora (kg × preço/kg). Se a quantidade exceder o
              estoque, aparece um aviso.
            </li>
            <li>
              <strong>Editar ou remover itens</strong> — use o ícone de lápis para mudar a quantidade e o X para
              remover, enquanto a comanda estiver aberta.
            </li>
            <li>
              <strong>Finalizar</strong> — com pelo menos 1 item, clique em <strong>&quot;Finalizar&quot;</strong>. A
              comanda trava (não aceita mais itens) e fica aguardando pagamento.
            </li>
            <li>
              <strong>Registrar Pagamento</strong> — escolha a forma: <Badge variant="neutral">Dinheiro</Badge>{" "}
              <Badge variant="neutral">Cartão</Badge> <Badge variant="neutral">Pix</Badge>. Dá para{" "}
              <strong>dividir em várias formas</strong> (ex: metade Pix, metade dinheiro) com o botão de adicionar
              forma de pagamento. O valor pago precisa cobrir o total; se pagar em dinheiro acima do total, o{" "}
              <strong>troco é calculado automaticamente</strong>. O pagamento entra no caixa aberto como movimento
              de venda.
            </li>
            <li>
              <strong>Avaliar a venda</strong> — após o pagamento abre o modal de avaliação com{" "}
              <strong>estrelas de 1 a 5</strong> e comentário opcional. Pode pular; a avaliação é opcional.
            </li>
            <li>
              <strong>Anexar nota (PDF)</strong> — com a comanda finalizada, use o botão{" "}
              <strong>&quot;Anexar nota&quot;</strong> para subir o PDF da nota fiscal (limite 4MB). Também dá para
              fazer isso depois, pela aba Comandas.
            </li>
          </ol>
          <p>
            <strong>Cancelar comanda:</strong> enquanto aberta, o botão &quot;Cancelar&quot; pede um{" "}
            <strong>motivo obrigatório</strong>. Se o estoque já tinha sido baixado, o cancelamento{" "}
            <strong>devolve o estoque automaticamente</strong> (estorno).
          </p>
          <Tip>
            Para o perfil <strong>Vendedor</strong>, o PDV mostra e desconta o{" "}
            <strong>estoque do próprio carro</strong> (veja &quot;Estoque de Vendedores&quot;), não o estoque
            central. Para os demais perfis, a venda sai do estoque central.
          </Tip>
        </GuideSection>

        {/* 5. Comandas */}
        <GuideSection section={SECTIONS[4]} open={!!openSections["comandas"]} onToggle={() => toggle("comandas")}>
          <p>Histórico de todas as comandas, para consulta e conferência:</p>
          <ul>
            <li>
              <strong>Filtros</strong> — por status (<Badge variant="warning">Aberta</Badge>{" "}
              <Badge variant="success">Finalizada</Badge> <Badge variant="danger">Cancelada</Badge>) e por
              período (&quot;De&quot; / &quot;Até&quot;), além da busca por identificador.
            </li>
            <li>
              <strong>Tabela</strong> — identificador, status, total, quem abriu, data/hora e a coluna{" "}
              <strong>&quot;Nota&quot;</strong>.
            </li>
            <li>
              <strong>Coluna Nota</strong> — em comandas finalizadas: <strong>&quot;Anexar nota&quot;</strong> sobe o
              PDF; se já houver nota, aparecem os botões <strong>&quot;Baixar&quot;</strong> e{" "}
              <strong>&quot;Excluir&quot;</strong>. Excluir é restrito a Admin, Gerente e Financeiro e pede
              confirmação. Cada comanda aceita uma nota; para trocar, exclua e anexe de novo.
            </li>
          </ul>
        </GuideSection>

        {/* 6. Vendas */}
        <GuideSection section={SECTIONS[5]} open={!!openSections["vendas"]} onToggle={() => toggle("vendas")}>
          <p>Acompanhamento das vendas <strong>em tempo real</strong>, por vendedor:</p>
          <ul>
            <li>
              <strong>Filtro de período</strong> — &quot;Hoje&quot; ou &quot;Últimos 7 dias&quot;.
            </li>
            <li>
              <strong>Tabela por vendedor</strong> — sacos vendidos, kg, total em R$ e horário da última venda.
            </li>
            <li>
              <strong>Vendas recentes</strong> — lista ao lado que atualiza sozinha a cada venda registrada.
            </li>
            <li>
              <strong>Indicador de conexão</strong> — <Badge variant="success">Conectado</Badge> significa que a
              tela está recebendo atualizações ao vivo; <Badge variant="warning">Desconectado</Badge> indica que é
              preciso recarregar a página para reconectar.
            </li>
          </ul>
        </GuideSection>

        {/* 7. Caixa */}
        <GuideSection section={SECTIONS[6]} open={!!openSections["caixa"]} onToggle={() => toggle("caixa")}>
          <p>Controle do dinheiro do dia. O ciclo do caixa:</p>
          <ol>
            <li>
              <strong>Abrir o caixa</strong> — informe o <strong>valor inicial</strong> (fundo de troco) e clique
              em &quot;Abrir caixa&quot;.
            </li>
            <li>
              <strong>Movimentos automáticos</strong> — cada pagamento de comanda entra sozinho como movimento{" "}
              <Badge variant="success">Venda</Badge>.
            </li>
            <li>
              <strong>Entrada / Saída manual</strong> — registre <Badge variant="success">Entrada</Badge>{" "}
              (suprimento, reforço de troco) ou <Badge variant="danger">Saída</Badge> (sangria, pagamento de
              despesa) com valor e descrição.
            </li>
            <li>
              <strong>Saldo esperado</strong> — o card mostra em tempo real: saldo inicial + entradas − saídas.
            </li>
            <li>
              <strong>Fechar o caixa</strong> — conte o dinheiro físico, informe o <strong>valor conferido</strong>{" "}
              e clique em &quot;Fechar caixa&quot;. O sistema guarda a comparação entre o esperado e o conferido.
            </li>
          </ol>
          <p>
            O <strong>histórico de caixas</strong> na parte de baixo lista as sessões anteriores com abertura,
            fechamento e responsável.
          </p>
          <Tip>
            Em Configurações existe a regra <strong>&quot;Exigir caixa aberto para registrar venda&quot;</strong> —
            se estiver ativa, o PDV bloqueia pagamentos enquanto o caixa não for aberto.
          </Tip>
        </GuideSection>

        {/* 8. Sacos & Estoque */}
        <GuideSection section={SECTIONS[7]} open={!!openSections["sacos"]} onToggle={() => toggle("sacos")}>
          <p>
            Cadastro dos produtos (sacos de café) e controle do <strong>estoque central</strong>. Todos os perfis
            visualizam; criar/editar é para Admin e Gerente, e ajustes de estoque também para o perfil Estoque.
          </p>
          <ul>
            <li>
              <strong>Cadastrar saco</strong> — nome, ano, <strong>preço por kg</strong>,{" "}
              <strong>kg por saco</strong> (usado na conversão do PDV), <strong>estoque mínimo</strong> (dispara o
              alerta de estoque baixo), <strong>categoria</strong> (opcional) e o checkbox{" "}
              <strong>&quot;Ativo&quot;</strong> — só sacos ativos aparecem no PDV. Ao criar, dá para informar o
              estoque inicial.
            </li>
            <li>
              <strong>Ajuste de estoque</strong> — botão de setas na linha do saco. Informe a quantidade em kg
              (positiva para acrescentar, negativa para retirar, ex: <code>-5</code>) e um{" "}
              <strong>motivo obrigatório</strong> (inventário, dano, perda...).
            </li>
            <li>
              <strong>Histórico de movimentos</strong> — dentro do modal de ajuste, com todos os tipos:{" "}
              <Badge variant="danger">Venda</Badge> <Badge variant="info">Estorno</Badge>{" "}
              <Badge variant="neutral">Ajuste</Badge> <Badge variant="success">Entrada</Badge>{" "}
              <Badge variant="warning">Transferência</Badge> (carga/descarga de vendedor).
            </li>
            <li>
              <strong>Alerta de estoque baixo</strong> — quando o estoque fica igual ou abaixo do mínimo, a linha
              destaca em amarelo com badge &quot;Baixo&quot;, e o saco aparece no Dashboard e no relatório de
              estoque baixo. O filtro &quot;Estoque baixo&quot; mostra só esses sacos.
            </li>
          </ul>
        </GuideSection>

        {/* 9. Entrada de Estoque */}
        <GuideSection section={SECTIONS[8]} open={!!openSections["entrada"]} onToggle={() => toggle("entrada")}>
          <p>Registro de <strong>recebimento de mercadoria</strong> no estoque central:</p>
          <ol>
            <li>Selecione o <strong>saco</strong>.</li>
            <li>Informe a <strong>quantidade em kg</strong>.</li>
            <li>
              Preencha a <strong>nota / motivo do recebimento</strong> (obrigatório — ex: &quot;NF 12345 —
              Fornecedor X&quot;).
            </li>
            <li>Clique em <strong>&quot;Registrar entrada&quot;</strong> — o estoque central aumenta na hora.</li>
          </ol>
          <p>
            O <strong>histórico de entradas</strong> abaixo mostra cada registro com quantidade, motivo, quem
            registrou e quando. Use esta tela para recebimentos; para correções (inventário, perda), use o{" "}
            <strong>ajuste</strong> em Sacos &amp; Estoque.
          </p>
        </GuideSection>

        {/* 10. Estoque de Vendedores */}
        <GuideSection section={SECTIONS[9]} open={!!openSections["estoque-vendedores"]} onToggle={() => toggle("estoque-vendedores")}>
          <p>
            Cada vendedor carrega um estoque próprio (o &quot;carro&quot;). As vendas do vendedor no PDV saem
            desse estoque, não do central.
          </p>
          <ul>
            <li>
              <strong>Carregar carro</strong> (Admin/Gerente/Estoque) — selecione o vendedor, o saco e a
              quantidade em kg. O sistema <strong>tira do estoque central e coloca no carro</strong> do vendedor.
              O motivo é opcional (ex: &quot;saída de rota da manhã&quot;).
            </li>
            <li>
              <strong>Descarregar carro</strong> — o caminho inverso: devolve do carro para o estoque central
              (ex: retorno de rota). Só é possível descarregar até o saldo que o vendedor tem.
            </li>
            <li>
              <strong>Saldo atual</strong> — tabela com o que está no carro (só sacos com saldo).
            </li>
            <li>
              <strong>Histórico</strong> — movimentos com os tipos <Badge variant="info">Carregado</Badge>{" "}
              <Badge variant="warning">Descarregado</Badge> <Badge variant="danger">Venda</Badge>{" "}
              <Badge variant="success">Estorno</Badge>.
            </li>
          </ul>
          <Tip>
            O perfil <strong>Vendedor</strong> abre esta tela e vê apenas o próprio saldo e histórico. Gestores
            escolhem qualquer vendedor no seletor do topo.
          </Tip>
        </GuideSection>

        {/* 11. Clientes */}
        <GuideSection section={SECTIONS[10]} open={!!openSections["clientes"]} onToggle={() => toggle("clientes")}>
          <p>Cadastro de clientes para vincular às vendas:</p>
          <ul>
            <li>
              <strong>Novo cliente</strong> — só o <strong>nome</strong> é obrigatório; CNPJ/CPF, telefone e
              endereço são opcionais. O documento não pode se repetir entre clientes.
            </li>
            <li>
              <strong>Lista</strong> — busca por nome, documento ou telefone; botão{" "}
              <strong>&quot;Ativar&quot; / &quot;Desativar&quot;</strong> com confirmação. Cliente desativado
              deixa de aparecer no seletor do PDV, mas o histórico das comandas dele permanece.
            </li>
            <li>
              <strong>No PDV</strong> — o cliente é escolhido ao abrir a comanda (ou trocado enquanto ela estiver
              aberta) e fica registrado na venda.
            </li>
          </ul>
        </GuideSection>

        {/* 12. Categorias */}
        <GuideSection section={SECTIONS[11]} open={!!openSections["categorias"]} onToggle={() => toggle("categorias")}>
          <p>
            Categorias organizam os sacos (ex: &quot;Café especial&quot;, &quot;Café tradicional&quot;). Crie a
            categoria aqui e selecione-a no cadastro do saco em Sacos &amp; Estoque. A categoria aparece como
            badge na tabela de sacos. Desativar uma categoria não afeta os sacos já vinculados — ela apenas some
            das opções de novos cadastros.
          </p>
        </GuideSection>

        {/* 13. Usuários */}
        <GuideSection section={SECTIONS[12]} open={!!openSections["usuarios"]} onToggle={() => toggle("usuarios")}>
          <p>Gestão de quem acessa o sistema:</p>
          <ul>
            <li>
              <strong>Criar usuário</strong> — email, nome, senha (mínimo 6 caracteres) e o <strong>perfil</strong>{" "}
              (Vendedor, Estoque, Financeiro, Gerente ou Admin). O perfil define quais abas e ações a pessoa terá
              — veja a seção &quot;Perfis e permissões&quot;.
            </li>
            <li>
              <strong>Bloquear / Ativar</strong> — usuário bloqueado não consegue entrar no sistema, mas o
              histórico dele (vendas, movimentos) é mantido. Não é possível bloquear a si mesmo.
            </li>
          </ul>
        </GuideSection>

        {/* 14. Relatórios */}
        <GuideSection section={SECTIONS[13]} open={!!openSections["relatorios"]} onToggle={() => toggle("relatorios")}>
          <p>
            Análises por período — escolha as datas no seletor e clique em &quot;Atualizar&quot;. As abas:
          </p>
          <ul>
            <li><strong>Vendas</strong> — total do período, gráfico e tabela das comandas.</li>
            <li><strong>Pagamentos</strong> — distribuição por forma (Dinheiro, Cartão, Pix) com gráfico de pizza.</li>
            <li><strong>Mais vendidos</strong> — ranking de sacos por faturamento, com kg e sacos vendidos.</li>
            <li><strong>Mov. caixa</strong> — todas as movimentações de caixa do período.</li>
            <li><strong>Estoque baixo</strong> — sacos abaixo do mínimo cadastrado.</li>
            <li>
              <strong>Canceladas</strong> (só Admin/Gerente) — comandas canceladas com motivo e responsável.
            </li>
          </ul>
        </GuideSection>

        {/* 15. Configurações */}
        <GuideSection section={SECTIONS[14]} open={!!openSections["configuracoes"]} onToggle={() => toggle("configuracoes")}>
          <p>Regras de negócio que mudam o comportamento do sistema:</p>
          <ul>
            <li>
              <strong>Nome do estabelecimento</strong> — exibido no menu lateral.
            </li>
            <li>
              <strong>Baixa de estoque</strong> — define <em>quando</em> o estoque é descontado:{" "}
              <strong>&quot;Ao adicionar item na comanda&quot;</strong> (desconta na hora; se a comanda for
              cancelada, devolve) ou <strong>&quot;Ao pagar a comanda&quot;</strong> (só desconta quando o
              pagamento é registrado).
            </li>
            <li>
              <strong>Permitir estoque negativo</strong> — se ativo, deixa vender mesmo sem saldo suficiente (o
              estoque fica negativo para acerto posterior). Se inativo, o sistema bloqueia a venda acima do
              estoque.
            </li>
            <li>
              <strong>Exigir caixa aberto para registrar venda</strong> — se ativo, só é possível registrar
              pagamento com um caixa aberto.
            </li>
          </ul>
        </GuideSection>

        {/* 16. Rotina típica */}
        <GuideSection section={SECTIONS[15]} open={!!openSections["rotina"]} onToggle={() => toggle("rotina")}>
          <p>Um dia de operação, do início ao fim, juntando todos os fluxos:</p>
          <ol>
            <li>
              <strong>Abrir o caixa</strong> (Caixa) com o fundo de troco do dia.
            </li>
            <li>
              <strong>Receber mercadoria</strong>, se houver (Entrada de Estoque), e conferir alertas de estoque
              baixo no Dashboard.
            </li>
            <li>
              <strong>Carregar o carro dos vendedores</strong> (Estoque de Vendedores) que saem para rota.
            </li>
            <li>
              <strong>Vender no PDV</strong> ao longo do dia: abrir comanda → itens → finalizar →{" "}
              <strong>registrar pagamento</strong> → avaliação → anexar nota PDF quando houver.
            </li>
            <li>
              <strong>Acompanhar</strong> em tempo real na aba Vendas e registrar sangrias/suprimentos no Caixa
              quando necessário.
            </li>
            <li>
              <strong>Fim do dia:</strong> <strong>descarregar o carro</strong> dos vendedores que voltaram
              (devolve o que não foi vendido ao estoque central).
            </li>
            <li>
              <strong>Fechar o caixa</strong> conferindo o dinheiro físico contra o saldo esperado.
            </li>
            <li>
              <strong>Conferir depois</strong> — Comandas para o histórico do dia e Relatórios para a análise do
              período.
            </li>
          </ol>
        </GuideSection>
      </div>
    </PageContainer>
  );
}
