# India Fashions

Premium saree shopping with local delivery and a role-based store operations dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/india-fashions/src/pages/storefront.tsx` — customer home, catalog, product, cart, checkout, and order tracking.
- `artifacts/india-fashions/src/pages/admin.tsx` — dashboard, catalog, inventory, orders, advance orders, and settings.
- `artifacts/india-fashions/src/index.css` — Royal Heritage theme tokens; the main background is sky blue.
- `lib/api-spec/openapi.yaml` — source of truth for storefront and operations contracts.
- `artifacts/api-server/src/routes/store.ts` — typed API routes and demo seed data.
- `lib/db/src/schema/store.ts` — PostgreSQL tables for catalog, variants, orders, advance orders, settings, and audit logs.

## Architecture decisions

- Storefront and operations use one OpenAPI contract so generated hooks stay aligned with server validation.
- Product availability is derived from variant-level quantities; out-of-stock products remain visible and support advance orders.
- Pricing and delivery limits are enforced on the server, not only in the UI.
- Demo catalog data seeds on first API start after the development schema is pushed.

## Product

Customers can browse and filter sarees, inspect variants and gallery details, add items to a cart, check local delivery eligibility, place orders, and track status. Store teams can review dashboard metrics, manage products and stock, handle advance-order requests, and update configurable store settings.

## User preferences

- Keep the Royal Heritage direction, but use a sky-blue main background instead of the original warm off-white.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The standalone Vite build needs `PORT` and `BASE_PATH`; the managed workflow supplies them automatically.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
