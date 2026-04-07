"use client";

import Link from "next/link";
import {
  Coffee,
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  Sprout,
  Wallet,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { LucideIcon } from "lucide-react";

type User = { name: string; email: string; profile: string };

interface SidebarProps {
  user: User;
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
  className?: string;
}

const profileLabels: Record<string, string> = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  FINANCEIRO: "Financeiro",
  VENDEDOR: "Vendedor",
  ESTOQUE: "Estoque",
};

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pdv", label: "PDV", icon: ShoppingCart, roles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { href: "/comandas", label: "Comandas", icon: ClipboardList, roles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { href: "/vendas", label: "Vendas", icon: TrendingUp, roles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { href: "/safras", label: "Safras & Estoque", icon: Sprout },
  { href: "/caixa", label: "Caixa", icon: Wallet, roles: ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"] },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3, roles: ["ADMIN", "GERENTE", "FINANCEIRO", "ESTOQUE"] },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN", "GERENTE"] },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings, roles: ["ADMIN", "GERENTE"] },
];

export function Sidebar({ user, pathname, onLogout, onNavigate, className = "" }: SidebarProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      role="navigation"
      aria-label="Menu principal"
      className={`w-56 bg-stone-900 text-stone-300 flex flex-col flex-shrink-0 ${className}`}
    >
      <div className="p-4 border-b border-stone-800">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 text-white hover:text-amber-200 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
        >
          <Coffee className="h-6 w-6 text-amber-500" />
          <span className="font-bold text-lg tracking-tight">Cafezal</span>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user.profile))
          .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                  active
                    ? "bg-amber-900/50 text-amber-200 font-medium"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${active ? "text-amber-400" : ""}`} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-stone-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-800 text-xs font-bold text-amber-100">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-200 truncate">{user.name}</p>
            <Badge variant="neutral" className="!bg-stone-800 !text-stone-400 !ring-stone-700 mt-0.5">
              {profileLabels[user.profile] ?? user.profile}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
