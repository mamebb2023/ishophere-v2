## Seed Development - Issue Fixed

**Problem:** `npm run seed:dev` failed with "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

**Solution:**
1. Created `.env.seed.local` from `.env.seed.example` template
2. File contains placeholder values for Supabase credentials
3. User must replace placeholders with actual Supabase project values
4. `.gitignore` excludes `*.local` files - won't be committed

**Required user actions:**
- Edit `.env.seed.local` with actual Supabase URL and service role key
- Set `SEED_ALLOW_REMOTE=true` if not using local Supabase
- Ensure migration `0004_multi_store.sql` is applied to Supabase
- Run `npm run seed:dev`

**File locations:**
- `.env.seed.example` - template (committed to repo)
- `.env.seed.local` - created local config (gitignored)