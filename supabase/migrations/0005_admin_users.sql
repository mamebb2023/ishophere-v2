-- ============================================================
-- Tofik Store — admin user directory
-- Run after 0004_profiles.sql.
-- ============================================================

create index if not exists profiles_created_idx
  on public.profiles (created_at desc);

-- Admin-only list of every shop account with order totals.
-- Non-admin callers get an empty result, never another customer's details.
create or replace function public.admin_users()
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  created_at timestamptz,
  order_count bigint,
  total_spent_cents bigint,
  last_order_at timestamptz,
  is_admin boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.email,
    p.phone,
    p.created_at,
    coalesce(o.order_count, 0) as order_count,
    coalesce(o.total_spent_cents, 0) as total_spent_cents,
    o.last_order_at,
    exists (select 1 from public.admins a where a.id = p.id) as is_admin
  from public.profiles p
  left join (
    select
      ord.user_id,
      count(*) as order_count,
      coalesce(
        sum(ord.total_cents) filter (where ord.status <> 'cancelled'),
        0
      ) as total_spent_cents,
      max(ord.created_at) as last_order_at
    from public.orders ord
    where ord.user_id is not null
    group by ord.user_id
  ) o on o.user_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

revoke all on function public.admin_users() from public;
grant execute on function public.admin_users() to authenticated;
