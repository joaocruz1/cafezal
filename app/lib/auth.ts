import * as jose from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cafezal-secret-change-in-production"
);
const JWT_EXPIRY = "8h";

export type ProfileType = "ADMIN" | "GERENTE" | "FINANCEIRO" | "VENDEDOR" | "ESTOQUE";

export type SessionPayload = {
  userId: string;
  email: string;
  profile: ProfileType;
  iat?: number;
  exp?: number;
};

export async function signToken(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
