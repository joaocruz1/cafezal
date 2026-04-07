import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const safra = await prisma.coffeeHarvest.findUnique({ where: { id } });
  if (!safra) {
    return NextResponse.json({ error: "Safra não encontrada" }, { status: 404 });
  }
  return NextResponse.json(safra);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const safra = await prisma.coffeeHarvest.findUnique({ where: { id } });
  if (!safra) {
    return NextResponse.json({ error: "Safra não encontrada" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { name, year, pricePerKg, kgPerBag, minStockKg, active } = body;
    const data: {
      name?: string;
      year?: number;
      pricePerKg?: number;
      kgPerBag?: number;
      minStockKg?: number;
      active?: boolean;
    } = {};
    if (name !== undefined) data.name = String(name).trim();
    if (year !== undefined) data.year = Number(year);
    if (pricePerKg !== undefined) data.pricePerKg = Number(pricePerKg);
    if (kgPerBag !== undefined) data.kgPerBag = Number(kgPerBag);
    if (minStockKg !== undefined) data.minStockKg = Math.max(0, Number(minStockKg));
    if (active !== undefined) data.active = Boolean(active);
    if (Object.keys(data).length === 0) {
      const s = await prisma.coffeeHarvest.findUnique({ where: { id } });
      return NextResponse.json(s);
    }
    const updated = await prisma.coffeeHarvest.update({
      where: { id },
      data,
    });
    if (data.pricePerKg !== undefined && data.pricePerKg !== Number(safra.pricePerKg)) {
      await auditLog({
        userId: result.session.userId,
        action: "safra.price_change",
        entityType: "CoffeeHarvest",
        entityId: String(id),
        summary: `Preço alterado de ${safra.pricePerKg} para ${updated.pricePerKg}`,
      });
    }
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar safra" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(_request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const safra = await prisma.coffeeHarvest.findUnique({
    where: { id },
    include: { orderItems: true, stockMovements: true },
  });
  if (!safra) {
    return NextResponse.json({ error: "Safra não encontrada" }, { status: 404 });
  }
  if (safra.orderItems.length > 0 || safra.stockMovements.length > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir safra com vendas ou movimentações de estoque" },
      { status: 400 }
    );
  }
  await prisma.coffeeHarvest.delete({ where: { id } });
  await auditLog({
    userId: result.session.userId,
    action: "safra.delete",
    entityType: "CoffeeHarvest",
    entityId: String(id),
    summary: `Safra excluída: ${safra.name}`,
  });
  return NextResponse.json({ ok: true });
}
