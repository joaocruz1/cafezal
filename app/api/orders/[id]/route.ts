import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { deductStock, revertStock, getCurrentStockKg } from "@/lib/stock";
import { deductVendorStock, revertVendorStock } from "@/lib/vendor-stock";
import { emitSocketEvent } from "@/lib/socket-emit";

class InsufficientStockError extends Error {}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(_request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      openedByUser: { select: { id: true, name: true } },
      cancelledByUser: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      items: { include: { safra: { select: { id: true, name: true, pricePerKg: true } } } },
      payments: true,
      review: true,
      invoice: { select: { id: true, fileName: true, fileSizeBytes: true, uploadedAt: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }
  return NextResponse.json(order);
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
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      openedByUser: { select: { id: true, name: true } },
      items: { include: { safra: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "finalize") {
      if (order.status !== "OPEN") {
        return NextResponse.json({ error: "Só é possível finalizar comanda aberta" }, { status: 400 });
      }
      if (order.items.length === 0) {
        return NextResponse.json({ error: "Não é possível finalizar comanda sem itens" }, { status: 400 });
      }
      const total = order.items.reduce(
        (sum: number, i: { unitPrice: unknown; quantityKg: unknown }) => sum + Number(i.unitPrice) * Number(i.quantityKg),
        0
      );
      try {
        await prisma.$transaction(async (tx) => {
          const stockRule = await tx.systemSetting
            .findUnique({ where: { key: "stockDeductionRule" } })
            .then((s: { value: string } | null) => s?.value ?? "on_pay");
          if (stockRule === "on_pay") {
            for (const it of order.items) {
              const quantityKg = Number(it.quantityKg);
              if (quantityKg > 0) {
                const deduct =
                  order.sellerStockLayer === "VENDOR"
                    ? await deductVendorStock(
                        {
                          vendorUserId: order.openedByUserId,
                          safraId: it.safraId,
                          quantityKg,
                          userId: result.session.userId,
                          orderId: id,
                        },
                        tx
                      )
                    : await deductStock(
                        {
                          safraId: it.safraId,
                          quantityKg,
                          userId: result.session.userId,
                        },
                        tx
                      );
                if (!deduct.ok) {
                  throw new InsufficientStockError(deduct.error ?? "Erro ao baixar estoque");
                }
              }
            }
          }
          await tx.order.update({
            where: { id },
            data: { status: "FINALIZED", total, finalizedAt: new Date() },
          });
        });
      } catch (e) {
        if (e instanceof InsufficientStockError) {
          return NextResponse.json({ error: e.message }, { status: 400 });
        }
        throw e;
      }
      await auditLog({
        userId: result.session.userId,
        action: "order.finalize",
        entityType: "Order",
        entityId: String(id),
        summary: `Comanda #${id} finalizada. Total: R$ ${total.toFixed(2)}`,
      });

      const seller = order.openedByUser;
      for (const it of order.items) {
        const quantityKg = Number(it.quantityKg);
        const bags = it.bags;
        const itemTotal = Number(it.unitPrice) * quantityKg;
        await emitSocketEvent("sale:new", {
          orderId: id,
          sellerId: order.openedByUserId,
          sellerName: seller?.name ?? "Vendedor",
          safraId: it.safraId,
          safraName: it.safra.name,
          kg: quantityKg,
          bags,
          total: itemTotal,
        });
        const currentStock = await getCurrentStockKg(it.safraId);
        await emitSocketEvent("stock:update", {
          safraId: it.safraId,
          safraName: it.safra.name,
          currentStockKg: currentStock,
        });
      }

      const updated = await prisma.order.findUnique({
        where: { id },
        include: {
          openedByUser: { select: { id: true, name: true } },
          items: { include: { safra: { select: { id: true, name: true } } } },
          payments: true,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "cancel") {
      if (order.status !== "OPEN" && order.status !== "FINALIZED") {
        return NextResponse.json({ error: "Comanda já cancelada" }, { status: 400 });
      }
      const reason = body.cancelReason != null ? String(body.cancelReason).trim() : "";
      if (!reason) {
        return NextResponse.json({ error: "Motivo do cancelamento é obrigatório" }, { status: 400 });
      }
      await prisma.$transaction(async (tx) => {
        const stockRule = await tx.systemSetting
          .findUnique({ where: { key: "stockDeductionRule" } })
          .then((s: { value: string } | null) => s?.value ?? "on_pay");
        const revertedOnCancel = order.status === "OPEN" ? stockRule === "on_add" : stockRule === "on_pay";
        if (revertedOnCancel) {
          for (const it of order.items) {
            const quantityKg = Number(it.quantityKg);
            if (quantityKg > 0) {
              if (order.sellerStockLayer === "VENDOR") {
                await revertVendorStock(
                  {
                    vendorUserId: order.openedByUserId,
                    safraId: it.safraId,
                    quantityKg,
                    userId: result.session.userId,
                    orderId: id,
                  },
                  tx
                );
              } else {
                await revertStock(
                  {
                    safraId: it.safraId,
                    quantityKg,
                    userId: result.session.userId,
                  },
                  tx
                );
              }
            }
          }
        }
        await tx.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: reason,
            cancelledByUserId: result.session.userId,
          },
        });
      });
      await auditLog({
        userId: result.session.userId,
        action: "order.cancel",
        entityType: "Order",
        entityId: String(id),
        summary: `Comanda #${id} cancelada. Motivo: ${reason}`,
      });
      const updated = await prisma.order.findUnique({
        where: { id },
        include: {
          openedByUser: { select: { id: true, name: true } },
          cancelledByUser: { select: { id: true, name: true } },
          items: true,
          payments: true,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "set_customer") {
      if (order.status === "CANCELLED") {
        return NextResponse.json({ error: "Não é possível alterar o cliente de uma comanda cancelada" }, { status: 400 });
      }
      let customerId: string | null = null;
      if (body.customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: String(body.customerId) } });
        if (!customer || !customer.active) {
          return NextResponse.json({ error: "Cliente não encontrado ou inativo" }, { status: 400 });
        }
        customerId = customer.id;
      }
      const updated = await prisma.order.update({
        where: { id },
        data: { customerId },
        include: {
          openedByUser: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: { include: { safra: { select: { id: true, name: true } } } },
          payments: true,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar comanda" }, { status: 500 });
  }
}
