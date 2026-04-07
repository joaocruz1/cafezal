import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { financeiroOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = financeiroOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { status: "CLOSED"; closedAt?: { gte?: Date; lte?: Date } } = { status: "CLOSED" };
  if (from || to) {
    where.closedAt = {};
    if (from) where.closedAt.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      where.closedAt.lte = t;
    }
  }

  const list = await prisma.cashRegister.findMany({
    where,
    orderBy: { closedAt: "desc" },
    take: 100,
    include: {
      openedByUser: { select: { id: true, name: true } },
      closedByUser: { select: { id: true, name: true } },
      _count: { select: { cashMovements: true } },
    },
  });
  return NextResponse.json(list);
}
