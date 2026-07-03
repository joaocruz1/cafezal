import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { vendedorOrAbove } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

function normalizeDocument(document: unknown): string | null {
  if (document == null) return null;
  const digits = String(document).replace(/\D/g, "");
  return digits || null;
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const activeOnly = searchParams.get("active") !== "false";

  const customers = await prisma.customer.findMany({
    where: {
      ...(activeOnly ? { active: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { document: { contains: search.replace(/\D/g, "") } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  const result = vendedorOrAbove(session);
  if (!result.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: result.status });
  }
  try {
    const body = await request.json();
    const { name, document, phone, address } = body;
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const customer = await prisma.customer.create({
      data: {
        name: String(name).trim(),
        document: normalizeDocument(document),
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
      },
    });
    await auditLog({
      userId: result.session.userId,
      action: "customer.create",
      entityType: "Customer",
      entityId: String(customer.id),
      summary: `Cliente criado: ${customer.name}`,
    });
    return NextResponse.json(customer);
  } catch (e) {
    const isUniqueViolation = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Já existe um cliente com esse CNPJ/CPF" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
