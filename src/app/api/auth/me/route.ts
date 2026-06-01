import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

type AdminOrUserRole =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

const VALID_ROLES: AdminOrUserRole[] = [
  "student",
  "lecturer",
  "university-deputy",
  "admin-deputy",
  "dean",
  "senior-officer",
];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // NOTE:
    // This endpoint is meant to be called from the client.
    // We rely on the browser Supabase auth cookie being present.
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.auth as any).getUser();

    if (error || !data?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = data.user.email;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const role = (user.user_type as AdminOrUserRole) || "student";
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
      }

      return NextResponse.json({
        data: {
          type: "user",
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role,
          user_type: user.user_type,
        },
      });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const role = (admin.admin_role as AdminOrUserRole) || "student";
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid admin role" }, { status: 403 });
      }

      return NextResponse.json({
        data: {
          type: "admin",
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role,
          admin_role: admin.admin_role,
        },
      });
    }

    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ error: "Failed to resolve auth" }, { status: 500 });
  }
}


