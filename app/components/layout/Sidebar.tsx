"use client";

import Link from "next/link";

type User = { name: string; email: string; profile: string };

interface SidebarProps {
  user: User;
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
  className?: string;
}

const navLinkClass = (active: boolean) =>
  `block px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus:outline-none ${
    active ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-600 hover:bg-neutral-50"
  }`;

export function Sidebar({ user, pathname, onLogout, onNavigate, className = "" }: SidebarProps) {
  const p = user.profile;
  const canPdv = ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"].includes(p);
  const canGerente = ["ADMIN", "GERENTE"].includes(p);
  const canCaixa = ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"].includes(p);
  const canEstoque = ["ADMIN", "GERENTE", "ESTOQUE"].includes(p);
  const canRelatorios = ["ADMIN", "GERENTE", "FINANCEIRO", "ESTOQUE"].includes(p);

  const linkProps = (href: string) => ({
    href,
    onClick: onNavigate,
    className: navLinkClass(pathname === href),
  });

  return (
    <aside
      className={`w-56 border-r border-neutral-200 bg-white flex flex-col flex-shrink-0 ${className}`}
    >
      <div className="p-4 border-b border-neutral-100">
        <Link
          href="/pdv"
          onClick={onNavigate}
          className="font-semibold text-neutral-800 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded focus:outline-none"
        >
          Cafezal
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {canPdv && (
          <>
            <Link {...linkProps("/pdv")}>PDV / Comandas</Link>
            <Link {...linkProps("/comandas")}>Comandas</Link>
            <Link {...linkProps("/vendas")}>Vendas (tempo real)</Link>
          </>
        )}
        <Link {...linkProps("/safras")}>Safras</Link>
        {canCaixa && <Link {...linkProps("/caixa")}>Caixa</Link>}
        {canEstoque && <Link {...linkProps("/estoque")}>Estoque</Link>}
        {canRelatorios && <Link {...linkProps("/relatorios")}>Relatórios</Link>}
        {canGerente && (
          <>
            <Link {...linkProps("/usuarios")}>Usuários</Link>
            <Link {...linkProps("/configuracoes")}>Configurações</Link>
          </>
        )}
      </nav>
      <div className="p-2 border-t border-neutral-100">
        <p className="px-3 py-1 text-xs text-neutral-500 truncate" title={user.email}>
          {user.name}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm text-neutral-600 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus:outline-none"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
