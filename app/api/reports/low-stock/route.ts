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
  const safras = await prisma.coffeeHarvest.findMany({
    where: { active: true },
  });
  const withStock = await Promise.all(
    safras.map(async (s: typeof safras[number]) => ({
      ...s,
      currentStockKg: await getCurrentStockKg(s.id),
    }))
  );
  const low = withStock.filter(
    (s: { minStockKg: unknown; currentStockKg: number }) =>
      Number(s.minStockKg) > 0 && s.currentStockKg <= Number(s.minStockKg)
  );
  return NextResponse.json(low);
}
