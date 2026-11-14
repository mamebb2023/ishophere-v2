-- ============================================================
-- iShopHere — lock down what store teams can change
-- Run after 0004_multi_store.sql.
--
-- RLS decides which rows a store manager can update, not which columns.
-- These triggers close that gap:
--   * orders: only `status` may change (totals, customer details and
--     ownership stay as placed).
--   * stores: only the dev may change `is_active`.
-- Calls with no signed-in user (dashboard SQL, service role, FK actions
-- such as deleting an auth user) are not restricted.
-- ============================================================

create or replace function public.protect_order_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and (
       new.id is distinct from old.id
       or new.store_id is distinct from old.store_id
       or new.user_id is distinct from old.user_id
       or new.customer_name is distinct from old.customer_name
       or new.customer_phone is distinct from old.customer_phone
       or new.customer_address is distinct from old.customer_address
       or new.total_cents is distinct from old.total_cents
       or new.created_at is distinct from old.created_at
     )
  then
    raise exception 'Only the order status can be changed';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_order_fields() from public;

create trigger orders_protect_fields
  before update on public.orders
  for each row execute function public.protect_order_fields();

create or replace function public.protect_store_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and not public.is_dev()
     and (
       new.id is distinct from old.id
       or new.is_active is distinct from old.is_active
       or new.created_at is distinct from old.created_at
     )
  then
    raise exception 'Only the platform owner can change this';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_store_admin_fields() from public;

create trigger stores_protect_admin_fields
  before update on public.stores
  for each row execute function public.protect_store_admin_fields();
