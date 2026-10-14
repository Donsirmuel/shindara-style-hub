import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { products, variants, priceTiers, categories } from "../db/schema.js";
import { eq, and, ilike, or, asc, inArray, sql } from "drizzle-orm";

const listQuery = z.object({
  gender: z.enum(["men", "women", "unisex"]).optional(),
  category: z.string().optional(),
  q: z.string().max(80).optional(),
  featured: z.coerce.boolean().optional(),
  // Storefront hides drafts; admin passes includeHidden=true to manage them.
  includeHidden: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(24),
  offset: z.coerce.number().min(0).default(0),
});

export async function productRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    return db.select().from(categories).orderBy(asc(categories.name));
  });

  app.get("/api/products", async (req) => {
    const query = listQuery.parse(req.query);
    const conds = [];
    if (!query.includeHidden) conds.push(eq(products.inStock, true));
    if (query.gender) conds.push(eq(products.gender, query.gender));
    if (query.category) conds.push(eq(products.categoryId, query.category));
    if (query.featured) conds.push(eq(products.featured, true));
    if (query.q) {
      conds.push(
        or(
          ilike(products.name, `%${query.q}%`),
          ilike(products.description, `%${query.q}%`),
        )!,
      );
    }
    const where = conds.length ? and(...conds) : undefined;
    const base = db.select().from(products);
    const items = where
      ? await base.where(where).limit(query.limit).offset(query.offset)
      : await base.limit(query.limit).offset(query.offset);

    // Batch-load variants + tiers so cards can render sizes/colors/bulk pricing
    // without N+1 detail fetches. Fine for catalog pages on a small VPS.
    const ids = items.map((p) => p.id);
    const [allVariants, allTiers] = ids.length
      ? await Promise.all([
          db.select().from(variants).where(inArray(variants.productId, ids)),
          db.select().from(priceTiers).where(inArray(priceTiers.productId, ids)).orderBy(asc(priceTiers.minQty)),
        ])
      : [[], []];
    const variantsByProduct = new Map<string, typeof allVariants>();
    for (const v of allVariants) {
      const list = variantsByProduct.get(v.productId) ?? [];
      list.push(v);
      variantsByProduct.set(v.productId, list);
    }
    const tiersByProduct = new Map<string, typeof allTiers>();
    for (const t of allTiers) {
      const list = tiersByProduct.get(t.productId) ?? [];
      list.push(t);
      tiersByProduct.set(t.productId, list);
    }
    const enriched = items.map((p) => {
      const vars = variantsByProduct.get(p.id) ?? [];
      const stocks = vars.map((v) => v.stock);
      return {
        ...p,
        sizes: [...new Set(vars.map((v) => v.size))],
        colors: [...new Set(vars.map((v) => v.color))],
        tiers: (tiersByProduct.get(p.id) ?? []).map((t) => ({ minQty: t.minQty, price: t.price })),
        // Stock rollups for vendor alerts (threshold lives in site.config.ts client-side).
        stockTotal: stocks.reduce((s, n) => s + n, 0),
        minStock: stocks.length ? Math.min(...stocks) : 0,
      };
    });

    const countQuery = db
      .select({ c: sql<number>`count(*)` })
      .from(products);
    const totalRows = where ? await countQuery.where(where) : await countQuery;
    return { items: enriched, total: Number(totalRows[0]?.c ?? enriched.length), limit: query.limit, offset: query.offset };
  });

  app.get("/api/products/:slugOrId", async (req, reply) => {
    const { slugOrId } = req.params as { slugOrId: string };
    const rows = await db.select().from(products).where(
      or(eq(products.slug, slugOrId), eq(products.id, slugOrId))!,
    ).limit(1);
    const product = rows[0];
    if (!product) return reply.code(404).send({ error: "not_found" });
    const [vars, tiers] = await Promise.all([
      db.select().from(variants).where(eq(variants.productId, product.id)),
      db.select().from(priceTiers).where(eq(priceTiers.productId, product.id)).orderBy(asc(priceTiers.minQty)),
    ]);
    return { product, variants: vars, tiers };
  });
}
