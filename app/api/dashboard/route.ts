import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's sales total
  const todaySalesResult = await prisma.order.aggregate({
    _sum: { total: true },
    where: {
      status: "FINALIZED",
      finalizedAt: { gte: todayStart, lte: todayEnd },
    },
  });

  // Open orders count
  const openOrders = await prisma.order.count({
    where: { status: "OPEN" },
  });

  // Low stock count
  const safras = await prisma.coffeeHarvest.findMany({
    where: { active: true, minStockKg: { gt: 0 } },
    select: { id: true, minStockKg: true },
  });

  let lowStockCount = 0;
  for (const s of safras) {
    const result = await prisma.stockMovement.aggregate({
      _sum: { quantityKg: true },
      where: { safraId: s.id },
    });
    const current = Number(result._sum.quantityKg ?? 0);
    if (current <= Number(s.minStockKg)) lowStockCount++;
  }

  // Cash register status
  const openCash = await prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: { cashMovements: true },
  });

  let cashBalance = 0;
  if (openCash) {
    const opening = Number(openCash.openingBalance);
    const movements = openCash.cashMovements as { type: string; amount: unknown }[];
    const totalIn = movements
      .filter((m) => m.type === "SALE" || m.type === "MANUAL_IN")
      .reduce((s, m) => s + Number(m.amount), 0);
    const totalOut = movements
      .filter((m) => m.type === "MANUAL_OUT")
      .reduce((s, m) => s + Number(m.amount), 0);
    cashBalance = opening + totalIn - totalOut;
  }

  // Last 7 days sales
  const last7Days: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const result = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: "FINALIZED",
        finalizedAt: { gte: start, lte: end },
      },
    });
    last7Days.push({
      date: d.toISOString().slice(0, 10),
      total: Number(result._sum.total ?? 0),
    });
  }

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { openedAt: "desc" },
    select: {
      id: true,
      identifier: true,
      status: true,
      total: true,
      openedAt: true,
    },
  });

  return NextResponse.json({
    todaySales: Number(todaySalesResult._sum.total ?? 0),
    openOrders,
    lowStockCount,
    cashStatus: openCash ? "OPEN" : "CLOSED",
    cashBalance,
    last7Days,
    recentOrders: recentOrders.map((o: { id: string; identifier: string; status: string; total: unknown; openedAt: Date }) => ({
      ...o,
      total: o.total ? Number(o.total) : null,
    })),
  });
}
