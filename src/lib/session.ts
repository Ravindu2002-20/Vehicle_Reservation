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
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}

