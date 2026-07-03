import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export async function getCurrentVendorStockKg(
  vendorUserId: string,
  safraId: string,
  db: PrismaClientOrTx = prisma
): Promise<number> {
  const result = await db.vendorStockMovement.aggregate({
    where: { vendorUserId, safraId },
    _sum: { quantityKg: true },
  });
  const sum = result._sum.quantityKg;
  return sum != null ? Number(sum) : 0;
}

export async function getVendorStockTotalsBySafra(
  vendorUserId: string,
  db: PrismaClientOrTx = prisma
): Promise<Record<string, number>> {
  const rows = await db.vendorStockMovement.groupBy({
    by: ["safraId"],
    where: { vendorUserId },
    _sum: { quantityKg: true },
  });
  const totals: Record<string, number> = {};
  for (const r of rows) {
    totals[r.safraId] = r._sum.quantityKg != null ? Number(r._sum.quantityKg) : 0;
  }
  return totals;
}

export async function deductVendorStock(
  params: { vendorUserId: string; safraId: string; quantityKg: number; userId: string; orderId?: string },
  db: PrismaClientOrTx = prisma
): Promise<{ ok: boolean; error?: string }> {
  const safra = await db.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return { ok: true };

  const current = await getCurrentVendorStockKg(params.vendorUserId, params.safraId, db);
  const after = current - params.quantityKg;

  const allowNegative = await db.systemSetting
    .findUnique({ where: { key: "allowNegativeStock" } })
    .then((s) => s?.value === "true");
  if (!allowNegative && after < 0) {
    return {
      ok: false,
      error: `Estoque insuficiente para ${safra.name}. Atual no seu carro: ${current.toFixed(2)} kg`,
    };
  }

  await db.vendorStockMovement.create({
    data: {
      vendorUserId: params.vendorUserId,
      safraId: params.safraId,
      quantityKg: -params.quantityKg,
      type: "SALE",
      orderId: params.orderId,
      createdByUserId: params.userId,
    },
  });
  return { ok: true };
}

export async function revertVendorStock(
  params: { vendorUserId: string; safraId: string; quantityKg: number; userId: string; orderId?: string },
  db: PrismaClientOrTx = prisma
): Promise<void> {
  const safra = await db.coffeeHarvest.findUnique({ where: { id: params.safraId } });
  if (!safra || !safra.active) return;

  await db.vendorStockMovement.create({
    data: {
      vendorUserId: params.vendorUserId,
      safraId: params.safraId,
      quantityKg: params.quantityKg,
      type: "SALE_REVERT",
      orderId: params.orderId,
      reason: "Estorno (item removido ou comanda cancelada)",
      createdByUserId: params.userId,
    },
  });
}

export async function loadVendorStock(
  params: { vendorUserId: string; safraId: string; quantityKg: number; userId: string; reason?: string },
  db: PrismaClientOrTx = prisma
): Promise<void> {
  await db.vendorStockMovement.create({
    data: {
      vendorUserId: params.vendorUserId,
      safraId: params.safraId,
      quantityKg: params.quantityKg,
      type: "LOAD",
      reason: params.reason,
      createdByUserId: params.userId,
    },
  });
}

export async function unloadVendorStock(
  params: { vendorUserId: string; safraId: string; quantityKg: number; userId: string; reason?: string },
  db: PrismaClientOrTx = prisma
): Promise<{ ok: boolean; error?: string }> {
  const current = await getCurrentVendorStockKg(params.vendorUserId, params.safraId, db);
  if (current - params.quantityKg < 0) {
    return { ok: false, error: `O vendedor só tem ${current.toFixed(2)} kg desse saco no carro` };
  }
  await db.vendorStockMovement.create({
    data: {
      vendorUserId: params.vendorUserId,
      safraId: params.safraId,
      quantityKg: -params.quantityKg,
      type: "UNLOAD",
      reason: params.reason,
      createdByUserId: params.userId,
    },
  });
  return { ok: true };
}
