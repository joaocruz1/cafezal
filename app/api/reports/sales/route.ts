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
  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from e to (data) são obrigatórios" }, { status: 400 });
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: "FINALIZED",
      finalizedAt: { gte: fromDate, lte: toDate },
    },
    include: {
      openedByUser: { select: { name: true } },
      items: { include: { safra: { select: { name: true } } } },
      payments: true,
    },
    orderBy: { finalizedAt: "asc" },
  });

  const total = orders.reduce((s: number, o: { total: unknown }) => s + Number(o.total ?? 0), 0);
  return NextResponse.json({ orders, total });
}
