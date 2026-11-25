-- ============================================================
-- Tofik Store — push hardening and deleted-account privacy
-- Run after 0008_device_tokens.sql.
-- ============================================================

-- 1. app_config ------------------------------------------------
-- Migration 0008 reads the push secret from this table but never created it.
-- RLS is on with no policies and all client grants are revoked, so only the
-- service role and SECURITY DEFINER functions can read it.
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
revoke all on table public.app_config from anon, authenticated;

-- 2. Push dispatch can never block a write ----------------------
-- Without this, any failure here (missing table, missing pg_net, network
-- setup) rolls back the notifications insert and with it place_order().
-- It also skips quietly until the secret has been stored.
create or replace function public.dispatch_push_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  begin
    select c.value into v_secret
    from public.app_config c
    where c.key = 'send_push_secret';

    if v_secret is null or btrim(v_secret) = '' then
      return new;
    end if;

    perform net.http_post(
      url := 'https://vupxaswkpdkhydztxosh.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secret
      ),
      body := jsonb_build_object(
        'userId', new.user_id,
        'title', new.title,
        'body', new.body,
        'orderId', new.order_id,
        'type', new.type
      )
    );
  exception when others then
    raise warning 'dispatch_push_notification failed: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.dispatch_push_notification() from public;

-- 3. Deleted accounts lose their personal details on orders ------
-- Deleting an auth user only sets orders.user_id to null, which left the
-- customer's name, phone and address on every order. Scrub them in the same
-- transaction as the delete, whichever way the account is removed.
create or replace function public.anonymize_orders_on_user_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set customer_name = 'Deleted customer',
      customer_phone = 'deleted',
      customer_address = null
  where user_id = old.id;
  return old;
end;
$$;

revoke all on function public.anonymize_orders_on_user_delete() from public;

drop trigger if exists on_auth_user_deleted_anonymize_orders on auth.users;
create trigger on_auth_user_deleted_anonymize_orders
  before delete on auth.users
  for each row execute function public.anonymize_orders_on_user_delete();

-- Backfill: orders already detached from a deleted account.
update public.orders
set customer_name = 'Deleted customer',
    customer_phone = 'deleted',
    customer_address = null
where user_id is null
  and (
    customer_name <> 'Deleted customer'
    or customer_phone <> 'deleted'
    or customer_address is not null
  );
