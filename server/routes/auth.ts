import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { and, eq, or } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword, newId, readSessionFrom, signSession, verifyPassword, SESSION_COOKIE, type SessionClaims } from "../auth/session.js";

function setSession(reply: FastifyReply, token: string) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<SessionClaims | null> {
  const session = await readSessionFrom(req);
  if (!session) {
    reply.code(401).send({ error: "unauthorized" });
    return null;
  }
  return session;
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<SessionClaims | null> {
  const session = await requireAuth(req, reply);
  if (!session) return null;
  if (session.role !== "admin") {
    reply.code(403).send({ error: "forbidden" });
    return null;
  }
  return session;
}

const registerBody = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(100),
  businessName: z.string().max(120).optional(),
  // Public signup can only request retail or wholesaler. Admins are seeded.
  role: z.enum(["retail", "wholesaler"]).default("retail"),
}).refine((b) => b.email || b.phone, { message: "email or phone required" });

export async function authRoutes(app: FastifyInstance) {
  // Brute-force guard: 20 account attempts per minute per IP.
  const strict = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };
  app.post("/api/auth/register", { ...strict }, async (req, reply) => {
    const body = registerBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });
    const { email, phone, password, businessName, role } = body.data;

    const clashConds = [
      email ? eq(users.email, email) : undefined,
      phone ? eq(users.phone, phone) : undefined,
    ].filter((c) => c !== undefined);
    const existing = await db.select({ id: users.id }).from(users).where(or(...clashConds)).limit(1);
    if (existing.length) return reply.code(409).send({ error: "account_exists" });

    const id = newId("usr");
    await db.insert(users).values({
      id,
      email: email ?? null,
      phone: phone ?? null,
      passwordHash: await hashPassword(password),
      role,
      businessName: businessName ?? null,
      // Wholesalers need admin approval (role + approved flag). Bulk tiers
      // themselves are quantity-based and apply to every shopper.
      approved: role !== "wholesaler",
    });
    setSession(reply, await signSession({ sub: id, role }));
    return { id, role, approved: role !== "wholesaler" };
  });

  const loginBody = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  }).refine((b) => b.email || b.phone, { message: "email or phone required" });
  app.post("/api/auth/login", { ...strict }, async (req, reply) => {
    const body = loginBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const idConds = [
      body.data.email ? eq(users.email, body.data.email) : undefined,
      body.data.phone ? eq(users.phone, body.data.phone) : undefined,
    ].filter((c) => c !== undefined);
    // Both identifiers supplied → both must match (AND). Either alone → that
    // one must match. Never mix one person's email with another's phone.
    const rows = await db.select().from(users).where(
      idConds.length > 1 ? and(...idConds) : or(...idConds),
    ).limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(body.data.password, user.passwordHash))) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }
    setSession(reply, await signSession({ sub: user.id, role: user.role as SessionClaims["role"] }));
    return { id: user.id, role: user.role, approved: user.approved, businessName: user.businessName };
  });

  app.post("/api/auth/logout", async (_req, reply) => {
    // Attrs must mirror setSession or browsers keep the cookie.
    // NOTE: the JWT itself stays valid until expiry (stateless sessions have
    // no server-side revocation); logout is cookie removal. Keep lifetimes
    // short-ish and secrets per-fork.
    reply.clearCookie(SESSION_COOKIE, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { ok: true };
  });

  app.get("/api/auth/me", async (req) => {
    const session = await readSessionFrom(req);
    if (!session) return { user: null };
    const rows = await db.select().from(users).where(eq(users.id, session.sub)).limit(1);
    const user = rows[0];
    if (!user) return { user: null };
    return { user: { id: user.id, role: user.role, approved: user.approved, businessName: user.businessName, email: user.email, phone: user.phone } };
  });
}
