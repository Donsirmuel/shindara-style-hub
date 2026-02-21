# Shindara Style Hub

Modern e-commerce storefront for Shindara Fashion World.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query

## Quick Start

### Prerequisites

- Node.js 18+
- npm (or Bun/Yarn)

### Install & Run

```sh
npm install
npm run dev
```

App runs at `http://localhost:8080`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run build:dev` — development-mode build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

## Project Structure

```text
src/
  components/   Reusable UI and feature components
  pages/        Route-level pages
  hooks/        Custom React hooks
  data/         Local JSON data (products/categories)
  lib/          Shared utilities and types
  utils/        Helper functions
```

## Troubleshooting

For installation/network/Windows permission issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Deployment

```sh
npm run build
```

Deploy the `dist/` output to any static host (e.g., GitHub Pages, Netlify, Vercel).

## License

All rights reserved — Shindara Fashion World.
