# Shindara Style Hub

Modern e-commerce storefront for Shindara Fashion World.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Install & Run (storefront only, static demo data)

```sh
npm install
npm run dev
```

App runs at `http://localhost:8080`.

### Run with embedded backend (Fastify + PGlite Postgres, no external DB)

```sh
cp .env.example .env
npm run db:seed
npm run dev:full
```

- Storefront: `http://localhost:8080` (Vite)
- API: `http://localhost:3000/api/health`
- Data persists in `./data/pgdata`, uploads in `./uploads`

### New client checklist

1. Fork repo, edit `src/site.config.ts` (brand, currency, WhatsApp, MOQ, fees, pickup address).
2. Replace `src/data/*.json` or `npm run db:seed` after editing.
3. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STORE_NAME`, `ORDER_PREFIX` in `.env`, `docker compose up --build -d` on VPS.

### Order emails (optional, recommended)

Checkout sends the customer a receipt email through the vendor's own mailbox.
Without these vars, checkout works — it just skips the email and says so honestly.

```sh
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shop@example.com
SMTP_PASS=<Gmail app password, not your login password>
SMTP_FROM=Shindara Fashion World <shop@example.com>
```

Gmail: enable 2-Step Verification → create an App Password → paste it as `SMTP_PASS`.

## How orders work (reserve → pay → pick up)

1. Customer reserves on the site (pickup or delivery), gets a memorable ref (`SH-482913`).
2. Ref shows big on screen + email receipt + `/track` page (ref + phone, no account needed).
3. Transfer-first customers tap "I've sent the transfer" → `paid_pending`; vendor confirms money → `paid`.
4. Counter flow: search ref in Admin → Confirm → Ready (packed) → Completed (collected/delivered).
5. Past ~50 orders/day: switch to real Postgres (below) — stock decrements become fully transactional.

### Scaling to real Postgres (same VPS, one env var)

The app starts on embedded PGlite (zero ops). When concurrent shoppers + staff arrive:

```sh
# in .env:
PG_PASSWORD=a-long-random-password
DATABASE_URL=postgres://shindara:a-long-random-password@db:5432/shindara
docker compose --profile pg up --build -d
npm run db:seed   # run once against the new DB to import catalog + admin
```

Same Drizzle schema and SQL either way; `supportsTransactions` flips order placement into a real transaction automatically. Moving to managed Postgres later = same `DATABASE_URL`, no code changes.

## Scripts

- `npm run dev` — Vite storefront only
- `npm run dev:full` — storefront + embedded API together
- `npm run db:seed` — import `src/data/*.json` into embedded Postgres
- `npm run typecheck` — `tsc -b`
- `npm run build` — production build (`dist/`, served by `server/` on VPS)

## Project Structure

```text
src/
  site.config.ts  Per-client brand/currency/bulk settings (edit this per fork)
  components/   Reusable UI and feature components
  pages/        Route-level pages
  hooks/        Custom React hooks (useCart, useProducts)
  data/         Seed JSON (imported by `npm run db:seed`)
  lib/          Shared utilities (api client, currency format, types)
server/
  index.ts      Fastify API + serves dist/ + /uploads
  db/           Drizzle schema + PGlite client + seed
  routes/       /api/products, /api/categories, /api/health
```

## Troubleshooting

Windows build issues: ensure Node 20+, delete `node_modules` and reinstall with npm.

## Deployment (Interserver $3 VPS, one per client)

```sh
cp .env.example .env   # set JWT_SECRET + DOMAIN
npm run build && npm run db:seed
docker compose up --build -d
# Caddy: caddy reverse-proxy --from shop.example.com --to 127.0.0.1:3000
```

## License

All rights reserved — Shindara Fashion World.
