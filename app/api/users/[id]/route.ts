import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
type Profile = "ADMIN" | "GERENTE" | "FINANCEIRO" | "VENDEDOR" | "ESTOQUE";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(_request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, profile: true, active: true, createdAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { name, profile, active, newPassword } = body;
    const data: { name?: string; profile?: Profile; active?: boolean; passwordHash?: string } = {};
    if (name !== undefined) data.name = String(name).trim();
    if (profile !== undefined) {
      const allowed = ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR", "ESTOQUE"] as const;
      data.profile = allowed.includes(profile as (typeof allowed)[number]) ? (profile as Profile) : user.profile;
    }
    if (active !== undefined) data.active = Boolean(active);
    if (newPassword !== undefined && String(newPassword).length >= 6) {
      data.passwordHash = await bcrypt.hash(String(newPassword), 10);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(user);
    }
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, profile: true, active: true },
    });
    await auditLog({
      userId: result.session.userId,
      action: "user.update",
      entityType: "User",
      entityId: String(id),
      summary: `Usuário atualizado: ${updated.email}`,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}
