-- ============================================================
-- Tofik Store — push notification device tokens
-- Run after 0007_rename-internal-email-domain.sql.
--
-- Stores FCM device tokens so the send-push Edge Function can
-- deliver native notifications when rows are inserted into
-- public.notifications.
-- ============================================================

create extension if not exists pg_net;

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android' check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_tokens_user_token_key unique (user_id, token)
);

create index device_tokens_user_idx on public.device_tokens (user_id);
create index device_tokens_token_idx on public.device_tokens (token);

alter table public.device_tokens enable row level security;

-- Users can only see and manage their own device tokens.
create policy device_tokens_select_own on public.device_tokens
  for select to authenticated using (user_id = auth.uid());

create policy device_tokens_insert_own on public.device_tokens
  for insert to authenticated with check (user_id = auth.uid());

create policy device_tokens_delete_own on public.device_tokens
  for delete to authenticated using (user_id = auth.uid());

-- Tokens are inserted (idempotently) and deleted; no update grant is needed.
grant select, insert, delete on table public.device_tokens to authenticated;

-- ============================================================
-- Dispatch push notifications on new in-app notifications
-- ============================================================
-- Calls the send-push Edge Function with the inserted row so it can
-- fan out FCM messages to the user's devices. pg_net is async, so a
-- slow or failed dispatch never blocks or rolls back the insert.
--
-- One manual step after applying: store the shared secret used by the
-- function in public.app_config (keep it in sync with the
-- PUSH_INTERNAL_SECRET Edge Function secret):
--
--   insert into public.app_config (key, value) values ('send_push_secret', '<secret>')
--   on conflict (key) do update set value = excluded.value;
--
-- Do NOT use `alter database postgres set app.send_push_secret` — Supabase
-- denies setting custom GUCs (42501) even for project owners.

create or replace function public.dispatch_push_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://vupxaswkpdkhydztxosh.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select value from public.app_config where key = 'send_push_secret'),
        ''
      )
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'title', new.title,
      'body', new.body,
      'orderId', new.order_id,
      'type', new.type
    )
  );
  return new;
end;
$$;

revoke all on function public.dispatch_push_notification() from public;

create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row execute function public.dispatch_push_notification();
