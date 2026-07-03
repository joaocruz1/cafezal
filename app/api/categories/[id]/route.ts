import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

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
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { name, active } = body;
    const data: { name?: string; active?: boolean } = {};
    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
      }
      data.name = String(name).trim();
    }
    if (active !== undefined) data.active = Boolean(active);
    const updated = await prisma.category.update({ where: { id }, data });
    await auditLog({
      userId: result.session.userId,
      action: "category.update",
      entityType: "Category",
      entityId: String(id),
      summary: `Categoria atualizada: ${updated.name}`,
    });
    return NextResponse.json(updated);
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}
