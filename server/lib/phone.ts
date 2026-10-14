/**
 * Phone normalization shared by track/mark-paid lookups and WhatsApp links.
 * Compares digit strings so "0803 123 4567", "+2348031234567" and
 * "2348031234567" all match the same stored contact number.
 */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  // Nigerian local format 0XXXXXXXXXX → international 234XXXXXXXXXX.
  if (digits.startsWith("0") && digits.length >= 10) return `234${digits.slice(1)}`;
  return digits;
}
