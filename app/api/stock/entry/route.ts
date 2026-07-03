import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { estoqueOrAbove } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";
import { auditLog } from "@/lib/audit";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = estoqueOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const entries = await prisma.stockMovement.findMany({
    where: { type: "ENTRY" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      safra: { select: { id: true, name: true } },
      createdByUser: { select: { name: true } },
    },
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = estoqueOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { safraId, quantityKg, reason } = body;
    if (!safraId || quantityKg == null || Number(quantityKg) <= 0) {
      return NextResponse.json(
        { error: "Saco e quantidade em kg (maior que zero) são obrigatórios" },
        { status: 400 }
      );
    }
    const reasonStr = String(reason ?? "").trim();
    if (!reasonStr) {
      return NextResponse.json({ error: "Motivo/nota da entrada é obrigatório" }, { status: 400 });
    }
    const safra = await prisma.coffeeHarvest.findUnique({ where: { id: String(safraId) } });
    if (!safra) {
      return NextResponse.json({ error: "Saco não encontrado" }, { status: 404 });
    }
    const qty = Number(quantityKg);
    const current = await getCurrentStockKg(safra.id);
    await prisma.stockMovement.create({
      data: {
        safraId: safra.id,
        quantityKg: qty,
        type: "ENTRY",
        reason: reasonStr,
        createdByUserId: result.session.userId,
      },
    });
    await auditLog({
      userId: result.session.userId,
      action: "stock.entry",
      entityType: "CoffeeHarvest",
      entityId: String(safra.id),
      summary: `Entrada de estoque: +${qty} kg — ${reasonStr}`,
    });
    const newStock = await getCurrentStockKg(safra.id);
    await emitSocketEvent("stock:update", {
      safraId: safra.id,
      safraName: safra.name,
      currentStockKg: newStock,
    });
    return NextResponse.json({
      safraId: safra.id,
      previousStockKg: current,
      newStockKg: newStock,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao registrar entrada de estoque" }, { status: 500 });
  }
}
