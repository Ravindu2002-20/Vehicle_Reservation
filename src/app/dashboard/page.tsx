"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UniversityDashboard } from "../components/UniversityDashboard";
import { getAuth } from "@/lib/api";

export type UserRole = "student" | "faculty-admin" | "university-deputy" | "faculty-deputy" | "dean" | "senior-officer";

export default function DashboardPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuth();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentRole((user.user_type as UserRole) || "student");
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