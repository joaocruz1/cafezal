import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { financeiroOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = financeiroOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const cash = await prisma.cashRegister.findUnique({ where: { id } });
  if (!cash || cash.status !== "OPEN") {
    return NextResponse.json({ error: "Caixa não encontrado ou já fechado" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "close") {
      const closingBalance = body.closingBalance != null ? Number(body.closingBalance) : null;
      await prisma.cashRegister.update({
        where: { id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          closedByUserId: result.session.userId,
          closingBalance: closingBalance ?? undefined,
        },
      });
      await auditLog({
        userId: result.session.userId,
        action: "cash.close",
        entityType: "CashRegister",
        entityId: String(id),
        summary: `Caixa fechado. Conferência: R$ ${closingBalance != null ? closingBalance.toFixed(2) : "—"}`,
      });
      const updated = await prisma.cashRegister.findUnique({
        where: { id },
        include: { openedByUser: true, closedByUser: true, cashMovements: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao fechar caixa" }, { status: 500 });
  }
}
