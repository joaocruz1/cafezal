import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { estoqueOrAbove } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";
import { unloadVendorStock } from "@/lib/vendor-stock";
import { auditLog } from "@/lib/audit";
import { emitSocketEvent } from "@/lib/socket-emit";

class InsufficientVendorStockError extends Error {}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = estoqueOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { vendorUserId, safraId, quantityKg, reason } = body;
    if (!vendorUserId || !safraId || quantityKg == null || Number(quantityKg) <= 0) {
      return NextResponse.json(
        { error: "Vendedor, saco e quantidade (maior que zero) são obrigatórios" },
        { status: 400 }
      );
    }
    const vendor = await prisma.user.findUnique({ where: { id: String(vendorUserId) } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendedor não encontrado" }, { status: 400 });
    }
    const safra = await prisma.coffeeHarvest.findUnique({ where: { id: String(safraId) } });
    if (!safra) {
      return NextResponse.json({ error: "Saco não encontrado" }, { status: 400 });
    }
    const qty = Number(quantityKg);
    const reasonStr = reason ? String(reason).trim() : undefined;

    try {
      await prisma.$transaction(async (tx) => {
        const unload = await unloadVendorStock(
          { vendorUserId: vendor.id, safraId: safra.id, quantityKg: qty, userId: result.session.userId, reason: reasonStr },
          tx
        );
        if (!unload.ok) {
          throw new InsufficientVendorStockError(unload.error ?? "Erro ao descarregar estoque");
        }
        await tx.stockMovement.create({
          data: {
            safraId: safra.id,
            quantityKg: qty,
            type: "TRANSFER_IN",
            reason: reasonStr ?? `Descarregado do carro de ${vendor.name}`,
            createdByUserId: result.session.userId,
          },
        });
      });
    } catch (e) {
      if (e instanceof InsufficientVendorStockError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }

    await auditLog({
      userId: result.session.userId,
      action: "vendor_stock.unload",
      entityType: "CoffeeHarvest",
      entityId: String(safra.id),
      summary: `Descarregado ${qty.toFixed(2)} kg de ${safra.name} do carro de ${vendor.name}`,
    });
    const newCentralStock = await getCurrentStockKg(safra.id);
    await emitSocketEvent("stock:update", { safraId: safra.id, safraName: safra.name, currentStockKg: newCentralStock });
    await emitSocketEvent("vendor-stock:update", { vendorUserId: vendor.id, safraId: safra.id, safraName: safra.name });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao descarregar estoque do vendedor" }, { status: 500 });
  }
}
