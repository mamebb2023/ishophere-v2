# iShopHere — Implementation Plan

**Generated:** 2026-11-11  
**Backend:** Supabase (Postgres + Auth + Storage)  
**Mobile-first:** Hard constraint throughout  
**Assumed defaults (baked in unless overridden):** admin = store-owner login via Supabase Auth; ordering = cart + checkout with contact details; cart requires user account

---

## 1. Overview

A lightweight, mobile-first e-commerce store app ("iShopHere") built on React 19 + TypeScript + Vite, using shadcn/ui + Tailwind CSS. Data persists via Supabase (Postgres + Auth + Storage). The shop owner can list items with images, track stock, and manage orders. Customers browse items publicly and must create/log in to an account before adding items to cart or checking out.

---

## 2. Decisions & Assumptions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Supabase (free tier) | Postgres + Auth + Storage with one `npm install`. Recommended. |
| Admin access | Store-owner login via Supabase Auth (Option A) | Realistic for a shop. First email to sign up becomes the admin. |
| Ordering flow | Cart + checkout with name/phone (Option A) | Avoids oversell; captures contact for fulfillment. |
| Theme colors | Warm amber/orange brand palette, editable via admin (Tailwind CSS vars) | "iShopHere" branding; easy to customize. |
| Payments | None at first — orders created as "new", admin confirms | Fastest path to MVP. Add Stripe later. |
| Image storage | Supabase Storage bucket `item-images` (public read) | Simple upload → URL → store in Postgres. |
| **Cart requires account** | ✅ Yes — cart is backed by Supabase Auth user session | Customers must sign up / log in before adding to cart or checkout. Cart persists per-auth-user in Postgres. |

---

## 3. Database Schema (Postgres via Supabase Migrations)

```sql
-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- items
create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  stock integer not null default 0,
  image_url text,
  is_available boolean generated always as (stock > 0) stored,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- order status enum
create type order_status as enum ('new', 'confirmed', 'shipped', 'cancelled');

-- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  status order_status not null default 'new',
  total_cents integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- order items (junction)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(on delete cascade) not null,
  item_id uuid references items(id) not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  line_total_cents integer generated always as (quantity * unit_price_cents) stored
);

-- cart items (per-auth-user, for adding to cart before checkout)
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references items(id) not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, item_id)
);

-- admins (one row per authenticated user who is the shop owner)
create table admins (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'owner',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

---

## 4. Supabase RLS Policies (summary)

| Table | Anon | Authenticated | Admin/Owner |
|---|---|---|---|
| categories | ✅ select | ✅ select / insert / update | ✅ all |
| items | ✅ select | ✅ select / insert / update | ✅ all |
| orders | ❌ (insert only) | ✅ select / update by owner | ✅ all |
| order_items | ❌ | ✅ by order owner | ✅ all |
| admins | ❌ | ❌ | ✅ by id |
| cart_items | ❌ | ✅ by user (select own only) | ✅ all |

- **Customers** can `select` their own cart items, `insert` new cart items, and `update` quantity. They can **not** read other users' cart items.
- **Customers** can `insert` new orders (via checkout). They can **not** read other orders.
- **Admins** are identified by a row in `admins` keyed to `auth.users.id`. The first user to sign up becomes the owner implicitly.
- **Items and categories** are public-read; only admins can create/update.
- **Cart items policies**: `create policy "Cart items select own" on cart_items for select using (auth.uid() = user_id);` etc.

---

## 5. Routing (React Router v6)

| Route | Public/Private | Layout |
|---|---|---|
| `/` | Public | ShopHome |
| `/item/:id` | Public | ItemDetail |
| `/cart` | **Private (auth required)** | CartDrawer |
| `/checkout` | **Private (auth required)** | CheckoutForm |
| `/order/:id` | Public | OrderConfirmation |
| `/admin/login` | Public | AdminLogin |
| `/admin` | Private (auth + admins row) | AdminLayout |
| `/admin/items` | Private | AdminItemsList |
| `/admin/items/new` | Private | AdminItemForm |
| `/admin/items/:id/edit` | Private | AdminItemForm |
| `/admin/categories` | Private | AdminCategories |
| `/admin/settings` | Private | AdminSettings |

Mobile nav: bottom bar on `sm` and below, top bar on `md` and above. Cart drawer slides up from bottom.

---

## 6. UI Stack

- **shadcn/ui** components (button, card, dialog, drawer, alert-avatar, etc.)
- **Tailwind CSS** with mobile-first breakpoints (`sm:`, `md:`)
- **CSS vars** for theme colors in `:root` (set from admin → propagate to Tailwind)
- **lucide-react** for icons
- **react-hook-form** + **zod** for forms
- **@supabase/supabase-js** client
- **react-hot-toast** for notifications

---

## 7. Feature breakdown

### 7.1 Shop (Customer-facing)

- **Home:** Category grid (1 col mobile, 2-4 cols desktop). Each card: image, name, price, stock badge (red if stock < 5).
- **Item detail:** Image carousel, price, stock counter, "Add to cart" button with quantity selector. **Shown only if user is authenticated**; unauthenticated users see "Sign in to add to cart" CTA.
- **Cart:** Drawer (mobile) / inline (desktop). Shows item thumbnails, quantity, line total. **Only accessible when user is authenticated.** Unauthenticated users clicking cart are redirected to sign-in page with a "continue where you left off" promise. Cart state is persisted per-auth-user in Supabase (via `user_id` on cart items).
- **Checkout:** Collects `customer_name`, `customer_phone`, optional `customer_address`. **Requires user to be authenticated.** On submit: DB transaction: decrement item stock (via RPC), insert order + order_items (with `user_id`), reset cart, show confirmation.
- **Order confirmation:** Shows order number, items, estimated pickup/eta (simple text). Order is tied to the user's account.

### 7.2 Admin Portal

- **Login:** Email/password via Supabase Auth. On success, check `admins` table; guard routes.
- **Dashboard:** KPI cards (total sales, items count, low-stock items). Recent orders list.
- **Items CRUD:** Form with name, description, price, stock, category select, image upload (Supabase Storage). Preview image before save. Delete item → set `is_available` = false or delete row.
- **Categories:** Add/edit/delete categories. Reorder via sort_order.
- **Settings:** Edit `primary_color`, `secondary_color` (hex). CSS vars update in real time (re-render or meta refresh).
- **Orders:** List with status badges. Admin can update status (`new` → `confirmed` → `shipped` → `cancelled`). Each order shows customer contact + items.

### 7.3 Stock management

- Stock decrement happens in a **Supabase RPC** to avoid race conditions:

```sql
create or replace function decrement_stock(item_id uuid, qty integer)
returns boolean as $$
update items set stock = stock - qty, updated_at = timezone('utc'::text, now())
where id = item_id and stock >= qty
returning stock >= qty;
$$ language sql;
```

Returns `true` if enough stock; front-end shows error if insufficient.

### 7.4 Image upload

- Admin uses a file input. On change: `supabase.storage.from('item-images').upload(uniqueFilename, file)`. Then `supabase.storage.from('item-images').getPublicUrl(uniqueFilename).data.publicUrl`. Store URL in `items.image_url`.
- Bucket `item-images` configured: `public: true` for image serving.

---

## 8. Key Files (src/)

```
src/
  lib/
    supabase.ts          // createClient with anon key
    auth.ts              // useSession, isAdmin, signIn/SignOut
    rpc.ts               // wrappers for stored procs
  hooks/
    useAuth.ts           // login status + admin check
    useCart.ts           // cart items persisted per-auth-user in Supabase (cart_items table)
    useStock.ts          // subscribe to items changes via supabase channel
  components/
    ui/                  // shadcn components (generated by shadcn cli)
    layout/
      Header.tsx         // mobile toggle + logo
      Footer.tsx         // links, copyright
      MobileNav.tsx      // bottom nav: Home, Cart, Admin
      AdminLayout.tsx    // protects routes
    shop/
      ItemCard.tsx       // image, name, price, stock badge
      CategoryFilter.tsx // pills
      SearchBar.tsx
    admin/
      AdminNavbar.tsx
      ItemForm.tsx       // react-hook-form + zod + image upload
      OrderTable.tsx
      SettingsForm.tsx   // color pickers
  pages/
    Home.tsx
    ItemDetail.tsx
    Cart.tsx
    Checkout.tsx
    OrderConfirmation.tsx
    AdminLogin.tsx
    AdminDashboard.tsx
    AdminItems.tsx
    AdminCategories.tsx
    AdminSettings.tsx
  styles/
    globals.css          // Tailwind + CSS vars
```

---

## 9. Setup Checklist (for implementation agent)

### 9.1 Install dependencies

```bash
# Core
npm install @supabase/supabase-js
npm install react-router-dom
npm install react-hook-form zod @hookform/resolvers
npm install @radix-ui/react-dialog @radix-ui/react-slot lucide-react
npm install @headlessui/react  # optional for complex UI patterns

# Tailwind & shadcn
npm install tailwindcss@^3.4.1 postcss@^8.5.0 autoprefixer@^^10.4.1
npx shadcn-ui@latest init   # generates ./src/components/ui/ from the shadcn library

# Then add these shadcn components (one-liners):
npx shadcn-ui@latest add button card dialog drawer input-avatar alert collapse navigation-menu avatar badge-tooltip separator progress-steps
```

### 9.2 Tailwind + shadcn config

- Run `npx tailwindcss init -p` to generate `tailwind.config.js` and `postcss.config.js`.
- Edit `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@/shadcn-ui/**/*.{js,ts,jsx,tsx}", // shadcn components
  ],
  theme: {
    extend: {
      colors: {
        // iShopHere brand palette (can be overridden in admin)
        primary: "var(--primary-color)",
        secondary: "var(--secondary-color)",
        accent: "var(--accent-color)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

- In `src/styles/globals.css`, add CSS vars for the brand colors (these will be set by the admin settings):

```css
:root {
  --primary-color: #ea580c;   /* warm amber-orange default */
  --secondary-color: #f97316;
  --accent-color: #ffed4a;
}
```

- The admin settings form updates these vars via state, e.g.:

```tsx
// AdminSettings.tsx snippet
const [primaryColor, setPrimaryColor] = useState("#ea580c");
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty("--primary-color", primaryColor);
}, [primaryColor]);
```

- Shadcn components use `className="...``` (rest of line cut off)

### 9.3 Supabase project

1. Create a new Supabase project at supabase.io.
2. Copy `Project URL` and `anon public` key.
3. Create `.env.local` (gitignored):
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```
4. **Run migrations.** In the Supabase SQL editor, paste the schema from Section 3 (Database Schema). Then run:

```sql
-- Enable RLS
alter table items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table categories enable row level security;
alter table admins enable row level security;
alter table cart_items enable row level security;

-- Policies
create policy "Items public read" on items for select using (true);
create policy "Categories public read" on categories for select using (true);
create policy "Orders insert for customers" on orders for insert with check (true);
create policy "Orders select for owner" on orders for select using (exists (select 1 from admins where id = auth.uid()));
create policy "Order items select for owner" on order_items for select using (exists (select 1 from orders where id = order_id and exists (select 1 from admins where id = auth.uid())));
create policy "Admins select for owner" on admins for select using (exists (select 1 from auth.users where id = id));

-- Cart items policies: users can manage their own cart
create policy "Cart items select own" on cart_items for select using (auth.uid() = user_id);
create policy "Cart items insert own" on cart_items for insert with check (auth.uid() = user_id);
create policy "Cart items update own quantity" on cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket policy for item-images
insert into storage.buckets (id, public) values ('item-images', true);
create policy "Item images public read" on storage.objects for select using (bucket_id = 'item-images');
create policy "Item images upload for admin" on storage.objects for insert with check (bucket_id = 'item-images' and (select role from admins where id = auth.uid()) = 'owner');
```

5. Create Storage bucket `item-images`, set `Public` = true via dashboard.

### 9.4 First admin

After Supabase is set up and the app runs locally:

1. The `Auth` provider wraps the app (see `src/lib/auth.ts`).
2. On first sign-up, a React effect inserts a row into `admins`:

```ts
// src/lib/auth.ts — onAuthStateChange handler
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN") {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .limit(1);
    if (!existing.length) {
      // First user ever to sign up becomes the owner
      await supabase.from("admins").insert({ id: session.user.id, role: "owner" });
    }
  }
});
```

Alternatively, the shop owner can click "Make me admin" in the settings page (requires existing owner to confirm).

### 9.5 Dev workflow

```bash
npm run dev     # Vite dev server
npm run build   # tsc + vite build
npm run lint    # oxlint
```

---

## 10. Risks & Open Questions

- **RLS policies:** Must be carefully tested. A mispolicy could expose items/orders to all users. Write unit-tests or manual smoke tests for each policy.
- **Stock race condition:** The RPC handles it, but edge case: two orders placed simultaneously could both see `stock >= qty` then both deduct. The `where stock >= qty` guard in the update prevents overallocation, but the app should display "out of stock" if the update returns false.
- **Image optimization:** Originals uploaded; no automatic resize. If large images are a concern, add an edge function or Cloudinary integration later.
- **Authentication flow:** Supabase Auth UI (`<SignIn>`, `<SignUp>`) is available. The admin login page should use it, with a redirect after login to `/admin`.
- **Mobile nav:** Bottom app bar on `sm` and below (`max-w-md`), top bar on `md` and above. Use Tailwind `hidden sm:block` and `block sm:hidden` to swap. Cart drawer uses `sm:translate-x-full` hidden, `md:hidden` for inline. Tap targets min `44px`, text size `text-sm` on mobile, `text-base` on `md+`.
- **Cart auth dependency:** Cart state is tied to the user's Supabase session. If the session expires or the user signs out, cart items are lost unless the app synchronously migrates them to localStorage or prompts the user to sign in to preserve them. Must handle `onAuthStateChange` gracefully.

---

## 11. Validation

- Manual smoke test: seed 3 categories, 6 items with images. Browse on mobile, add to cart (must be logged in), checkout with name/phone, confirm order appears in admin dashboard. Stock decrements. Try low-stock scenario (set stock to 0 → item disappears from shop).
- Admin login → add new item with image → item appears in shop immediately.
- Admin changes theme color → CSS vars update, UI reflects new colors without refresh.
- Supabase storage: upload large image → verify it displays in item form.
- Unauthenticated user clicks "Add to cart" → redirected to sign-in; after sign-in, cart items persist and checkout works.

---

**Assumptions baked in (flip if needed):** admin = store-owner login (A); ordering = cart + checkout with contact details (A); cart requires user account (A). If you want the alternative models, let me know and I'll adjust the plan before finalizing.