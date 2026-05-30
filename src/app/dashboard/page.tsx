"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UniversityDashboard } from "../components/UniversityDashboard";
import { getAuth } from "@/lib/api";

/**
 * Unified role type covering every user_type / admin_role value stored in the DB.
 *
 * User table `user_type` values → mapped directly:
 *   "student", "lecturer"
 *
 * Admin table `admin_role` values → mapped directly:
 *   "university-deputy", "admin-deputy", "dean", "senior-officer"
 */
export type UserRole =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

/** All valid role strings (used for runtime validation) */
const VALID_ROLES: string[] = [
  "student",
  "lecturer",
  "university-deputy",
  "admin-deputy",
  "dean",
  "senior-officer",
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(true);

  /**
   * IMPORTANT BUSINESS RULE:
   * 1. Determine which table the credentials came from (`type` field set by login API).
   * 2. If from `prisma.user`  (type === "user")  → use `user_type` column as the role.
   * 3. If from `prisma.admin` (type === "admin") → use `user_type` (admin_role) as the role.
   *
   * The login payload is stored in sessionStorage via `data.data.user`.
   */
  function normalizeRole(authUser: any): UserRole {
    // `type` is set by /api/auth/login/route.ts
    //   - prisma.user  -> type: "user"   (user_type comes from user.user_type)
    //   - prisma.admin -> type: "admin"  (user_type comes from admin.admin_role)
    const rawUserType = (authUser?.user_type || "").toLowerCase().trim();

    // --- From user table: the user_type column IS the user's role ---
    if (authUser?.type === "user") {
      if (VALID_ROLES.includes(rawUserType)) {
        return rawUserType as UserRole;
      }
      // Fallback: unknown user_type in user table → treat as student
      return "student";
    }

    // --- From admin table: admin_role is stored in user_type ---
    if (authUser?.type === "admin") {
      if (VALID_ROLES.includes(rawUserType)) {
        return rawUserType as UserRole;
      }
      // Fallback: unknown admin role → treat as student
      return "student";
    }

    return "student";
  }

  useEffect(() => {
    const user = getAuth();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentRole(normalizeRole(user));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <UniversityDashboard role={currentRole} />;
}
