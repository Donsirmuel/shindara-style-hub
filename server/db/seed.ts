import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, migrate } from "./client.js";
import { categories, products, variants, priceTiers, users } from "./schema.js";
import { hashPassword, newId } from "../auth/session.js";
import { sql } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const DEFAULT_MOQ = Number(process.env.DEFAULT_MOQ ?? 12);

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function tableEmpty(table: typeof categories) {
  const rows = await db.execute(sql`SELECT COUNT(*)::int AS c FROM ${table}`);
  const c = (rows.rows?.[0] as { c?: number } | undefined)?.c
    ?? (rows as unknown as Array<{ c: number }>)[0]?.c
    ?? 0;
  return Number(c) === 0;
}

async function main() {
  await migrate();

  const catsPath = path.join(root, "src/data/categories.json");
  const prodsPath = path.join(root, "src/data/products.json");
  const cats = JSON.parse(fs.readFileSync(catsPath, "utf8")) as Array<{
    id: string; name: string; slug: string; gender: string;
  }>;
  const prods = JSON.parse(fs.readFileSync(prodsPath, "utf8")) as Array<{
    id: string; name: string; description: string; price: number;
    originalPrice?: number; images: string[]; category: string;
    gender: "men" | "women" | "unisex"; sizes: string[]; colors: string[];
    inStock: boolean; featured?: boolean; trending?: boolean;
    newArrival?: boolean; rating?: number; reviewCount?: number;
  }>;

  if (await tableEmpty(categories)) {
    await db.insert(categories).values(
      cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: `${c.gender}-${c.slug}`,
        gender: c.gender as "men" | "women" | "all",
      })),
    );
    console.log(`seeded ${cats.length} categories`);
  }

  // products table empty check via raw count
  const countRes = await db.execute(sql`SELECT COUNT(*)::int AS c FROM products`);
  const pCount = Number((countRes.rows?.[0] as { c?: number } | undefined)?.c ?? 0);
  if (pCount === 0) {
    for (const p of prods) {
      await db
        .insert(products)
        .values({
          id: p.id,
          slug: `${slugify(p.id)}-${slugify(p.name).slice(0, 40)}`,
          name: p.name,
          description: p.description,
          gender: p.gender,
          categoryId: p.category,
          basePrice: p.price,
          originalPrice: p.originalPrice ?? null,
          images: p.images,
          inStock: p.inStock,
          featured: !!p.featured,
          trending: !!p.trending,
          newArrival: !!p.newArrival,
          rating: p.rating ? Math.round(p.rating * 10) : null,
          reviewCount: p.reviewCount ?? 0,
        })
        .onConflictDoNothing();

      // variants = sizes x colors. Stock 50 covers the default MOQ (12)
      // so the demo bulk tier is orderable out of the box.
      const rows = [];
      for (const size of p.sizes.length ? p.sizes : ["One Size"]) {
        for (const color of p.colors.length ? p.colors : ["Standard"]) {
          rows.push({
            id: `${p.id}-${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            productId: p.id,
            size,
            color,
            sku: `${p.id}-${size}-${color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
            stock: 50,
          });
        }
      }
      if (rows.length) {
        await db.insert(variants).values(rows).onConflictDoNothing();
      }

      // default bulk tier: 10% off at MOQ (template default, editable in admin later)
      const bulkPrice = Math.round(p.price * 0.9);
      await db
        .insert(priceTiers)
        .values({ productId: p.id, minQty: DEFAULT_MOQ, price: bulkPrice })
        .onConflictDoNothing();
    }
    console.log(`seeded ${prods.length} products + variants + tiers (MOQ=${DEFAULT_MOQ})`);
  } else {
    console.log(`products already seeded (${pCount}), skipping`);
  }

  // Admin account for the /admin CMS. Override via ADMIN_EMAIL/ADMIN_PASSWORD.
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@shindara.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const existingAdmin = await db.select({ id: users.id }).from(users).where(sql`${users.role} = 'admin'`).limit(1);
  if (!existingAdmin.length) {
    await db.insert(users).values({
      id: newId("usr"),
      email: adminEmail,
      phone: null,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
      businessName: null,
      approved: true,
    });
    console.log(`seeded admin ${adminEmail} (change ADMIN_PASSWORD in production!)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
