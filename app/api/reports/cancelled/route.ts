import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { businessDayBounds } from "@/lib/date";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from e to (data) são obrigatórios" }, { status: 400 });
  }
  const { start: fromDate } = businessDayBounds(from);
  const { end: toDate } = businessDayBounds(to);

  const orders = await prisma.order.findMany({
    where: {
      status: "CANCELLED",
      cancelledAt: { gte: fromDate, lte: toDate },
    },
    include: {
      openedByUser: { select: { name: true } },
      cancelledByUser: { select: { name: true } },
    },
    orderBy: { cancelledAt: "desc" },
  });
  return NextResponse.json(orders);
}
