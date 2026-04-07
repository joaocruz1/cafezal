import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { deductStock } from "@/lib/stock";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }
  if (order.status !== "OPEN") {
    return NextResponse.json({ error: "Só é possível adicionar itens em comanda aberta" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { safraId, quantityKg, bags, observation } = body;
    if (!safraId) {
      return NextResponse.json({ error: "Safra é obrigatória" }, { status: 400 });
    }
    const safra = await prisma.coffeeHarvest.findUnique({ where: { id: String(safraId) } });
    if (!safra || !safra.active) {
      return NextResponse.json({ error: "Safra não encontrada ou inativa" }, { status: 400 });
    }

    let qtyKg = 0;
    let bagsCount = 0;
    if (quantityKg != null && Number(quantityKg) > 0) {
      qtyKg = Number(quantityKg);
      bagsCount = Math.floor(qtyKg / Number(safra.kgPerBag));
    } else if (bags != null && Number(bags) > 0) {
      bagsCount = Math.floor(Number(bags));
      qtyKg = bagsCount * Number(safra.kgPerBag);
    }
    if (qtyKg <= 0) {
      return NextResponse.json({ error: "Informe quantidade em kg ou sacos" }, { status: 400 });
    }

    const stockRule = await prisma.systemSetting
      .findUnique({ where: { key: "stockDeductionRule" } })
      .then((s) => s?.value ?? "on_pay");
    if (stockRule === "on_add") {
      const deduct = await deductStock({
        safraId: safra.id,
        quantityKg: qtyKg,
        userId: result.session.userId,
      });
      if (!deduct.ok) {
        return NextResponse.json({ error: deduct.error ?? "Erro ao baixar estoque" }, { status: 400 });
      }
    }

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        safraId: safra.id,
        quantityKg: qtyKg,
        bags: bagsCount,
        unitPrice: safra.pricePerKg,
        observation: observation != null ? String(observation).trim() || undefined : undefined,
      },
      include: { safra: { select: { id: true, name: true, pricePerKg: true } } },
    });

    await emitSocketEvent("seller:activity", {
      sellerId: result.session.userId,
      sellerName: result.session.name ?? "Vendedor",
      action: "item_added",
      orderId,
      safraName: safra.name,
      kg: qtyKg,
      bags: bagsCount,
    });

    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
  }
}
