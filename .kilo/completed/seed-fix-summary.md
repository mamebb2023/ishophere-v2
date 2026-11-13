## Seed Script Fixed - Now Uses .env.local Only

**Changes to `scripts/seed-dev.mjs`:**
- Now reads environment variables from `.env.local` only (removed `.env.seed.local` dependency)
- Falls back to `VITE_SUPABASE_URL` if `SUPABASE_URL` not set
- Requires `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
- Updated `SEED_ALLOW_REMOTE` check to use `env.SEED_ALLOW_REMOTE`
- Updated all dev credential reads to use `env.` prefix
- Updated usage documentation

**Changes to `.env.local`:**
- Added `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables
- Added `SEED_ALLOW_REMOTE=true` (required for remote projects)
- Kept all existing SEED_* variables

**Usage:**
1. Ensure `.env.local` has your Supabase credentials + `SUPABASE_SERVICE_ROLE_KEY` + `SEED_ALLOW_REMOTE=true`
2. Run: `npm run seed:dev`

The script now works with a single `.env.local` file instead of requiring a separate `.env.seed.local`.