import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { financeiroOrAbove } from "@/lib/permissions";
import { businessDayBounds } from "@/lib/date";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = financeiroOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cashRegisterId = searchParams.get("cashRegisterId");
  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from e to (data) são obrigatórios" }, { status: 400 });
  }
  const { start: fromDate } = businessDayBounds(from);
  const { end: toDate } = businessDayBounds(to);

  const where: { createdAt: { gte: Date; lte: Date }; cashRegisterId?: string } = {
    createdAt: { gte: fromDate, lte: toDate },
  };
  if (cashRegisterId && cashRegisterId.trim()) {
    where.cashRegisterId = cashRegisterId.trim();
  }

  const movements = await prisma.cashMovement.findMany({
    where,
    include: {
      cashRegister: { select: { id: true, openedAt: true } },
      createdByUser: { select: { name: true } },
      order: { select: { id: true, identifier: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(movements);
}
