"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./LoginPage";
import { getAuth } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuth();
    if (user) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <LoginPage />;
}