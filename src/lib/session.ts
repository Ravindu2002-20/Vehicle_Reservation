/**
 * Unified role type covering every user_type / admin_role value stored in the DB.
 *
 * User table `user_type` values:
 *   "student", "lecturer"
 *
 * Admin table `admin_role` values:
 *   "university-deputy", "admin-deputy", "dean", "senior-officer"
 */
export type UserRole = 'student' | 'lecturer' | 'university-deputy' | 'admin-deputy' | 'dean' | 'senior-officer';

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

import { createClient } from "@supabase/supabase-js";

// Client-side hook used by UI components.
// Option A: return the currently authenticated Supabase user.
export function useSession(): { user: SessionUser | null } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return { user: null };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  // getSession is typically sync for the current in-memory session, but keep this defensive.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybePromise = (supabase.auth as any).getSession
    ? (supabase.auth as any).getSession()
    : null;

  if (maybePromise && typeof maybePromise.then === "function") {
    // If it's async in this environment, we can't await in a hook sync return.
    return { user: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (maybePromise as any)?.data?.session ?? maybePromise?.session ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (session?.user ?? null) as any;

  if (!user) return { user: null };

  const id = Number(user.id ?? user.user_metadata?.id ?? user.user_metadata?.sub ?? 0);

  return {
    user: {
      id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? "",
      user_type: user.user_metadata?.user_type ?? "",
      role: (user.user_metadata?.role ?? "student") as UserRole,
      department_id: Number(user.user_metadata?.department_id ?? 0),
      registration_or_employee_no:
        user.user_metadata?.registration_or_employee_no ?? "",
      department: null,
    },
  };
}

