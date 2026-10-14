import type { FastifyInstance } from "fastify";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, supportsTransactions, type Db } from "../db/client.js";
import { orders, orderItems, products, variants, priceTiers } from "../db/schema.js";
import { readSession } from "../auth/session.js";
import { sendOrderEmail } from "../notify/email.js";

const STORE_NAME = process.env.STORE_NAME ?? "Our Store";
const ORDER_CURRENCY = process.env.ORDER_CURRENCY ?? "NGN";

function money(n: number): string {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: ORDER_CURRENCY, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${ORDER_CURRENCY} ${n.toLocaleString()}`;
  }
}

function contactPhone(order: { contactJson: string }): string {
  try {
    return (JSON.parse(order.contactJson) as { phone?: string }).phone ?? "";
  } catch {
    return "";
  }
}

/**
 * Memorable order refs like SH-482913. Unguessable enough for lookup-by-ref,
 * short enough to read over the phone or type into WhatsApp.
 */
async function newOrderId(): Promise<string> {
  // Per-client prefix, e.g. ORDER_PREFIX=ADA → ADA-482913. Set it to the
  // brand's initials when forking the template.
  const prefix = (process.env.ORDER_PREFIX ?? "SH").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "SH";
  for (let attempt = 0; attempt < 8; attempt++) {
    // 100000–999999: no leading zero, no confusing letters.
    const code = String(randomInt(100000, 1000000));
    const id = `${prefix}-${code}`;
    const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing.length) return id;
  }
  // Astronomically unlikely fallback, still memorable.
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

const contactSchema = z.object({
  email: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().email().optional()),
  firstName: z.string().max(60).optional().default(""),
  lastName: z.string().max(60).optional().default(""),
  phone: z.string().min(7).max(20),
  address: z.string().max(200).optional().default(""),
  city: z.string().max(80).optional().default(""),
  state: z.string().max(80).optional().default(""),
  zipCode: z.string().max(20).optional().default(""),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  qty: z.number().int().min(1).max(1000),
});

const createOrderBody = z.object({
  contact: contactSchema,
  items: orderItemSchema.array().min(1).max(50),
  fulfillment: z.enum(["pickup", "delivery"]).default("delivery"),
  note: z.string().max(500).optional().default(""),
});

function tierPrice(qty: number, base: number, tiers: Array<{ minQty: number; price: number }>): number {
  let best = base;
  for (const t of tiers) if (qty >= t.minQty && t.price < best) best = t.price;
  return best;
}

interface OrderLine {
  productId: string;
  variantId: string;
  qty: number;
  unitPrice: number;
}

class StockRaceError extends Error {
  productId: string;
  constructor(productId: string) {
    super("stock changed during checkout");
    this.productId = productId;
  }
}

/**
 * Order + items + conditional stock decrements. Runs inside a real
 * transaction on Postgres (atomic); sequentially on PGlite where the
 * pre-validation + `stock >= qty` guard still prevents negative stock.
 */
async function persistOrder(
  exec: Db,
  args: {
    orderId: string;
    customerId: string | null;
    fulfillment: "pickup" | "delivery";
    subtotal: number;
    shipping: number;
    contactJson: string;
    lines: OrderLine[];
  },
) {
  await exec.insert(orders).values({
    id: args.orderId,
    customerId: args.customerId,
    status: "pending",
    fulfillment: args.fulfillment,
    subtotal: args.subtotal,
    total: args.subtotal + args.shipping,
    contactJson: args.contactJson,
  });
  await exec.insert(orderItems).values(
    args.lines.map((l) => ({ orderId: args.orderId, variantId: l.variantId, productId: l.productId, qty: l.qty, unitPrice: l.unitPrice })),
  );
  for (const l of args.lines) {
    const updated = await exec
      .update(variants)
      .set({ stock: sql`${variants.stock} - ${l.qty}` })
      .where(and(eq(variants.id, l.variantId), sql`${variants.stock} >= ${l.qty}`))
      .returning({ id: variants.id });
    if (!updated.length) throw new StockRaceError(l.productId);
  }
}

export async function orderRoutes(app: FastifyInstance) {
  // Spam guard: 30 checkouts per minute per IP is plenty for real shoppers.
  app.post("/api/orders", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req, reply) => {
    const body = createOrderBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body", details: body.error.flatten() });

    const session = await readSession(req.cookies.shindara_session);
    const productIds = [...new Set(body.data.items.map((i) => i.productId))];
    const [prods, vars, tiers] = await Promise.all([
      db.select().from(products).where(inArray(products.id, productIds)),
      db.select().from(variants).where(inArray(variants.productId, productIds)),
      db.select().from(priceTiers).where(inArray(priceTiers.productId, productIds)),
    ]);
    const prodById = new Map(prods.map((p) => [p.id, p]));
    const tiersByProduct = new Map<string, Array<{ minQty: number; price: number }>>();
    for (const t of tiers) {
      const list = tiersByProduct.get(t.productId) ?? [];
      list.push({ minQty: t.minQty, price: t.price });
      tiersByProduct.set(t.productId, list);
    }

    // Validate everything before writing anything.
    const lines: OrderLine[] = [];
    for (const item of body.data.items) {
      const prod = prodById.get(item.productId);
      if (!prod) return reply.code(400).send({ error: "unknown_product", productId: item.productId });
      const variant = vars.find((v) => v.productId === item.productId && v.size === item.size && v.color === item.color);
      if (!variant) return reply.code(400).send({ error: "unknown_variant", item });
      if (variant.stock < item.qty) {
        return reply.code(409).send({ error: "insufficient_stock", productId: item.productId, available: variant.stock });
      }
      lines.push({
        productId: item.productId,
        variantId: variant.id,
        qty: item.qty,
        unitPrice: tierPrice(item.qty, prod.basePrice, tiersByProduct.get(item.productId) ?? []),
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    // Pickup is always free; delivery is free above the threshold.
    const shipping =
      body.data.fulfillment === "pickup"
        ? 0
        : subtotal >= Number(process.env.FREE_ABOVE ?? 100000)
          ? 0
          : Number(process.env.SHIPPING_FEE ?? 2000);
    const orderId = await newOrderId();
    const persistArgs = {
      orderId,
      customerId: session?.sub ?? null,
      fulfillment: body.data.fulfillment,
      subtotal,
      shipping,
      contactJson: JSON.stringify({ ...body.data.contact, note: body.data.note }),
      lines,
    };
    try {
      if (supportsTransactions) {
        // Atomic on real Postgres: concurrent checkouts can't oversell.
        await db.transaction(async (tx) => {
          await persistOrder(tx as unknown as Db, persistArgs);
        });
      } else {
        await persistOrder(db, persistArgs);
      }
    } catch (e) {
      if (e instanceof StockRaceError) {
        return reply.code(409).send({ error: "insufficient_stock", productId: e.productId });
      }
      throw e;
    }

    // Confirmation email via the vendor's own SMTP (skipped if unconfigured).
    // Awaited so the client can honestly say "receipt sent" — attempts are
    // time-boxed in the mailer, and the common no-SMTP case returns instantly.
    const emailTo = body.data.contact.email?.trim();
    let emailSent = false;
    if (emailTo) {
      const nameById = new Map(prods.map((p) => [p.id, p.name]));
      const c = body.data.contact;
      emailSent = await sendOrderEmail({
        to: emailTo,
        ref: orderId,
        storeName: STORE_NAME,
        pickupAddress: process.env.PICKUP_ADDRESS,
        fulfillment: body.data.fulfillment,
        deliveryAddress: [c.address, c.city, c.state].filter(Boolean).join(", ") || undefined,
        items: lines.map((l) => ({
          name: nameById.get(l.productId) ?? l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
        subtotal,
        shipping,
        total: subtotal + shipping,
        payment: "unpaid",
        money,
      });
    }
    return { id: orderId, subtotal, shipping, total: subtotal + shipping, status: "pending", payment: "unpaid", emailSent };
  });

  app.get("/api/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = rows[0];
    if (!order) return reply.code(404).send({ error: "not_found" });
    // Only the owner (or anyone with a guest ref within 7 days — template keeps it simple:
    // order id is unguessable) may view. Admin view lives under /api/admin.
    const session = await readSession(req.cookies.shindara_session);
    if (order.customerId && order.customerId !== session?.sub && session?.role !== "admin") {
      return reply.code(403).send({ error: "forbidden" });
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { order, items };
  });

  // Customer: "I've sent the transfer". Phone must match the order's contact
  // phone — that's the only secret a guest customer has.
  app.post("/api/orders/:id/mark-paid", async (req, reply) => {
    const parsed = z.object({ phone: z.string().min(7).max(20) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const { id } = req.params as { id: string };
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = rows[0];
    if (!order) return reply.code(404).send({ error: "not_found" });
    if (contactPhone(order) !== parsed.data.phone.trim()) {
      return reply.code(403).send({ error: "phone_mismatch" });
    }
    if (order.payment !== "unpaid") return { ok: true, payment: order.payment };
    await db.update(orders).set({ payment: "paid_pending" }).where(eq(orders.id, id));
    return { ok: true, payment: "paid_pending" };
  });

  // Customer self-service tracking: ref + phone unlocks status (no account needed).
  app.get("/api/track/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const phone = String((req.query as { phone?: string }).phone ?? "").trim();
    const rows = await db.select().from(orders).where(eq(orders.id, id.toUpperCase())).limit(1);
    const order = rows[0];
    if (!order || contactPhone(order) !== phone || !phone) {
      return reply.code(404).send({ error: "not_found" });
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const prodIds = [...new Set(items.map((i) => i.productId))];
    const prods = prodIds.length
      ? await db.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, prodIds))
      : [];
    const nameById = new Map(prods.map((p) => [p.id, p.name]));
    return {
      ref: order.id,
      status: order.status,
      fulfillment: order.fulfillment,
      payment: order.payment,
      subtotal: order.subtotal,
      shipping: order.total - order.subtotal,
      total: order.total,
      items: items.map((i) => ({
        productId: i.productId,
        productName: nameById.get(i.productId) ?? i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
    };
  });
}
