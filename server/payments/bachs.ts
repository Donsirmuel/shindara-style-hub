import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Bachs payments (https://docs.bachs.io). Conventions honored:
 * - Money is a decimal string at currency precision ("7500.00"), never minor units.
 * - Sandbox (sk_sandbox_, https://sandbox-api.bachs.io) vs live (sk_live_) is
 *   a key swap — the base URL follows the key unless BACHS_BASE_URL overrides.
 * - Webhooks are the source of truth; redirects are hints. At-least-once
 *   delivery is deduplicated by event id in the webhook_events table.
 *
 * Inactive without BACHS_SECRET_KEY: the pay endpoint answers 501 and the
 * webhook answers 503, so a fork without a Bachs account behaves exactly
 * like before (transfer/cash at pickup).
 */

export function bachsBaseUrl(): string {
  if (process.env.BACHS_BASE_URL) return process.env.BACHS_BASE_URL;
  const key = process.env.BACHS_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";
}

export function isPaymentsConfigured(): boolean {
  return !!process.env.BACHS_SECRET_KEY;
}

export interface CheckoutInput {
  orderRef: string;
  amountNgn: number;
  currency?: string;
  email?: string;
  name?: string;
  phone?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  checkoutId: string;
  url: string;
}

/** Raw-amount checkout: our order total priced at session time, no Bachs catalog needed. */
export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
  const currency = input.currency ?? process.env.ORDER_CURRENCY ?? "NGN";
  const res = await fetch(`${bachsBaseUrl()}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BACHS_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pricing: { currency, amount: input.amountNgn.toFixed(2) },
      reference: input.orderRef,
      metadata: { order_ref: input.orderRef, ...(input.phone ? { phone: input.phone } : {}) },
      ...(input.email || input.name
        ? { customer: { ...(input.email ? { email: input.email } : {}), ...(input.name ? { name: input.name } : {}) } }
        : {}),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    checkout_id?: string;
    checkout_url?: string;
    error?: unknown;
  };
  if (!res.ok || !payload.checkout_id || !payload.checkout_url) {
    throw new Error(`bachs checkout failed (${res.status}): ${JSON.stringify(payload).slice(0, 200)}`);
  }
  return { checkoutId: payload.checkout_id, url: payload.checkout_url };
}

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Verify an X-Bachs-Signature-V2 header (`t=..,v1=..[,v1=..]`) against the
 * RAW body. Any v1 match counts (secret rotation sends several). Rejects
 * deliveries older than 5 minutes as replay protection.
 */
export function verifyWebhook(rawBody: Buffer, header: string | undefined, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const ts = Number(t);
  if (!t || !Number.isFinite(ts) || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${ts}.`).update(rawBody).digest("hex");
  return sigs.some((s) => timingSafeEq(expected, s));
}
