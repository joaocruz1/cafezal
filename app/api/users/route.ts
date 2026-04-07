import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
type Profile = "ADMIN" | "GERENTE" | "FINANCEIRO" | "VENDEDOR" | "ESTOQUE";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { email, name, password, profile } = body;
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }
    const allowedProfiles = ["ADMIN", "GERENTE", "FINANCEIRO", "VENDEDOR", "ESTOQUE"] as const;
    const profileVal = allowedProfiles.includes(profile as (typeof allowedProfiles)[number]) ? (profile as Profile) : "VENDEDOR";
    const emailNorm = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        name: String(name).trim(),
        passwordHash,
        profile: profileVal as Profile,
      },
      select: { id: true, email: true, name: true, profile: true, active: true },
    });
    await auditLog({
      userId: result.session.userId,
      action: "user.create",
      entityType: "User",
      entityId: String(user.id),
      summary: `Usuário criado: ${user.email}`,
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
