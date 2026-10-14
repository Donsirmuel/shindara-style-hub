import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { eq, desc, inArray, or, sql } from "drizzle-orm";
import { db, supportsTransactions } from "../db/client.js";
import { orders, orderItems, products, variants, priceTiers, users, categories } from "../db/schema.js";
import { requireAdmin } from "./auth.js";
import { uploadsDir } from "../lib/paths.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const extFor = (mime: string) => (mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg");

/** Magic-byte check so a renamed .exe can't ride in on a spoofed mimetype. */
function sniffImage(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes.length > 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  ) return "image/webp";
  return null;
}

const statusBody = z.object({ status: z.enum(["pending", "confirmed", "ready", "completed", "cancelled"]) });
const paymentBody = z.object({ payment: z.enum(["unpaid", "paid_pending", "paid"]) });
const productBody = z.object({
  id: z.string().min(1).max(60).optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(2000).default(""),
  gender: z.enum(["men", "women", "unisex"]),
  categoryId: z.string().min(1),
  basePrice: z.number().int().min(0),
  originalPrice: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string().max(300)).max(8).default([]),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});
const tiersBody = z.object({
  tiers: z.array(z.object({ minQty: z.number().int().min(1), price: z.number().int().min(0) })).max(5),
});
const approveBody = z.object({ approved: z.boolean() });

export async function adminRoutes(app: FastifyInstance) {
  // Every route in this plugin is admin-only. requireAdmin already sent
  // the 401/403; returning `reply` halts the request before the handler.
  app.addHook("preHandler", async (req, reply) => {
    const session = await requireAdmin(req, reply);
    if (!session) return reply;
  });

  app.get("/api/admin/orders", async (req) => {
    const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
    return db.select().from(orders).orderBy(desc(orders.id)).limit(limit);
  });

  // Full order detail for vendors: lines with product names + parsed contact.
  app.get("/api/admin/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = rows[0];
    if (!order) return reply.code(404).send({ error: "not_found" });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const prodIds = [...new Set(items.map((i) => i.productId))];
    const prods = prodIds.length
      ? await db.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, prodIds))
      : [];
    const nameById = new Map(prods.map((p) => [p.id, p.name]));
    return {
      order,
      items: items.map((i) => ({ ...i, productName: nameById.get(i.productId) ?? i.productId })),
    };
  });

  app.patch("/api/admin/orders/:id", async (req, reply) => {
    const body = statusBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!current.length) return reply.code(404).send({ error: "not_found" });
    // A cancelled order is terminal: leaving it would double-restock below.
    if (current[0].status === "cancelled" && body.data.status !== "cancelled") {
      return reply.code(409).send({ error: "order_cancelled", hint: "Cancelled orders stay cancelled — place a new order instead." });
    }
    // Cancelling an unfulfilled order returns its items to stock (exactly once:
    // the guard above makes a second cancel a no-op for already-cancelled).
    if (body.data.status === "cancelled" && (current[0].status === "pending" || current[0].status === "confirmed")) {
      const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const line of lines) {
        if (!line.variantId) continue;
        await db
          .update(variants)
          .set({ stock: sql`${variants.stock} + ${line.qty}` })
          .where(eq(variants.id, line.variantId));
      }
    }
    await db.update(orders).set({ status: body.data.status }).where(eq(orders.id, id));
    return { ok: true };
  });

  // Counter truth: vendor confirms money arrived (transfer receipt checked).
  app.patch("/api/admin/orders/:id/payment", async (req, reply) => {
    const body = paymentBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const updated = await db.update(orders).set({ payment: body.data.payment }).where(eq(orders.id, id)).returning({ id: orders.id });
    if (!updated.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  app.get("/api/admin/products", async () => {
    return db.select().from(products).limit(200);
  });

  app.post("/api/admin/products", async (req, reply) => {
    const body = productBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });
    const b = body.data;
    const id = b.id ?? `prod-${randomUUID().slice(0, 8)}`;
    const slug = `${id}-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    const created = await db.insert(products).values({
      id,
      slug,
      name: b.name,
      description: b.description,
      gender: b.gender,
      categoryId: b.categoryId,
      basePrice: b.basePrice,
      originalPrice: b.originalPrice ?? null,
      images: b.images,
      inStock: b.inStock,
      featured: b.featured,
    }).onConflictDoNothing().returning({ id: products.id });
    // Explicit id/slug collision (or same-millisecond retry): say so instead
    // of reporting a success that never happened.
    if (!created.length) return reply.code(409).send({ error: "id_taken", hint: "That product id already exists." });
    // New products need at least one orderable option; the vendor then edits
    // sizes and stock in the variant manager.
    const defaultVid = `${id}-one-size-standard`;
    await db.insert(variants).values({
      id: defaultVid,
      productId: id,
      size: "One Size",
      color: "Standard",
      sku: `${id}-ONE-SIZE-STANDARD`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
      stock: 0,
    }).onConflictDoNothing();
    return { id, slug };
  });

  // Edit product fields (name, price, category, images, flags). Slug stays stable.
  app.patch("/api/admin/products/:id", async (req, reply) => {
    const body = productBody.partial().safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });
    const { id } = req.params as { id: string };
    const b = body.data;
    const updated = await db.update(products).set({
      ...(b.name !== undefined ? { name: b.name } : {}),
      ...(b.description !== undefined ? { description: b.description } : {}),
      ...(b.gender !== undefined ? { gender: b.gender } : {}),
      ...(b.categoryId !== undefined ? { categoryId: b.categoryId } : {}),
      ...(b.basePrice !== undefined ? { basePrice: b.basePrice } : {}),
      ...(b.originalPrice !== undefined ? { originalPrice: b.originalPrice ?? null } : {}),
      ...(b.images !== undefined ? { images: b.images } : {}),
      ...(b.inStock !== undefined ? { inStock: b.inStock } : {}),
      ...(b.featured !== undefined ? { featured: b.featured } : {}),
    }).where(eq(products.id, id)).returning({ id: products.id });
    if (!updated.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  // Clone a product for the new season: same fields + tiers, variants at 0
  // stock so the vendor consciously restocks instead of overselling.
  app.post("/api/admin/products/:id/duplicate", async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const src = rows[0];
    if (!src) return reply.code(404).send({ error: "not_found" });
    const newId = `prod-${Date.now().toString(36)}`;
    const slug = `${newId}-${src.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    await db.insert(products).values({
      id: newId,
      slug,
      name: `${src.name} (Copy)`,
      description: src.description,
      gender: src.gender,
      categoryId: src.categoryId,
      basePrice: src.basePrice,
      originalPrice: src.originalPrice,
      images: src.images,
      inStock: false, // hidden until the vendor reviews + restocks
      featured: false,
    });
    const [srcTiers, srcVariants] = await Promise.all([
      db.select().from(priceTiers).where(eq(priceTiers.productId, id)),
      db.select().from(variants).where(eq(variants.productId, id)),
    ]);
    if (srcTiers.length) {
      await db.insert(priceTiers).values(srcTiers.map((t) => ({ productId: newId, minQty: t.minQty, price: t.price })));
    }
    for (const v of srcVariants) {
      const vid = `${newId}-${v.size}-${v.color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await db.insert(variants).values({
        id: vid,
        productId: newId,
        size: v.size,
        color: v.color,
        sku: `${newId}-${v.size}-${v.color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
        stock: 0,
      }).onConflictDoNothing();
    }
    return { id: newId, slug };
  });

  app.put("/api/admin/products/:id/tiers", async (req, reply) => {
    const body = tiersBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const exists = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    if (!exists.length) return reply.code(404).send({ error: "not_found" });
    // Replace-then-insert must be atomic: a crash between DELETE and INSERT
    // would otherwise leave shoppers with zero tiers (full price for bulk).
    const replace = async (exec: typeof db) => {
      await exec.execute(sql`DELETE FROM price_tiers WHERE product_id = ${id}`);
      if (body.data.tiers.length) {
        await exec.insert(priceTiers).values(body.data.tiers.map((t) => ({ productId: id, minQty: t.minQty, price: t.price })));
      }
    };
    try {
      if (supportsTransactions) {
        await db.transaction(async (tx) => {
          await replace(tx as unknown as typeof db);
        });
      } else {
        await replace(db);
      }
    } catch (e) {
      // Duplicate min_qty for one product (unique(product_id, min_qty)).
      // Real Postgres reports code 23505 on the error; PGlite nests it one
      // level down (drizzle wraps driver errors in `cause`).
      const codes: string[] = [];
      let cur: unknown = e;
      for (let i = 0; i < 3 && cur instanceof Error; i++) {
        if ("code" in cur) codes.push(String((cur as { code: unknown }).code));
        cur = (cur as { cause?: unknown }).cause;
      }
      if (codes.includes("23505")) {
        return reply.code(409).send({ error: "duplicate_tier", hint: "Each minimum quantity may appear only once." });
      }
      throw e;
    }
    return { ok: true };
  });

  // ---- Variants (size/color stock) ----
  const variantStockBody = z.object({ stock: z.number().int().min(0).max(100000) });
  const variantCreateBody = z.object({
    size: z.string().min(1).max(20),
    color: z.string().min(1).max(40),
    stock: z.number().int().min(0).max(100000).default(0),
  });

  // Vendor edits stock per size/color. No variant is ever silently deleted.
  app.patch("/api/admin/variants/:id", async (req, reply) => {
    const body = variantStockBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const updated = await db.update(variants).set({ stock: body.data.stock }).where(eq(variants.id, id)).returning({ id: variants.id });
    if (!updated.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  app.post("/api/admin/products/:id/variants", async (req, reply) => {
    const body = variantCreateBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });
    const { id: productId } = req.params as { id: string };
    const exists = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
    if (!exists.length) return reply.code(404).send({ error: "not_found" });
    const vid = `${productId}-${body.data.size}-${body.data.color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sku = `${productId}-${body.data.size}-${body.data.color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
    // Never silently merge: "M" vs "m" (or an SKU clash) is a 409 telling the
    // vendor to edit the existing variant's stock instead.
    const clash = await db.select({ id: variants.id }).from(variants).where(
      or(eq(variants.id, vid), eq(variants.sku, sku)),
    ).limit(1);
    if (clash.length) {
      return reply.code(409).send({ error: "variant_exists", hint: "That size/color already exists — adjust its stock instead." });
    }
    await db.insert(variants).values({
      id: vid,
      productId,
      size: body.data.size,
      color: body.data.color,
      sku,
      stock: body.data.stock,
    });
    return { id: vid };
  });

  app.delete("/api/admin/variants/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    // Never orphan order history: block deletion while orders reference the variant.
    const refs = await db.execute(sql`SELECT 1 FROM order_items WHERE variant_id = ${id} LIMIT 1`);
    const hasRefs = ((refs.rows ?? []) as unknown[]).length > 0;
    if (hasRefs) {
      return reply.code(409).send({ error: "referenced_by_orders", hint: "Set its stock to 0 instead — history stays intact." });
    }
    const deleted = await db.delete(variants).where(eq(variants.id, id)).returning({ id: variants.id });
    if (!deleted.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  // ---- Categories ----
  const categoryBody = z.object({
    name: z.string().min(2).max(80),
    gender: z.enum(["men", "women", "all"]),
  });

  // Vendors can grow the taxonomy themselves (e.g. "Aso-Ebi").
  // Convention (matches seed): id/slug = "<gender>-<slugified name>".
  app.post("/api/admin/categories", async (req, reply) => {
    const body = categoryBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });
    const slugPart = body.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "misc";
    const id = `${body.data.gender}-${slugPart}`;
    await db.insert(categories).values({ id, name: body.data.name, slug: id, gender: body.data.gender }).onConflictDoNothing();
    return { id };
  });

  app.patch("/api/admin/categories/:id", async (req, reply) => {
    const body = z.object({ name: z.string().min(2).max(80) }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const updated = await db.update(categories).set({ name: body.data.name }).where(eq(categories.id, id)).returning({ id: categories.id });
    if (!updated.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  app.delete("/api/admin/categories/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const used = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
    if (used.length) {
      return reply.code(409).send({ error: "category_in_use", hint: "Move its products to another category first." });
    }
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
    if (!deleted.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  // Wholesaler approvals + role management
  app.get("/api/admin/customers", async (req) => {
    const role = (req.query as { role?: string }).role;
    const all = await db.select().from(users).limit(200);
    return all
      .filter((u) => (!role || u.role === role))
      .map((u) => ({ id: u.id, email: u.email, phone: u.phone, role: u.role, businessName: u.businessName, approved: u.approved }));
  });

  app.patch("/api/admin/customers/:id", async (req, reply) => {
    const body = approveBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const updated = await db.update(users).set({ approved: body.data.approved }).where(eq(users.id, id)).returning({ id: users.id });
    if (!updated.length) return reply.code(404).send({ error: "not_found" });
    return { ok: true };
  });

  // Local-disk image upload (template default: no S3). 5MB, jpg/png/webp.
  // Mimetype header is client-controlled, so the actual bytes are sniffed too.
  app.post("/api/admin/uploads", async (req, reply) => {
    const part = await req.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    if (!part) return reply.code(400).send({ error: "no_file" });
    if (!ALLOWED.has(part.mimetype)) return reply.code(400).send({ error: "bad_type", allowed: [...ALLOWED] });
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of part.file) {
        size += (chunk as Buffer).length;
        if (size > 5 * 1024 * 1024 + 64 * 1024) {
          return reply.code(400).send({ error: "too_large" });
        }
        chunks.push(chunk as Buffer);
      }
    } catch {
      return reply.code(400).send({ error: "unreadable" });
    }
    const buf = Buffer.concat(chunks);
    const kind = sniffImage(buf);
    if (!kind || kind !== part.mimetype) {
      return reply.code(400).send({ error: "bad_content", hint: "File bytes don't match its image type." });
    }
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${extFor(kind)}`;
    await fs.promises.writeFile(path.join(uploadsDir(), name), buf);
    return { url: `/uploads/${name}` };
  });
}
