import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";

function parseRating(body: unknown): { ok: true; rating: number; comment: string | null } | { ok: false; error: string } {
  const { rating, comment } = (body ?? {}) as { rating?: unknown; comment?: unknown };
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    return { ok: false, error: "Nota deve ser um número inteiro entre 1 e 5" };
  }
  return { ok: true, rating: n, comment: comment != null && String(comment).trim() ? String(comment).trim() : null };
}

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
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }
  if (order.status !== "FINALIZED") {
    return NextResponse.json({ error: "Só é possível avaliar uma comanda finalizada" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = parseRating(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const review = await prisma.orderReview.create({
      data: {
        orderId,
        rating: parsed.rating,
        comment: parsed.comment,
        createdByUserId: result.session.userId,
      },
    });
    return NextResponse.json(review);
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Essa comanda já foi avaliada" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao registrar avaliação" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId } = await params;
  const existing = await prisma.orderReview.findUnique({ where: { orderId } });
  if (!existing) {
    return NextResponse.json({ error: "Essa comanda ainda não foi avaliada" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = parseRating(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const review = await prisma.orderReview.update({
    where: { orderId },
    data: { rating: parsed.rating, comment: parsed.comment },
  });
  return NextResponse.json(review);
}
