import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { DDL, dataDir } from "./ddl.js";

// Embedded Postgres (WASM). No external DB service.
// Data persists in DATA_DIR on the VPS volume.
// (DATABASE_URL → real Postgres lands with the volume upgrade;
// it will run the same DDL from ./ddl.js.)
const pg = new PGlite(dataDir());

export const db = drizzle(pg);
export const raw = pg;

export async function migrate() {
  // Idempotent DDL — mirrors server/db/schema.ts for PGlite.
  await pg.exec(DDL);
}
