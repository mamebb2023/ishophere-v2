# iShopHere

A mobile-first e-commerce MVP built with React 19, TypeScript, Vite, Tailwind CSS 4, shadcn-style UI components, and Supabase.

Customers browse items publicly, must sign in to use the cart, and check out with contact details. The shop owner manages items, stock, orders, categories, and brand colors from `/admin`.

## Features

- **Shop:** category filters, search, stock badges, item detail, responsive item grid.
- **Accounts:** one account per customer with email/password or phone/password sign-in; add the other contact method later without creating a second account.
- **Cart & checkout:** atomic server-side checkout RPC that validates stock, creates the order + line items, decrements stock, and clears the cart.
- **Orders:** customers see their own order confirmation and order history; admins update statuses (`new → confirmed → shipped → cancelled`).
- **Admin:** dashboard KPIs, item CRUD with image upload, category management, order management, and live theme colors.
- **Mobile-first:** bottom navigation, 44 px tap targets, safe-area padding, responsive tables/cards.

## Stack

- React 19 + TypeScript 7 + Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first config)
- Radix UI primitives with shadcn-style wrappers
- React Router 7
- Supabase Postgres + Auth + Storage + Edge Functions
- React Hook Form + Zod
- `libphonenumber-js` for country dial codes and phone validation
- Sonner toasts

## Identity model

Each Supabase auth user gets exactly one `public.profiles` row:

| Column | Notes |
|---|---|
| `id` | Same UUID as `auth.users.id`, one row per account. |
| `name` | Display name, also reused at checkout. |
| `email` | Real customer email, or `null` for phone-only accounts. Unique. |
| `phone` | Full E.164 string (`+966501234567`). Unique. |

- Email and phone are **not** separate accounts. Adding a phone while signed in by email links it to the same profile, and vice versa.
- Phone-only sign-up uses an opaque internal auth email (`u-<uuid>@internal.ishophere.app`) so Supabase password auth works without an SMS provider. That address is never shown to the customer; `profiles.email` stays `null` until a real email is added.
- Phone sign-in and adding/changing an email go through the `account-auth` Edge Function because Supabase's native phone provider requires SMS OTP.
- There is no email or SMS verification. Sign-up returns a session immediately because **Confirm email** is off.
- Shop owner/admin access still requires a real email and password account. `claim_admin()` rejects internal phone-only emails.

## Quick start

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run these migrations in order:
   1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   2. [`supabase/migrations/0002_notifications.sql`](supabase/migrations/0002_notifications.sql)
   3. [`supabase/migrations/0004_profiles.sql`](supabase/migrations/0004_profiles.sql)

   Save [`0003_fixes.sql`](supabase/migrations/0003_fixes.sql) for after you create the owner in section 5 — it locks owner access and must find an existing admin row.

   Or use the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`. That applies `0003_fixes.sql` too, so skip the claim form in section 5 and create the owner with `npm run seed:owner`.
3. In **Auth → Providers**, enable **Email** and turn **Confirm email** off so sign-ups get a session immediately.
   - You do **not** need to enable **Phone** or configure an SMS provider. Phone/password accounts use the `account-auth` Edge Function.
4. Deploy the account function (from the project root):

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase functions deploy account-auth --no-verify-jwt
   ```

   `supabase/config.toml` already sets `verify_jwt = false` for `account-auth`; the `--no-verify-jwt` flag keeps a manual deploy consistent. If you create the function in the dashboard instead, turn **Verify JWT** off for it — phone sign-in is called before the customer has a session. The function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Edge Function runtime — do not hardcode them.
5. In **Auth → URL Configuration**, set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` as a redirect URL.

> If sign-up returns **"email rate limit exceeded"**, Supabase's built-in mailer is throttled (especially on the free plan). For development, keep **Confirm email** off, or create the owner directly under **Auth → Users → Add user** with **Auto Confirm User** enabled. For production, configure custom SMTP.

The initial migration creates the `item-images` storage bucket with public read and admin-only writes (JPG/PNG/WebP/AVIF, 5 MB max). The notifications migration adds the in-app notification table, admin new-order alerts, and customer order-status alerts. The profiles migration creates the customer profile table, backfills existing users, and validates the unique E.164 phone format.

### 3. Configure environment

```bash
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Only the publishable key (or Supabase's older anon key) belongs in the browser. Row Level Security is the security boundary; never expose the service-role key.

`.env.example` also includes `SUPABASE_SERVICE_ROLE_KEY` for the owner-seeding script. Leave it unprefixed: Vite only exposes variables prefixed with `VITE_`, so it stays out of the browser bundle. Do not use `NEXT_PUBLIC_*` names in this project.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Create the shop owner

1. Go to `/admin/login`.
2. Choose **Create owner** and sign up with a real email (not a phone-only account).
3. With `SUPABASE_SERVICE_ROLE_KEY` filled in `.env.local`, promote that account:

   ```bash
   npm run seed:owner -- you@example.com
   ```

   The script uses `VITE_SUPABASE_URL` and the service-role key from `.env.local`. The key stays on your machine and is never bundled into the app.
4. Run [`0003_fixes.sql`](supabase/migrations/0003_fixes.sql) to disable `claim_admin()`. If you used the seed script, the `owner@example.com` placeholder in section 1 can stay as-is; otherwise replace it with your email before running.

To promote an owner manually instead, insert the row yourself:

```sql
insert into public.admins (id, role)
select id, 'owner'
from auth.users
where email = 'owner@example.com'
on conflict (id) do nothing;
```

## How customers use one account

- **Sign up with phone:** choose the country code, enter the number, name, and password. The app stores the phone on `profiles` and creates an opaque internal auth email. The customer can immediately shop, and name/phone prefills at checkout.
- **Add email later:** Account → Email → Add. Enter the new email and current password. The Edge Function confirms it immediately and updates both `auth.users` and `profiles`.
- **Sign up with email:** the profile stores the real email. Add a phone later from Account → Phone; phone sign-in then works with the same password.
- **Checkout:** when the profile has a name and phone, checkout shows them as a read-only summary and does not ask again. Missing values are prompted once and saved to the profile after the order is placed.
- **Phone sign-in:** the app sends phone + password to `account-auth`, which finds the auth user and returns a normal Supabase session.

If you customize `INTERNAL_EMAIL_DOMAIN`, update it in all three places: `supabase/migrations/0004_profiles.sql`, `supabase/functions/account-auth/index.ts`, and `src/lib/phone.ts`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |
| `npm run seed:owner -- <email>` | Promote a signed-up account to shop owner using the service-role key |
| `npx supabase functions deploy account-auth --no-verify-jwt` | Deploy phone sign-in and add-email support |

## Project structure

```
src/
  components/        UI primitives, layout, shop, and admin components
  contexts/          Auth, cart, and settings providers
  hooks/             useAuth, useCart, useSettings
  lib/               Supabase client, types, phone helpers, money/date helpers, uploads
  pages/             Shop, auth, account, checkout, and admin pages
  index.css          Tailwind 4 + shadcn tokens + brand variables
supabase/migrations/ 0001_init.sql, 0002_notifications.sql, 0003_fixes.sql, 0004_profiles.sql
supabase/functions/  account-auth (phone sign-in, add/change email)
scripts/seed-owner.mjs Promotes a signed-up account to shop owner
```

## Security model

- **Public read:** items, categories, settings.
- **Customers:** can read/write only their own `cart_items`; can read only their own orders and order items.
- **Profiles:** RLS restricts rows to their owner. Customers can select their profile and update only `name` and `phone`; `email` is written by the `account-auth` Edge Function with the service role so it stays in sync with `auth.users`.
- **Checkout:** clients have no INSERT permission on `orders` or `order_items`; `place_order()` is a `security definer` RPC with `search_path = ''` that handles validation, locking, totals, stock, and cart cleanup atomically.
- **Admins:** identified by a row in `admins`; `is_admin()` is a `security definer` helper used by RLS and storage policies. `claim_admin()` only accepts real email accounts.
- **Order pages:** `/order/:id` is private and RLS-limited to the owner or an admin.
- **Storage:** public read for item images; only admins can upload, update, or delete.

## Customization

- Currency: change `CURRENCY` in `src/lib/money.ts`.
- Default theme: edit the `--brand`, `--brand-2`, and `--brand-accent` variables in `src/index.css`, or use the admin settings page.
- Low-stock threshold: `stock < 5` appears in `ItemCard`, `ItemDetail`, admin dashboard, and item badges.
- Default phone country: change the fallback in `DEFAULT_COUNTRY` in `src/lib/phone.ts`. It currently uses the browser locale, falling back to Saudi Arabia (`SA`).

## Deployment

Deploy the static app to any host with SPA fallback (Vercel, Netlify, Cloudflare Pages). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings, then build with `npm run build`.

Deploy `account-auth` to the same Supabase project whenever the function changes:

```bash
npx supabase functions deploy account-auth --no-verify-jwt
```

Keep **Confirm email** off. There is no phone/SMS confirmation step; phone sign-in uses password auth through the Edge Function. Add your production domain to the Auth redirect URLs if you later enable email confirmation.
