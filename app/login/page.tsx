"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../providers";
import { Button, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { Coffee, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Erro ao fazer login");
        return;
      }
      login(data.token, data.user);
      toast.success("Login realizado com sucesso!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left hero section */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,53,15,0.3),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-xl bg-amber-700/30 p-3">
              <Coffee className="h-10 w-10 text-amber-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Cafezal
          </h1>
          <p className="text-xl text-amber-100/80 font-light mb-2">
            Sistema de Gestao
          </p>
          <p className="text-stone-400 max-w-md mt-4 leading-relaxed">
            Gerencie vendas, estoque, caixa e relatorios do seu negocio de cafe em um unico lugar.
          </p>
          <div className="mt-12 flex gap-8 text-sm text-stone-400">
            <div>
              <p className="text-2xl font-bold text-amber-300">PDV</p>
              <p>Ponto de venda</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">Estoque</p>
              <p>Controle de safras</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">Caixa</p>
              <p>Gestao financeira</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Coffee className="h-8 w-8 text-amber-700" />
            <span className="text-2xl font-bold text-stone-800">Cafezal</span>
          </div>

          <h2 className="text-2xl font-bold text-stone-800 mb-1">Entrar</h2>
          <p className="text-sm text-stone-500 mb-8">
            Acesse sua conta para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              leftIcon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
            />
            <Input
              type="password"
              label="Senha"
              leftIcon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <Button
              type="submit"
              className="w-full justify-center"
              size="lg"
              disabled={loading}
              loading={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-stone-400">
            Cafezal — Sistema de Gestao
          </p>
        </div>
      </div>
    </div>
  );
}
