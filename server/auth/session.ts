import type { FastifyRequest } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

/**
 * Session cookie name. Overridable per fork (COOKIE_NAME) so two brands
 * tested on one machine never share sessions. Matches the cart-key
 * namespacing on the frontend (site.brandSlug).
 */
export const SESSION_COOKIE = process.env.COOKIE_NAME ?? "session";

let warnedFallback = false;
const secret = () => {
  if (!process.env.JWT_SECRET && !warnedFallback) {
    warnedFallback = true;
    // Dev convenience only: production refuses to boot without JWT_SECRET
    // (see the guard in db/client.ts). Never rely on this default.
    console.warn("WARN: JWT_SECRET unset — using an insecure dev default.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-only-change-me-in-prod");
};

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

export async function readSession(token: string | undefined): Promise<SessionClaims | null> {  if (!token) return null;
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

/** Read the session from the configured cookie on a request. */
export function readSessionFrom(req: FastifyRequest): Promise<SessionClaims | null> {
  return readSession(req.cookies[SESSION_COOKIE] as string | undefined);
}

/** Cheap request id for guest orders (no uuid dep on the server). */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${createHash("sha256").update(randomUUID()).digest("hex").slice(0, 12)}`;
}
