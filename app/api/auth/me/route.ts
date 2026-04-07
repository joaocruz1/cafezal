import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anyAuthenticated } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = anyAuthenticated(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const user = await prisma.user.findUnique({
    where: { id: result.session.userId },
    select: { id: true, email: true, name: true, profile: true, active: true },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Usuário inativo" }, { status: 403 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profile: user.profile,
  });
}
