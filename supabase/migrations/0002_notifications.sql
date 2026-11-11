-- ============================================================
-- iShopHere — notifications
-- Run after 0001_init.sql
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  type text not null check (type in ('order_placed', 'order_status')),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Row Level Security still decides which rows are visible; these grants only
-- let signed-in users select/update rows once RLS allows it.
grant select, update on table public.notifications to authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Notify every admin when a new order is placed.
create or replace function public.notify_admins_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, order_id, type, title, body)
  select
    a.id,
    new.id,
    'order_placed',
    'New order #' || upper(left(new.id::text, 8)),
    new.customer_name || ' · ' || new.customer_phone
  from public.admins a
  where a.id is distinct from new.user_id;
  return new;
end;
$$;

revoke all on function public.notify_admins_new_order() from public;

create trigger orders_notify_admins
  after insert on public.orders
  for each row execute function public.notify_admins_new_order();

-- Notify the customer when an order status changes.
create or replace function public.notify_customer_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and new.status is distinct from old.status then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (
      new.user_id,
      new.id,
      'order_status',
      'Order #' || upper(left(new.id::text, 8)) || ' is ' || new.status,
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
