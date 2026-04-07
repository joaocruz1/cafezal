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

  const payments = await prisma.payment.findMany({
    where: {
      order: { status: "FINALIZED", finalizedAt: { gte: fromDate, lte: toDate } },
    },
  });

  const byMethod: Record<string, number> = {};
  for (const p of payments) {
    const key = p.paymentMethod;
    byMethod[key] = (byMethod[key] ?? 0) + Number(p.amount);
  }
  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  return NextResponse.json({ byMethod, total });
}
