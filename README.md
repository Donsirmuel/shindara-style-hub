# Shindara Style Hub

A full-stack commerce template for fashion vendors that sell **retail and wholesale** — built around how Nigerian boutiques actually operate: customers reserve online and pick up in store, pay by transfer or at the counter, and track orders with a short reference code.

Fork it, edit one config file, and deploy a working store for a new client.

## What it does

**Shoppers** can browse a gender-split catalog with search, filters and sorting, see automatic bulk discounts (e.g. 12+ pieces at a wholesale price), check out for pickup or delivery, and track orders by reference code — no account required.

**Vendors** get an admin dashboard to confirm and pack orders, manage products end-to-end (details, photos, sizes, stock, bulk tiers), approve wholesale accounts, and notify customers. Everything runs from a single $3/month VPS with no external services required.

## Demo

```sh
npm install
cp .env.example .env
npm run db:seed
npm run dev:full
```

- Storefront: `http://localhost:8080`
- Admin dashboard: `http://localhost:8080/admin` — sign in with `admin@shindara.local` / `admin123`
- API health: `http://localhost:3000/api/health`

`npm run dev` alone runs the storefront against built-in demo data (no backend needed).

## Features

### Storefront
- Catalog with category, price and sort filters plus full-text search (debounced, server-side)
- Product pages with variant-level stock, quantity-aware bulk pricing tables ("add 3 more to unlock ₦13,950 each")
- Cart with local persistence; checkout for **pickup** (free) or **delivery** (configurable fee and free threshold)
- Memorable order references (`SH-482913`) shown on screen, emailed as a receipt, and usable on the self-service tracking page with just ref + phone
- Transfer-first customers can flag "I've sent the transfer"; vendors confirm on seeing the money

### Vendor dashboard (`/admin`)
- Order pipeline built for the counter: search by ref or phone → confirm → mark ready → mark collected/delivered, with pickup/delivery lanes and payment badges (`unpaid` / `paid? confirm` / `paid`)
- Cancelling an unfulfilled order automatically returns its items to stock
- Product management: create, edit, duplicate (as hidden draft), cover-photo picker, image reorder, per size/color stock controls with low-stock alerts
- Category management with in-use protection; bulk-tier editor per product
- Wholesale account approvals; one-click WhatsApp customer notification per order
- Dashboard stats: orders awaiting confirmation, confirmed revenue, low-stock count

## How an order flows

1. Customer reserves items (pickup or delivery) and receives a reference code.
2. The ref is displayed for screenshot, emailed with the full receipt, and works on `/track` with the order phone number.
3. Payment happens by bank transfer (customer flags it, vendor confirms), at pickup/delivery — or online via Bachs when enabled (`Pay now`, confirmed by webhook).
4. The vendor packs against the ref at the counter and advances the order to completion.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui | Fast static builds, accessible component primitives |
| Data fetching | TanStack Query | Server cache with static-JSON fallback, so the demo works with no backend |
| API | Fastify (Node 20) | Low memory footprint for a 1 vCPU / 2 GB VPS |
| Database | PGlite (embedded Postgres), optional real Postgres via `DATABASE_URL` | Zero ops to start; same Drizzle schema and SQL either way, transactions kick in automatically on real Postgres |
| Auth | JWT in httpOnly cookies (roles: retail, wholesaler, admin) | No session store to operate |
| Email | Nodemailer via the vendor's own SMTP | No third-party account needed; skipped gracefully when unconfigured |
| Images | Local disk with admin upload | No S3 bill; migratable later |
| Deploy | Docker Compose + Caddy | One image per client, automatic HTTPS |

## Configuration

Per-client branding lives in one file — **`src/site.config.ts`**: brand name, currency, contact/WhatsApp, shipping fees, pickup address, bulk MOQ, low-stock threshold.

Secrets live in **`.env`** (see `.env.example`): `JWT_SECRET`, `COOKIE_NAME`, admin bootstrap credentials, store name, order prefix, and the optional `DATABASE_URL` and `SMTP_*` settings.

## Delivering a new client (fork sequence)

Each brand gets its own fork, VPS and database. The owner signs in through a private `/login` link — shoppers never need accounts.

```sh
# 1. Fork the repo, then make it theirs:
#    - src/site.config.ts → brand, shortName, brandSlug, story, contact, fees, pickup
#    - src/data/products.json + categories.json → their catalog
#    - .env → JWT_SECRET, COOKIE_NAME, ADMIN_EMAIL, ADMIN_PASSWORD,
#             STORE_NAME, ORDER_PREFIX, PICKUP_ADDRESS (+ SMTP_*, DATABASE_URL as needed)
npm run db:seed
npm run fork:check    # fails loudly on any leftover of the previous brand
npm run dev:full      # verify, then deploy per Deployment below
```

`npm run fork:check -- --from=OldBrand` scans for a different previous brand. Page titles and link previews regenerate from the config on every dev/build, so they follow the fork automatically. Replace the demo admin credentials before handover.

## Deployment

One VPS per client (reference: 1 vCPU / 2 GB RAM / 40 GB SSD):

```sh
cp .env.example .env   # fill in secrets
npm run build && npm run db:seed
docker compose up --build -d
caddy reverse-proxy --from shop.example.com --to 127.0.0.1:3000
```

Past ~50 orders/day, switch to real Postgres on the same machine:

```sh
# in .env:
PG_PASSWORD=<long random password>
DATABASE_URL=postgres://shindara:<password>@db:5432/shindara
docker compose --profile pg up --build -d
npm run db:seed
```

## API overview

| Method & path | Description |
|---|---|
| `GET /api/products`, `GET /api/products/:slug` | Catalog list (filterable) and detail with variants + bulk tiers |
| `POST /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/mark-paid` | Checkout, order lookup, transfer flagging |
| `POST /api/orders/:id/pay`, `POST /api/webhooks/bachs` | Bachs online payment + signature-verified webhook (paid on `collection.succeeded`) |
| `GET /api/track/:ref?phone=` | Public order tracking |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Retail/wholesaler signup, login, session |
| `GET/PATCH /api/admin/orders[/:id]` | Order management, status and payment transitions |
| `POST/PATCH /api/admin/products[/:id]`, `PUT .../tiers`, variant endpoints | Full product and stock management |
| `POST /api/admin/uploads` | Local image upload (jpg/png/webp, 5 MB) |

## Project structure

```text
src/
  site.config.ts    Per-client brand, currency, fees and pickup settings
  pages/            Home, Women, Men, Bulk, ProductDetail, Checkout, Track, Login, admin/
  components/       Header, Cart, ProductCard, ConfirmButton, ui/ (shadcn)
  hooks/            useProducts, useCart, useAuth
  lib/              API client, currency formatter, shared types
  data/             Seed catalog (imported by db:seed)
server/
  index.ts          Fastify app: API routes + serves dist/ and /uploads
  db/               Drizzle schema, shared DDL, PGlite/Postgres client, seed
  routes/           products, auth, orders, admin
  notify/           Order emails via vendor SMTP
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Storefront only (static demo data) |
| `npm run dev:full` | Storefront + API together |
| `npm run dev:api` | API only (port 3000) |
| `npm run db:seed` | Import seed catalog and bootstrap admin into the database |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm run build` | Production storefront build served by `server/` |

## Roadmap

- `DATABASE_URL` acceptance run against live Postgres on the VPS (code paths verified, awaiting a Docker host)
- Bachs sandbox end-to-end (keys + `collection.succeeded` replay) before any client's launch
- CSV catalog import for large seasonal drops

## License

All rights reserved — Shindara Fashion World.
