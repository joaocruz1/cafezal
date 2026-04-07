import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { estoqueOrAbove } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";
import { auditLog } from "@/lib/audit";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = estoqueOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { safraId, quantityKg, reason } = body;
    if (!safraId || quantityKg == null || Number(quantityKg) === 0) {
      return NextResponse.json(
        { error: "Safra e quantidade em kg (diferente de zero) são obrigatórios" },
        { status: 400 }
      );
    }
    const reasonStr = String(reason ?? "").trim();
    if (!reasonStr) {
      return NextResponse.json({ error: "Motivo do ajuste é obrigatório" }, { status: 400 });
    }
    const safra = await prisma.coffeeHarvest.findUnique({ where: { id: String(safraId) } });
    if (!safra) {
      return NextResponse.json({ error: "Safra não encontrada" }, { status: 404 });
    }
    const qty = Number(quantityKg);
    const allowNegative = await prisma.systemSetting
      .findUnique({ where: { key: "allowNegativeStock" } })
      .then((s) => s?.value === "true");
    const current = await getCurrentStockKg(safra.id);
    const after = current + qty;
    if (!allowNegative && after < 0) {
      return NextResponse.json(
        { error: `Ajuste resultaria em estoque negativo (atual: ${current.toFixed(2)} kg)` },
        { status: 400 }
      );
    }
    await prisma.stockMovement.create({
      data: {
        safraId: safra.id,
        quantityKg: qty,
        type: "ADJUSTMENT",
        reason: reasonStr,
        createdByUserId: result.session.userId,
      },
    });
    await auditLog({
      userId: result.session.userId,
      action: "stock.adjust",
      entityType: "CoffeeHarvest",
      entityId: String(safra.id),
      summary: `Ajuste: ${qty > 0 ? "+" : ""}${qty} kg — ${reasonStr}. Estoque anterior: ${current}`,
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
    return NextResponse.json({ error: "Erro ao ajustar estoque" }, { status: 500 });
  }
}
