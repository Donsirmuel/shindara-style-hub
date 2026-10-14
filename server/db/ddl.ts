import fs from "node:fs";

/**
 * Database bootstrap with two modes, same Drizzle schema and SQL:
 *
 * - Default: embedded PGlite (./data/pgdata). Zero ops, fine for
 *   boutique volume. Single writer — flip to real Postgres past
 *   ~50 orders/day with concurrent staff + shoppers.
 * - DATABASE_URL set: real Postgres on the same VPS
 *   (docker-compose --profile pg, or any managed Postgres).
 *   Flip the env var and restart — no code or schema changes.
 *
 * NOTE: dual-engine wiring (drizzle node-postgres) lands with the
 * volume upgrade. Until then PGlite runs this same DDL.
 */
export const DDL = `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      gender TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      base_price INTEGER NOT NULL,
      original_price INTEGER,
      images TEXT[] NOT NULL DEFAULT '{}',
      in_stock BOOLEAN NOT NULL DEFAULT true,
      featured BOOLEAN NOT NULL DEFAULT false,
      trending BOOLEAN NOT NULL DEFAULT false,
      new_arrival BOOLEAN NOT NULL DEFAULT false,
      rating INTEGER,
      review_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      stock INTEGER NOT NULL DEFAULT 10
    );
    CREATE TABLE IF NOT EXISTS price_tiers (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      min_qty INTEGER NOT NULL,
      price INTEGER NOT NULL,
      UNIQUE(product_id, min_qty)
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'retail',
      business_name TEXT,
      approved BOOLEAN NOT NULL DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal INTEGER NOT NULL,
      total INTEGER NOT NULL,
      contact_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      variant_id TEXT REFERENCES variants(id),
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_tiers_product ON price_tiers(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    -- Template evolution: safe to re-run on existing VPS data.
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment TEXT NOT NULL DEFAULT 'delivery';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment TEXT NOT NULL DEFAULT 'unpaid';
`;

export function dataDir(): string {
  const dir = process.env.DATA_DIR ?? "./data/pgdata";
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function shouldUseRealPostgres(): boolean {
  return !!process.env.DATABASE_URL;
}
