import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { anyAuthenticated, financeiroOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const open = await prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: {
      openedByUser: { select: { id: true, name: true } },
      cashMovements: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  return NextResponse.json(open);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = financeiroOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "open") {
      const openingBalance = Number(body.openingBalance) ?? 0;
      if (openingBalance < 0) {
        return NextResponse.json({ error: "Valor inicial inválido" }, { status: 400 });
      }
      const existing = await prisma.cashRegister.findFirst({ where: { status: "OPEN" } });
      if (existing) {
        return NextResponse.json({ error: "Já existe um caixa aberto" }, { status: 400 });
      }
      const cash = await prisma.cashRegister.create({
        data: {
          openingBalance,
          openedByUserId: result.session.userId,
          status: "OPEN",
        },
        include: { openedByUser: { select: { id: true, name: true } } },
      });
      await auditLog({
        userId: result.session.userId,
        action: "cash.open",
        entityType: "CashRegister",
        entityId: String(cash.id),
        summary: `Caixa aberto com R$ ${openingBalance.toFixed(2)}`,
      });
      return NextResponse.json(cash);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao abrir caixa" }, { status: 500 });
  }
}
