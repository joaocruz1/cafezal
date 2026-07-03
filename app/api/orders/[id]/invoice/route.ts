import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove, financeiroOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const invoiceSelect = {
  id: true,
  fileName: true,
  fileSizeBytes: true,
  mimeType: true,
  uploadedAt: true,
} as const;

function isPdf(file: File, bytes: Uint8Array): boolean {
  if (file.type !== "application/pdf") return false;
  // magic bytes "%PDF-"
  const magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return magic.every((b, i) => bytes[i] === b);
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
    return NextResponse.json(
      { error: "Só é possível anexar nota em comanda finalizada" },
      { status: 400 }
    );
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Arquivo excede o limite de 5MB" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(file, bytes)) {
    return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
  }
  try {
    const invoice = await prisma.orderInvoice.create({
      data: {
        orderId,
        fileName: file.name,
        storagePath: "db",
        fileData: bytes,
        fileSizeBytes: file.size,
        mimeType: "application/pdf",
        uploadedByUserId: result.session.userId,
      },
      select: invoiceSelect,
    });
    await auditLog({
      userId: result.session.userId,
      action: "order.invoice.upload",
      entityType: "Order",
      entityId: orderId,
      summary: `Nota "${file.name}" (${file.size} bytes) anexada à comanda ${order.identifier}`,
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Essa comanda já possui nota anexada" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao anexar nota" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId } = await params;
  const invoice = await prisma.orderInvoice.findUnique({ where: { orderId } });
  if (!invoice) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }
  return new NextResponse(Buffer.from(invoice.fileData), {
    headers: {
      "Content-Type": invoice.mimeType,
      "Content-Length": String(invoice.fileSizeBytes),
      "Content-Disposition": `attachment; filename="invoice.pdf"; filename*=UTF-8''${encodeURIComponent(invoice.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const result = financeiroOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { id: orderId } = await params;
  const invoice = await prisma.orderInvoice.findUnique({
    where: { orderId },
    select: { id: true, fileName: true },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }
  await prisma.orderInvoice.delete({ where: { orderId } });
  await auditLog({
    userId: result.session.userId,
    action: "order.invoice.delete",
    entityType: "Order",
    entityId: orderId,
    summary: `Nota "${invoice.fileName}" removida da comanda`,
  });
  return NextResponse.json({ ok: true });
}
