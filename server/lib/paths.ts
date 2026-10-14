import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Single source of truth for runtime directories. index.ts and admin.ts must
 * resolve the same uploads folder regardless of the process working dir.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function uploadsDir(): string {
  const dir = process.env.UPLOADS_DIR ?? path.join(root, "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
