import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./db/client.js";
import { productRoutes } from "./routes/products.js";
import { authRoutes } from "./routes/auth.js";
import { orderRoutes } from "./routes/orders.js";
import { adminRoutes } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const uploadsDir = process.env.UPLOADS_DIR ?? path.join(root, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const app = Fastify({ logger: process.env.NODE_ENV !== "production" ? true : false });
await app.register(fastifyCookie);
await app.register(fastifyMultipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
await migrate();
await app.register(productRoutes);
await app.register(authRoutes);
await app.register(orderRoutes);
await app.register(adminRoutes);

app.get("/api/health", async () => ({
  ok: true,
  version: "1.0.0",
  db: "pglite",
  time: new Date().toISOString(),
}));

// Local uploads (template default: disk on VPS, no S3)
if (fs.existsSync(uploadsDir)) {
  await app.register(fastifyStatic, { root: uploadsDir, prefix: "/uploads/", decorateReply: false });
}

// Serve Vite build if present (prod on VPS). In dev, Vite runs separately.
// NOTE: only ONE @fastify/static instance may use decorateReply (reply.sendFile).
// Uploads get decorateReply:false so reply.sendFile always serves from distDir.
if (fs.existsSync(path.join(distDir, "index.html"))) {
  await app.register(fastifyStatic, { root: distDir, prefix: "/", wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/")) return reply.code(404).send({ error: "not_found" });
    return reply.sendFile("index.html");
  });
} else {
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/")) return reply.code(404).send({ error: "not_found" });
    return reply.code(200).send({ ok: true, dev: "run `npm run dev` for the Vite frontend" });
  });
}

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`API + storefront on http://0.0.0.0:${port}`);
});
