# Vehicle_Reservation — Code Bundle (for GPT Review)

This Markdown file includes the source code (code blocks) for the **critical set** selected for review:

- `src/app/api/**`
- `src/app/components/roles/**`
- `src/app/dashboard/**`
- `src/app/requests/**`
- `src/lib/**`
- `prisma/schema.prisma`

> Note: If you are pasting/uploading to a model with size limits, use chunking. This file may be large.

---

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
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
  full_name                   String
  user_type                   String
  registration_or_employee_no String           @unique
  designation                 String?
  telephone                   String?
  email                       String           @unique
  password                    String
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
  full_name               String
  admin_role              String
  telephone               String?
  email                   String           @unique
  password                String
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

---

## `src/lib/**`

### `src/lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### `src/lib/auth.ts`

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "vehicle-reservation-secret-key-change-in-production";

export interface JWTPayload {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  department_id: number;
  registration_or_employee_no: string;
  type: "user" | "admin";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(): JWTPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
}
```

### `src/lib/session.ts`

```ts
export type UserRole = 'student' | 'faculty-admin' | 'university-deputy' | 'faculty-deputy' | 'dean' | 'senior-officer';

export interface SessionUser {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  role: UserRole;

  // Department can be present (e.g., student profile) but is optional in the minimal client hook.
  department?: {
    faculty?: string | null;
    name?: string | null;
  } | null;

  department_id: number;
  registration_or_employee_no: string;
  telephone?: string | null;
}


export interface SessionAdmin {
  id: number;
  email: string;
  full_name: string;
  admin_role: string;
  role: UserRole;
  department_id: number;
}

export type Session = SessionUser | SessionAdmin | null;

// Minimal client-side hook used by UI components.
// Server components should fetch session data directly.
export function useSession(): { user: SessionUser } {
  return {
    user: {
      id: 0,
      email: "",
      full_name: "",
      user_type: "",
      role: "student",
      department_id: 0,
      registration_or_employee_no: "",
    },
  };
}
```

### `src/lib/api.ts`

```ts
export function getAuth() {
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    // ignore
  }
  if (!user) return null;
  return user;
}

export function fetchUser() {
  return getAuth();
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getFetchError(res: Response, payload: any) {
  return payload?.error ?? `Request failed with status ${res.status}`;
}

export async function getUserProfile() {
  const user = getAuth();
  if (!user) return null;

  try {
    const res = await fetch(`/api/profile?user_id=${user.id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function getUserRequests() {
  const user = getAuth();
  if (!user) return { data: [] as any[] };

  try {
    const res = await fetch(`/api/vehicle-requests?user_id=${user.id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload;
  } catch {
    return { data: [] as any[] };
  }
}

export async function getUserRequestById(id: number) {
  try {
    const res = await fetch(`/api/requests/${id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.data ?? null;
  } catch (err) {
    throw err;
  }
}

export async function deleteUserRequest(id: number) {
  try {
    const res = await fetch(`/api/requests/${id}`, {
      method: "DELETE",
    });

    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload?.success === true;
  } catch (err) {
    throw err;
  }
}

export async function getMessages() {
  const user = getAuth();
  if (!user) return [];

  try {
    const res = await fetch(`/api/messages/inbox?user_id=${user.id}`);
    const payload = await parseJsonSafe(res);
    if (!res.ok) throw new Error(getFetchError(res, payload));
    return payload;
  } catch {
    return [];
  }
}
```

---

## `src/app/api/**`

### `src/app/api/auth/login/route.ts`

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 400, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Try finding user first (matches Prisma "user" table)
    let user = await prisma.user.findUnique({ where: { email } });
    let userType: "user" | "admin" = "user";
    let payloadData: any = null;

    if (user) {
      // Support both bcrypt-hashed and plain text passwords for DB compatibility
      const passwordValid =
        user.password.startsWith("$2")
          ? await bcrypt.compare(password, user.password)
          : user.password === password;

      if (!passwordValid) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      payloadData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        department_id: user.department_id,
        registration_or_employee_no: user.registration_or_employee_no,
      };
    } else {
      // Try admin table
      let admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Support both bcrypt-hashed and plain text passwords
      const passwordValid =
        admin.password.startsWith("$2")
          ? await bcrypt.compare(password, admin.password)
          : admin.password === password;

      if (!passwordValid) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }

      userType = "admin";
      payloadData = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        user_type: admin.admin_role,
        department_id: admin.department_id || 0,
        registration_or_employee_no: "",
      };
    }

    const tokenPayload = {
      ...payloadData,
      type: userType as "user" | "admin",
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      status: 200,
      data: {
        user: tokenPayload,
        token,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { status: 500, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
```

### `src/app/api/auth/logout/route.ts`

```ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: 200, message: "Logged out" });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
```

### `src/app/api/profile/route.ts`

```ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Temporary placeholder for authenticated user id.
    // Current frontend stores auth in sessionStorage; server can't access it,
    // so we accept a header as a stand-in.
    const userIdHeader = req.headers.get("x-user-id");
    const userId = userIdHeader ? Number(userIdHeader) : null;

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!user) {
