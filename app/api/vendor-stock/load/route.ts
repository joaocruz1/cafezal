import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { estoqueOrAbove } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";
import { loadVendorStock } from "@/lib/vendor-stock";
import { auditLog } from "@/lib/audit";
import { emitSocketEvent } from "@/lib/socket-emit";

class InsufficientStockError extends Error {}

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
    if (!vendor || vendor.profile !== "VENDEDOR" || !vendor.active) {
      return NextResponse.json({ error: "Vendedor não encontrado ou inativo" }, { status: 400 });
    }
    const safra = await prisma.coffeeHarvest.findUnique({ where: { id: String(safraId) } });
    if (!safra || !safra.active) {
      return NextResponse.json({ error: "Saco não encontrado ou inativo" }, { status: 400 });
    }
    const qty = Number(quantityKg);
    const reasonStr = reason ? String(reason).trim() : undefined;

    try {
      await prisma.$transaction(async (tx) => {
        const allowNegative = await tx.systemSetting
          .findUnique({ where: { key: "allowNegativeStock" } })
          .then((s) => s?.value === "true");
        const current = await getCurrentStockKg(safra.id, tx);
        const after = current - qty;
        if (!allowNegative && after < 0) {
          throw new InsufficientStockError(
            `Estoque central insuficiente para ${safra.name}. Atual: ${current.toFixed(2)} kg`
          );
        }
        await tx.stockMovement.create({
          data: {
            safraId: safra.id,
            quantityKg: -qty,
            type: "TRANSFER_OUT",
            reason: reasonStr ?? `Carregado no carro de ${vendor.name}`,
            createdByUserId: result.session.userId,
          },
        });
        await loadVendorStock(
          { vendorUserId: vendor.id, safraId: safra.id, quantityKg: qty, userId: result.session.userId, reason: reasonStr },
          tx
        );
      });
    } catch (e) {
      if (e instanceof InsufficientStockError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }

    await auditLog({
      userId: result.session.userId,
      action: "vendor_stock.load",
      entityType: "CoffeeHarvest",
      entityId: String(safra.id),
      summary: `Carregado ${qty.toFixed(2)} kg de ${safra.name} para o carro de ${vendor.name}`,
    });
    const newCentralStock = await getCurrentStockKg(safra.id);
    await emitSocketEvent("stock:update", { safraId: safra.id, safraName: safra.name, currentStockKg: newCentralStock });
    await emitSocketEvent("vendor-stock:update", { vendorUserId: vendor.id, safraId: safra.id, safraName: safra.name });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar estoque do vendedor" }, { status: 500 });
  }
}
