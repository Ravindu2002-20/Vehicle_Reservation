/**
 * Sync Prisma users to Supabase Auth so login works.
 * This script:
 * 1. Creates users in Supabase Auth for each Prisma user
 * 2. Links their supabase_id back to the Prisma record
 *
 * Run: npx tsx scripts/sync-users-to-supabase-auth.ts
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env into process.env if present (avoid adding dotenv dependency)
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
      if (!match) continue;

      let [, key, val] = match;
      if (!val) val = "";

      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // Ignore env loading issues and fall back to existing process.env values.
}

import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. Ensure SUPABASE_SERVICE_ROLE_KEY is in .env");
  console.log(
    "Get it from: https://supabase.com/dashboard/project/avfkqynaftjpczomidxc/settings/api"
  );
  process.exit(1);
}

// Diagnostic: mask service key so user can verify it's loaded (no full secret printed)
const masked = `${supabaseServiceKey.slice(0, 6)}...${supabaseServiceKey.slice(-6)}`;
console.log(`Using SUPABASE_URL=${supabaseUrl}`);
console.log(`Loaded SUPABASE_SERVICE_ROLE_KEY length=${supabaseServiceKey.length} masked=${masked}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

type AuthUser = {
  id: string;
  email: string | null;
};

async function findSupabaseUser(email: string, authUsers: AuthUser[]) {
  return authUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function listAllAuthUsers(): Promise<AuthUser[]> {
  const users: AuthUser[] = [];
  const perPage = 100;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Supabase listUsers failed: ${error.message}`);
    }

    const batch = (data?.users ?? []) as AuthUser[];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

async function main() {
  console.log("=== Syncing Prisma users to Supabase Auth ===\n");

  const authUsers = await listAllAuthUsers();

  // Sync regular users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in Prisma`);

  for (const user of users) {
    const existing = await findSupabaseUser(user.email, authUsers);

    if (existing) {
      console.log(`  [ok] ${user.email} exists in Supabase Auth (id: ${existing.id})`);
      // Link supabase_id if not already set
      if (!user.supabase_id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { supabase_id: existing.id },
        });
        console.log(`    [link] Linked supabase_id to user #${user.id}`);
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "123",
        email_confirm: true,
      });

      if (error) {
        console.error(`  [err] Failed to create ${user.email}: ${error.message}`);
      } else {
        console.log(`  [create] Created ${user.email} in Supabase Auth (id: ${data.user.id})`);
        await prisma.user.update({
          where: { id: user.id },
          data: { supabase_id: data.user.id },
        });
        console.log(`    [link] Linked supabase_id to user #${user.id}`);
      }
    }
  }

  // Sync admin users
  const admins = await prisma.admin.findMany();
  console.log(`\nFound ${admins.length} admins in Prisma`);

  for (const admin of admins) {
    const existing = await findSupabaseUser(admin.email, authUsers);

    if (existing) {
      console.log(`  [ok] ${admin.email} exists in Supabase Auth (id: ${existing.id})`);
      if (!admin.supabase_id) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { supabase_id: existing.id },
        });
        console.log(`    [link] Linked supabase_id to admin #${admin.id}`);
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: "123",
        email_confirm: true,
      });

      if (error) {
        console.error(`  [err] Failed to create ${admin.email}: ${error.message}`);
      } else {
        console.log(`  [create] Created ${admin.email} in Supabase Auth (id: ${data.user.id})`);
        await prisma.admin.update({
          where: { id: admin.id },
          data: { supabase_id: data.user.id },
        });
        console.log(`    [link] Linked supabase_id to admin #${admin.id}`);
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("All users should now be able to log in with password '123'.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
