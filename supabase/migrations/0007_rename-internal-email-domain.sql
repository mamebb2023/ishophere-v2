-- ============================================================
-- Tofik Store — rename internal email domain for phone-only accounts
-- internal.ishophere.app → internal.tofik.store
-- Run after 0006_item_image_size_limit.sql.
-- ============================================================

-- Backfill existing phone-only accounts so internal email matching keeps working.
update auth.users
set email = replace(email, '@internal.ishophere.app', '@internal.tofik.store')
where email like '%@internal.ishophere.app';

update public.profiles
set email = replace(email, '@internal.ishophere.app', '@internal.tofik.store')
where email like '%@internal.ishophere.app';

-- GoTrue copies the email into the user metadata and identity row at signup.
-- Keep both in sync so email changes and account recovery see one address.
update auth.users
set raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{email}',
  to_jsonb(
    replace(
      raw_user_meta_data->>'email',
      '@internal.ishophere.app',
      '@internal.tofik.store'
    )
  ),
  true
)
where raw_user_meta_data->>'email' like '%@internal.ishophere.app';

update auth.identities
set identity_data = jsonb_set(
  identity_data,
  '{email}',
  to_jsonb(
    replace(
      identity_data->>'email',
      '@internal.ishophere.app',
      '@internal.tofik.store'
    )
  ),
  true
)
where identity_data->>'email' like '%@internal.ishophere.app';

-- Update the trigger that strips internal emails on new phone-only accounts.
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
  if v_email is not null and lower(v_email) like '%@internal.tofik.store' then
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

-- Update the admin claim check to the new internal domain.
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
  if v_email is null or v_email like '%@internal.tofik.store' then
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
