import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { anyAuthenticated, gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") !== "false";

  const categories = await prisma.category.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { name } = body;
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name: String(name).trim() },
    });
    await auditLog({
      userId: result.session.userId,
      action: "category.create",
      entityType: "Category",
      entityId: String(category.id),
      summary: `Categoria criada: ${category.name}`,
    });
    return NextResponse.json(category);
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
