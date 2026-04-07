import type { SessionPayload } from "./auth";

export type ProfileType = SessionPayload["profile"];

/** Apenas Admin */
export function adminOnly(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN"]);
}

/** Admin ou Gerente — config, usuários, produtos, categorias */
export function gerenteOrAdmin(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN", "GERENTE"]);
}

/** Admin, Gerente ou Financeiro — caixa (abrir/fechar), relatórios */
export function financeiroOrAbove(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN", "GERENTE", "FINANCEIRO"]);
}

/** Admin, Gerente, Financeiro ou Vendedor — PDV, comandas, pagamento, movimentos de caixa do dia */
export function vendedorOrAbove(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR"]);
}

/** Admin, Gerente ou Estoque — ajustes de estoque, histórico, alertas */
export function estoqueOrAbove(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN", "GERENTE", "ESTOQUE"]);
}

/** Qualquer usuário autenticado */
export function anyAuthenticated(session: SessionPayload | null) {
  return requireProfile(session, ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR", "ESTOQUE"]);
}

export function requireProfile(
  session: SessionPayload | null,
  allowed: ProfileType[]
): { ok: true; session: SessionPayload } | { ok: false; status: 401 } | { ok: false; status: 403 } {
  if (!session) return { ok: false, status: 401 };
  if (!allowed.includes(session.profile)) return { ok: false, status: 403 };
  return { ok: true, session };
}
