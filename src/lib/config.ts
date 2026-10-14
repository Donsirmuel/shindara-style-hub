/**
 * Application configuration (Vite-safe: uses import.meta.env).
 * Frontend reads the embedded API; falls back to local JSON for static demos.
 */
import { site } from "@/site.config";

export const config = {
  useMocks: !import.meta.env.VITE_API_URL,
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "/api",
  brand: site.brand,
  currency: site.currency,
} as const;
