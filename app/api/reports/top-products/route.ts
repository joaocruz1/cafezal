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
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  if (!from || !to) {
    return NextResponse.json(
      { error: "Parâmetros from e to (data) são obrigatórios" },
      { status: 400 }
    );
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const items = await prisma.orderItem.findMany({
    where: {
      order: { status: "FINALIZED", finalizedAt: { gte: fromDate, lte: toDate } },
    },
    include: { safra: { select: { id: true, name: true } } },
  });

  const bySafra: Record<
    string,
    { name: string; quantityKg: number; bags: number; revenue: number }
  > = {};
  for (const i of items) {
    const id = i.safraId;
    if (!bySafra[id]) {
      bySafra[id] = {
        name: i.safra.name,
        quantityKg: 0,
        bags: 0,
        revenue: 0,
      };
    }
    const qtyKg = Number(i.quantityKg);
    bySafra[id].quantityKg += qtyKg;
    bySafra[id].bags += i.bags;
    bySafra[id].revenue += Number(i.unitPrice) * qtyKg;
  }
  const list = Object.entries(bySafra)
    .map(([id, d]: [string, { name: string; quantityKg: number; bags: number; revenue: number }]) => ({ safraId: id, ...d }))
    .sort((a, b) => b.quantityKg - a.quantityKg)
    .slice(0, limit);
  return NextResponse.json(list);
}
