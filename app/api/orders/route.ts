import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const identifier = searchParams.get("identifier");

  const where: {
    status?: "OPEN" | "FINALIZED" | "CANCELLED";
    identifier?: string | { contains: string; mode: "insensitive" };
    openedAt?: { gte?: Date; lte?: Date };
  } = {};
  if (status === "OPEN" || status === "FINALIZED" || status === "CANCELLED") where.status = status;
  if (identifier && String(identifier).trim()) where.identifier = { contains: String(identifier).trim(), mode: "insensitive" };
  if (from || to) {
    where.openedAt = {};
    if (from) where.openedAt.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      where.openedAt.lte = t;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { openedAt: "desc" },
    take: 200,
    include: {
      openedByUser: { select: { id: true, name: true } },
      cancelledByUser: { select: { id: true, name: true } },
      items: { include: { safra: { select: { id: true, name: true } } } },
      payments: true,
    },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const identifier = body.identifier != null ? String(body.identifier).trim() : "";
    if (!identifier) {
      return NextResponse.json({ error: "Identificador da comanda é obrigatório" }, { status: 400 });
    }
    const order = await prisma.order.create({
      data: {
        identifier,
        status: "OPEN",
        openedByUserId: result.session.userId,
      },
      include: {
        openedByUser: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao abrir comanda" }, { status: 500 });
  }
}
