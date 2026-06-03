# Vehicle Reservation System — Complete Documentation

> Comprehensive technical reference covering all source files, authentication flow, database schema, API routes, deployment setup, and operational commands.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Project File Structure](#2-project-file-structure)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema (Prisma)](#4-database-schema-prisma)
5. [Authentication & Session Flow](#5-authentication--session-flow)
6. [Server-Side Auth Utilities](#6-server-side-auth-utilities)
7. [Client-Side Auth Utilities](#7-client-side-auth-utilities)
8. [Middleware (Session Refresh)](#8-middleware-session-refresh)
9. [Current User Resolver](#9-current-user-resolver)
10. [API Routes](#10-api-routes)
11. [Frontend Pages & Components](#11-frontend-pages--components)
12. [Dashboard Rendering (After Login)](#12-dashboard-rendering-after-login)
13. [Seed Script](#13-seed-script)
14. [Utility Scripts](#14-utility-scripts)
15. [Configuration Files](#15-configuration-files)
16. [Operational Commands](#16-operational-commands)

---

## 1) System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  (Next.js Client Components)                                 │
│  - LoginPage.tsx  - DashboardPage.tsx  - Session Hook       │
│       │                                                      │
│       │ fetch() /api/auth/me                                 │
│       │ supabase.auth.signInWithPassword()                   │
│       ▼                                                      │
├─────────────────────────────────────────────────────────────┤
│                    Next.js App Router                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ middleware.ts│  │   API Routes      │  │ Server       │   │
│  │ (edge layer) │  │  /api/auth/me    │  │ Components   │   │
│  │              │  │  /api/profile    │  │              │   │
│  │ Cookies:     │  │  /api/stats      │  │              │   │
│  │  getAll()    │  │  /api/vehicle-   │  │              │   │
│  │  setAll()    │  │    requests/*    │  │              │   │
│  │              │  │  /api/messages/* │  │              │   │
│  └──────┬───────┘  └────────┬─────────┘  └──────────────┘   │
│         │                   │                                │
│         │      getCurrentUser()                              │
│         ▼                   ▼                                │
│  ┌──────────────────────────────────────────────────┐       │
│  │          src/lib/current-user.ts                  │       │
│  │  1. supabase.auth.getUser() → Supabase identity   │       │
│  │  2. prisma.findUnique({ supabase_id }) → Role     │       │
│  └─────────────────────┬────────────────────────────┘       │
│                        │                                     │
│         ┌──────────────┴──────────────┐                     │
│         ▼                              ▼                     │
│  ┌──────────────┐             ┌──────────────┐              │
│  │  Prisma DB   │             │ Supabase Auth │              │
│  │  (Postgres)  │             │ (Auth Users)  │              │
│  └──────────────┘             └──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Supabase Auth** owns authentication (password verification, session tokens, cookie management via `@supabase/ssr`).
- **Prisma + PostgreSQL** owns all application data (users, admins, departments, roles, vehicle requests, messages).
- **supabase_id** is the foreign key linking Prisma records to Supabase Auth identities.
- **Role mapping** is done server-side in `getCurrentUser()` — the browser never sees raw Supabase tokens.

---

## 2) Project File Structure

```
Vehicle_Reservation/
├── .env                           # Environment variables (NEVER commit)
├── .gitignore
├── ATTRIBUTIONS.md
├── backend.md
├── markdown.md                    # ← This file (comprehensive documentation)
├── next-env.d.ts
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies & scripts
├── pnpm-workspace.yaml
├── postcss.config.cjs             # PostCSS / Tailwind config
├── README.md
├── TODO.md
├── tsconfig.json                  # TypeScript configuration
├── guidelines/
│   └── Guidelines.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260522075519_init/
│       │   └── migration.sql
│       ├── 20260601191913_add_supabase_id/
│       │   └── migration.sql
│       └── 20260602044903_supabase_auth_refactor/
│           └── migration.sql
├── scripts/
│   ├── check-auth.ts
│   ├── check-supabase-users.ts
│   ├── ensure-test-users.ts
│   └── sync-users-to-supabase-auth.ts
└── src/
    ├── middleware.ts
    ├── lib/
    │   ├── api.ts
    │   ├── current-user.ts
    │   ├── prisma.ts
    │   ├── session.ts
    │   └── supabase/
    │       ├── client.ts
    │       └── server.ts
    └── app/
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx
        ├── LoginPage.tsx
        ├── login/
        │   └── page.tsx
        ├── dashboard/
        │   └── page.tsx
        ├── requests/
        │   ├── page.tsx
        │   ├── requestDetail.tsx
        │   ├── requestsHistory.tsx
        │   ├── types.ts
        │   └── [id]/
        │       └── page.tsx
        ├── api/
        │   ├── auth/
        │   │   ├── me/
        │   │   │   └── route.ts
        │   │   └── logout/
        │   │       └── route.ts
        │   ├── availability/
        │   │   └── drivers/
        │   │       └── route.ts
        │   ├── messages/
        │   │   ├── inbox/
        │   │   │   └── route.ts
        │   │   └── send/
        │   │       └── route.ts
        │   ├── profile/
        │   │   └── route.ts
        │   ├── requests/
        │   │   └── [id]/
        │   │       └── route.ts
        │   ├── schedule/
        │   │   └── senior-officer/
        │   │       └── route.ts
        │   ├── stats/
        │   │   ├── route.ts
        │   │   ├── faculty/
        │   │   │   └── route.ts
        │   │   ├── senior-officer/
        │   │   │   └── route.ts
        │   │   └── senior-officer-pending/
        │   │       └── route.ts
        │   ├── vehicle-requests/
        │   │   ├── route.ts
        │   │   ├── [id]/
        │   │   │   ├── page.tsx
        │   │   │   ├── allocate/
        │   │   │   │   └── route.ts
        │   │   │   ├── approve/
        │   │   │   │   └── route.ts
        │   │   │   ├── reject/
        │   │   │   │   └── route.ts
        │   │   │   ├── letter/
        │   │   │   │   ├── download/
        │   │   │   │   │   └── route.ts
        │   │   │   │   └── view/
        │   │   │   │       └── route.ts
            │       │   └── (senior-officer routes)

        │   │   ├── senior-officer/
        │   │   │   └── route.ts
        │   │   ├── senior-officer-detail/
        │   │   │   └── route.ts
        │   │   └── senior-officer-pending/
        │   │       └── route.ts
        │   └── vehicles/
        │       ├── route.ts
        │       └── available/
        │           └── route.ts
        └── components/
            ├── RoleRouter.tsx
            ├── UniversityDashboard.tsx
            ├── UniversityHeader.tsx
            ├── UniversitySidebar.tsx
            ├── figma/
            │   └── ImageWithFallback.tsx
            ├── roles/
            │   ├── AdminAccountDetailsPage.tsx
            │   ├── AdminDashboard.tsx
            │   ├── AdminDeputyDashboard.tsx
            │   ├── AdminMessagesPage.tsx
            │   ├── ApprovedRequestsView.tsx
            │   ├── DeanApprovedRequestsTable.tsx
            │   ├── DeanDashboard.tsx
            │   ├── FacultyDeputyApprovalsView.tsx
            │   ├── FleetStatusView.tsx
            │   ├── General DeputyDashboard.tsx
            │   ├── OngoingRequestsView.tsx
            │   ├── PendingApprovalsView.tsx
            │   ├── SeniorOfficerDashboard.tsx
            │   ├── UniversityDeputyDashboard.tsx
            │   └── senior-officer/
            │       ├── DriversPage.tsx
            │       ├── MessagesPage.tsx
            │       ├── RequestAllocationDetailPage.tsx
            │       ├── SchedulePage.tsx
            │       ├── SeniorOfficerDashboardPage.tsx
            │       ├── SeniorOfficerLayout.tsx
            │       ├── VehicleAllocationPage.tsx
            │       ├── VehiclesPage.tsx
            │       └── VehicleStatusPage.tsx
            ├── ui/
            │   ├── (many shadcn/ui component files: button, card, table, dialog, etc.)
            │   └── utils.ts
            └── user/
                ├── AccountDetailsPage.tsx
                ├── MessagesPage.tsx
                ├── PreviousRequestsPage.tsx
                ├── StudentDashboard.tsx
                ├── VehicleReservationForm.tsx
                └── WelcomeBanner.tsx
```

---

## 3) Environment Variables

**File: `.env`**


```
NEXT_PUBLIC_SUPABASE_URL=https://avfkqynaftjpczomidxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATABASE_URL=postgresql://postgres:Ravindu%402002@db.avfkqynaftjpczomidxc.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous (public) API key | Browser + server clients |
| `DATABASE_URL` | PostgreSQL connection string (direct DB access) | Prisma |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (bypasses RLS) | Seed script, sync scripts |

---

## 4) Database Schema (Prisma)

**File: `prisma/schema.prisma`**

Full schema with all 7 models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Faculty {
  id          Int          @id @default(autoincrement())
  name        String       @unique
  admins      Admin[]
  departments Department[]
  @@map("faculty")
}

model Department {
  id              Int     @id @default(autoincrement())
  department_name String
  faculty_id      Int
  admins          Admin[]
  faculty         Faculty @relation(fields: [faculty_id], references: [id])
  users           User[]
  @@map("department")
}

model User {
  id                          Int              @id @default(autoincrement())
  supabase_id                 String           @unique
  full_name                   String
  user_type                   String
  registration_or_employee_no String           @unique
  designation                 String?
  telephone                   String?
  email                       String           @unique
  department_id               Int
  created_at                  DateTime         @default(now())
  received_user_messages      Message[]        @relation("UserReceiver")
  sent_user_messages          Message[]        @relation("UserSender")
  department                  Department       @relation(fields: [department_id], references: [id])
  vehicle_requests            VehicleRequest[]
  @@map("user")
}

model Admin {
  id                      Int              @id @default(autoincrement())
  supabase_id             String?          @unique
  full_name               String
  admin_role              String
  telephone               String?
  email                   String           @unique
  department_id           Int?
  faculty_id              Int?
  created_at              DateTime         @default(now())
  department              Department?      @relation(fields: [department_id], references: [id])
  faculty                 Faculty?         @relation(fields: [faculty_id], references: [id])
  received_admin_messages Message[]        @relation("AdminReceiver")
  sent_admin_messages     Message[]        @relation("AdminSender")
  approved_requests       VehicleRequest[] @relation("RequestApprover")
  @@map("admin")
}

model Driver {
  id                  Int              @id @default(autoincrement())
  full_name           String
  telephone           String?
  license_number      String           @unique
  availability_status String
  created_at          DateTime         @default(now())
  vehicle_requests    VehicleRequest[]
  @@map("driver")
}

model Vehicle {
  id                  Int              @id @default(autoincrement())
  vehicle_number      String           @unique
  vehicle_type        String
  capacity            Int
  availability_status String
  vehicle_requests    VehicleRequest[]
  @@map("vehicle")
}

model VehicleRequest {
  id                 Int      @id @default(autoincrement())
  requester_id       Int
  approved_by        Int?
  vehicle_id         Int?
  driver_id          Int?
  request_type       String
  vehicle_nature     String
  number_of_persons  Int
  travel_date_from   DateTime
  travel_date_to     DateTime
  required_time_from String
  required_time_to   String
  purpose            String
  places_to_visit    String?
  travel_route       String?
  distance_type      String
  special_notes      String?
  approval_status    String   @default("pending")
  allocation_status  String   @default("pending")
  admin_remarks      String?
  trip_remarks       String?
  created_at         DateTime @default(now())
  approver           Admin?   @relation("RequestApprover", fields: [approved_by], references: [id])
  driver             Driver?  @relation(fields: [driver_id], references: [id])
  requester          User     @relation(fields: [requester_id], references: [id])
  vehicle            Vehicle? @relation(fields: [vehicle_id], references: [id])
  @@map("vehicle_request")
}

model Message {
  id                Int      @id @default(autoincrement())
  sender_user_id    Int?
  receiver_user_id  Int?
  sender_admin_id   Int?
  receiver_admin_id Int?
  subject           String?
  message           String
  is_read           Boolean  @default(false)
  created_at        DateTime @default(now())
  receiver_admin    Admin?   @relation("AdminReceiver", fields: [receiver_admin_id], references: [id])
  receiver_user     User?    @relation("UserReceiver", fields: [receiver_user_id], references: [id])
  sender_admin      Admin?   @relation("AdminSender", fields: [sender_admin_id], references: [id])
  sender_user       User?    @relation("UserSender", fields: [sender_user_id], references: [id])
  @@map("message")
}
```

### User Model Fields (for Lecturers / Staff)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Int` (PK, autoincrement) | Unique user ID |
| `supabase_id` | `String` (unique) | UUID from Supabase Auth |
| `full_name` | `String` | Full name of the user |
| `user_type` | `String` | Role: `"student"` or `"lecturer"` |
| `registration_or_employee_no` | `String` (unique) | Registration number (student) or employee number (lecturer) |
| `designation` | `String?` (optional) | **Lecturer-specific** — academic title (e.g., "Senior Lecturer", "Professor", "Assistant Lecturer") |
| `telephone` | `String?` (optional) | Contact telephone number |
| `email` | `String` (unique) | Email address (also used for Supabase Auth login) |
| `department_id` | `Int` | FK → `Department.id` |
| `created_at` | `DateTime` | Auto-generated timestamp |

**Key difference between Student & Lecturer:**

| Aspect | Student | Lecturer |
|--------|---------|----------|
| `user_type` | `"student"` | `"lecturer"` |
| `registration_or_employee_no` | Registration number (e.g., `EG/2020/1001`) | Employee number (e.g., `EG/2015/2001`) |
| `designation` | Always `null` | Optional — academic rank/title |
| Frontend role badge | Blue badge: "Student" | Purple badge: "Lecturer" |

### Model Relationships

| Model | Links To | Via Field |
|-------|----------|-----------|
| User → Department | Department | `department_id` |
| Department → Faculty | Faculty | `faculty_id` |
| Admin → Department | Department | `department_id` |
| Admin → Faculty | Faculty | `faculty_id` |
| VehicleRequest → User | User | `requester_id` |
| VehicleRequest → Admin | Admin | `approved_by` |
| VehicleRequest → Vehicle | Vehicle | `vehicle_id` |
| VehicleRequest → Driver | Driver | `driver_id` |
| Message → User (sender) | User | `sender_user_id` |
| Message → User (receiver) | User | `receiver_user_id` |
| Message → Admin (sender) | Admin | `sender_admin_id` |
| Message → Admin (receiver) | Admin | `receiver_admin_id` |

---

## 5) Authentication & Session Flow

### End-to-End Auth Flow

```
1. User visits /login
       │
2. User submits email + password
       │
       ▼
3. LoginPage.tsx: supabase.auth.signInWithPassword(email, password)
       │
       ├─ Success? → @supabase/ssr write cookies (sb-access-token, sb-refresh-token)
       │              await supabase.auth.getSession()  // confirm cookies written
       │              router.push("/dashboard")
       │
       └─ Error?   → Display error message to user
       
4. Browser navigates to /dashboard
       │
       ▼
5. middleware.ts intercepts request
       │
       ├─ Reads cookies via request.cookies.getAll()
       ├─ Creates server client via createServerClient()
       ├─ Calls supabase.auth.getUser()  // refreshes session if needed
       │   └─ setAll() propagates new cookies back to response
       └─ Returns NextResponse with updated cookies

6. /dashboard/page.tsx (client component) loads
       │
       ▼
7. Fetches /api/auth/me
       │
       ▼
8. me/route.ts → getCurrentUser()
       │
       ├─ createSupabaseServerClient() → supabase.auth.getUser()
       ├─ If no user → return null → 401
       ├─ If user found → prisma.user.findUnique({ supabase_id })
       │   └─ OR → prisma.admin.findUnique({ supabase_id })
       └─ Returns { id, email, role, type, department_id }

9. Dashboard renders role-specific UI (see Section 12)
```

### Common Auth Bug — Fixed

**Symptoms:**
- Login succeeds on frontend
- Dashboard loads
- Every API call returns 401
- Server logs: `AuthSessionMissingError: Auth session missing!`

**Root Cause:** `src/lib/supabase/client.ts` used `createClient` from `@supabase/supabase-js` which stores session in memory/localStorage but does NOT write SSR-compatible cookies. Server-side `getUser()` looked for cookies that didn't exist.

**Fix:** Changed to `createBrowserClient` from `@supabase/ssr` which:
1. Writes `sb-access-token` and `sb-refresh-token` cookies after login
2. Automatically refreshes tokens
3. Cookies are readable by `createServerClient` on the server

**Verification:**
- Open DevTools → Application → Cookies → localhost:3000
- After login, verify `sb-access-token` and `sb-refresh-token` exist
- If cookies exist but still 401 → inspect middleware.ts cookie propagation

---

## 6) Server-Side Auth Utilities

### Prisma Singleton

**File: `src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Server Supabase Client

**File: `src/lib/supabase/server.ts`**

```ts
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
```

**Key points:**
- Uses `cookies()` from `next/headers` (Server Component / Route Handler API)
- `createServerClient` from `@supabase/ssr` reads/writes auth cookies
- The `get()` / `set()` / `remove()` pattern matches the latest `@supabase/ssr` v0.10.x API
- Temporary logging outputs `[server cookies]` to debug cookie state

---

## 7) Client-Side Auth Utilities

### Browser Supabase Client

**File: `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
```

**Key points:**
- `createBrowserClient` from `@supabase/ssr` — writes auth cookies to the browser
- These cookies are read by `createServerClient` in middleware and server routes
- Singleton export: imported in `LoginPage.tsx` for `signInWithPassword()`

### Client Session Hook

**File: `src/lib/session.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

type ApiMeData = {
  id: number;
  email: string;
  role: string;
  type: "user" | "admin";
  department_id: number;
};

export function useSession(): {
  user: ApiMeData | null;
  loading: boolean;
  error: string | null;
} {
  const [user, setUser] = useState<ApiMeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", { method: "GET" });
        const payload = (await res.json()) as any;

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setError(payload?.error ?? "Unauthorized");
          }
          return;
        }

        if (!cancelled) {
          setUser(payload?.data ?? null);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setError("Failed to load session");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { user, loading, error };
}
```

**Used by** any client component that needs to know the current user without hitting the API manually (e.g., `UniversityHeader`).

### Legacy API Helpers

**File: `src/lib/api.ts`**

```ts
export function getAuth() { return null; }

export function fetchUser() { return null; }

export async function getUserProfile() {
  const res = await fetch(`/api/profile`);
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed`);
  return payload?.data ?? null;
}

export async function getUserRequests() {
  const res = await fetch(`/api/vehicle-requests`);
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed`);
  return payload;
}

export async function getUserRequestById(id: number) {
  const res = await fetch(`/api/requests/${id}`);
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed`);
  return payload?.data ?? null;
}

export async function deleteUserRequest(id: number) {
  const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed`);
  return payload?.success === true;
}

export async function getMessages() {
  const res = await fetch(`/api/messages/inbox`);
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed`);
  return payload;
}
```

All functions call server API routes which authenticate via `getCurrentUser()`.

---

## 8) Middleware (Session Refresh)

**File: `src/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("[middleware cookies]", request.cookies.getAll());

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
          // 1. Set cookies on the request so getUser() can read them
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // 2. Create ONE response with updated request cookies
          supabaseResponse = NextResponse.next({ request });
          // 3. Set cookies on the response for the browser
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: This refreshes the auth session
  const { data: { user } } = await supabase.auth.getUser();

  console.log("[middleware] supabase.auth.getUser user:", {
    email: user?.email, id: user?.id,
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**How it works:**

1. Intercepts every incoming request (except static files)
2. Reads cookies from the incoming request via `getAll()`
3. Creates a `createServerClient` with cookie accessors
4. Calls `supabase.auth.getUser()` — this refreshes the session if needed
5. If Supabase sets new tokens (via `setAll`), they are:
   - First written to `request.cookies` so `getUser()` sees them
   - Then written to `supabaseResponse.cookies` so the browser stores them
6. Returns the response with updated cookies

**Critical bug fixed in `setAll`:**

The original code recreated `supabaseResponse` inside the forEach loop, overwriting previously set cookies:
```ts
// BUG (old):
setAll(cookiesToSet) {
  supabaseResponse = NextResponse.next({ request }); // ← recreated each iteration!
  cookiesToSet.forEach(({ name, value, options }) => {
    supabaseResponse.cookies.set(name, value, options);
  });
},
// FIX (new):
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value }) => {
    request.cookies.set(name, value);
  });
  supabaseResponse = NextResponse.next({ request }); // ← created once
  cookiesToSet.forEach(({ name, value, options }) => {
    supabaseResponse.cookies.set(name, value, options);
  });
},
```

---

## 9) Current User Resolver

**File: `src/lib/current-user.ts`**

This is the central authentication gate for the entire application. Every API route and most pages depend on it.

```ts
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UnifiedRoleType =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

export type CurrentUser =
  | {
      id: number;
      email: string;
      role: UnifiedRoleType;
      type: "user";
      department_id: number;
    }
  | {
      id: number;
      email: string;
      role: UnifiedRoleType;
      type: "admin";
      department_id: number;
    }
  | null;

const VALID_ROLES: UnifiedRoleType[] = [
  "student", "lecturer", "university-deputy",
  "admin-deputy", "dean", "senior-officer",
];

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    console.log("[getCurrentUser] user", user);
    console.log("[getCurrentUser] supabase.auth.getUser():", {
      error,
      user: user ? { id: user.id, email: user.email } : null,
    });

    if (error || !user?.id || !user?.email) return null;

    const supabaseId = user.id;

    // Lookup by supabase_id in Prisma User table
    let appUser = await prisma.user
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);

    if (appUser) {
      const role = (appUser.user_type as UnifiedRoleType) ?? "student";
      if (!VALID_ROLES.includes(role)) return null;
      return {
        id: appUser.id,
        email: appUser.email,
        role,
        type: "user",
        department_id: appUser.department_id,
      };
    }

    // Lookup by supabase_id in Prisma Admin table
    let appAdmin = await prisma.admin
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);

    if (appAdmin) {
      const role = (appAdmin.admin_role as UnifiedRoleType) ?? "admin-deputy";
      if (!VALID_ROLES.includes(role)) return null;
      return {
        id: appAdmin.id,
        email: appAdmin.email,
        role,
        type: "admin",
        department_id: appAdmin.department_id || 0,
      };
    }

    console.log("[getCurrentUser] no matching prisma user/admin found");
    return null;
  } catch (err) {
    console.log("[getCurrentUser] caught error:", err);
    return null;
  }
}
```

**Flow:**
1. Create server Supabase client (cookie-aware)
2. Call `supabase.auth.getUser()` — validates session from cookies
3. If no user → return `null` (401)
4. Look up `prisma.user` by `supabase_id` (the UUID from Supabase Auth)
5. If found → return user with role from `user_type`
6. If not found → look up `prisma.admin` by `supabase_id`
7. If found → return admin with role from `admin_role`
8. If neither found → return `null`

---

## 10) API Routes

### GET /api/auth/me

**File: `src/app/api/auth/me/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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
}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "student@test.com",
    "role": "student",
    "type": "user",
    "department_id": 1
  }
}
```

**Response (401):** `{ "error": "Not authenticated" }`

---

### POST /api/auth/logout

**File: `src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ status: 200, message: "Logged out" });
}
```

---

### GET/PATCH /api/profile

**File: `src/app/api/profile/route.ts`**

**GET** — Returns current user's profile from Prisma.

For `user` type with `student` role:
```json
{
  "data": {
    "id": 1,
    "full_name": "Student User",
    "email": "student@test.com",
    "telephone": null,
    "role": "student",
    "user_type": "student",
    "registration_or_employee_no": "EG/2020/1001",
    "designation": null,
    "department": { "faculty": "Faculty of Engineering", "name": "Computer Science & Engineering" }
  }
}
```

For `user` type with `lecturer` role (includes the `designation` field):
```json
{
  "data": {
    "id": 2,
    "full_name": "Lecturer User",
    "email": "lecturer@test.com",
    "telephone": null,
    "role": "lecturer",
    "user_type": "lecturer",
    "registration_or_employee_no": "EG/2015/2001",
    "designation": null,
    "department": { "faculty": "Faculty of Engineering", "name": "Computer Science & Engineering" }
  }
}
```
**Note:** The `designation` field is specific to lecturers/staff (e.g., "Senior Lecturer", "Professor") and is stored as an optional `String?` in the `User` model. It is `null` by default and can be updated via the **PATCH** endpoint.

For `admin` type:
```json
{
  "data": {
    "id": 1,
    "full_name": "Admin Deputy",
    "email": "admin@test.com",
    "telephone": null,
    "role": "admin-deputy",
    "admin_role": "admin-deputy",
    "department_id": 0
  }
}
```

**PATCH** — Update profile fields (`name`, `email`, `telephone`) — only for `user` type.

---

### GET /api/stats

**File: `src/app/api/stats/route.ts`**

Query parameter `?type=student` or `?type=admin`.

**Student stats:**
```json
{
  "data": {
    "availableVehicles": 3,
    "activeBookings": 0,
    "unreadMessages": 0
  }
}
```

**Admin stats:**
```json
{
  "data": {
    "pendingApprovals": 0,
    "approvedToday": 0,
    "approvedThisMonth": 0,
    "rejectedCount": 0,
    "totalUsers": 2
  }
}
```

---

### GET /api/stats/faculty

**File: `src/app/api/stats/faculty/route.ts`**

Returns per-faculty aggregated stats using raw SQL:

```json
{
  "data": [
    { "name": "Faculty of Engineering", "requestsCount": 12, "vehiclesCount": 3 }
  ]
}
```

---

### GET/POST /api/vehicle-requests

**File: `src/app/api/vehicle-requests/route.ts`**

**GET** — List vehicle requests for current user (or all for admins). Supports `?status=pending|approved|rejected`.

**POST** — Create a new vehicle request.

```json
{
  "request_type": "official",
  "vehicle_nature": "car",
  "number_of_persons": 3,
  "travel_date_from": "2026-06-10T08:00:00Z",
  "travel_date_to": "2026-06-10T17:00:00Z",
  "required_time_from": "08:00",
  "required_time_to": "17:00",
  "purpose": "Field visit",
  "places_to_visit": "Colombo",
  "travel_route": "Kandy-Colombo",
  "distance_type": "long",
  "special_notes": ""
}
```

---

### POST /api/vehicle-requests/[id]/approve

**File: `src/app/api/vehicle-requests/[id]/approve/route.ts`**

Approves a vehicle request (admin only).

```ts
if (authUser.type !== "admin") {
  return NextResponse.json({ status: 403, error: "Only admins can approve requests" }, { status: 403 });
}
```

---

### POST /api/vehicle-requests/[id]/reject

**File: `src/app/api/vehicle-requests/[id]/reject/route.ts`**

Rejects a vehicle request (admin only).

---

### GET/DELETE /api/requests/[id]

**File: `src/app/api/requests/[id]/route.ts`**

**GET** — Single vehicle request with full join data (requester, vehicle, driver, approver).

**DELETE** — Delete a request (user can delete only their own requests).

---

### GET /api/messages/inbox

**File: `src/app/api/messages/inbox/route.ts`**

Returns messages for current user (by `receiver_user_id`) or admin (by `receiver_admin_id`):

```json
{
  "data": [
    {
      "id": 1,
      "message": "Your request has been approved",
      "is_read": false,
      "created_at": "2026-06-01T10:00:00Z",
      "sender_user": { "id": 1, "full_name": "Admin Deputy", "email": "admin@test.com" },
      "sender_admin": null
    }
  ]
}
```

---

## 11) Frontend Pages & Components

### Login Page

**File: `src/app/LoginPage.tsx`** (component)

**Route: `src/app/login/page.tsx`** → renders `<LoginPage />`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("LOGIN DATA", data);
      console.log("LOGIN ERROR", error);

      if (error) {
        setError(error.message);
        return;
      }

      // Wait until the session is available client-side (cookies updated by @supabase/ssr)
      await supabase.auth.getSession();

      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>Sign In</button>
    </form>
  );
}
```

**Critical:**
1. `supabase.auth.signInWithPassword()` authenticates with Supabase
2. `@supabase/ssr`'s `createBrowserClient` automatically writes auth cookies
3. `await supabase.auth.getSession()` ensures cookies are written before navigation
4. `router.push("/dashboard")` initiates the client-side navigation

---

### Home Page (Auth Gate)

**File: `src/app/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./LoginPage";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (res.ok) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>;
  }

  return <LoginPage />;
}
```

**Flow:**
1. On mount, hit `/api/auth/me` to check if logged in
2. If authenticated → redirect to `/dashboard`
3. If not → show `<LoginPage />`

---

### Dashboard Page

**File: `src/app/dashboard/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UniversityDashboard } from "../components/UniversityDashboard";

export type UserRole =
  | "student" | "lecturer" | "university-deputy"
  | "admin-deputy" | "dean" | "senior-officer";

export default function DashboardPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      const normalizeRole = (role: unknown): UserRole => {
        const r = String(role ?? "").trim();
        const normalized = r.includes("_") ? r.replaceAll("_", "-") : r;
        return normalized as UserRole;
      };

      try {
        const res = await fetch("/api/auth/me");
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.data?.role) {
          router.push("/login");
          return;
        }
        setCurrentRole(normalizeRole(payload.data.role));
      } catch {
        router.push("/login");
        return;
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>;
  }

  return <UniversityDashboard role={currentRole} />;
}
```

**Flow:**
1. Fetch `/api/auth/me` to get authenticated user's role
2. Normalize role string (handles underscore/hyphen variants)
3. If unauthenticated → redirect to `/login`
4. Render `<UniversityDashboard>` with the resolved role

---

## 12) Dashboard Rendering (After Login)

This section documents the complete rendering flow after a user successfully authenticates and is redirected to `/dashboard`. The dashboard is composed of a role-based routing system with a shared sidebar and header layout.

### Architecture Overview

```
/dashboard
    │
    ▼
DashboardPage (src/app/dashboard/page.tsx)
    │  ├─ Fetches /api/auth/me → { id, email, role, type, department_id }
    │  └─ Normalizes role string
    ▼
UniversityDashboard (src/app/components/UniversityDashboard.tsx)
    │  ├─ Determines if role is "student" | "lecturer" (user type) or admin role
    │  ├─ Manages page navigation state (currentPage)
    │  ├─ Renders UniversitySidebar (left navigation)
    │  ├─ Renders UniversityHeader (top bar with profile dropdown)
    │  └─ Renders role-specific content with AnimatePresence transitions
    │
    ├── User Roles (student / lecturer) ─────────► StudentDashboard
    │       ├─ "reservation-form"  → VehicleReservationForm
    │       ├─ "messages"          → MessagesPage
    │       ├─ "previous-requests" → PreviousRequestsPage
    │       ├─ "account-details"   → AccountDetailsPage
    │       └─ WelcomeBanner shown on main pages
    │
    └── Admin Roles ──────────────────────────────► renderAdminContent()
            ├─ "account-details" → AdminAccountDetailsPage
            ├─ "messages"        → AdminMessagesPage
            ├─ "approvals"       → ApprovedRequestsView (or DeanApprovedRequestsTable for dean)
            ├─ "dashboard" (default) →
            │       ├─ "university-deputy" → UniversityDeputyDashboard
            │       ├─ "admin-deputy"      → AdminDeputyDashboard
            │       ├─ "dean"              → DeanDashboard
            │       └─ "senior-officer"    → SeniorOfficerDashboard
            └─ null (fallback)
```

### UniversityDashboard (Role Router)

**File: `src/app/components/UniversityDashboard.tsx`**

This is the main layout wrapper for the entire dashboard. It manages page state, routes to the correct role-specific dashboard, and provides the shared sidebar + header layout.

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { StudentDashboard } from "./user/StudentDashboard";
import { UniversityDeputyDashboard } from "./roles/UniversityDeputyDashboard";
import { AdminDeputyDashboard } from "./roles/AdminDeputyDashboard";
import { DeanDashboard } from "./roles/DeanDashboard";
import { SeniorOfficerDashboard } from "./roles/SeniorOfficerDashboard";
import { AdminAccountDetailsPage } from "./roles/AdminAccountDetailsPage";
import { ApprovedRequestsView } from "./roles/ApprovedRequestsView";
import { DeanApprovedRequestsTable } from "./roles/DeanApprovedRequestsTable";
import { AdminMessagesPage } from "./roles/AdminMessagesPage";

export type UserRole =
  | "student" | "lecturer" | "university-deputy"
  | "admin-deputy" | "dean" | "senior-officer";

export type StudentPage =
  | "reservation-form" | "messages" | "previous-requests"
  | "account-details" | "edit-profile" | "dashboard"
  | "approvals" | "users" | "analytics"
  | "settings" | "fleet-status";

export type AdminPage = "dashboard" | "approvals" | "messages";

export function isAdminRole(role: UserRole): boolean {
  return ["university-deputy", "admin-deputy", "dean", "senior-officer"].includes(role);
}
```

**State management:**
- `currentPage` — tracks which sub-page is active (defaults to `"reservation-form"` for student/lecturer, `"dashboard"` for admins)
- `effectiveAdminPage` — interpreted as `AdminPage` type for admin role views

**Admin content routing (`renderAdminContent()`):**

| `currentPage` value | Component Rendered | Notes |
|---|---|---|
| `"account-details"` | `<AdminAccountDetailsPage />` | Admin profile view |
| `"messages"` | `<AdminMessagesPage />` | Admin inbox |
| `"approvals"` (when role = `"dean"`) | `<DeanApprovedRequestsTable />` | Dean-specific table |
| `"approvals"` (other admin roles) | `<ApprovedRequestsView />` | Generic approved requests |
| `"dashboard"` + role = `"university-deputy"` | `<UniversityDeputyDashboard />` | University-wide stats |
| `"dashboard"` + role = `"admin-deputy"` | `<AdminDeputyDashboard />` | Faculty-level stats |
| `"dashboard"` + role = `"dean"` | `<DeanDashboard />` | Dean executive overview |
| `"dashboard"` + role = `"senior-officer"` | `<SeniorOfficerDashboard />` | Requests & complaints |

**Layout structure:**
```tsx
return (
  <div className="flex h-screen bg-gray-50">
    <UniversitySidebar role={role} currentPage={currentPage} onPageChange={setCurrentPage} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <UniversityHeader role={role} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={role + currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {role === "student" || role === "lecturer" ? (
              <StudentDashboard currentPage={currentPage} />
            ) : (
              renderAdminContent()
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
);
```

- **Left:** `UniversitySidebar` (fixed 256px width, gradient background)
- **Right:** `UniversityHeader` (top bar) + scrollable main content
- **Animation:** Framer Motion `AnimatePresence` with fade + slide transitions on page change
- **Key:** `role + currentPage` ensures re-render animation on both role and page changes

---

### UniversitySidebar

**File: `src/app/components/UniversitySidebar.tsx`**

Provides the left navigation menu with role-appropriate items:

**Student menu items:**
| Icon | Label | Page ID |
|------|-------|---------|
| `FileText` | Vehicle Reservation | `reservation-form` |
| `MessageSquare` | Messages | `messages` |
| `History` | Previous Requests | `previous-requests` |

**Admin menu items:**
| Icon | Label | Page ID |
|------|-------|---------|
| `LayoutDashboard` | Dashboard | `dashboard` |
| `FileCheck` | Approvals | `approvals` |
| `MessageSquare` | Messages | `messages` |

**Visual:**
- Gradient background: `from-amber-600 to-orange-600`
- Active item highlighted with orange background and shadow
- Hover: scale, brightness, and translate animations
- Bottom: role badge showing current user role label

---

### UniversityHeader

**File: `src/app/components/UniversityHeader.tsx`**

Top header bar with:

1. **Left side:** Dashboard title + "Welcome back!" greeting
2. **Right side:**
   - **Notification bell:** Fetches unread message count from `/api/stats?type=student`. Shows animated badge with count (capped at "9+")
   - **Profile dropdown:** (shadcn/ui `DropdownMenu`)
     - Avatar with gradient fallback initials
     - Role label + username display
     - **Account Details** menu item → navigates to account page
     - **Sign Out** → POST `/api/auth/logout` → redirect to `/`

**Role labels mapped:**
| Role | Display Label |
|------|---------------|
| `student` | Student |
| `lecturer` | Lecturer |
| `university-deputy` | University Deputy |
| `admin-deputy` | Admin Deputy |
| `dean` | Dean |
| `senior-officer` | Senior Officer |

---

### StudentDashboard (User Page Router)

**File: `src/app/components/user/StudentDashboard.tsx`**

Routes student/lecturer page navigation:

```tsx
export function StudentDashboard({ currentPage }: StudentDashboardProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Show welcome banner only on main pages */}
      {(currentPage === "reservation-form" || currentPage === "messages" || currentPage === "previous-requests") && (
        <WelcomeBanner />
      )}

      {currentPage === "reservation-form" && <VehicleReservationForm />}
      {currentPage === "messages" && <MessagesPage />}
      {currentPage === "previous-requests" && <PreviousRequestsPage />}
      {currentPage === "account-details" && <AccountDetailsPage />}
    </div>
  );
}
```

**Page routing:**
| `currentPage` | Component | Purpose |
|---|---|---|
| `"reservation-form"` | `VehicleReservationForm` | Create new vehicle reservation |
| `"messages"` | `MessagesPage` | View received messages |
| `"previous-requests"` | `PreviousRequestsPage` | View request history |
| `"account-details"` | `AccountDetailsPage` | View/edit profile |
| `"dashboard"` / others | (empty) | No content rendered |

**WelcomeBanner** displays on the three main pages showing stats from `/api/stats?type=student`:
- Available Vehicles count
- Active Bookings count
- Unread Messages count

---

### WelcomeBanner

**File: `src/app/components/user/WelcomeBanner.tsx`**

A gradient card shown at the top of student/lecturer pages that displays a welcome message and quick stats:

```tsx
export function WelcomeBanner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = "User"; // placeholder until backend provides name

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/stats?type=student");
      const data = await res.json();
      if (data.data) setStats(data.data);
    }
    fetchStats();
  }, []);
  // ...
}
```

**Stats shown:**
| Stat | Icon | Source |
|------|------|--------|
| Available Vehicles | `Car` | `stats.availableVehicles` |
| Active Bookings | `Calendar` | `stats.activeBookings` |
| Unread Messages | `MessageSquare` | `stats.unreadMessages` |

---

### AdminDeputyDashboard

**File: `src/app/components/roles/AdminDeputyDashboard.tsx`**

Faculty Deputy Registrar Dashboard with hardcoded mock data:

**Stat cards (4-column grid):**
| Card | Color | Stat Value |
|------|-------|------------|
| Faculty Students | Teal | 342 |
| This Month | Rose | 78 |
| Pending Review | Amber | 5 |
| Active Today | Violet | 12 |

**Department Breakdown:** Grid of 3 department cards showing:
- Faculty of Applied Sciences (28 requests, 2 pending, 24 approved)
- Faculty of Medicine (22 requests, 1 pending, 20 approved)
- Faculty of Business Studies (18 requests, 2 pending, 15 approved)

**Recent Activity:** List of 4 mock activities with student name, vehicle type, time, and status badge.

**Weekly Schedule:** 5-day schedule (Mon-Fri) showing reservation counts.

---

### UniversityDeputyDashboard

**File: `src/app/components/roles/UniversityDeputyDashboard.tsx`**

University Deputy Registrar Dashboard with live data fetching:

**Stat cards (3-column grid):**
| Card | Color | Stat Source |
|------|-------|-------------|
| Active Today | Orange | Hardcoded: 12 |
| Monthly Requests | Amber | Hardcoded: 284 |
| Pending Requests | Rose | `/api/stats?type=admin` → `pendingApprovals` |

**Faculty Performance Overview:** Grid of faculty stat cards fetched from `/api/stats/faculty`:
- Shows faculty name, request count, and vehicle count

**Pending Approvals section:** Renders `<PendingApprovalsView />` at the bottom — a table of pending vehicle requests with approve/reject actions.

---

### DeanDashboard

**File: `src/app/components/roles/DeanDashboard.tsx`**

Dean's executive dashboard with live data fetching:

**Stat cards (3-column grid):**
| Card | Color | Stat Source |
|------|-------|-------------|
| Approved Requests | Green | `/api/stats?type=admin` → `approvedThisMonth` |
| Pending Requests | Rose | `/api/stats?type=admin` → `pendingApprovals` |
| Faculty Summary | Amber | `/api/stats/faculty` → `[0].name`, `vehiclesCount`, `requestsCount` |

**Pending Approvals section:** Renders `<PendingApprovalsView />` for dean-level approval actions.

---

### SeniorOfficerDashboard

**File: `src/app/components/roles/SeniorOfficerDashboard.tsx`**

Senior Officer dashboard with mock data for requests and complaints:

**Stat cards (4-column grid):**
| Card | Color | Stat |
|------|-------|------|
| Total Requests | Orange | 6 (mock) |
| Open Complaints | Red | 1 (mock) |
| In Review | Amber | 1 (mock) |
| Resolved | Emerald | 1 (mock) |

**View Vehicle Reservation Requests:** Searchable + filterable table with columns: ID, Request Date, Vehicle, Reservation Date, Destination, Approval Status, Allocation Status, Details (expandable). Features:
- Search by ID, vehicle type, destination, or purpose
- Filter by approval status (All / Approved / Pending / Rejected)
- Expandable rows showing purpose
- Status badges with color coding

**Complaints Table:** Searchable + filterable table with columns: ID, Request ID, Category, Status, Message, Actions. Features:
- Search by ID, request ID, category, or message
- Filter by status (All / Open / In Review / Resolved)
- Action buttons: "Mark Review" (for Open), "Resolve" (for Open/In Review)
- Resolved items show "Done" badge

**Previous Requests:** Separate history table showing all mock requests with purpose details expandable.

---

### AdminAccountDetailsPage

**File: `src/app/components/roles/AdminAccountDetailsPage.tsx`**

Displays the admin user's profile information. Accessed from the profile dropdown menu in `UniversityHeader`. Shows:
- Admin name, email, role, telephone
- Department / Faculty info if applicable

---

### AdminMessagesPage

**File: `src/app/components/roles/AdminMessagesPage.tsx`**

Admin message inbox accessed from sidebar "Messages" menu item. Fetches from `/api/messages/inbox` and displays messages sent to the admin.

---

### Page Navigation Summary

**Student/Lecturer pages (via `StudentDashboard`):**

```
StudentDashboard
  ├── WelcomeBanner ─────┐
  │                       ├── reservation-form → VehicleReservationForm
  │                       ├── messages → MessagesPage
  │                       └── previous-requests → PreviousRequestsPage
  └── account-details → AccountDetailsPage (no WelcomeBanner)
```

**Admin pages (via `UniversityDashboard.renderAdminContent()`):**

```
renderAdminContent()
  ├── account-details → AdminAccountDetailsPage
  ├── messages → AdminMessagesPage
  ├── approvals ─────┬── dean → DeanApprovedRequestsTable
  │                   └── other admin roles → ApprovedRequestsView
  └── dashboard ─────┬── university-deputy → UniversityDeputyDashboard
                      ├── admin-deputy → AdminDeputyDashboard
                      ├── dean → DeanDashboard
                      └── senior-officer → SeniorOfficerDashboard
```

**Navigation flow:**
1. `DashboardPage` resolves role from `/api/auth/me` → passes to `UniversityDashboard`
2. `UniversityDashboard` sets initial page: `"reservation-form"` for students, `"dashboard"` for admins
3. Sidebar buttons call `onPageChange()` to update `currentPage` state
4. Header dropdown "Account Details" also calls `onPageChange("account-details")`
5. Content area re-renders with fade/slide animation via `AnimatePresence`
6. `key={role + currentPage}` ensures animation triggers on both role and page changes

---

## 13) Seed Script

**File: `prisma/seed.ts`**

Creates test data in both Prisma and Supabase Auth.

### How to run:
```bash
npx tsx prisma/seed.ts
```

### What it creates:

**Faculty:** Faculty of Engineering

**Departments (3):**
- Computer Science & Engineering
- Electrical Engineering
- Mechanical Engineering

**Users (2):**
| Name | Email | Type | Password | Reg/Employee No. |
|------|-------|------|----------|-------------------|
| Student User | student@test.com | student | 123 | EG/2020/1001 |
| Lecturer User | lecturer@test.com | lecturer | 123 | EG/2015/2001 |

**Admins (4):**
| Name | Email | Role | Password |
|------|-------|------|----------|
| Admin Deputy | admin@test.com | admin-deputy | 123 |
| University Deputy | uni-deputy@test.com | university-deputy | 123 |
| Dean User | dean@test.com | dean | 123 |
| Senior Officer | officer@test.com | senior-officer | 123 |

**Drivers (2):** John Driver, Sarah Driver

**Vehicles (3):**
| Number | Type | Capacity |
|--------|------|----------|
| CAB-1001 | car | 4 |
| BUS-2001 | bus | 30 |
| VAN-3001 | van | 8 |

### Key code:

```ts
// Creates Supabase Auth user + links supabase_id to Prisma record
async function ensureSupabaseUser(email, password, userId, type) {
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });

  if (error) {
    // If already exists → fetch existing user
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u: any) => u.email === email);
    if (found) return found.id;
    console.error(`Failed to create ${email}:`, error.message);
    return null;
  }
  return data.user.id; // This is Supabase Auth UUID
}
```

---

## 14) Utility Scripts

### check-auth.ts

**Path:** `scripts/check-auth.ts`

**Purpose:** Diagnostic tool to verify Supabase Auth connectivity and Prisma database state.

**Run:** `npx tsx scripts/check-auth.ts`

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Check Supabase session (will be null in CLI, but proves connectivity)
  const { data: sessionData } = await supabase.auth.getSession();

  // Check Prisma user/admin counts
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count();
  const adminCount = await prisma.admin.count();
  // ...
}
```

---

### check-supabase-users.ts

**Path:** `scripts/check-supabase-users.ts`

**Purpose:** Lists all users in Supabase Auth using the service role key.

**Run:** `npx tsx scripts/check-supabase-users.ts`

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers();
console.log("Supabase Auth users count:", data?.users?.length || 0);
data?.users?.forEach((u) => console.log("  -", u.email, "(id:", u.id, ")"));
```

---

### sync-users-to-supabase-auth.ts

**Path:** `scripts/sync-users-to-supabase-auth.ts`

**Purpose:** Sync existing Prisma users/admins into Supabase Auth. For each user, if they don't have a Supabase Auth account yet, creates one with password "123" and links the `supabase_id`.

**Run:** `npx tsx scripts/sync-users-to-supabase-auth.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

async function findSupabaseUser(email: string) {
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users?.find(u => u.email === email) || null;
}

for (const user of users) {
  const existing = await findSupabaseUser(user.email);
  if (existing) {
    if (!user.supabase_id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabase_id: existing.id },
      });
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: "123",
      email_confirm: true,
    });
    if (!error) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabase_id: data.user.id },
      });
    }
  }
}
```

---

## 15) Configuration Files

### package.json

```json
{
  "name": "vehicle-reservation-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@supabase/ssr": "^0.10.3",
    "@supabase/supabase-js": "^2.106.2",
    "next": "14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@prisma/client": "^5.22.0",
    "@radix-ui/*": "... (UI primitives)",
    "lucide-react": "^0.487.0",
    "tailwind-merge": "^3.2.0",
    "class-variance-authority": "^0.7.1",
    "recharts": "^2.15.2",
    "framer-motion": "^11.0.0",
    "motion": "^12.23.24",
    "date-fns": "^3.6.0",
    "react-hook-form": "^7.55.0",
    "sonner": "^2.0.7",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "^5.8.3",
    "tailwindcss": "^4.3.0",
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.12"
  }
}
```

### next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
}
export default nextConfig
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### postcss.config.cjs

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

---

## 16) Operational Commands

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Copy the .env file with the required Supabase and database credentials

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed the database
npx tsx prisma/seed.ts

# 6. Start the development server
npm run dev

# 7. Open in browser
open http://localhost:3000
```

### Development

```bash
# Start development server with Turbopack
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name describe_change

# Reset database (drop all data and re-run migrations)
npx prisma migrate reset

# Re-seed (after reset or when you need fresh data)
npx tsx prisma/seed.ts
```

### Production Build

```bash
# TypeScript check + production build
npm run build

# Start production server
npm start
```

### Authentication Debugging

```bash
# Check Supabase Auth connectivity and Prima user counts
npx tsx scripts/check-auth.ts

# List all users in Supabase Auth
npx tsx scripts/check-supabase-users.ts

# Sync Prisma users to Supabase Auth (creates missing accounts)
npx tsx scripts/sync-users-to-supabase-auth.ts
```

### Browser Debugging Steps for Auth Issues

1. **Open DevTools** → Application → Cookies → localhost:3000
2. **After login**, verify these cookies exist:
   - `sb-access-token`
   - `sb-refresh-token`
   - (or the newer Supabase auth cookie names)
3. **If no auth cookies** → problem is in `LoginPage.tsx` or Supabase browser client setup
4. **If cookies exist but server shows empty** → problem is in middleware or server.ts cookie handling
5. **Check server console** for these log lines:
   - `[middleware cookies] [...]` — should list auth cookies
   - `[server cookies] [...]` — should list auth cookies
   - `[middleware] supabase.auth.getUser user: { email: "...", id: "..." }` — should show user
   - `[getCurrentUser] user {...}` — should show user object

### Quick Auth Test Flow

```
1. Start server:    npm run dev
2. Open browser:    http://localhost:3000
3. Login with:      student@test.com / 123
4. Verify:          Redirected to /dashboard
5. Check cookies:   DevTools → Application → Cookies → sb-access-token exists
6. Test API:        Open /api/auth/me in browser → returns JSON with user data
7. Test stats:      Open /api/stats?type=student → returns JSON
```

---

## Appendix: Auth Bug Fix Summary
See the deputy dashboard implementations here: [Deputy dashboard code samples](docs/deputy-dashboards.md)

### Files Modified

| File | Change | Reason |
|------|--------|--------|
| `src/lib/supabase/client.ts` | `createClient` → `createBrowserClient` from `@supabase/ssr` | `createClient` doesn't write SSR cookies; `createBrowserClient` does |
| `src/middleware.ts` | Fixed `setAll` cookie propagation | Original code recreated `supabaseResponse` in loop, losing cookie values |
| `prisma/seed.ts` | Added type assertion `(u: any)` to `.find()` | TypeScript strictness issue with `never` type |

### Package Verification

- Uses `@supabase/ssr` v0.10.3 ✅
- No `@supabase/auth-helpers-nextjs` package present ✅
- Uses only one auth approach (`@supabase/ssr`) ✅

### Why Auth Cookies Didn't Reach getUser()

1. **Browser client used wrong import**: `createClient` from `@supabase/supabase-js` stores auth session in memory/localStorage only — it does NOT write cookies to the HTTP response.
2. **Server side looks for cookies**: `createServerClient` from `@supabase/ssr` reads auth tokens from cookies named `sb-access-token` / `sb-refresh-token`.
3. **Mismatch**: Browser stored session in memory → server found no cookies → `AuthSessionMissingError`.
4. **Fix**: `createBrowserClient` from `@supabase/ssr` automatically writes auth cookies after `signInWithPassword()` succeeds.

### Verification After Fix

1. Clear all browser cookies
2. `npm run build` (production build)
3. `npm run dev` (or `npm start`)
4. Login with `student@test.com` / `123`
5. Open DevTools → Application → Cookies → localhost:3000
6. Confirm `sb-access-token` and `sb-refresh-token` exist
7. Confirm `/api/auth/me` returns 200 with user data