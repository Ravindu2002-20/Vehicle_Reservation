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
  "student",
  "lecturer",
  "university-deputy",
  "admin-deputy",
  "dean",
  "senior-officer",
];

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log("[getCurrentUser] user", user);

    console.log("[getCurrentUser] supabase.auth.getUser():", {
      error,
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : null,
    });

    if (error || !user?.id || !user?.email) return null;

    const supabaseId = user.id;

    // Supabase Auth is the ONLY identity source.
    // Prisma lookup MUST be by supabase_id. No email-based authentication.
    let appUser = await prisma.user
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);

    console.log("[getCurrentUser] prisma.user by supabase_id:", {
      found: !!appUser,
      supabaseId,
    });

    if (appUser) {
      const role = (appUser.user_type as UnifiedRoleType) ?? "student";
      console.log("[getCurrentUser] mapped prisma.user:", {
        appUserId: appUser.id,
        email: appUser.email,
        role,
        validRole: VALID_ROLES.includes(role),
      });
      if (!VALID_ROLES.includes(role)) return null;
      return {
        id: appUser.id,
        email: appUser.email,
        role,
        type: "user",
        department_id: appUser.department_id,
      };
    }

    // Try admin: supabase_id first, then email
    let appAdmin = await prisma.admin
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);
    console.log("[getCurrentUser] prisma.admin by supabase_id:", {
      found: !!appAdmin,
      supabaseId,
    });


    if (appAdmin) {
      const role = (appAdmin.admin_role as UnifiedRoleType) ?? "admin-deputy";
      console.log("[getCurrentUser] mapped prisma.admin:", {
        appAdminId: appAdmin.id,
        email: appAdmin.email,
        role,
        validRole: VALID_ROLES.includes(role),
      });
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
