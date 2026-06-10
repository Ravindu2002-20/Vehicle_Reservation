/**
 * Diagnostic script to check Supabase Auth state and Prisma user linking.
 * Run: npx tsx scripts/check-auth.ts
 */
import fs from "fs";
import path from "path";

// Load .env into process.env if present (same pattern as sync-users-to-supabase-auth.ts)
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
      if (!match) continue;

      let [, key, val] = match;
      if (!val) val = "";
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // ignore
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars. Make sure .env is loaded.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== Supabase Auth Diagnostic ===\n");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${(supabaseAnonKey as string).substring(0, 20)}...\n`);

  // Try to get current session (will be null in CLI, but checks connectivity)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Session error:", sessionError.message);
  } else {
    console.log("Session check:", sessionData.session ? "Active" : "No active session (expected in CLI)");
  }

  console.log("\nTo check Supabase Auth users:");
  console.log("1. Go to: https://supabase.com/dashboard/project/avfkqynaftjpczomidxc");
  console.log("2. Navigate to: Authentication -> Users");
  console.log("3. Verify your test user exists with email + password");
  console.log("4. If missing, click 'Invite user' or 'Add user' to create one\n");

  console.log("=== Prisma Connection Check ===");
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const userCount = await prisma.user.count();
    const adminCount = await prisma.admin.count();

    console.log(`Users in Prisma: ${userCount}`);
    console.log(`Admins in Prisma: ${adminCount}`);

    if (userCount > 0) {
      const sampleUsers = await prisma.user.findMany({
        take: 3,
        select: { id: true, email: true, full_name: true, user_type: true },
      });
      console.log("\nSample Prisma users:");
      sampleUsers.forEach((u) => console.log(`  - ${u.full_name} (${u.email}) [${u.user_type}]`));
    }
    if (adminCount > 0) {
      const sampleAdmins = await prisma.admin.findMany({
        take: 3,
        select: { id: true, email: true, full_name: true, admin_role: true },
      });
      console.log("\nSample Prisma admins:");
      sampleAdmins.forEach((a) => console.log(`  - ${a.full_name} (${a.email}) [${a.admin_role}]`));
    }

    await prisma.$disconnect();
  } catch (e) {
    console.error("Prisma error (expected if DATABASE_URL is not reachable):", (e as Error).message);
  }
}

main().catch(console.error);
