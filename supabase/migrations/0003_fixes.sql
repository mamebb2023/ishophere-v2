-- ============================================================
-- iShopHere — fixes: restock on cancel, color defaults,
-- dashboard stats, realtime
-- Run after 0002_notifications.sql.
-- The legacy owner lock-down was removed for the multi-store reset.
-- ============================================================

-- 1. RESTOCK WHEN AN ORDER IS CANCELLED ----------------------
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

-- 2. COLOR DEFAULTS MATCH THE APP (green) --------------------
alter table public.settings alter column primary_color set default '#1d813e';
alter table public.settings alter column secondary_color set default '#50cc60';
alter table public.settings alter column accent_color set default '#96ee89';

-- 3. DASHBOARD STATS WITHOUT LOADING EVERY ORDER -------------
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

-- 4. REALTIME ------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;
