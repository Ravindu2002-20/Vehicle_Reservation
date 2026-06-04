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
    const email = user.email;

    // Supabase Auth is the primary identity source.
    // If no row exists by supabase_id, try to reconcile by email and fill supabase_id.
    let appUser = await prisma.user
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);

    if (!appUser) {
      appUser = await prisma.user
        .findUnique({ where: { email } })
        .catch(() => null);

      if (appUser) {
        if (appUser.supabase_id && appUser.supabase_id !== supabaseId) {
          console.warn(
            "[getCurrentUser] supabase_id mismatch for user email:",
            email,
            { expected: supabaseId, actual: appUser.supabase_id }
          );
          appUser = null;
        } else if (!appUser.supabase_id) {
          appUser = await prisma.user.update({
            where: { id: appUser.id },
            data: { supabase_id: supabaseId },
          });
          console.log(
            "[getCurrentUser] linked existing Prisma user to Supabase auth user:",
            { userId: appUser.id, email: appUser.email, supabaseId }
          );
        }
      }
    }

    console.log("[getCurrentUser] prisma.user by supabase_id/email:", {
      found: !!appUser,
      supabaseId,
      email,
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

    let appAdmin = await prisma.admin
      .findUnique({ where: { supabase_id: supabaseId } })
      .catch(() => null);

    if (!appAdmin) {
      appAdmin = await prisma.admin
        .findUnique({ where: { email } })
        .catch(() => null);

      if (appAdmin) {
        if (appAdmin.supabase_id && appAdmin.supabase_id !== supabaseId) {
          console.warn(
            "[getCurrentUser] supabase_id mismatch for admin email:",
            email,
            { expected: supabaseId, actual: appAdmin.supabase_id }
          );
          appAdmin = null;
        } else if (!appAdmin.supabase_id) {
          appAdmin = await prisma.admin.update({
            where: { id: appAdmin.id },
            data: { supabase_id: supabaseId },
          });
          console.log(
            "[getCurrentUser] linked existing Prisma admin to Supabase auth user:",
            { adminId: appAdmin.id, email: appAdmin.email, supabaseId }
          );
        }
      }
    }

    console.log("[getCurrentUser] prisma.admin by supabase_id/email:", {
      found: !!appAdmin,
      supabaseId,
      email,
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

    console.warn(
      "[getCurrentUser] no matching Prisma user/admin found for Supabase user."
    );
    console.warn(
      "[getCurrentUser] run npm run sync:supabase-auth or scripts/sync-users-to-supabase-auth.ts to reconcile existing users."
    );
    return null;
  } catch (err) {
    console.log("[getCurrentUser] caught error:", err);
    return null;
  }
}