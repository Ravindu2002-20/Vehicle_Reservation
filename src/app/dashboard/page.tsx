"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleRouter } from "../components/RoleRouter";

export type UserRole =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

const VALID_ROLES: UserRole[] = [
  "student",
  "lecturer",
  "university-deputy",
  "admin-deputy",
  "dean",
  "senior-officer",
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/auth/me");
        const payload = await res.json().catch(() => null);

        if (!res.ok || !payload?.data?.role) {
          console.log("[dashboard] /api/auth/me failed or no role, redirecting to /login");
          router.push("/login");
          return;
        }

        const role = String(payload.data.role ?? "").trim();
        const normalized = role.replaceAll("_", "-") as UserRole;

        console.log("CURRENT ROLE:", normalized);

        if (!VALID_ROLES.includes(normalized)) {
          console.warn("[dashboard] unknown/invalid role:", normalized);
          setError(`Unauthorized: unknown role "${normalized}"`);
          return;
        }

        setCurrentRole(normalized);
      } catch {
        console.log("[dashboard] fetch error, redirecting to /login");
        router.push("/login");
        return;
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Unknown/unauthorized role -> show error screen, NOT student dashboard
  if (error || !currentRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Unauthorized</h1>
          <p className="text-gray-500">
            {error || "Your account does not have access to this system. Please contact an administrator."}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <RoleRouter role={currentRole} />;
}