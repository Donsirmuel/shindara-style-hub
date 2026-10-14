import { site } from "@/site.config";
import type { CartItem } from "@/lib/types";

export function formatPrice(naira: number): string {
  try {
    return new Intl.NumberFormat(site.locale, {
      style: "currency",
      currency: site.currency,
      maximumFractionDigits: 0,
    }).format(naira);
  } catch {
    return `${site.currency} ${naira.toLocaleString()}`;
  }
}

/**
 * Cheapest unit price for a quantity given tiers [{minQty, price}].
 * Matches the server exactly (cheapest qualified tier wins, order-independent),
 * so the price shown here is the price charged — never a higher "last tier".
 */
export function tierPriceFor(qty: number, basePrice: number, tiers: Array<{ minQty: number; price: number }>): number {
  let best = basePrice;
  for (const t of tiers) {
    if (qty >= t.minQty && t.price < best) best = t.price;
  }
  return best;
}

/** Bulk-aware line total. Cart, checkout and detail must all use this. */
export function lineTotal(item: CartItem): number {
  return tierPriceFor(item.quantity, item.product.price, item.product.tiers ?? []) * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function whatsappOrderLink(orderRef: string, total: number): string {
  const text = encodeURIComponent(`Hello ${site.brand}! I just placed order ${orderRef} (${formatPrice(total)}).`);
  return `https://wa.me/${site.contact.whatsapp}?text=${text}`;
}

/**
 * Normalize a customer phone number to WhatsApp's wa.me format.
 * Assumes Nigerian numbers when it sees a local format (080… → 23480…);
 * passes through anything already international. Vendors should confirm
 * the country prefix matches their market in site.config.ts docs.
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

export function customerWhatsAppLink(phone: string, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
