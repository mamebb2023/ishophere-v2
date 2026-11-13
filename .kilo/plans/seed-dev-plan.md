# Seed Development Plan

## Diagnosis

The `npm run seed:dev` command fails because:

1. **Missing `.env.seed.local` file** - The seed script (`scripts/seed-dev.mjs`) expects a `.env.seed.local` file containing Supabase credentials. This file is derived from `.env.seed.example` but does not exist yet.

2. **Required environment variables** - The seed script needs:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-only, never expose in browser)
   - Optionally `SEED_ALLOW_REMOTE=true` if seeding a remote Supabase project (blocked by default due to known default password)

3. **Script flow** (from `seed-dev.mjs`):
   - Loads `.env.local` first, then `.env.seed.example` as fallback
   - Validates `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist
   - Blocks remote seeding by default (safety measure for default password)
   - Creates/updates dev user (`admin@store.com` / `12345678`)
   - Creates demo store with slug `demo`
   - Assigns dev role and owner membership

## Required Fixes

### 1. Copy `.env.seed.example` to `.env.seed.local`

```bash
cp .env.seed.example .env.seed.local
```

### 2. Fill in the `.env.seed.local` file

Edit `.env.seed.local` and replace the placeholder values:

```
SUPABASE_URL=your-supabase-project-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Optional: allow remote seeding if not using local Supabase
SEED_ALLOW_REMOTE=true
```

### 3. Ensure Supabase migration is run

The seed script references `supabase/migrations/0004_multi_store.sql`. Ensure this migration has been applied to your Supabase project, as it creates the `stores`, `store_members`, and `platform_roles` tables needed by the seed.

### 4. Run the seed

```bash
npm run seed:dev
```

## Verification

After successful seeding, you should see:

```
✔ Dev account ready: admin@store.com
✔ Global role: dev
✔ Demo store: Demo Store (/s/demo)
✔ Owner membership: Platform Owner

Sign in at /admin/login or open /dev after starting the app.
```

## Notes

- The seed uses a **known default password** (`12345678`) intended for local development only
- Remote seeding is blocked by default (`SEED_ALLOW_REMOTE=false`) for security
- The service-role key has full admin access - never commit `.env.seed.local` to version control
- After seeding, you can sign in at `/admin/login` or access dev tools at `/dev`