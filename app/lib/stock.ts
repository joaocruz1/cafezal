import { prisma } from "./prisma";

export async function getCurrentStockKg(safraId: string): Promise<number> {
  const result = await prisma.stockMovement.aggregate({
    where: { safraId },
    _sum: { quantityKg: true },
  });
  const sum = result._sum.quantityKg;
  return sum != null ? Number(sum) : 0;
}

export async function deductStock(params: {
  safraId: string;
  quantityKg: number;
  userId: string;
  orderId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const safra = await prisma.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return { ok: true };

  const current = await getCurrentStockKg(params.safraId);
  const after = current - params.quantityKg;

  const allowNegative = await prisma.systemSetting
    .findUnique({ where: { key: "allowNegativeStock" } })
    .then((s) => s?.value === "true");
  if (!allowNegative && after < 0) {
    return {
      ok: false,
      error: `Estoque insuficiente para ${safra.name}. Atual: ${current.toFixed(2)} kg`,
    };
  }

  await prisma.stockMovement.create({
    data: {
      safraId: params.safraId,
      quantityKg: -params.quantityKg,
      type: "SALE",
      createdByUserId: params.userId,
    },
  });
  return { ok: true };
}

export async function revertStock(params: {
  safraId: string;
  quantityKg: number;
  userId: string;
}): Promise<void> {
  const safra = await prisma.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return;

  await prisma.stockMovement.create({
    data: {
      safraId: params.safraId,
      quantityKg: params.quantityKg,
      type: "SALE_REVERT",
      reason: "Estorno (item removido ou comanda cancelada)",
      createdByUserId: params.userId,
    },
  });
}
