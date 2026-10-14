import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-only-change-me-in-prod");

export interface SessionClaims {
  sub: string;
  role: "retail" | "wholesaler" | "admin";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .setJti(randomUUID())
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    const role = payload.role as SessionClaims["role"];
    if (role !== "retail" && role !== "wholesaler" && role !== "admin") return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}

/** Cheap request id for guest orders (no uuid dep on the server). */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${createHash("sha256").update(randomUUID()).digest("hex").slice(0, 12)}`;
}
