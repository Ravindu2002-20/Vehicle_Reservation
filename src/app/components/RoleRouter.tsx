"use client";
import { UniversityDashboard } from "./UniversityDashboard";

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

interface RoleRouterProps {
  role: UserRole;
}

/**
 * RoleRouter
 *
 * Centralized role-based routing component.
 * Accepts a validated role and renders the correct dashboard.
 * Falls back to null for unknown roles (upstream should handle errors).
 */
export function RoleRouter({ role }: RoleRouterProps) {
  // Role validation — if role is not in the valid set, return null
  // so the parent (DashboardPage) can show the error/unauthorized screen.
  if (!VALID_ROLES.includes(role)) {
    console.warn("[RoleRouter] unknown role received:", role);
    return null;
  }

  return <UniversityDashboard role={role} />;
}