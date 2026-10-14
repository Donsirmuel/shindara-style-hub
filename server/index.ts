import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate, supportsTransactions } from "./db/client.js";
import { uploadsDir } from "./lib/paths.js";
import { productRoutes } from "./routes/products.js";
import { authRoutes } from "./routes/auth.js";
import { orderRoutes } from "./routes/orders.js";
import { paymentRoutes } from "./routes/payments.js";
import { adminRoutes } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const uploads = uploadsDir();

const app = Fastify({ logger: process.env.NODE_ENV !== "production" ? true : false });
await app.register(fastifyCookie);
await app.register(fastifyMultipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
await app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // Product images may be remote URLs once vendors hotlink supplier photos.
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
    },
  },
});
// Shared abuse budget + tighter per-route caps on auth/order routes below.
await app.register(fastifyRateLimit, { global: true, max: 300, timeWindow: "1 minute" });
await migrate();
await app.register(productRoutes);
await app.register(authRoutes);
await app.register(orderRoutes);
await app.register(paymentRoutes);
await app.register(adminRoutes);

const bootTime = new Date().toISOString();
app.get("/api/health", async () => ({
  ok: true,
  version: "1.0.0",
  db: supportsTransactions ? "postgres" : "pglite",
  uptime: Math.round((Date.now() - Date.parse(bootTime)) / 1000),
  time: new Date().toISOString(),
}));

// Local uploads (template default: disk on VPS, no S3)
if (fs.existsSync(uploads)) {
  await app.register(fastifyStatic, { root: uploads, prefix: "/uploads/", decorateReply: false });
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
