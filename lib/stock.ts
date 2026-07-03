import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export async function getCurrentStockKg(safraId: string, db: PrismaClientOrTx = prisma): Promise<number> {
  const result = await db.stockMovement.aggregate({
    where: { safraId },
    _sum: { quantityKg: true },
  });
  const sum = result._sum.quantityKg;
  return sum != null ? Number(sum) : 0;
}

export async function deductStock(
  params: {
    safraId: string;
    quantityKg: number;
    userId: string;
    orderId?: string;
  },
  db: PrismaClientOrTx = prisma
): Promise<{ ok: boolean; error?: string }> {
  const safra = await db.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return { ok: true };

  const current = await getCurrentStockKg(params.safraId, db);
  const after = current - params.quantityKg;

  const allowNegative = await db.systemSetting
    .findUnique({ where: { key: "allowNegativeStock" } })
    .then((s) => s?.value === "true");
  if (!allowNegative && after < 0) {
    return {
      ok: false,
      error: `Estoque insuficiente para ${safra.name}. Atual: ${current.toFixed(2)} kg`,
    };
  }

  await db.stockMovement.create({
    data: {
      safraId: params.safraId,
      quantityKg: -params.quantityKg,
      type: "SALE",
      createdByUserId: params.userId,
    },
  });
  return { ok: true };
}

export async function revertStock(
  params: {
    safraId: string;
    quantityKg: number;
    userId: string;
  },
  db: PrismaClientOrTx = prisma
): Promise<void> {
  const safra = await db.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return;

  await db.stockMovement.create({
    data: {
      safraId: params.safraId,
      quantityKg: params.quantityKg,
      type: "SALE_REVERT",
      reason: "Estorno (item removido ou comanda cancelada)",
      createdByUserId: params.userId,
    },
  });
}
