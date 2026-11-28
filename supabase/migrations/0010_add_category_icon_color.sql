-- ============================================================
-- Tofik Store — category icon and color
-- Run after 0009_push_and_privacy_fixes.sql.
-- ============================================================

-- 1. Add icon and color to categories --------------------------
-- icon: lucide-react icon name rendered beside the category name
-- color: hex color used for the icon/badge background
alter table public.categories
  add column if not exists icon text not null default 'FolderTree';

alter table public.categories
  add column if not exists color text not null default '#1e5b3a';

-- Backfill any existing rows explicitly (defensive).
update public.categories
set icon = 'FolderTree',
    color = '#1e5b3a'
where icon is null or color is null;
