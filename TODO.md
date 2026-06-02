# TODO - AUTH BUG INVESTIGATION

- [ ] Step 1: Add temporary cookie/session logging to:
  - src/middleware.ts
  - src/lib/supabase/server.ts (cookieStore.getAll)
  - src/lib/current-user.ts (supabase.auth.getUser user)
- [ ] Step 2: Fix LoginPage redirect timing:
  - src/app/LoginPage.tsx
  - Wait for signInWithPassword to finish
  - Call await supabase.auth.getSession() before router.push("/dashboard")
  - Add LOGIN DATA / LOGIN ERROR logs as requested
- [ ] Step 3: Improve/verify createServerClient cookie adapter in src/lib/supabase/server.ts:
  - Ensure cookies are read/written in the exact shape expected by @supabase/ssr
  - Ensure setAll/remove use correct options (path/httpOnly/sameSite/secure/maxAge)
- [ ] Step 4: Verify middleware cookie refresh behavior:
  - src/middleware.ts
  - Add request cookie logging and ensure setAll persists cookies via NextResponse.cookies
- [ ] Step 5: Verify mixing approaches:
  - Search src for @supabase/auth-helpers-nextjs usage (ensure only @supabase/ssr is used)
- [ ] Step 6: Run app flow + validate DevTools cookies exist and server logs show them
