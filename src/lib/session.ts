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

// Minimal client-side hook used by UI components.
// Reads from sessionStorage where auth stores the user data.
export function useSession(): { user: SessionUser } {
  let stored: any = null;
  if (typeof window !== "undefined") {
    try {
      stored = JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      // ignore
    }
  }

  const defaultUser: SessionUser = {
    id: 0,
    email: "",
    full_name: "",
    user_type: "",
    role: "student",
    department_id: 0,
    registration_or_employee_no: "",
  };

  if (!stored) {
    return { user: defaultUser };
  }

  return {
    user: {
      id: stored.id ?? stored.user_id ?? 0,
      email: stored.email ?? "",
      full_name: stored.full_name ?? "",
      user_type: stored.user_type ?? "",
      role: stored.role ?? "student",
      department_id: stored.department_id ?? 0,
      registration_or_employee_no: stored.registration_or_employee_no ?? "",
      telephone: stored.telephone ?? null,
      department: stored.department
        ? {
            faculty: stored.department.faculty ?? null,
            name: stored.department.name ?? null,
          }
        : null,
    },
  };
}

