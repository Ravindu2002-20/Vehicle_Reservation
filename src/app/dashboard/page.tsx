"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UniversityDashboard } from "../components/UniversityDashboard";

export type UserRole =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

export default function DashboardPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      const normalizeRole = (role: unknown): UserRole => {
        const r = String(role ?? "").trim();
        const normalized = r.includes("_") ? r.replaceAll("_", "-") : r;

        // Map known variants to the union used by the UI
        switch (normalized) {
          case "university-deputy":
            return "university-deputy";
          case "admin-deputy":
            return "admin-deputy";
          case "dean":
            return "dean";
          case "senior-officer":
            return "senior-officer";
          case "student":
            return "student";
          case "lecturer":
            return "lecturer";
          default:
            // fallback to best-effort cast
            return normalized as UserRole;
        }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <UniversityDashboard role={currentRole} />;
}