import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, migrate } from "./client.js";
import { categories, products, variants, priceTiers, users } from "./schema.js";
import { hashPassword, newId } from "../auth/session.js";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const DEFAULT_MOQ = Number(process.env.DEFAULT_MOQ ?? 12);

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

  // Per-category upsert: a re-run backfills anything a crashed run missed.
  let catCount = 0;
  for (const c of cats) {
    const done = await db
      .insert(categories)
      .values({
        id: c.id,
        name: c.name,
        slug: `${c.gender}-${c.slug}`,
        gender: c.gender as "men" | "women" | "all",
      })
      .onConflictDoNothing()
      .returning({ id: categories.id });
    catCount += done.length;
  }
  console.log(`categories ensured (${catCount} new)`);

  // Per-product upsert: skip existing rows instead of gating the whole loop
  // on a global count, so interrupted seeds heal on re-run.
  // Seed stock always covers the bulk MOQ, or the demo tier is unorderable.
  const seedStock = Math.max(50, DEFAULT_MOQ * 2);
  let prodCount = 0;
  for (const p of prods) {
    const done = await db
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
      .onConflictDoNothing()
      .returning({ id: products.id });
    if (!done.length) continue;
    prodCount++;

    // variants = sizes x colors.
    const rows = [];
    for (const size of p.sizes.length ? p.sizes : ["One Size"]) {
      for (const color of p.colors.length ? p.colors : ["Standard"]) {
        rows.push({
          id: `${p.id}-${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          productId: p.id,
          size,
          color,
          sku: `${p.id}-${size}-${color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
          stock: seedStock,
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
  console.log(`products ensured (${prodCount} new, MOQ=${DEFAULT_MOQ}, seed stock=${seedStock})`);

  // Admin account for the /admin CMS. Explicit env creds always win (so
  // rotation works); the weak default exists only for first local boot.
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@shindara.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  if (!process.env.ADMIN_PASSWORD) {
    console.log("WARN: no ADMIN_PASSWORD set — using the demo default. Set one before delivery!");
  }
  const byEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
  if (!byEmail.length) {
    await db.insert(users).values({
      id: newId("usr"),
      email: adminEmail,
      phone: null,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
      businessName: null,
      approved: true,
    });
    console.log(`seeded admin ${adminEmail}`);
  } else if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await db.update(users).set({ passwordHash: await hashPassword(adminPassword), role: "admin", approved: true }).where(eq(users.email, adminEmail));
    console.log(`rotated admin credentials for ${adminEmail}`);
  } else {
    console.log(`admin ${adminEmail} already exists, skipping`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
