import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { anyAuthenticated } from "@/lib/permissions";
import { getCurrentStockKg } from "@/lib/stock";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ safraId: string }> }
) {
  const session = await getSession(_request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { safraId } = await params;
  const safra = await prisma.coffeeHarvest.findUnique({ where: { id: safraId } });
  if (!safra) {
    return NextResponse.json({ error: "Safra não encontrada" }, { status: 404 });
  }
  const currentStockKg = await getCurrentStockKg(safra.id);
  return NextResponse.json({ ...safra, currentStockKg });
}
