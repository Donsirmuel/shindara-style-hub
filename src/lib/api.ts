/**
 * API client with JSON-file fallback so the GitHub Pages demo keeps working
 * when no backend is configured (VITE_API_URL unset or unreachable).
 *
 * The embedded API returns Drizzle rows (basePrice, categoryId, rating x10);
 * this module maps everything to the frontend `Product` shape so pages
 * never care where data came from.
 */
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import type { Category, PriceTier, Product, ProductVariant } from "@/lib/types";
import { site } from "@/site.config";

const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

async function tryApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${base}${path}`, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown) {
    super(typeof payload === "object" && payload && "error" in payload ? String((payload as { error: string }).error) : `Request failed (${status})`);
    this.status = status;
    this.payload = payload;
  }
}

/**
 * POST helper. Returns parsed JSON, throws ApiError on HTTP errors,
 * returns null when the backend is unreachable (static demo mode).
 */
async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as T;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as T;
}

async function apiGet<T>(path: string): Promise<T | null> {
  return tryApi<T>(path);
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  gender: "men" | "women" | "unisex";
  categoryId: string | null;
  basePrice: number;
  originalPrice: number | null;
  images: string[];
  inStock: boolean;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  rating: number | null;
  reviewCount: number;
  sizes?: string[];
  colors?: string[];
  tiers?: PriceTier[];
  stockTotal?: number;
  minStock?: number;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.basePrice,
    originalPrice: row.originalPrice ?? undefined,
    images: row.images,
    category: row.categoryId ?? "",
    gender: row.gender,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    inStock: row.inStock,
    featured: row.featured || undefined,
    trending: row.trending || undefined,
    newArrival: row.newArrival || undefined,
    rating: row.rating != null ? row.rating / 10 : undefined,
    reviewCount: row.reviewCount,
    tiers: row.tiers,
    stockTotal: row.stockTotal,
    minStock: row.minStock,
  };
}

/**
 * Static-demo fallback: synthesize the template's default bulk tier.
 * Deliberate: bulk here is quantity-based for every shopper (not a
 * role-gated club), so the demo honestly previews the real model —
 * every product is bulkable at MOQ until the vendor sets custom tiers.
 */
function withDemoTier(p: Product): Product {
  if (p.tiers && p.tiers.length) return p;
  return {
    ...p,
    tiers: [{ minQty: site.bulk.defaultMOQ, price: Math.round(p.price * 0.9) }],
  };
}

export interface ProductListParams {
  gender?: "men" | "women" | "unisex";
  category?: string;
  q?: string;
  featured?: boolean;
  includeHidden?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchCategories(): Promise<Category[]> {
  const remote = await tryApi<Category[]>("/categories");
  if (remote) return remote;
  return categoriesData as Category[];
}

export async function fetchProducts(params: ProductListParams = {}): Promise<{ items: Product[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.gender) sp.set("gender", params.gender);
  if (params.category) sp.set("category", params.category);
  if (params.q) sp.set("q", params.q);
  if (params.featured) sp.set("featured", "true");
  if (params.includeHidden) sp.set("includeHidden", "true");
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));
  const remote = await tryApi<{ items: ProductRow[]; total: number }>(`/products?${sp.toString()}`);
  if (remote?.items) {
    const items = remote.items.map((r) => withDemoTier(mapRow(r)));
    return { items, total: remote.total ?? items.length };
  }
  // Fallback: filter the static JSON the same way the old pages did
  let items = [...(productsData as unknown as Product[])];
  if (params.gender) items = items.filter((p) => p.gender === params.gender);
  if (params.category) items = items.filter((p) => p.category === params.category);
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
  }
  if (params.featured) items = items.filter((p) => p.featured);
  const total = items.length;
  return { items: items.slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 24)).map(withDemoTier), total };
}

export interface ProductDetail {
  product: Product;
  variants: ProductVariant[];
  tiers: PriceTier[];
}

export async function fetchProductDetail(slugOrId: string): Promise<ProductDetail | null> {
  const remote = await tryApi<{ product: ProductRow; variants: ProductVariant[]; tiers: PriceTier[] }>(
    `/products/${encodeURIComponent(slugOrId)}`,
  );
  if (remote) {
    const product = withDemoTier(mapRow({ ...remote.product, tiers: remote.tiers }));
    return { product, variants: remote.variants, tiers: remote.tiers.length ? remote.tiers : (product.tiers ?? []) };
  }
  // Static fallback mirrors the API: id first, slug second.
  const key = slugOrId.toLowerCase();
  const all = productsData as unknown as Array<Product & { slug?: string }>;
  const found = all.find((p) => p.id === slugOrId)
    ?? all.find((p) => p.id.toLowerCase() === key || (p.slug ?? '').toLowerCase() === key);
  if (!found) return null;
  const product = withDemoTier(found);
  const variants: ProductVariant[] = [];
  for (const size of found.sizes.length ? found.sizes : ["One Size"]) {
    for (const color of found.colors.length ? found.colors : ["Standard"]) {
      variants.push({ id: `${found.id}-${size}-${color}`, size, color, sku: found.id, stock: 10 });
    }
  }
  return { product, variants, tiers: product.tiers ?? [] };
}

export async function apiHealth(): Promise<{ ok: boolean; db?: string } | null> {
  return tryApi("/health");
}

// ---------- Auth ----------

export interface AuthUser {
  id: string;
  role: "retail" | "wholesaler" | "admin";
  approved: boolean;
  businessName: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function fetchMe(): Promise<AuthUser | null> {
  // 401 (logged out) resolves to null; anything else failing throws, so the
  // UI can tell "signed out" apart from "backend unreachable".
  let res: Response;
  try {
    res = await fetch(`${base}/auth/me`, { credentials: "include" });
  } catch {
    throw new ApiError(0, { error: "unreachable" });
  }
  if (res.status === 401) return null;
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return (payload as { user: AuthUser | null }).user;
}

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  businessName?: string;
  role?: "retail" | "wholesaler";
}

export async function register(input: RegisterInput): Promise<{ id: string; role: string; approved: boolean } | null> {
  return apiPost("/auth/register", input);
}

export async function login(identifier: { email?: string; phone?: string }, password: string): Promise<AuthUser | null> {
  return apiPost("/auth/login", { ...identifier, password });
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${base}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // static demo: nothing to clear server-side
  }
}

// ---------- Orders ----------

export interface OrderLineInput {
  productId: string;
  size: string;
  color: string;
  qty: number;
}

export interface PlacedOrder {
  id: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  payment?: string;
  emailSent?: boolean;
}

export async function createOrder(
  contact: Record<string, string>,
  items: OrderLineInput[],
  fulfillment: "pickup" | "delivery" = "delivery",
): Promise<PlacedOrder | null> {
  return apiPost("/orders", { contact, items, fulfillment });
}

export interface TrackedOrder {
  ref: string;
  status: string;
  fulfillment: "pickup" | "delivery";
  payment: "unpaid" | "paid_pending" | "paid";
  subtotal: number;
  shipping: number;
  total: number;
  items: Array<{ productId: string; productName: string; qty: number; unitPrice: number }>;
}

export async function trackOrder(ref: string, phone: string): Promise<TrackedOrder> {
  const res = await apiGet<TrackedOrder>(`/track/${encodeURIComponent(ref.trim().toUpperCase())}?phone=${encodeURIComponent(phone.trim())}`);
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

export async function markOrderPaid(ref: string, phone: string): Promise<{ ok: boolean; payment: string }> {
  const res = await apiPost<{ ok: boolean; payment: string }>(`/orders/${encodeURIComponent(ref.trim().toUpperCase())}/mark-paid`, { phone: phone.trim() });
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

/**
 * Start a Bachs online payment for an unpaid order. Returns the hosted
 * checkout URL to redirect to. Throws 501 when the store hasn't enabled
 * online payment (pay-at-pickup stays available).
 */
export async function createOrderPayment(ref: string, phone: string): Promise<{ url: string; checkoutId: string }> {
  const res = await apiPost<{ url: string; checkoutId: string }>(`/orders/${encodeURIComponent(ref.trim().toUpperCase())}/pay`, { phone: phone.trim() });
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

export async function fetchOrder(id: string): Promise<{ order: PlacedOrder & { contactJson: string }; items: Array<{ productId: string; qty: number; unitPrice: number }> } | null> {
  return apiGet(`/orders/${encodeURIComponent(id)}`);
}

// ---------- Admin ----------

export type OrderStatus = "pending" | "confirmed" | "ready" | "completed" | "cancelled";
export type OrderPayment = "unpaid" | "paid_pending" | "paid";

export interface AdminOrder {
  id: string;
  customerId: string | null;
  status: OrderStatus;
  fulfillment: "pickup" | "delivery";
  payment: OrderPayment;
  subtotal: number;
  total: number;
  contactJson: string;
}

export interface AdminOrderDetail {
  order: AdminOrder;
  items: Array<{ id: number; productId: string; productName: string; variantId: string | null; qty: number; unitPrice: number }>;
}

export async function adminGetOrder(id: string): Promise<AdminOrderDetail> {
  const res = await apiGet<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}`);
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

export async function adminListOrders(): Promise<AdminOrder[]> {
  const res = await apiGet<AdminOrder[]>("/admin/orders");
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

export async function adminSetOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const res = await apiPatch<{ ok: boolean }>(`/admin/orders/${encodeURIComponent(id)}`, { status });
  if (!res) throw new ApiError(0, { error: "unreachable" });
}

export async function adminSetOrderPayment(id: string, payment: OrderPayment): Promise<void> {
  const res = await apiPatch<{ ok: boolean }>(`/admin/orders/${encodeURIComponent(id)}/payment`, { payment });
  if (!res) throw new ApiError(0, { error: "unreachable" });
}

export interface AdminCustomer {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  businessName: string | null;
  approved: boolean;
}

export async function adminListCustomers(role?: string): Promise<AdminCustomer[]> {
  const res = await apiGet<AdminCustomer[]>(`/admin/customers${role ? `?role=${role}` : ""}`);
  if (!res) throw new ApiError(0, { error: "unreachable" });
  return res;
}

export async function adminApproveCustomer(id: string, approved: boolean): Promise<void> {
  const res = await apiPatch<{ ok: boolean }>(`/admin/customers/${encodeURIComponent(id)}`, { approved });
  if (!res) throw new ApiError(0, { error: "unreachable" });
}

export interface AdminProductInput {
  name: string;
  description?: string;
  gender: "men" | "women" | "unisex";
  categoryId: string;
  basePrice: number;
  originalPrice?: number | null;
  images?: string[];
  inStock?: boolean;
  featured?: boolean;
}

export async function adminListProducts(): Promise<Product[]> {
  // The public list endpoint already enriches with sizes/colors/tiers/stock.
  // includeHidden so vendors can manage drafts and duplicates.
  const res = await fetchProducts({ limit: 200, includeHidden: true });
  return res.items;
}

export async function adminCreateProduct(input: AdminProductInput): Promise<{ id: string; slug: string }> {
  let res: Response;
  try {
    res = await fetch(`${base}/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, { error: "unreachable" });
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as { id: string; slug: string };
}

export async function adminSetTiers(productId: string, tiers: Array<{ minQty: number; price: number }>): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${base}/admin/products/${encodeURIComponent(productId)}/tiers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tiers }),
    });
  } catch {
    throw new ApiError(0, { error: "unreachable" });
  }
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
}

export async function adminUploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${base}/admin/uploads`, { method: "POST", credentials: "include", body: form });
  } catch {
    throw new ApiError(0, { error: "unreachable" });
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return (payload as { url: string }).url;
}

async function apiJson<T>(method: "PATCH" | "PUT" | "DELETE" | "POST", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { error: "unreachable" });
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as T;
}

export async function adminUpdateProduct(id: string, patch: Partial<AdminProductInput>): Promise<void> {
  await apiJson("PATCH", `/admin/products/${encodeURIComponent(id)}`, patch);
}

export async function adminDuplicateProduct(id: string): Promise<{ id: string; slug: string }> {
  return apiJson("POST", `/admin/products/${encodeURIComponent(id)}/duplicate`);
}

export async function adminSetVariantStock(variantId: string, stock: number): Promise<void> {
  await apiJson("PATCH", `/admin/variants/${encodeURIComponent(variantId)}`, { stock });
}

export async function adminAddVariant(productId: string, size: string, color: string, stock: number): Promise<{ id: string }> {
  return apiJson("POST", `/admin/products/${encodeURIComponent(productId)}/variants`, { size, color, stock });
}

export async function adminDeleteVariant(variantId: string): Promise<void> {
  await apiJson("DELETE", `/admin/variants/${encodeURIComponent(variantId)}`);
}

export async function adminCreateCategory(name: string, gender: "men" | "women" | "all"): Promise<{ id: string }> {
  return apiJson("POST", "/admin/categories", { name, gender });
}

export async function adminRenameCategory(id: string, name: string): Promise<void> {
  await apiJson("PATCH", `/admin/categories/${encodeURIComponent(id)}`, { name });
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await apiJson("DELETE", `/admin/categories/${encodeURIComponent(id)}`);
}
