/**
 * Check how many users exist in Supabase Auth.
 * Run: npx tsx scripts/check-supabase-users.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. Make sure .env file exists in project root.");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "SET" : "MISSING");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error:", error.message);
    return;
  }
  console.log("Supabase Auth users count:", data?.users?.length || 0);
  data?.users?.forEach((u) =>
    console.log("  -", u.email, "(id:", u.id, ")")
  );
}

main().catch(console.error);