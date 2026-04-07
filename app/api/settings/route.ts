import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gerenteOrAdmin } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

const KEYS = [
  "establishmentName",
  "stockDeductionRule",
  "allowNegativeStock",
  "requireOpenCashToSell",
] as const;
const STOCK_RULES = ["on_add", "on_pay"];

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: [...KEYS] } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  if (!map.establishmentName) map.establishmentName = "Café";
  if (!map.stockDeductionRule) map.stockDeductionRule = "on_pay";
  if (!map.allowNegativeStock) map.allowNegativeStock = "false";
  if (!map.requireOpenCashToSell) map.requireOpenCashToSell = "true";
  return NextResponse.json(map);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  const result = gerenteOrAdmin(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    for (const key of KEYS) {
      const value = body[key];
      if (value === undefined) continue;
      const str = String(value);
      if (key === "stockDeductionRule" && !STOCK_RULES.includes(str)) continue;
      if (key === "allowNegativeStock" || key === "requireOpenCashToSell") {
        const v = str === "true" ? "true" : "false";
        await prisma.systemSetting.upsert({
          where: { key },
          create: { key, value: v },
          update: { value: v },
        });
      } else {
        await prisma.systemSetting.upsert({
          where: { key },
          create: { key, value: str },
          update: { value: str },
        });
      }
    }
    await auditLog({
      userId: result.session.userId,
      action: "settings.update",
      entityType: "SystemSetting",
      summary: "Configurações atualizadas",
    });
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: [...KEYS] } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json(map);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
  }
}
