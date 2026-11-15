#!/usr/bin/env node
/**
 * Promote an existing account to shop owner using the service-role key.
 *
 * Usage:
 *   1. Copy .env.example to .env.local and fill in the Supabase values.
 *   2. Sign up the owner account in the app (or create it in the dashboard).
 *   3. Run: npm run seed:owner -- owner@example.com
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * The service-role key is server-only: never put it in a VITE_* variable
 * or commit it.
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
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  fail(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. " +
      "Copy .env.example to .env.local and fill in your Supabase credentials.",
  );
}

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  fail(
    "Pass the owner email: npm run seed:owner -- owner@example.com",
  );
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

async function main() {
  let user;
  try {
    user = await findUserByEmail(email);
  } catch (error) {
    fail(
      `Could not look up ${email}: ${error.message}. Check that the service-role key belongs to ${supabaseUrl}.`,
    );
  }

  if (!user) {
    fail(
      `No account found for ${email}. Sign up in the app first (or create the user in the Supabase dashboard), then run this again.`,
    );
  }

  if (!user.email_confirmed_at) {
    console.warn(
      `\n! ${email} has not confirmed its email yet. Confirm it in Supabase Auth before signing in.`,
    );
  }

  const { error } = await supabase
    .from("admins")
    .upsert({ id: user.id, role: "owner" }, { onConflict: "id" });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      fail(
        "The admins table is missing. Run supabase/migrations/0001_init.sql first.",
      );
    }
    fail(`Could not promote ${email}: ${error.message}`);
  }

  console.log(`\n✔ ${email} is now the shop owner.`);
  console.log("  Sign in at /admin/login.\n");
}

main().catch((error) => {
  if (!process.exitCode) {
    console.error(`\n✖ Could not seed the owner: ${error.message}\n`);
    process.exitCode = 1;
  }
});
