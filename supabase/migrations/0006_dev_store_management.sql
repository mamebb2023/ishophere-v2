-- ============================================================
-- iShopHere — dev store slug changes and store deletion
-- Run after 0005_lock_down_updates.sql.
--
-- The dev console can move a store to a new public address or delete it
-- entirely. Both functions are SECURITY DEFINER so they validate the caller
-- first and remove child rows in the right order.
-- ============================================================

create or replace function public.update_store_slug(
  p_store_id uuid,
  p_slug text
)
returns public.stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_store public.stores;
begin
  if not public.is_dev() then
    raise exception 'Only the platform owner can change a store slug';
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

  select *
    into v_store
  from public.stores s
  where s.id = p_store_id;

  if not found then
    raise exception 'Store not found';
  end if;

  if v_store.slug = v_slug then
    return v_store;
  end if;

  update public.stores
  set slug = v_slug
  where id = p_store_id
  returning * into v_store;

  return v_store;
exception
  when unique_violation then
    raise exception 'That store slug is already taken';
end;
$$;

revoke all on function public.update_store_slug(uuid, text) from public;
grant execute on function public.update_store_slug(uuid, text) to authenticated;

create or replace function public.delete_store(p_store_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_dev() then
    raise exception 'Only the platform owner can delete stores';
  end if;

  -- Lock the store row so a checkout cannot add orders while it is removed.
  perform 1
  from public.stores s
  where s.id = p_store_id
  for update;

  if not found then
    raise exception 'Store not found';
  end if;

  -- order_items.item_id is ON DELETE RESTRICT so removing a normal item keeps
  -- order history. Remove the store's order history first, then the store
  -- cascade can remove items, categories, members, carts, and notifications.
  delete from public.order_items
  where order_id in (
    select o.id
    from public.orders o
    where o.store_id = p_store_id
  );

  delete from public.orders
  where store_id = p_store_id;

  delete from public.stores
  where id = p_store_id;
end;
$$;

revoke all on function public.delete_store(uuid) from public;
grant execute on function public.delete_store(uuid) to authenticated;

notify pgrst, 'reload schema';
