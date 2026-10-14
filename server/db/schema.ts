import { pgTable, text, integer, boolean, serial } from "drizzle-orm/pg-core";

// Single-brand per VPS: no brand_id needed. Fork repo per client.
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  gender: text("gender").notNull().$type<"men" | "women" | "all">(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  gender: text("gender").notNull().$type<"men" | "women" | "unisex">(),
  categoryId: text("category_id").references(() => categories.id),
  basePrice: integer("base_price").notNull(),
  originalPrice: integer("original_price"),
  images: text("images").array().notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  trending: boolean("trending").notNull().default(false),
  newArrival: boolean("new_arrival").notNull().default(false),
  rating: integer("rating"), // rating * 10 (e.g. 48 = 4.8) to avoid floats
  reviewCount: integer("review_count").notNull().default(0),
});

export const variants = pgTable("variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  color: text("color").notNull(),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(10),
});

export const priceTiers = pgTable("price_tiers", {
  id: serial("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  minQty: integer("min_qty").notNull(),
  price: integer("price").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().$type<"retail" | "wholesaler" | "admin">().default("retail"),
  businessName: text("business_name"),
  approved: boolean("approved").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => users.id),
  status: text("status").notNull().$type<"pending" | "confirmed" | "ready" | "completed" | "cancelled">().default("pending"),
  fulfillment: text("fulfillment").notNull().$type<"pickup" | "delivery">().default("delivery"),
  payment: text("payment").notNull().$type<"unpaid" | "paid_pending" | "paid">().default("unpaid"),
  paymentRef: text("payment_ref"),
  subtotal: integer("subtotal").notNull(),
  total: integer("total").notNull(),
  contactJson: text("contact_json").notNull().default("{}"),
});

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: text("received_at").notNull().default(""),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => variants.id),
  productId: text("product_id").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
});

export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof variants.$inferSelect;
export type PriceTierRow = typeof priceTiers.$inferSelect;
