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
  let vendorUserId = searchParams.get("vendorUserId");
  const safraId = searchParams.get("safraId");

  if (result.session.profile === "VENDEDOR") {
    vendorUserId = result.session.userId;
  }
  if (!vendorUserId) {
    return NextResponse.json({ error: "Informe vendorUserId" }, { status: 400 });
  }

  const movements = await prisma.vendorStockMovement.findMany({
    where: { vendorUserId, ...(safraId ? { safraId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      safra: { select: { id: true, name: true } },
      createdByUser: { select: { name: true } },
    },
  });
  return NextResponse.json(movements);
}
