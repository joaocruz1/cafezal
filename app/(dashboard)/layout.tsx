"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../providers";
import { useEffect, useState } from "react";
import { clearStoredToken } from "@/lib/auth-client";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingScreen } from "@/components/ui";
import { Menu, X } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pdv": "PDV — Comandas",
  "/comandas": "Comandas",
  "/vendas": "Vendas em tempo real",
  "/safras": "Safras & Estoque",
  "/caixa": "Caixa",
  "/relatorios": "Relatorios",
  "/usuarios": "Usuarios",
  "/configuracoes": "Configuracoes",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  function handleLogout() {
    clearStoredToken();
    router.replace("/login");
    router.refresh();
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  if (loading || !user) {
    return <LoadingScreen />;
  }

  const pageTitle = pageTitles[pathname] ?? "Cafezal";

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar user={user} pathname={pathname} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-label="Fechar menu"
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
        />
      )}

      {/* Mobile drawer sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 transform shadow-lg transition-transform duration-200 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} pathname={pathname} onLogout={handleLogout} onNavigate={closeSidebar} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-[var(--radius-md)] p-2 text-stone-600 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 lg:hidden"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-lg font-semibold text-stone-800 truncate">{pageTitle}</h1>
        </header>

        <main id="main-content" className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
