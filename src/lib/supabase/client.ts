import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helpful diagnostics during startup (won't reveal secret values)
console.log(
  "[supabase] NEXT_PUBLIC_SUPABASE_URL:",
  supabaseUrl ? "FOUND" : "MISSING"
);
console.log(
  "[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  supabaseAnonKey ? "FOUND" : "MISSING"
);

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);