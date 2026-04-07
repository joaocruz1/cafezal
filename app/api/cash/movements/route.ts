import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const open = await prisma.cashRegister.findFirst({ where: { status: "OPEN" } });
  if (!open) {
    return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { type, amount, description } = body;
    if (!type || !["MANUAL_IN", "MANUAL_OUT"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido (MANUAL_IN ou MANUAL_OUT)" }, { status: 400 });
    }
    const value = Number(amount);
    if (value <= 0) {
      return NextResponse.json({ error: "Valor deve ser positivo" }, { status: 400 });
    }
    const desc = String(description ?? "").trim();
    if (!desc) {
      return NextResponse.json({ error: "Descrição/motivo é obrigatória" }, { status: 400 });
    }
    const movement = await prisma.cashMovement.create({
      data: {
        cashRegisterId: open.id,
        type,
        amount: value,
        description: desc,
        createdByUserId: result.session.userId,
      },
      include: { createdByUser: { select: { id: true, name: true } } },
    });
    return NextResponse.json(movement);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao registrar movimento" }, { status: 500 });
  }
}
