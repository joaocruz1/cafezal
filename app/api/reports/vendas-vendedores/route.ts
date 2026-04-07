import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "today";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let fromDate: Date;
  let toDate: Date;

  if (from && to) {
    fromDate = new Date(from);
    toDate = new Date(to);
  } else if (period === "week") {
    toDate = new Date();
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
  } else {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date();
  }
  toDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: "FINALIZED",
      finalizedAt: { gte: fromDate, lte: toDate },
    },
    include: {
      openedByUser: { select: { id: true, name: true } },
      items: {
        include: { safra: { select: { id: true, name: true } } },
      },
    },
    orderBy: { finalizedAt: "desc" },
  });

  const bySeller = new Map<
    string,
    { sellerId: string; sellerName: string; kg: number; bags: number; total: number; lastSale: Date }
  >();

  for (const o of orders) {
    const sellerId = o.openedByUserId;
    const sellerName = o.openedByUser?.name ?? "—";
    const existing = bySeller.get(sellerId);
    let kg = 0;
    let bags = 0;
    let total = Number(o.total ?? 0);
    for (const it of o.items) {
      kg += Number(it.quantityKg);
      bags += it.bags;
    }
    const lastSale = o.finalizedAt ?? o.openedAt;
    if (existing) {
      existing.kg += kg;
      existing.bags += bags;
      existing.total += total;
      if (lastSale > existing.lastSale) existing.lastSale = lastSale;
    } else {
      bySeller.set(sellerId, {
        sellerId,
        sellerName,
        kg,
        bags,
        total,
        lastSale,
      });
    }
  }

  const sellers = Array.from(bySeller.values()).sort(
    (a, b) => b.lastSale.getTime() - a.lastSale.getTime()
  );

  const recentSales = orders.slice(0, 20).map((o: typeof orders[number]) => ({
    id: o.id,
    identifier: o.identifier,
    sellerName: o.openedByUser?.name ?? "—",
    finalizedAt: o.finalizedAt,
    total: Number(o.total ?? 0),
    items: o.items.map((i: typeof o.items[number]) => ({
      safraName: i.safra.name,
      kg: Number(i.quantityKg),
      bags: i.bags,
      total: Number(i.unitPrice) * Number(i.quantityKg),
    })),
  }));

  return NextResponse.json({
    sellers,
    recentSales,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  });
}
