-- ============================================================
-- iShopHere — initial schema, functions, RLS, and storage
-- Run once in a fresh Supabase project (SQL editor or CLI).
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_available boolean generated always as (stock > 0) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.order_status as enum ('new', 'confirmed', 'shipped', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- nullable only so deleting an auth user does not erase order history
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  status public.order_status not null default 'new',
  total_cents integer not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  -- restrict: keep item rows that appear in order history; "remove" = stock 0
  item_id uuid not null references public.items(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  line_total_cents integer generated always as (quantity * unit_price_cents) stored
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

-- singleton row: id is always 1
create table public.settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'iShopHere',
  primary_color text not null default '#ea580c'
    check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#f97316'
    check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text not null default '#facc15'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================

create index items_category_idx on public.items (category_id);
create index items_sort_idx on public.items (sort_order);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index cart_items_user_idx on public.cart_items (user_id);

-- ============================================================
-- updated_at TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- HELPERS
-- ============================================================

-- Used by RLS policies. SECURITY DEFINER avoids recursive RLS on admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- First authenticated account can claim ownership exactly once.
-- Serialize with an advisory lock so two concurrent claims cannot both win.
create or replace function public.claim_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(781043001);

  if exists (select 1 from public.admins) then
    return exists (select 1 from public.admins where id = v_uid);
  end if;

  insert into public.admins (id, role) values (v_uid, 'owner');
  return true;
end;
$$;

revoke all on function public.claim_admin() from public;
grant execute on function public.claim_admin() to authenticated;

-- Increment/add to the caller's cart with stock validation.
-- SECURITY INVOKER: cart RLS still applies.
create or replace function public.add_to_cart(p_item_id uuid, p_qty integer default 1)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stock integer;
  v_existing integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_qty < 1 or p_qty > 99 then
    raise exception 'Quantity must be between 1 and 99';
  end if;

  select i.stock into v_stock
  from public.items i
  where i.id = p_item_id;

  if v_stock is null then
    raise exception 'Item not found';
  end if;

  v_existing := coalesce((
    select ci.quantity
    from public.cart_items ci
    where ci.user_id = v_uid and ci.item_id = p_item_id
  ), 0);

  if v_existing + p_qty > v_stock then
    raise exception 'Only % left in stock', v_stock;
  end if;
  if v_existing + p_qty > 99 then
    raise exception 'Maximum quantity per item is 99';
  end if;

  insert into public.cart_items as ci (user_id, item_id, quantity)
  values (v_uid, p_item_id, p_qty)
  on conflict (user_id, item_id) do update
    set quantity = ci.quantity + excluded.quantity;
end;
$$;

revoke all on function public.add_to_cart(uuid, integer) from public;
grant execute on function public.add_to_cart(uuid, integer) to authenticated;

-- Atomic checkout. SECURITY DEFINER: bypasses RLS so customers never get
-- direct INSERT rights on orders/order_items. Any exception rolls back all
-- writes in the function, including stock decrements.
create or replace function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_total integer := 0;
  r record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_customer_name is null
     or btrim(p_customer_name) = ''
     or char_length(p_customer_name) > 120
     or p_customer_phone is null
     or btrim(p_customer_phone) = ''
     or char_length(p_customer_phone) > 32
     or (p_customer_address is not null and char_length(p_customer_address) > 500)
  then
    raise exception 'Invalid customer details';
  end if;

  -- Lock cart rows and item rows in a deterministic order to avoid deadlocks.
  for r in
    select ci.item_id, ci.quantity, i.name, i.price_cents, i.stock
    from public.cart_items ci
    join public.items i on i.id = ci.item_id
    where ci.user_id = v_uid
    order by ci.item_id
    for update of ci, i
  loop
    if r.stock < r.quantity then
      raise exception 'Insufficient stock for "%"', r.name;
    end if;
    v_total := v_total + r.quantity * r.price_cents;
  end loop;

  if v_total = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (
    user_id, customer_name, customer_phone, customer_address, total_cents
  )
  values (
    v_uid,
    btrim(p_customer_name),
    btrim(p_customer_phone),
    nullif(btrim(p_customer_address), ''),
    v_total
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, item_id, quantity, unit_price_cents)
  select v_order_id, ci.item_id, ci.quantity, i.price_cents
  from public.cart_items ci
  join public.items i on i.id = ci.item_id
  where ci.user_id = v_uid;

  update public.items i
  set stock = i.stock - ci.quantity
  from public.cart_items ci
  where ci.user_id = v_uid and i.id = ci.item_id;

  delete from public.cart_items where user_id = v_uid;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(text, text, text) from public;
grant execute on function public.place_order(text, text, text) to authenticated;

-- ============================================================
-- RLS
-- ============================================================

alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.admins enable row level security;
alter table public.settings enable row level security;

-- categories: public read, admin write
create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);

create policy categories_admin_insert on public.categories
  for insert to authenticated with check (public.is_admin());

create policy categories_admin_update on public.categories
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy categories_admin_delete on public.categories
  for delete to authenticated using (public.is_admin());

-- items: public read, admin write
create policy items_public_read on public.items
  for select to anon, authenticated using (true);

create policy items_admin_insert on public.items
  for insert to authenticated with check (public.is_admin());

create policy items_admin_update on public.items
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy items_admin_delete on public.items
  for delete to authenticated using (public.is_admin());

-- orders: customers read only their own; admins read/update/delete all.
-- No INSERT policy: rows are created only by place_order().
create policy orders_select_own_or_admin on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy orders_admin_update on public.orders
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy orders_admin_delete on public.orders
  for delete to authenticated using (public.is_admin());

-- order_items: visible with the parent order; no INSERT policy.
create policy order_items_select_own_or_admin on public.order_items
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- cart_items: each user manages only their own rows.
create policy cart_items_select_own on public.cart_items
  for select to authenticated using (user_id = auth.uid());

create policy cart_items_insert_own on public.cart_items
  for insert to authenticated with check (user_id = auth.uid());

create policy cart_items_update_own on public.cart_items
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cart_items_delete_own on public.cart_items
  for delete to authenticated using (user_id = auth.uid());

-- admins: a signed-in admin can read only their own row.
-- No write policies; claim_admin() is the only path.
create policy admins_select_self on public.admins
  for select to authenticated using (id = auth.uid());

-- settings: theme is public; only admins update. Row is seeded above.
create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);

create policy settings_admin_update on public.settings
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy item_images_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'item-images');

create policy item_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-images' and public.is_admin());

create policy item_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'item-images' and public.is_admin())
  with check (bucket_id = 'item-images' and public.is_admin());

create policy item_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-images' and public.is_admin());
