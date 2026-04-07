import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { revertStock } from "@/lib/stock";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId, itemId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { safra: true } } },
  });
  if (!order || order.status !== "OPEN") {
    return NextResponse.json({ error: "Comanda não encontrada ou não está aberta" }, { status: 400 });
  }
  const item = order.items.find((i: { id: string }) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }
  const stockRule = await prisma.systemSetting
    .findUnique({ where: { key: "stockDeductionRule" } })
    .then((s: { value: string } | null) => s?.value ?? "on_pay");

  try {
    const body = await request.json();
    const { quantityKg, bags, observation } = body;
    const data: { quantityKg?: number; bags?: number; observation?: string | null } = {};

    if (quantityKg !== undefined || bags !== undefined) {
      let newQtyKg = 0;
      let newBags = 0;
      const kgPerBag = Number(item.safra.kgPerBag);
      if (quantityKg != null && Number(quantityKg) > 0) {
        newQtyKg = Number(quantityKg);
        newBags = Math.floor(newQtyKg / kgPerBag);
      } else if (bags != null && Number(bags) > 0) {
        newBags = Math.floor(Number(bags));
        newQtyKg = newBags * kgPerBag;
      }
      if (newQtyKg <= 0) {
        if (stockRule === "on_add") {
          await revertStock({
            safraId: item.safraId,
            quantityKg: Number(item.quantityKg),
            userId: result.session.userId,
          });
        }
        await prisma.orderItem.delete({ where: { id: itemId } });
        return NextResponse.json({ deleted: true });
      }
      if (stockRule === "on_add") {
        const oldKg = Number(item.quantityKg);
        if (newQtyKg < oldKg) {
          await revertStock({
            safraId: item.safraId,
            quantityKg: oldKg - newQtyKg,
            userId: result.session.userId,
          });
        }
      }
      data.quantityKg = newQtyKg;
      data.bags = newBags;
    }
    if (observation !== undefined) data.observation = String(observation).trim() || null;
    if (Object.keys(data).length === 0) {
      const updated = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: { safra: { select: { id: true, name: true, pricePerKg: true } } },
      });
      return NextResponse.json(updated);
    }
    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data,
      include: { safra: { select: { id: true, name: true, pricePerKg: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession(_request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId, itemId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { safra: true } } },
  });
  if (!order || order.status !== "OPEN") {
    return NextResponse.json({ error: "Comanda não encontrada ou não está aberta" }, { status: 400 });
  }
  const item = order.items.find((i: { id: string }) => i.id === itemId);
  const stockRule = await prisma.systemSetting
    .findUnique({ where: { key: "stockDeductionRule" } })
    .then((s: { value: string } | null) => s?.value ?? "on_pay");
  if (item && stockRule === "on_add") {
    await revertStock({
      safraId: item.safraId,
      quantityKg: Number(item.quantityKg),
      userId: result.session.userId,
    });
  }
  await prisma.orderItem.deleteMany({ where: { id: itemId, orderId } });
  return NextResponse.json({ ok: true });
}
