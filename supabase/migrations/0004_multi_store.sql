-- ============================================================
-- iShopHere — Phase 1 multi-store schema
-- DESTRUCTIVE RESET: drops the old public shop tables only.
-- auth.users is preserved. Old storage objects are left in place.
-- Run after 0003_fixes.sql.
-- ============================================================

-- ============================================================
-- 1. DROP THE LEGACY SINGLE-STORE SHOP
-- ============================================================

drop table if exists public.notifications cascade;
drop table if exists public.order_items cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.items cascade;
drop table if exists public.categories cascade;
drop table if exists public.admins cascade;
drop table if exists public.settings cascade;
drop type if exists public.order_status cascade;

drop function if exists public.place_order(text, text, text) cascade;
drop function if exists public.add_to_cart(uuid, integer) cascade;
drop function if exists public.admin_stats() cascade;
drop function if exists public.claim_admin() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.notify_admins_new_order() cascade;
drop function if exists public.notify_customer_order_status() cascade;
drop function if exists public.sync_stock_on_cancel() cascade;

drop policy if exists item_images_public_read on storage.objects;
drop policy if exists item_images_admin_insert on storage.objects;
drop policy if exists item_images_admin_update on storage.objects;
drop policy if exists item_images_admin_delete on storage.objects;

-- ============================================================
-- 2. PLATFORM AND STORE TABLES
-- ============================================================

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique
    check (
      char_length(slug) between 2 and 60
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  description text not null
    check (char_length(btrim(description)) between 2 and 500),
  primary_color text not null default '#1d813e'
    check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#50cc60'
    check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text not null default '#96ee89'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Global platform roles. Today the only role is 'dev'.
create table public.platform_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('dev')),
  created_at timestamptz not null default now()
);

-- Store-scoped team membership. The owner's name is recorded here because
-- auth.users is not publicly readable.
create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  display_name text not null
    check (char_length(btrim(display_name)) between 2 and 120),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index store_members_user_idx on public.store_members (user_id);

-- ============================================================
-- 3. STORE-SCOPED SHOP TABLES
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, slug),
  -- Needed so items can reference a category from the same store.
  unique (store_id, id)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_available boolean generated always as (stock > 0) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Needed so cart rows can enforce item/store consistency.
  unique (store_id, id)
);

create type public.order_status as enum ('new', 'confirmed', 'shipped', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  -- Nullable only so deleting an auth user does not erase order history.
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
  -- Restrict: keep item rows that appear in order history. "Remove" = stock 0.
  item_id uuid not null references public.items(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  line_total_cents integer generated always as (quantity * unit_price_cents) stored
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  item_id uuid not null,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (user_id, item_id),
  foreign key (store_id, item_id)
    references public.items(store_id, id) on delete cascade
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  type text not null check (type in ('order_placed', 'order_status')),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. DEMO STORE
-- ============================================================

insert into public.stores (name, slug, description)
values (
  'Demo Store',
  'demo',
  'A sample storefront for exploring the iShopHere platform.'
)
on conflict (slug) do nothing;

-- ============================================================
-- 5. INDEXES
-- ============================================================

create index categories_store_sort_idx
  on public.categories (store_id, sort_order, name);

create index items_store_sort_idx
  on public.items (store_id, sort_order, created_at desc);

create index items_category_idx on public.items (category_id);

create index orders_store_status_idx
  on public.orders (store_id, status, created_at desc);

create index orders_user_idx on public.orders (user_id);

create index order_items_order_idx on public.order_items (order_id);

create index cart_items_user_store_idx
  on public.cart_items (user_id, store_id);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create index notifications_store_idx
  on public.notifications (store_id, created_at desc);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
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

create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- The store slug is a permanent public address. Members may edit the name,
-- description, and colors, but only the dev can move the store.
create or replace function public.protect_store_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug
     and auth.uid() is not null
     and not public.is_dev()
  then
    raise exception 'Only the platform owner can change a store slug';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_store_slug() from public;

create trigger stores_protect_slug
  before update on public.stores
  for each row execute function public.protect_store_slug();

-- Reject categories that belong to a different store.
create or replace function public.enforce_item_category_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category_id is not null then
    if not exists (
      select 1
      from public.categories c
      where c.id = new.category_id
        and c.store_id = new.store_id
    ) then
      raise exception 'Category does not belong to this store';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_item_category_store() from public;

create trigger items_enforce_category_store
  before insert or update on public.items
  for each row execute function public.enforce_item_category_store();

-- ============================================================
-- 7. ACCESS HELPERS
-- ============================================================

create or replace function public.is_dev()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = auth.uid()
      and pr.role = 'dev'
  );
$$;

revoke all on function public.is_dev() from public;
grant execute on function public.is_dev() to anon, authenticated;

create or replace function public.store_is_active(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.is_active
  );
$$;

revoke all on function public.store_is_active(uuid) from public;
grant execute on function public.store_is_active(uuid) to anon, authenticated;

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to anon, authenticated;

create or replace function public.can_manage_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_dev() or public.is_store_member(p_store_id);
$$;

revoke all on function public.can_manage_store(uuid) from public;
grant execute on function public.can_manage_store(uuid) to anon, authenticated;

-- Used by storage policies. Storage object names look like:
-- stores/<store_id>/items/<file>
create or replace function public.can_manage_item_image(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where split_part(p_name, '/', 1) = 'stores'
      and split_part(p_name, '/', 2) = s.id::text
      and split_part(p_name, '/', 3) = 'items'
      and public.can_manage_store(s.id)
  );
$$;

revoke all on function public.can_manage_item_image(text) from public;
grant execute on function public.can_manage_item_image(text) to authenticated;

-- ============================================================
-- 8. STORE CREATION
-- ============================================================

create or replace function public.create_store(
  p_name text,
  p_slug text,
  p_description text,
  p_owner_name text,
  p_owner_email text,
  p_primary_color text default null,
  p_secondary_color text default null,
  p_accent_color text default null
)
returns public.stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_description text := btrim(coalesce(p_description, ''));
  v_owner_name text := btrim(coalesce(p_owner_name, ''));
  v_owner_email text := lower(btrim(coalesce(p_owner_email, '')));
  v_primary text := coalesce(nullif(btrim(p_primary_color), ''), '#1d813e');
  v_secondary text := coalesce(nullif(btrim(p_secondary_color), ''), '#50cc60');
  v_accent text := coalesce(nullif(btrim(p_accent_color), ''), '#96ee89');
  v_owner_id uuid;
  v_store public.stores;
begin
  if not public.is_dev() then
    raise exception 'Only the platform owner can create stores';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Store name must be between 2 and 80 characters';
  end if;

  if char_length(v_slug) < 2
     or char_length(v_slug) > 60
     or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'Slug must use lowercase letters, numbers, and hyphens';
  end if;

  if v_slug = any (array[
    'admin', 'auth', 'dev', 'stores', 'account', 'cart', 'checkout',
    'order', 'api', 's', 'static', 'assets', 'login', 'signup', 'new',
    'ishophere'
  ]) then
    raise exception 'That store slug is reserved';
  end if;

  if char_length(v_description) < 2 or char_length(v_description) > 500 then
    raise exception 'Store description must be between 2 and 500 characters';
  end if;

  if char_length(v_owner_name) < 2 or char_length(v_owner_name) > 120 then
    raise exception 'Owner name must be between 2 and 120 characters';
  end if;

  if position('@' in v_owner_email) < 2 then
    raise exception 'Enter a valid owner email';
  end if;

  if v_primary !~ '^#[0-9a-fA-F]{6}$'
     or v_secondary !~ '^#[0-9a-fA-F]{6}$'
     or v_accent !~ '^#[0-9a-fA-F]{6}$'
  then
    raise exception 'Colors must be 6-digit hex values';
  end if;

  select u.id
    into v_owner_id
  from auth.users u
  where lower(u.email) = v_owner_email
  limit 1;

  if v_owner_id is null then
    raise exception
      'No iShopHere account found for %. Ask the owner to sign up at /auth first.',
      v_owner_email;
  end if;

  insert into public.stores (
    name, slug, description, primary_color, secondary_color, accent_color
  )
  values (
    v_name,
    v_slug,
    v_description,
    lower(v_primary),
    lower(v_secondary),
    lower(v_accent)
  )
  returning * into v_store;

  insert into public.store_members (store_id, user_id, role, display_name)
  values (v_store.id, v_owner_id, 'owner', v_owner_name);

  return v_store;
exception
  when unique_violation then
    raise exception 'That store slug is already taken';
end;
$$;

revoke all on function public.create_store(text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_store(text, text, text, text, text, text, text, text) to authenticated;

-- ============================================================
-- 9. DEV STORE LIST
-- ============================================================

create or replace function public.dev_list_stores()
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  is_active boolean,
  primary_color text,
  secondary_color text,
  accent_color text,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  staff_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.name,
    s.slug,
    s.description,
    s.is_active,
    s.primary_color,
    s.secondary_color,
    s.accent_color,
    s.created_at,
    om.display_name as owner_name,
    ou.email::text as owner_email,
    (
      select count(*)
      from public.store_members sm
      where sm.store_id = s.id
        and sm.role = 'staff'
    ) as staff_count
  from public.stores s
  left join public.store_members om
    on om.store_id = s.id and om.role = 'owner'
  left join auth.users ou on ou.id = om.user_id
  where public.is_dev()
  order by s.created_at desc;
$$;

revoke all on function public.dev_list_stores() from public;
grant execute on function public.dev_list_stores() to authenticated;

-- ============================================================
-- 10. CART AND CHECKOUT
-- ============================================================

create or replace function public.add_to_cart(
  p_item_id uuid,
  p_qty integer default 1
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_item record;
  v_existing integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_qty is null or p_qty < 1 or p_qty > 99 then
    raise exception 'Quantity must be between 1 and 99';
  end if;

  select i.id, i.store_id, i.stock, i.is_available, s.is_active
    into v_item
  from public.items i
  join public.stores s on s.id = i.store_id
  where i.id = p_item_id;

  if not found then
    raise exception 'Item not found';
  end if;

  if not v_item.is_active then
    raise exception 'This store is not available';
  end if;

  if not v_item.is_available then
    raise exception 'Item is out of stock';
  end if;

  select ci.quantity
    into v_existing
  from public.cart_items ci
  where ci.user_id = v_uid
    and ci.item_id = p_item_id;

  v_existing := coalesce(v_existing, 0);

  if v_existing + p_qty > v_item.stock then
    raise exception 'Only % left in stock', v_item.stock;
  end if;

  if v_existing + p_qty > 99 then
    raise exception 'Maximum quantity per item is 99';
  end if;

  insert into public.cart_items as ci (user_id, store_id, item_id, quantity)
  values (v_uid, v_item.store_id, p_item_id, p_qty)
  on conflict (user_id, item_id) do update
    set quantity = ci.quantity + excluded.quantity,
        store_id = excluded.store_id;
end;
$$;

revoke all on function public.add_to_cart(uuid, integer) from public;
grant execute on function public.add_to_cart(uuid, integer) to authenticated;

-- Atomic per-store checkout. SECURITY DEFINER bypasses RLS so customers never
-- get direct INSERT rights on orders/order_items.
create or replace function public.place_order(
  p_store_id uuid,
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

  if not exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.is_active
  ) then
    raise exception 'Store not found or unavailable';
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

  -- Lock this store's cart rows and item rows in a deterministic order.
  for r in
    select ci.item_id, ci.quantity, i.name, i.price_cents, i.stock
    from public.cart_items ci
    join public.items i on i.id = ci.item_id
    where ci.user_id = v_uid
      and ci.store_id = p_store_id
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
    store_id, user_id, customer_name, customer_phone, customer_address, total_cents
  )
  values (
    p_store_id,
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
  where ci.user_id = v_uid
    and ci.store_id = p_store_id;

  update public.items i
  set stock = i.stock - ci.quantity
  from public.cart_items ci
  where ci.user_id = v_uid
    and ci.store_id = p_store_id
    and i.id = ci.item_id;

  delete from public.cart_items
  where user_id = v_uid
    and store_id = p_store_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, text, text, text) from public;
grant execute on function public.place_order(uuid, text, text, text) to authenticated;

-- ============================================================
-- 11. DASHBOARD STATS
-- ============================================================

create or replace function public.admin_stats(p_store_id uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.can_manage_store(p_store_id) then json_build_object(
    'sales_cents', coalesce((
      select sum(o.total_cents)
      from public.orders o
      where o.store_id = p_store_id
        and o.status <> 'cancelled'
    ), 0),
    'order_count', (
      select count(*)
      from public.orders o
      where o.store_id = p_store_id
    ),
    'new_count', (
      select count(*)
      from public.orders o
      where o.store_id = p_store_id
        and o.status = 'new'
    ),
    'item_count', (
      select count(*)
      from public.items i
      where i.store_id = p_store_id
    ),
    'low_stock_count', (
      select count(*)
      from public.items i
      where i.store_id = p_store_id
        and i.stock between 1 and 4
    )
  ) end;
$$;

revoke all on function public.admin_stats(uuid) from public;
grant execute on function public.admin_stats(uuid) to authenticated;

-- ============================================================
-- 12. NOTIFICATIONS AND STOCK TRIGGERS
-- ============================================================

create or replace function public.notify_store_members_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_name text;
begin
  select s.name into v_store_name
  from public.stores s
  where s.id = new.store_id;

  insert into public.notifications (user_id, store_id, order_id, type, title, body)
  select
    m.user_id,
    new.store_id,
    new.id,
    'order_placed',
    'New order · ' || coalesce(v_store_name, 'Store')
      || ' #' || upper(left(new.id::text, 8)),
    new.customer_name || ' · ' || new.customer_phone
  from public.store_members m
  where m.store_id = new.store_id
    and m.user_id is distinct from new.user_id;

  return new;
end;
$$;

revoke all on function public.notify_store_members_new_order() from public;

create trigger orders_notify_store_members
  after insert on public.orders
  for each row execute function public.notify_store_members_new_order();

create or replace function public.notify_customer_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_name text;
begin
  if new.user_id is not null and new.status is distinct from old.status then
    select s.name into v_store_name
    from public.stores s
    where s.id = new.store_id;

    insert into public.notifications (user_id, store_id, order_id, type, title, body)
    values (
      new.user_id,
      new.store_id,
      new.id,
      'order_status',
      'Order #' || upper(left(new.id::text, 8))
        || ' from ' || coalesce(v_store_name, 'Store')
        || ' is ' || new.status,
      'Your order status changed from ' || old.status || ' to ' || new.status || '.'
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_customer_order_status() from public;

create trigger orders_notify_customer
  after update of status on public.orders
  for each row execute function public.notify_customer_order_status();

create or replace function public.sync_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.items i
    set stock = i.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id
      and oi.item_id = i.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    -- Un-cancelling takes the stock back; fails if there is not enough left.
    update public.items i
    set stock = i.stock - oi.quantity
    from public.order_items oi
    where oi.order_id = new.id
      and oi.item_id = i.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_stock_on_cancel() from public;

create trigger orders_sync_stock
  after update of status on public.orders
  for each row execute function public.sync_stock_on_cancel();

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================

alter table public.stores enable row level security;
alter table public.platform_roles enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.notifications enable row level security;

-- platform_roles: users can see their own role; dev can see all.
create policy platform_roles_select on public.platform_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_dev());

-- stores: active stores are public; members see their own even when inactive.
create policy stores_select on public.stores
  for select to anon, authenticated
  using (
    is_active
    or public.is_dev()
    or public.is_store_member(id)
  );

create policy stores_update on public.stores
  for update to authenticated
  using (public.can_manage_store(id))
  with check (public.can_manage_store(id));

create policy stores_dev_insert on public.stores
  for insert to authenticated
  with check (public.is_dev());

create policy stores_dev_delete on public.stores
  for delete to authenticated
  using (public.is_dev());

-- store_members: see your own membership; members can see their team; dev all.
create policy store_members_select on public.store_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_dev()
    or public.is_store_member(store_id)
  );

create policy store_members_dev_insert on public.store_members
  for insert to authenticated
  with check (public.is_dev());

create policy store_members_dev_update on public.store_members
  for update to authenticated
  using (public.is_dev())
  with check (public.is_dev());

create policy store_members_dev_delete on public.store_members
  for delete to authenticated
  using (public.is_dev());

-- categories and items: public read for active stores; managers can write.
create policy categories_select on public.categories
  for select to anon, authenticated
  using (
    public.store_is_active(store_id)
    or public.can_manage_store(store_id)
  );

create policy categories_insert on public.categories
  for insert to authenticated
  with check (public.can_manage_store(store_id));

create policy categories_update on public.categories
  for update to authenticated
  using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

create policy categories_delete on public.categories
  for delete to authenticated
  using (public.can_manage_store(store_id));

create policy items_select on public.items
  for select to anon, authenticated
  using (
    public.store_is_active(store_id)
    or public.can_manage_store(store_id)
  );

create policy items_insert on public.items
  for insert to authenticated
  with check (public.can_manage_store(store_id));

create policy items_update on public.items
  for update to authenticated
  using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

create policy items_delete on public.items
  for delete to authenticated
  using (public.can_manage_store(store_id));

-- orders: customers read their own; store managers read/update their store's.
-- No INSERT policy: rows are created only by place_order().
create policy orders_select on public.orders
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_store(store_id)
  );

create policy orders_update on public.orders
  for update to authenticated
  using (public.can_manage_store(store_id))
  with check (public.can_manage_store(store_id));

create policy orders_delete on public.orders
  for delete to authenticated
  using (public.can_manage_store(store_id));

-- order_items: visible with the parent order; no INSERT policy.
create policy order_items_select on public.order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = auth.uid()
          or public.can_manage_store(o.store_id)
        )
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

-- notifications: each user sees only their own.
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 14. TABLE GRANTS
-- ============================================================

grant select on public.stores to anon, authenticated;
grant insert, update, delete on public.stores to authenticated;

grant select on public.platform_roles to authenticated;

grant select, insert, update, delete on public.store_members to authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;

grant select on public.orders to authenticated;
grant update, delete on public.orders to authenticated;

grant select on public.order_items to authenticated;

grant select, insert, update, delete on public.cart_items to authenticated;

grant select, update on public.notifications to authenticated;

-- ============================================================
-- 15. STORAGE
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

drop policy if exists item_images_public_read on storage.objects;
drop policy if exists item_images_store_insert on storage.objects;
drop policy if exists item_images_store_update on storage.objects;
drop policy if exists item_images_store_delete on storage.objects;

create policy item_images_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'item-images');

create policy item_images_store_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and public.can_manage_item_image(name)
  );

create policy item_images_store_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'item-images'
    and public.can_manage_item_image(name)
  )
  with check (
    bucket_id = 'item-images'
    and public.can_manage_item_image(name)
  );

create policy item_images_store_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'item-images'
    and public.can_manage_item_image(name)
  );

-- ============================================================
-- 16. REALTIME
-- ============================================================

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;

notify pgrst, 'reload schema';
