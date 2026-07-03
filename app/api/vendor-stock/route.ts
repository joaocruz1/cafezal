import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { getVendorStockTotalsBySafra } from "@/lib/vendor-stock";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  let vendorUserId = searchParams.get("vendorUserId");
  const mine = searchParams.get("mine") === "true";

  if (result.session.profile === "VENDEDOR") {
    // A vendedor can only ever see their own stock, regardless of query params.
    vendorUserId = result.session.userId;
  } else if (mine) {
    vendorUserId = result.session.userId;
  }

  if (!vendorUserId) {
    return NextResponse.json({ error: "Informe vendorUserId ou mine=true" }, { status: 400 });
  }

  const safras = await prisma.coffeeHarvest.findMany({
    where: { active: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: { category: { select: { id: true, name: true } } },
  });
  const totals = await getVendorStockTotalsBySafra(vendorUserId);

  const withStock = safras.map((s) => ({
    ...s,
    currentStockKg: totals[s.id] ?? 0,
  }));

  return NextResponse.json(withStock);
}
