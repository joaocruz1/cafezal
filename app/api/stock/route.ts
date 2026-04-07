import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { anyAuthenticated } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const lowOnly = searchParams.get("low") === "true";

  const safras = await prisma.coffeeHarvest.findMany({
    where: lowOnly ? {} : {},
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  const withStock = await Promise.all(
    safras.map(async (s) => {
      const current = await getCurrentStockKg(s.id);
      return { ...s, currentStockKg: current };
    })
  );

  const filtered = lowOnly
    ? withStock.filter(
        (s) =>
          s.minStockKg != null &&
          Number(s.minStockKg) > 0 &&
          s.currentStockKg <= Number(s.minStockKg)
      )
    : withStock;

  return NextResponse.json(filtered);
}
