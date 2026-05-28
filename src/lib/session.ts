export type UserRole = 'student' | 'faculty-admin' | 'university-deputy' | 'faculty-deputy' | 'dean' | 'senior-officer';

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
// Server components should fetch session data directly.
export function useSession(): { user: SessionUser } {
  return {
    user: {
      id: 0,
      email: "",
      full_name: "",
      user_type: "",
      role: "student",
      department_id: 0,
      registration_or_employee_no: "",
    },
  };
}

