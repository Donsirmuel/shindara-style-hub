import type { FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { orders, webhookEvents } from "../db/schema.js";
import { normalizePhone } from "../lib/phone.js";
import { createCheckoutSession, isPaymentsConfigured, verifyWebhook } from "../payments/bachs.js";

function contactPhone(order: { contactJson: string }): string {
  try {
    return (JSON.parse(order.contactJson) as { phone?: string }).phone ?? "";
  } catch {
    return "";
  }
}

function contactName(order: { contactJson: string }): string {
  try {
    const c = JSON.parse(order.contactJson) as { firstName?: string; lastName?: string };
    return `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  } catch {
    return "";
  }
}

function contactEmail(order: { contactJson: string }): string {
  try {
    return (JSON.parse(order.contactJson) as { email?: string }).email ?? "";
  } catch {
    return "";
  }
}

export async function paymentRoutes(app: FastifyInstance) {
  // Webhook signature verification needs the exact bytes Bachs signed, so the
  // JSON body is captured raw (and only) for webhook routes.
  app.addHook("preParsing", async (req, _reply, payload) => {
    if (!req.url.startsWith("/api/webhooks/")) return payload;
    const chunks: Buffer[] = [];
    for await (const chunk of payload) chunks.push(chunk as Buffer);
    (req as unknown as { rawBody: Buffer }).rawBody = Buffer.concat(chunks);
    return Readable.from([(req as unknown as { rawBody: Buffer }).rawBody]);
  });

  // Customer: start online payment for an unpaid order. Phone proves the
  // order is theirs (same rule as tracking). Without Bachs keys this is an
  // honest 501, and pay-at-pickup stays the way to pay.
  app.post("/api/orders/:id/pay", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const parsed = z.object({ phone: z.string().min(4).max(30) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    if (!isPaymentsConfigured()) {
      return reply.code(501).send({ error: "payments_disabled", hint: "Online payment isn't enabled on this store yet." });
    }
    const publicBase = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
    if (!publicBase) {
      return reply.code(501).send({ error: "payments_misconfigured", hint: "PUBLIC_BASE_URL is not set." });
    }
    const { id } = req.params as { id: string };
    const rows = await db.select().from(orders).where(eq(orders.id, id.toUpperCase())).limit(1);
    const order = rows[0];
    if (!order) return reply.code(404).send({ error: "not_found" });
    const want = normalizePhone(parsed.data.phone);
    if (!want || normalizePhone(contactPhone(order)) !== want) {
      return reply.code(403).send({ error: "phone_mismatch" });
    }
    if (order.payment === "paid") return { already: true as const, payment: "paid" as const };
    try {
      const session = await createCheckoutSession({
        orderRef: order.id,
        amountNgn: order.total,
        email: contactEmail(order) || undefined,
        name: contactName(order) || undefined,
        phone: contactPhone(order) || undefined,
        successUrl: `${publicBase}/track?ref=${encodeURIComponent(order.id)}&paid=1`,
        cancelUrl: `${publicBase}/track?ref=${encodeURIComponent(order.id)}`,
      });
      await db.update(orders).set({ paymentRef: session.checkoutId }).where(eq(orders.id, order.id));
      return { url: session.url, checkoutId: session.checkoutId };
    } catch (e) {
      req.log.error({ err: e, orderId: order.id }, "bachs checkout failed");
      return reply.code(502).send({ error: "payment_unavailable", hint: "Couldn't reach the payment provider. Try again or pay at pickup." });
    }
  });

  // Bachs webhook: collection.succeeded is the ONLY event that marks paid.
  // 400 = refused (bad signature, never retried); 5xx = retry me.
  app.post("/api/webhooks/bachs", async (req, reply) => {
    const webhookSecret = process.env.BACHS_WEBHOOK_SECRET;
    if (!webhookSecret) return reply.code(503).send({ error: "webhooks_disabled" });
    const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!raw) return reply.code(400).send({ error: "no_body" });
    const v2 = req.headers["x-bachs-signature-v2"] as string | undefined;
    const v1 = req.headers["x-bachs-signature"] as string | undefined;
    const ts = req.headers["x-bachs-timestamp"] as string | undefined;
    let verified = verifyWebhook(raw, v2, webhookSecret);
    if (!verified && v1 && ts) {
      // Legacy header pair: same digest, timestamp carried separately.
      verified = verifyWebhook(raw, `t=${ts},v1=${v1}`, webhookSecret);
    }
    if (!verified) return reply.code(400).send({ error: "bad_signature" });

    let envelope: { id?: string; type?: string; data?: Record<string, unknown> };
    try {
      envelope = JSON.parse(raw.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "bad_json" });
    }
    if (!envelope.id || !envelope.type) return reply.code(400).send({ error: "bad_envelope" });

    // At-least-once delivery: first insert wins, replays land here.
    const fresh = await db
      .insert(webhookEvents)
      .values({ id: envelope.id, type: envelope.type })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (!fresh.length) return { ok: true, deduped: true };

    if (envelope.type === "collection.succeeded") {
      const checkoutId = typeof envelope.data?.checkout_id === "string" ? envelope.data.checkout_id : null;
      if (checkoutId) {
        const matches = await db.select().from(orders).where(eq(orders.paymentRef, checkoutId)).limit(1);
        const order = matches[0];
        // Idempotent: only unpaid → paid. Never touch status (packing stays manual).
        if (order && order.payment !== "paid") {
          await db.update(orders).set({ payment: "paid" }).where(eq(orders.id, order.id));
        }
      }
    }
    // checkout.completed (no payment info), checkout.expired,
    // collection.failed: nothing to do — the order stays payable/unpaid.
    return { ok: true };
  });
}
