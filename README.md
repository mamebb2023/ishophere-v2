# iShopHere

A mobile-first e-commerce MVP built with React 19, TypeScript, Vite, Tailwind CSS 4, shadcn-style UI components, and Supabase.

Customers browse items publicly, must sign in to use the cart, and check out with contact details. The shop owner manages items, stock, orders, categories, and brand colors from `/admin`.

## Features

- **Shop:** category filters, search, stock badges, item detail, responsive item grid.
- **Accounts:** email/password auth via Supabase; cart persisted per user in Postgres.
- **Cart & checkout:** atomic server-side checkout RPC that validates stock, creates the order + line items, decrements stock, and clears the cart.
- **Orders:** customers see their own order confirmation and order history; admins update statuses (`new → confirmed → shipped → cancelled`).
- **Admin:** dashboard KPIs, item CRUD with image upload, category management, order management, and live theme colors.
- **Mobile-first:** bottom navigation, 44 px tap targets, safe-area padding, responsive tables/cards.

## Stack

- React 19 + TypeScript 7 + Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first config)
- Radix UI primitives with shadcn-style wrappers
- React Router 7
- Supabase Postgres + Auth + Storage
- React Hook Form + Zod
- Sonner toasts

## Quick start

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then [`supabase/migrations/0002_notifications.sql`](supabase/migrations/0002_notifications.sql), then [`supabase/migrations/0003_fixes.sql`](supabase/migrations/0003_fixes.sql).
   - Before running `0003_fixes.sql`, sign up your owner account and replace `owner@example.com` in section 1 of that file with its email. After it runs, `claim_admin()` is disabled and only that account can use the admin area.
   - Or use the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. In **Auth → Providers → Email**, enable email/password.
   - For local development, disable **Confirm email** so sign-ups get a session immediately.
4. In **Auth → URL Configuration**, set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` as a redirect URL.

> If sign-up returns **"email rate limit exceeded"**, Supabase's built-in mailer is throttled (especially on the free plan). For development, disable **Confirm email**, or create the owner directly under **Auth → Users → Add user** with **Auto Confirm User** enabled. For production, configure custom SMTP.

The initial migration creates the `item-images` storage bucket with public read and admin-only writes (JPG/PNG/WebP/AVIF, 5 MB max). The notifications migration adds the in-app notification table, admin new-order alerts, and customer order-status alerts.

### 3. Configure environment

```bash
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Only the anon key belongs in the browser. Row Level Security is the security boundary; never expose the service-role key.

Supabase's newer publishable key (`sb_publishable_...`) works here too — paste it into `VITE_SUPABASE_ANON_KEY`. Vite only exposes variables prefixed with `VITE_`, so do not use `NEXT_PUBLIC_*` names in this project.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Create the shop owner

1. Go to `/admin/login`.
2. Choose **Create owner** and sign up (do this before running `0003_fixes.sql`).
3. Run `0003_fixes.sql` with your email in section 1. It seeds your account as the owner and disables `claim_admin()`.

To add an owner manually instead, insert the row yourself:

```sql
insert into public.admins (id, role)
select id, 'owner'
from auth.users
where email = 'owner@example.com'
on conflict (id) do nothing;
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |

## Project structure

```
src/
  components/        UI primitives, layout, shop, and admin components
  contexts/          Auth, cart, and settings providers
  hooks/             useAuth, useCart, useSettings
  lib/               Supabase client, types, money/date helpers, storage uploads
  pages/             Shop, auth, account, checkout, and admin pages
  index.css          Tailwind 4 + shadcn tokens + brand variables
supabase/migrations/ 0001_init.sql, 0002_notifications.sql, 0003_fixes.sql
```

## Security model

- **Public read:** items, categories, settings.
- **Customers:** can read/write only their own `cart_items`; can read only their own orders and order items.
- **Checkout:** clients have no INSERT permission on `orders` or `order_items`; `place_order()` is a `security definer` RPC with `search_path = ''` that handles validation, locking, totals, stock, and cart cleanup atomically.
- **Admins:** identified by a row in `admins`; `is_admin()` is a `security definer` helper used by RLS and storage policies.
- **Order pages:** `/order/:id` is private and RLS-limited to the owner or an admin.
- **Storage:** public read for item images; only admins can upload, update, or delete.

## Customization

- Currency: change `CURRENCY` in `src/lib/money.ts`.
- Default theme: edit the `--brand`, `--brand-2`, and `--brand-accent` variables in `src/index.css`, or use the admin settings page.
- Low-stock threshold: `stock < 5` appears in `ItemCard`, `ItemDetail`, admin dashboard, and item badges.

## Deployment

Deploy to any static host with SPA fallback (Vercel, Netlify, Cloudflare Pages). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings, then build with `npm run build`.

If email confirmation is enabled in Supabase, add your production domain to the Auth redirect URLs.
