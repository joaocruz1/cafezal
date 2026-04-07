import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") !== "false";
  const forPdv = searchParams.get("forPdv") === "true";

  const where: { active?: boolean } = {};
  if (activeOnly || forPdv) where.active = true;

  const safras = await prisma.coffeeHarvest.findMany({
    where,
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(safras);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { name, year, pricePerKg, kgPerBag, minStockKg, active } = body;
    if (!name || year == null || pricePerKg == null || kgPerBag == null) {
      return NextResponse.json(
        { error: "Nome, ano, preço por kg e kg por saco são obrigatórios" },
        { status: 400 }
      );
    }
    const safra = await prisma.coffeeHarvest.create({
      data: {
        name: String(name).trim(),
        year: Number(year),
        pricePerKg: Number(pricePerKg),
        kgPerBag: Number(kgPerBag),
        minStockKg: Math.max(0, Number(minStockKg) || 0),
        active: active !== false,
      },
    });
    await auditLog({
      userId: result.session.userId,
      action: "safra.create",
      entityType: "CoffeeHarvest",
      entityId: String(safra.id),
      summary: `Safra criada: ${safra.name}`,
    });
    return NextResponse.json(safra);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar safra" }, { status: 500 });
  }
}
