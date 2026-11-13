#!/usr/bin/env node
/**
 * Seed the iShopHere platform owner and demo store.
 *
 * Usage:
 *   1. Copy .env.example to .env.local
 *   2. Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 *   3. Also add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local (service-role key is server-only)
 *   4. Run: npm run seed:dev
 *
 * This script uses the service-role key on the server only. Never expose it
 * through Vite or commit the .env.local file.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

function loadEnvFile(fileName) {
  const path = resolve(ROOT, fileName);
  if (!existsSync(path)) return {};

  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separator = normalized.indexOf("=");
    if (separator === -1) continue;

    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const env = loadEnvFile(".env.local");

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  fail(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. " +
    "Copy .env.example to .env.local and fill in your Supabase credentials. " +
    "Also add SUPABASE_SERVICE_ROLE_KEY (server-only key) to .env.local.",
  );
}

const isLocalUrl =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(supabaseUrl);
if (!isLocalUrl && env.SEED_ALLOW_REMOTE !== "true") {
  fail(
    "This looks like a remote Supabase project. The seed uses a known default password, so remote seeding is blocked. " +
    "Set SEED_ALLOW_REMOTE=true in .env.local only if you really intend to seed this project.",
  );
}

const email = (env.SEED_DEV_EMAIL || "admin@store.com")
  .trim()
  .toLowerCase();
const password = env.SEED_DEV_PASSWORD || "12345678";
const ownerName = (env.SEED_DEV_NAME || "Platform Owner").trim();
const storeSlug = (env.SEED_DEV_STORE_SLUG || "demo").trim();
const storeName = (env.SEED_DEV_STORE_NAME || "Demo Store").trim();
const storeDescription = (
  env.SEED_DEV_STORE_DESCRIPTION ||
  "A sample storefront for exploring the iShopHere platform."
).trim();

if (password.length < 6) {
  fail("SEED_DEV_PASSWORD must be at least 6 characters.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail) {
  const perPage = 1000;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === targetEmail,
    );
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function ensureDevUser() {
  const existing = await findUserByEmail(email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          full_name: ownerName,
        },
      },
    );
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: ownerName },
  });
  if (error) throw error;
  return data.user;
}

async function ensureDefaultStore() {
  const { data: existing, error: selectError } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", storeSlug)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: storeName,
      slug: storeSlug,
      description: storeDescription,
    })
    .select("*")
    .single();

  if (error) {
    // A concurrent seed may have created it between the select and insert.
    if (error.code === "23505") {
      const { data: raced, error: racedError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storeSlug)
        .single();
      if (racedError) throw racedError;
      return raced;
    }
    throw error;
  }

  return data;
}

async function main() {
  console.log(`\nSeeding iShopHere dev account: ${email}`);

  let user;
  try {
    user = await ensureDevUser();
  } catch (error) {
    fail(
      `Could not create or update the dev account: ${error.message}. Check that the service-role key is correct.`,
    );
  }

  const { error: roleError } = await supabase
    .from("platform_roles")
    .upsert({ user_id: user.id, role: "dev" }, { onConflict: "user_id" });

  if (roleError) {
    fail(
      `Could not assign the dev role: ${roleError.message}. Run supabase/migrations/0004_multi_store.sql first.`,
    );
  }

  let store;
  try {
    store = await ensureDefaultStore();
  } catch (error) {
    fail(
      `Could not ensure the demo store: ${error.message}. Run supabase/migrations/0004_multi_store.sql first.`,
    );
  }

  const { error: memberError } = await supabase.from("store_members").upsert(
    {
      store_id: store.id,
      user_id: user.id,
      role: "owner",
      display_name: ownerName,
    },
    { onConflict: "store_id,user_id" },
  );

  if (memberError) {
    fail(
      `Could not attach the dev account to the demo store: ${memberError.message}`,
    );
  }

  console.log(`✔ Dev account ready: ${user.email}`);
  console.log(`✔ Global role: dev`);
  console.log(`✔ Demo store: ${store.name} (/s/${store.slug})`);
  console.log(`✔ Owner membership: ${ownerName}`);
  console.log(
    "\nSign in at /admin/login or open /dev after starting the app.\n",
  );
}

main().catch((error) => {
  if (!process.exitCode) {
    console.error(`\n✖ Seed failed: ${error.message}\n`);
    process.exitCode = 1;
  }
});
