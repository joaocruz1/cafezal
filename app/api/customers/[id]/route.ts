import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

function normalizeDocument(document: unknown): string | null {
  if (document == null) return null;
  const digits = String(document).replace(/\D/g, "");
  return digits || null;
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
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { name, document, phone, address, active } = body;
    const data: {
      name?: string;
      document?: string | null;
      phone?: string | null;
      address?: string | null;
      active?: boolean;
    } = {};
    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
      }
      data.name = String(name).trim();
    }
    if (document !== undefined) data.document = normalizeDocument(document);
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) data.address = address ? String(address).trim() : null;
    if (active !== undefined) data.active = Boolean(active);

    const updated = await prisma.customer.update({ where: { id }, data });
    await auditLog({
      userId: result.session.userId,
      action: "customer.update",
      entityType: "Customer",
      entityId: String(id),
      summary: `Cliente atualizado: ${updated.name}`,
    });
    return NextResponse.json(updated);
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Já existe um cliente com esse CNPJ/CPF" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}
