import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNode, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DDL, dataDir, shouldUseRealPostgres } from "./ddl.js";
import * as schema from "./schema.js";

/**
 * Dual-engine database. Same Drizzle schema + same DDL either way:
 *
 * - No DATABASE_URL: embedded PGlite in ./data/pgdata. Zero ops.
 * - DATABASE_URL set: real Postgres (same VPS via
 *   `docker compose --profile pg up`, or managed). Proper
 *   transactions + concurrent writers for 50+ orders/day.
 *
 * Typed once as NodePgDatabase (one contained cast) so every route file
 * stays clean; runtime honors whichever engine was initialized.
 */
export type Db = NodePgDatabase<typeof schema>;

let pool: pg.Pool | null = null;
let pglite: PGlite | null = null;

function init(): Db {
  if (shouldUseRealPostgres()) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    console.log("DB: real Postgres via DATABASE_URL");
    return drizzleNode(pool, { schema }) as Db;
  }
  pglite = new PGlite(dataDir());
  console.log("DB: embedded PGlite (set DATABASE_URL for real Postgres)");
  return drizzlePglite(pglite, { schema }) as unknown as Db;
}

export const db: Db = init();

/** True only on real Postgres — the only engine with transactions. */
export const supportsTransactions = shouldUseRealPostgres();

export async function migrate() {
  if (pool) {
    await pool.query(DDL);
    return;
  }
  await pglite!.exec(DDL);
}

export async function closeDb() {
  if (pool) await pool.end();
}
