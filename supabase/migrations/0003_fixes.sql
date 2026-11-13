-- ============================================================
-- iShopHere — fixes: owner lock-down, restock on cancel,
-- color defaults, dashboard stats, realtime
-- Run after 0002_notifications.sql
-- ============================================================

-- 1. OWNER LOCK-DOWN ----------------------------------------
-- Replace the email with YOUR owner account (sign up first), then run.
insert into public.admins (id, role)
select id, 'owner'
from auth.users
where email = 'owner@example.com'
on conflict (id) do nothing;

-- Abort (and roll back everything) if no admin exists, so you can't lock yourself out.
do $$
begin
  if not exists (select 1 from public.admins) then
    raise exception 'No admin row found. Check the email in section 1.';
  end if;
end $$;

-- Nobody can claim ownership any more.
revoke execute on function public.claim_admin() from authenticated;

-- 2. RESTOCK WHEN AN ORDER IS CANCELLED ----------------------
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
    where oi.order_id = new.id and oi.item_id = i.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    -- Un-cancelling takes the stock back; fails if there isn't enough left.
    update public.items i
    set stock = i.stock - oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.item_id = i.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_stock_on_cancel() from public;

create trigger orders_sync_stock
  after update of status on public.orders
  for each row execute function public.sync_stock_on_cancel();

-- 3. COLOR DEFAULTS MATCH THE APP (green) --------------------
alter table public.settings alter column primary_color set default '#1d813e';
alter table public.settings alter column secondary_color set default '#50cc60';
alter table public.settings alter column accent_color set default '#96ee89';

-- 4. DASHBOARD STATS WITHOUT LOADING EVERY ORDER -------------
create or replace function public.admin_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_admin() then json_build_object(
    'sales_cents',     coalesce((select sum(total_cents) from public.orders where status <> 'cancelled'), 0),
    'order_count',     (select count(*) from public.orders),
    'new_count',       (select count(*) from public.orders where status = 'new'),
    'item_count',      (select count(*) from public.items),
    'low_stock_count', (select count(*) from public.items where stock between 1 and 4)
  ) end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

-- 5. REALTIME ------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;
