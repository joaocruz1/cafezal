import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { estoqueOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = estoqueOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const vendedores = await prisma.user.findMany({
    where: { profile: "VENDEDOR", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(vendedores);
}
