import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  console.log("[server cookies]", cookieStore.getAll());

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const all = cookieStore.getAll();
          const found = all.find((c) => c.name === name);
          return found?.value;
        },
        set(name, value, options) {
          cookieStore.set({
            name,
            value,
            path: options?.path ?? "/",
            httpOnly: options?.httpOnly ?? true,
            sameSite: options?.sameSite,
            secure: options?.secure,
            maxAge: options?.maxAge,
          });
        },
        remove(name) {
          cookieStore.set({
            name,
            value: "",
            path: "/",
            httpOnly: true,
            maxAge: 0,
          });
        },
      },
    }
  );
}



