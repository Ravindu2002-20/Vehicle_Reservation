/**
 * Sync Prisma users to Supabase Auth so login works.
 * This script:
 * 1. Creates users in Supabase Auth for each Prisma user
 * 2. Links their supabase_id back to the Prisma record
 *
 * Run: npx tsx scripts/sync-users-to-supabase-auth.ts
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. Ensure SUPABASE_SERVICE_ROLE_KEY is in .env");
  console.log("Get it from: https://supabase.com/dashboard/project/avfkqynaftjpczomidxc/settings/api");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

async function findSupabaseUser(email: string) {
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users?.find((u: any) => u.email === email) || null;
}

async function main() {
  console.log("=== Syncing Prisma users to Supabase Auth ===\n");

  // Sync regular users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in Prisma`);

  for (const user of users) {
    const existing = await findSupabaseUser(user.email);

    if (existing) {
      console.log(`  ✓ ${user.email} exists in Supabase Auth (id: ${existing.id})`);
      // Link supabase_id if not already set
      if (!user.supabase_id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { supabase_id: existing.id },
        });
        console.log(`    → Linked supabase_id to user #${user.id}`);
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "123",
        email_confirm: true,
      });

      if (error) {
        console.error(`  ✗ Failed to create ${user.email}: ${error.message}`);
      } else {
        console.log(`  ✓ Created ${user.email} in Supabase Auth (id: ${data.user.id})`);
        await prisma.user.update({
          where: { id: user.id },
          data: { supabase_id: data.user.id },
        });
        console.log(`    → Linked supabase_id to user #${user.id}`);
      }
    }
  }

  // Sync admin users
  const admins = await prisma.admin.findMany();
  console.log(`\nFound ${admins.length} admins in Prisma`);

  for (const admin of admins) {
    const existing = await findSupabaseUser(admin.email);

    if (existing) {
      console.log(`  ✓ ${admin.email} exists in Supabase Auth (id: ${existing.id})`);
      if (!admin.supabase_id) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { supabase_id: existing.id },
        });
        console.log(`    → Linked supabase_id to admin #${admin.id}`);
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: "123",
        email_confirm: true,
      });

      if (error) {
        console.error(`  ✗ Failed to create ${admin.email}: ${error.message}`);
      } else {
        console.log(`  ✓ Created ${admin.email} in Supabase Auth (id: ${data.user.id})`);
        await prisma.admin.update({
          where: { id: admin.id },
          data: { supabase_id: data.user.id },
        });
        console.log(`    → Linked supabase_id to admin #${admin.id}`);
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("All users should now be able to log in with password '123'.");

  await prisma.$disconnect();
}

main().catch(console.error);