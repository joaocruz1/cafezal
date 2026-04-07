import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, type ProfileType } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user || !user.active) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    const profile = user.profile as ProfileType;
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      profile,
    });
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
