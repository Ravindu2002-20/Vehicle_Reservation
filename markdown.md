# Supabase Auth Integration (Vehicle Reservation System)

> This document describes how authentication/authorization is implemented using **Supabase Auth** + **Prisma** (app DB) + **role mapping**, and lists the auth-related code paths present in this repository.

---

## 1) What is the app using for authentication?

### Supabase Auth (SSO-like email+password auth)
- Client login uses `supabase.auth.signInWithPassword()`.
- Auth session is stored in cookies (handled by `@supabase/ssr` helpers).
- Server-side code uses `supabase.auth.getUser()` to determine the signed-in user.

### Prisma database (authoritative role/profile data)
- After Supabase Auth returns the user email, the app looks up that email in **Prisma** tables:
  - `User` table for students/lecturers/etc
  - `Admin` table for deputy/dean/senior-officer/etc

### Role mapping (Supabase → Prisma)
- The Supabase identity is only used to confirm that a user is authenticated.
- The app’s **role** and **department** come from Prisma.

---

## 2) Repo code overview (auth/session entry points)

### Middleware refresh (cookie/session upkeep)
**File:** `src/middleware.ts`

Key logic:
```ts
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: This refreshes the auth session
  const { data: { user } } = await supabase.auth.getUser();
  return supabaseResponse;
}
```

**Why it matters:**
- Ensures Supabase session is refreshed for incoming requests.
- Without this, SSR/server routes may observe stale/expired session cookies.

---

## 3) Supabase client utilities

### Server-side Supabase client (cookie-aware)
**File:** `src/lib/supabase/server.ts`

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value) {
          cookieStore.set({ name, value, path: "/", httpOnly: true });
        },
        remove(name) {
          cookieStore.set({ name, value: "", path: "/", httpOnly: true, maxAge: 0 });
        },
      },
    }
  );
}
```

### Browser/client Supabase instance (used for login)
**File:** `src/lib/supabase/client.ts`

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 4) Unified current-user resolver (Supabase user → Prisma role)

**File:** `src/lib/current-user.ts`

### Supported roles
```ts
export type UnifiedRoleType =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";
```

### Authentication flow implemented
1. Create cookie-aware Supabase server client.
2. Call `supabase.auth.getUser()`.
3. If no user/email → return `null`.
4. Look up user by email in Prisma:
   - try `prisma.user.findUnique({ where: { email } })`
   - else try `prisma.admin.findUnique({ where: { email } })`
5. Extract role:
   - student role from `user.user_type`
   - admin role from `admin.admin_role`
6. Validate role against `VALID_ROLES`.

Key call site:
```ts
const supabase = createSupabaseServerClient();
const { data: { user }, error } = await supabase.auth.getUser();
```

---

## 5) “Me” and logout API routes (used by frontend)

### Get current auth info
**File:** `src/app/api/auth/me/route.ts`

Returns:
- `401` if unauthenticated
- otherwise: `{ data: { id, email, role, type, department_id } }`

```ts
const authUser = await getCurrentUser();
if (!authUser) {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

return NextResponse.json({
  data: {
    id: authUser.id,
    email: authUser.email,
    role: authUser.role,
    type: authUser.type,
    department_id: authUser.department_id,
  },
});
```

### Logout
**File:** `src/app/api/auth/logout/route.ts`

```ts
const supabase = createSupabaseServerClient();
await supabase.auth.signOut();
return NextResponse.json({ status: 200, message: "Logged out" });
```

---

## 6) Frontend session handling (client-side)

**File:** `src/lib/session.ts`

This is a `use client` hook that calls `/api/auth/me`.

```ts
const res = await fetch("/api/auth/me", { method: "GET" });
if (!res.ok) {
  setUser(null);
  setError(payload?.error ?? "Unauthorized");
  return;
}
setUser(payload?.data ?? null);
```

**Important:**
- The repository does not rely on localStorage auth state.
- Identity comes from Supabase cookies via server endpoints (`/api/auth/me`).

---

## 7) Login page (Supabase auth sign-in)

**File:** `src/app/LoginPage.tsx`

On form submit:
```ts
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

On success:
- `router.push("/dashboard")`

---

## 8) Route protection / auth-check behavior

### Client home gate
**File:** `src/app/page.tsx`

- Calls `/api/auth/me`.
- If ok → redirect to `/dashboard`.
- If not → show the login page.

### Dashboard role loading
**File:** `src/app/dashboard/page.tsx`

- Calls `/api/auth/me` and reads `payload.data.role`.
- Normalizes role strings.
- If unauthenticated/invalid → push `/login`.

---

## 9) Other API routes that require authentication

Most API routes call `getCurrentUser()` from `src/lib/current-user.ts`.

Examples:

### Messages inbox
**File:** `src/app/api/messages/inbox/route.ts`
```ts
const authUser = await getCurrentUser();
if (!authUser) return 401;
```

### Stats
**File:** `src/app/api/stats/route.ts`
```ts
const authUser = await getCurrentUser();
if (!authUser) return 401;
```

### Profile
**File:** `src/app/api/profile/route.ts`
- GET returns profile from Prisma
- PATCH restricts to `authUser.type === "user"`

---

## 10) Auth available in existing codes (explicit listing)

### Supabase Auth methods used
- `supabase.auth.signInWithPassword()` (login UI)
  - `src/app/LoginPage.tsx`
- `supabase.auth.getUser()` (server: middleware + current-user + auth check)
  - `src/middleware.ts`
  - `src/lib/current-user.ts`
- `supabase.auth.signOut()` (logout route)
  - `src/app/api/auth/logout/route.ts`

### Supabase Admin Auth (server scripts)
These scripts use **service role key** and admin APIs to create/list users.

#### List users
- `supabase.auth.admin.listUsers()`
  - `scripts/check-supabase-users.ts`
  - `scripts/sync-users-to-supabase-auth.ts`

#### Create users
- `supabase.auth.admin.createUser()`
  - `scripts/sync-users-to-supabase-auth.ts`
  - `prisma/seed.ts`

---

## 11) Supabase user provisioning (seeding + sync scripts)

### Seed script
**File:** `prisma/seed.ts`

Behavior:
- Creates faculties/departments/users/admins/drivers/vehicles in Prisma.
- Creates corresponding **Supabase Auth accounts** for each created Prisma user/admin.
- Uses `password: "123"` for test accounts.

Key snippet:
```ts
const { data: newUser, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
```

Then it stores the returned Supabase Auth user id into Prisma fields (e.g. `supabase_id`).

### Sync Prisma → Supabase Auth
**File:** `scripts/sync-users-to-supabase-auth.ts`

Behavior:
- Loads Prisma users/admins.
- For each, checks Supabase Auth for `email`.
- If missing, creates Supabase Auth account.
- Links `supabase_id` back to Prisma.

Admin checks:
```ts
const { data } = await supabase.auth.admin.listUsers();
```

Create:
```ts
await supabase.auth.admin.createUser({
  email: user.email,
  password: "123",
  email_confirm: true,
});
```

---

## 12) Prisma schema note (password storage)

From `prisma/schema.prisma` included in the repository:
- `User` model contains `password` (string).
- `Admin` model contains `password` (string).

However, the app logic indicates that Supabase owns passwords:
- `src/app/api/profile/route.ts` contains the comment: 
  > “Supabase owns passwords; do not validate password in Prisma.”

In other words:
- Prisma password fields are likely legacy/test fields.
- Actual authentication is performed by Supabase Auth.

---

## 13) Summary (end-to-end)

1. User opens `/` (client).
2. Client calls `/api/auth/me`.
3. `/api/auth/me` calls `getCurrentUser()`.
4. `getCurrentUser()` calls `supabase.auth.getUser()`.
5. It finds matching Prisma record by email and maps role.
6. Frontend uses returned `role/type` to render dashboards.
7. User logs in via `/src/app/LoginPage.tsx` using `supabase.auth.signInWithPassword()`.
8. Server middleware keeps Supabase session cookies refreshed.
9. Logout calls `supabase.auth.signOut()`.

---

## 14) Important env vars used

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (used by seed/sync/admin scripts)
- `DATABASE_URL` (Prisma DB)

