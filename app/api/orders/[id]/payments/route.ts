import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import type { PaymentMethod } from "@prisma/client";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "PIX"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }
  if (order.status !== "FINALIZED") {
    return NextResponse.json({ error: "Comanda deve estar finalizada para registrar pagamento" }, { status: 400 });
  }
  const totalOrder = Number(order.total ?? 0);
  if (totalOrder <= 0) {
    return NextResponse.json({ error: "Total da comanda inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payments = Array.isArray(body.payments) ? body.payments : body.payment ? [body] : [];
    if (payments.length === 0) {
      return NextResponse.json({ error: "Informe ao menos um pagamento" }, { status: 400 });
    }

    const existingTotal = order.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0);
    let newTotal = 0;
    const toCreate: { paymentMethod: PaymentMethod; amount: number; changeGiven?: number }[] = [];

    for (const p of payments) {
      const method = PAYMENT_METHODS.includes(p.paymentMethod) ? p.paymentMethod : "CASH";
      const amount = Number(p.amount);
      if (amount <= 0) continue;
      toCreate.push({
        paymentMethod: method as PaymentMethod,
        amount,
        changeGiven: method === "CASH" && p.changeGiven != null ? Number(p.changeGiven) : undefined,
      });
      newTotal += amount;
    }

    const totalPaid = existingTotal + newTotal;
    if (totalPaid < totalOrder) {
      return NextResponse.json(
        { error: `Valor pago (${totalPaid.toFixed(2)}) é menor que o total (${totalOrder.toFixed(2)})` },
        { status: 400 }
      );
    }

    const requireOpenCash = await prisma.systemSetting
      .findUnique({ where: { key: "requireOpenCashToSell" } })
      .then((s: { value: string } | null) => s?.value !== "false");
    const openCash = await prisma.cashRegister.findFirst({ where: { status: "OPEN" } });
    if (requireOpenCash && !openCash) {
      return NextResponse.json(
        { error: "Caixa fechado. Abra o caixa para registrar a venda." },
        { status: 400 }
      );
    }

    for (const p of toCreate) {
      await prisma.payment.create({
        data: {
          orderId,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          changeGiven: p.changeGiven,
        },
      });
    }

    if (openCash && newTotal > 0) {
      const description = toCreate.map((p) => `${p.paymentMethod}: R$ ${p.amount.toFixed(2)}`).join("; ");
      await prisma.cashMovement.create({
        data: {
          cashRegisterId: openCash.id,
          type: "SALE",
          amount: newTotal,
          description: `Comanda #${orderId} - ${description}`,
          orderId,
          createdByUserId: result.session.userId,
        },
      });
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        openedByUser: { select: { id: true, name: true } },
        items: { include: { safra: { select: { id: true, name: true } } } },
        payments: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });
  }
}
