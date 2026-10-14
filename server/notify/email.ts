import nodemailer from "nodemailer";

export interface OrderEmailInput {
  to: string;
  ref: string;
  storeName: string;
  pickupAddress?: string;
  fulfillment: "pickup" | "delivery";
  deliveryAddress?: string;
  items: Array<{ name: string; qty: number; unitPrice: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  payment: string;
  money: (n: number) => string;
}

function isConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let warnedOnce = false;

/**
 * Order confirmation email through the vendor's own mailbox
 * (Gmail app password or business SMTP in .env).
 * Unset SMTP_* vars → skipped silently. Never throws.
 */
export async function sendOrderEmail(input: OrderEmailInput): Promise<boolean> {
  if (!isConfigured()) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.log("SMTP not configured — order emails skipped (set SMTP_HOST/USER/PASS to enable).");
    }
    return false;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const itemLines = input.items
    .map((i) => `<tr><td>${escapeHtml(i.name)} × ${i.qty}</td><td align="right">${input.money(i.unitPrice * i.qty)}</td></tr>`)
    .join("");
  const whereLine =
    input.fulfillment === "pickup"
      ? `Pick up at: ${escapeHtml(input.pickupAddress ?? "our store")}`
      : `Deliver to: ${escapeHtml(input.deliveryAddress || "your address")}`;
  const payLine =
    input.payment === "paid"
      ? "Payment: received. Thank you!"
      : "Payment: due at pickup/delivery. Bring this order ref.";

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2>${escapeHtml(input.storeName)}</h2>
      <p>Your order is reserved.</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:2px">${escapeHtml(input.ref)}</p>
      <p>Show this ref at the counter to collect your order.</p>
      <table width="100%" cellpadding="6" style="border-collapse:collapse">${itemLines}</table>
      <p>Subtotal: ${input.money(input.subtotal)}<br/>
      Delivery: ${input.shipping === 0 ? "Free" : input.money(input.shipping)}<br/>
      <strong>Total: ${input.money(input.total)}</strong></p>
      <p>${whereLine}<br/>${payLine}</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: input.to,
      subject: `Your ${input.storeName} order ${input.ref} — ${input.money(input.total)}`,
      html,
    });
    return true;
  } catch (e) {
    console.error("Order email failed:", (e as Error).message);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
