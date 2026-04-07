import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { anyAuthenticated } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ safraId: string }> }
) {
  const session = await getSession(request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { safraId } = await params;
  const movements = await prisma.stockMovement.findMany({
    where: { safraId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdByUser: { select: { id: true, name: true } } },
  });
  return NextResponse.json(movements);
}
