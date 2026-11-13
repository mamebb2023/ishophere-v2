# iShopHere

A mobile-first multi-store e-commerce MVP built with React 19, TypeScript, Vite, Tailwind CSS 4, shadcn-style UI components, and Supabase.

Customers browse public storefronts, sign in once, and keep a separate cart per store. Store owners and staff manage their own items, stock, categories, orders, and brand colors. A global **dev** role creates stores and assigns an existing iShopHere account as the owner.

## Features

- **Multi-store storefronts:** each store lives at `/s/:storeSlug`; `/` opens the demo store and `/stores` lists every active store.
- **Shop:** category filters, search, stock badges, item detail, and a 2-column mobile grid.
- **Accounts:** email/password auth via Supabase; one account works across every store.
- **Per-store cart & checkout:** cart rows are scoped by store and user. Checkout calls an atomic server-side RPC that validates stock, creates the order and line items, decrements stock, and clears only that store's cart.
- **Orders:** customers see their own orders across stores; store teams update statuses (`new → confirmed → shipped → cancelled`).
- **Store admin:** dashboard KPIs, item CRUD with image upload, category management, order management, and live theme colors.
- **Dev console:** platform overview, store list, and store creation at `/dev`.
- **Notifications:** store-scoped new-order alerts for the store team and status updates for customers, with unread badges.
- **Mobile-first:** bottom navigation, 44 px tap targets, safe-area padding, and responsive tables/cards.

## Roles and routes

| Route | Purpose |
|---|---|
| `/` | Redirects to the demo store, `/s/demo` |
| `/stores` | Public store directory |
| `/s/:storeSlug` | Storefront (shop, item, cart, checkout, order) |
| `/s/:storeSlug/admin` | Store admin (owner or staff) |
| `/auth` | Customer sign-in / sign-up |
| `/account` | Account details and order history |
| `/admin/login` | Sign-in for owners, staff, and dev |
| `/admin` | Dev redirect, single-store redirect, or store chooser |
| `/dev`, `/dev/stores`, `/dev/stores/new` | Platform owner console |

- **Dev** is a global role stored in `platform_roles`. Dev can create stores and access every store's admin.
- **Owner** and **staff** are store-scoped roles stored in `store_members`. Owners and staff can manage their own store.
- A store owner's email must already belong to an iShopHere account. `create_store()` assigns that account as the store owner.

## Stack

- React 19 + TypeScript 7 + Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first config)
- Radix UI primitives with shadcn-style wrappers
- React Router 7
- Supabase Postgres + Auth + Storage + Realtime
- React Hook Form + Zod
- Sonner toasts

## Quick start

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the migrations in order:
   - [`0001_init.sql`](supabase/migrations/0001_init.sql)
   - [`0002_notifications.sql`](supabase/migrations/0002_notifications.sql)
   - [`0003_fixes.sql`](supabase/migrations/0003_fixes.sql)
   - [`0004_multi_store.sql`](supabase/migrations/0004_multi_store.sql)
   - Or use the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. In **Auth → Providers → Email**, enable email/password.
   - For local development, disable **Confirm email** so sign-ups get a session immediately.
4. In **Auth → URL Configuration**, set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` as a redirect URL.

> **Upgrading an existing single-store project?** `0004_multi_store.sql` intentionally drops the old public shop tables (`settings`, `admins`, items, categories, orders, and notifications), then recreates them with store scoping. It seeds a neutral **Demo Store** (`/s/demo`) and keeps `auth.users` intact. Old item images may remain in storage as unreferenced files. Back up any data you need before running it.

The `0001` migration creates the `item-images` storage bucket. `0004` re-applies its public-read policy and adds store-scoped write policies. Images upload to `stores/<store_id>/items/...`.

> If sign-up returns **"email rate limit exceeded"**, Supabase's built-in mailer is throttled (especially on the free plan). For development, disable **Confirm email**, or create users directly under **Auth → Users → Add user** with **Auto Confirm User** enabled. For production, configure custom SMTP.

### 3. Configure the app environment

```bash
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Only the anon key belongs in the browser. Row Level Security is the security boundary; never expose the service-role key.

Supabase's newer publishable key (`sb_publishable_...`) works here too — paste it into `VITE_SUPABASE_ANON_KEY`. Vite only exposes variables prefixed with `VITE_`, so do not use `NEXT_PUBLIC_*` names in this project.

### 4. Seed the dev owner

The seed creates a confirmed dev account and ensures the demo store exists. It is idempotent.

```bash
cp .env.seed.example .env.seed.local
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.seed.local`, then run:

```bash
npm run seed:dev
```

Local defaults:

- Email: `admin@store.com`
- Password: `12345678`
- Global role: `dev`

The seed refuses remote project URLs unless `SEED_ALLOW_REMOTE=true` is set, because it uses a known development password. The service-role key is server-side only and must never be added to `VITE_*` variables or committed.

To promote an existing account manually instead:

```sql
insert into public.platform_roles (user_id, role)
select id, 'dev'
from auth.users
where email = 'you@example.com'
on conflict (user_id) do update set role = excluded.role;
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sign in at `/admin/login` with the dev account, then create a store at `/dev/stores/new`.

To create a store, you need:

- Store name, slug, and description.
- Owner name.
- Owner email that already belongs to an iShopHere account.

The owner can then sign in at `/admin/login` and manage the store at `/s/<slug>/admin`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |
| `npm run seed:dev` | Create/confirm the dev account and demo store using the service-role key |

## Project structure

```
src/
  components/        UI primitives, layout, shop, and admin components
  contexts/          Auth, store, cart, and notifications providers
  hooks/             useAuth, useStore, useCart, useNotifications
  lib/               Supabase client, types, route/theme/money helpers, storage uploads
  pages/             Shop, auth, account, admin, dev, and store directory pages
  index.css          Tailwind 4 + shadcn tokens + brand variables
supabase/migrations/ 0001_init.sql … 0004_multi_store.sql
scripts/seed-dev.mjs Dev account and demo-store seed
```

## Security model

- **Public read:** active stores, their categories, and their items.
- **Store membership:** `store_members` links accounts to stores as `owner` or `staff`. `is_store_member()` and `can_manage_store()` are `security definer` helpers used by RLS and storage policies.
- **Dev:** `platform_roles` grants the global `dev` role. Dev can read every store, create stores, and manage memberships.
- **Customers:** can read/write only their own `cart_items`; can read only their own orders and order items.
- **Store team:** can read and update orders for their own store, and manage that store's items, categories, and settings.
- **Checkout:** clients have no INSERT permission on `orders` or `order_items`. `place_order(p_store_id, …)` handles validation, row locking, totals, stock, and cart cleanup atomically.
- **Notifications:** each user sees only their own rows. New-order alerts go to the members of the order's store; status alerts go to the customer.
- **Storage:** public read for item images; only that store's managers can upload, update, or delete files under `stores/<store_id>/…`.

## Customization

- Currency: change `CURRENCY` in `src/lib/money.ts` (defaults to SAR).
- Default theme: edit the `--brand`, `--brand-2`, and `--brand-accent` variables in `src/index.css`. Each store's colors live in the `stores` table and are editable at `/s/<slug>/admin/settings`.
- Demo store name/slug: the migration seeds **Demo Store** at `/s/demo` (`DEFAULT_STORE_SLUG` in `src/lib/types.ts`). `ishophere` is a reserved slug, as are app routes such as `admin`, `auth`, `dev`, and `stores`.
- Low-stock threshold: `stock < 5` appears in `ItemCard`, `ItemDetail`, admin dashboard, and item badges.

## Deployment

Deploy to any static host with SPA fallback (Vercel, Netlify, Cloudflare Pages). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings, then build with `npm run build`.

Configure the SPA fallback so deep links such as `/s/demo/admin/orders` and `/dev/stores` load the app. If email confirmation is enabled, add your production domain to the Supabase Auth redirect URLs.

## Roadmap

Phase 2 adds WhatsApp phone authentication while keeping global accounts and store-aware redirects. The current email/password flow remains available.
