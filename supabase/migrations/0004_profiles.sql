-- ============================================================
-- iShopHere — customer profiles: one account with email + phone
-- Run after 0001_init.sql. Safe to run before or after 0003.
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_length check (
    name is null or char_length(btrim(name)) between 2 and 120
  ),
  constraint profiles_email_format check (
    email is null or (email = lower(email) and position('@' in email) > 1)
  ),
  constraint profiles_phone_format check (
    phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'
  )
);

comment on column public.profiles.email is
  'Real customer email. Null for phone-only accounts until an email is added.';
comment on column public.profiles.phone is
  'Full E.164 phone string, e.g. +966501234567.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Customers may only edit their own name and phone. Email is written by the
-- account-auth Edge Function (service role) so it stays in sync with auth.users.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, name, phone) on public.profiles to authenticated;
grant update (name, phone) on public.profiles to authenticated;

-- Create a profile for every new auth user.
-- Phone-only accounts use an internal auth email; it is not a customer email.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := nullif(btrim(coalesce(new.email, '')), '');
  v_phone text := coalesce(
    nullif(btrim(coalesce(new.phone, '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'phone', '')), '')
  );
  v_name text := nullif(btrim(coalesce(new.raw_user_meta_data->>'name', '')), '');
begin
  if v_email is not null and lower(v_email) like '%@internal.ishophere.app' then
    v_email := null;
  end if;

  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{6,14}$' then
    v_phone := null;
  end if;

  if v_name is not null and (char_length(v_name) < 2 or char_length(v_name) > 120) then
    v_name := null;
  end if;

  insert into public.profiles (id, name, email, phone)
  values (new.id, v_name, lower(v_email), v_phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Backfill existing auth users, including legacy native phone accounts.
insert into public.profiles (id, name, email, phone)
select candidate.id, candidate.name, candidate.email, candidate.phone
from (
  select
    u.id,
    case
      when char_length(btrim(coalesce(u.raw_user_meta_data->>'name', ''))) between 2 and 120
        then btrim(u.raw_user_meta_data->>'name')
      else null
    end as name,
    case
      when u.email is null then null
      when lower(u.email) like '%@internal.ishophere.app' then null
      else lower(u.email)
    end as email,
    case
      when u.phone ~ '^\+[1-9][0-9]{6,14}$' then u.phone
      when btrim(coalesce(u.raw_user_meta_data->>'phone', '')) ~ '^\+[1-9][0-9]{6,14}$'
        then btrim(u.raw_user_meta_data->>'phone')
      else null
    end as phone
  from auth.users u
) candidate
where candidate.phone is null
   or not exists (
     select 1 from public.profiles p where p.phone = candidate.phone
   )
on conflict (id) do nothing;

-- Friendly signup check. The unique constraint remains the real guard.
create or replace function public.is_phone_available(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_phone is not null
    and p_phone ~ '^\+[1-9][0-9]{6,14}$'
    and not exists (
      select 1 from public.profiles p where p.phone = p_phone
    );
$$;

revoke all on function public.is_phone_available(text) from public;
grant execute on function public.is_phone_available(text) to anon, authenticated;

-- Keep ownership restricted to real email accounts.
create or replace function public.claim_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  if v_email is null or v_email like '%@internal.ishophere.app' then
    raise exception 'Admin access requires a real email address';
  end if;

  perform pg_advisory_xact_lock(781043001);

  if exists (select 1 from public.admins) then
    return exists (select 1 from public.admins where id = v_uid);
  end if;

  insert into public.admins (id, role) values (v_uid, 'owner');
  return true;
end;
$$;
