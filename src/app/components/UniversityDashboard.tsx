import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { StudentDashboard } from "./user/StudentDashboard";
import { UniversityDeputyDashboard } from "./roles/UniversityDeputyDashboard";
import { AdminDeputyDashboard } from "./roles/AdminDeputyDashboard";
import { DeanDashboard } from "./roles/DeanDashboard";
import SeniorOfficerDashboardPage from "./roles/senior-officer/SeniorOfficerDashboardPage";
import VehicleAllocationPage from "./roles/senior-officer/VehicleAllocationPage";
import RequestAllocationDetailPage from "./roles/senior-officer/RequestAllocationDetailPage";
import SchedulePage from "./roles/senior-officer/SchedulePage";
import DriversPage from "./roles/senior-officer/DriversPage";
import VehiclesPage from "./roles/senior-officer/VehiclesPage";
import MessagesPage from "./roles/senior-officer/MessagesPage";

import { AdminAccountDetailsPage } from "./roles/AdminAccountDetailsPage";
import SeniorOfficerAccountDetailsPage from "./roles/senior-officer/SeniorOfficerAccountDetailsPage";

import { ApprovedRequestsView } from "./roles/ApprovedRequestsView";
import { DeanApprovedRequestsTable } from "./roles/DeanApprovedRequestsTable";
import { AdminMessagesPage } from "./roles/AdminMessagesPage";
import ReportsPage from "./roles/ReportsPage";

export type UserRole =
  | "student"
  | "lecturer"
  | "university-deputy"
  | "admin-deputy"
  | "dean"
  | "senior-officer";

export type StudentPage =
  | "reservation-form"
  | "messages"
  | "previous-requests"
  | "account-details"
  | "edit-profile"
  | "dashboard"
  | "approvals"
  | "users"
  | "analytics"
  | "settings"
  | "fleet-status";

export type AdminPage = "dashboard" | "approvals" | "messages" | "reports";

export type SeniorOfficerPage =
  | "senior-dashboard"
  | "vehicle-allocation"
  | "schedule"
  | "drivers"
  | "vehicles"
  | "messages"
  | "account-details"; // ← added so the type accepts it

export function isAdminRole(role: UserRole): boolean {
  return (
    role === "university-deputy" ||
    role === "admin-deputy" ||
    role === "dean" ||
    role === "senior-officer"
  );
}

interface UniversityDashboardProps {
  role: UserRole;
}

export function UniversityDashboard({ role }: UniversityDashboardProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<StudentPage | SeniorOfficerPage>(
    role === "student" || role === "lecturer"
      ? "reservation-form"
      : role === "senior-officer"
        ? "senior-dashboard"
        : "dashboard"
  );

  const effectiveAdminPage: AdminPage | null =
    role && isAdminRole(role) && role !== "senior-officer"
      ? (currentPage as unknown as AdminPage)
      : null;

  const effectiveSeniorOfficerPage: SeniorOfficerPage | null =
    role === "senior-officer" ? (currentPage as SeniorOfficerPage) : null;

  const renderAdminContent = () => {
    // ── Account details: handle for ALL roles first, before any role routing ──
    if (currentPage === "account-details") {
      if (role === "senior-officer") return <SeniorOfficerAccountDetailsPage />;
      return <AdminAccountDetailsPage />;
    }

    // ── Senior Officer pages (fully isolated) ─────────────────────────────────
    if (role === "senior-officer" && effectiveSeniorOfficerPage) {
      if (effectiveSeniorOfficerPage === "senior-dashboard") {
        return selectedRequestId ? (
          <RequestAllocationDetailPage
            requestId={selectedRequestId}
            onAllocated={() => setSelectedRequestId(null)}
            onCancel={() => setSelectedRequestId(null)}
          />
        ) : (
          <SeniorOfficerDashboardPage onSelectRequest={setSelectedRequestId} />
        );
      }
      if (effectiveSeniorOfficerPage === "vehicle-allocation") {
        return selectedRequestId ? (
          <RequestAllocationDetailPage
            requestId={selectedRequestId}
            onAllocated={() => setSelectedRequestId(null)}
            onCancel={() => setSelectedRequestId(null)}
          />
        ) : (
          <VehicleAllocationPage onSelectRequest={setSelectedRequestId} />
        );
      }
      if (effectiveSeniorOfficerPage === "schedule")  return <SchedulePage />;
      if (effectiveSeniorOfficerPage === "drivers")   return <DriversPage />;
      if (effectiveSeniorOfficerPage === "vehicles")  return <VehiclesPage />;
      if (effectiveSeniorOfficerPage === "messages")  return <MessagesPage />;

      return <SeniorOfficerDashboardPage onSelectRequest={setSelectedRequestId} />;
    }

    // ── Admin messages tab ────────────────────────────────────────────────────
    if (currentPage === "messages") {
      return <AdminMessagesPage />;
    }

    // ── Admin reports tab (university-deputy + admin-deputy only) ─────────────
    if (
      effectiveAdminPage === "reports" &&
      (role === "university-deputy" || role === "admin-deputy")
    ) {
      return <ReportsPage role={role} />;
    }

    // ── Admin approvals tab ───────────────────────────────────────────────────
    if (effectiveAdminPage === "approvals") {
      if (role === "dean") return <DeanApprovedRequestsTable />;
      return <ApprovedRequestsView />;
    }

    // ── Default dashboard per admin role ──────────────────────────────────────
    if (role === "university-deputy") return <UniversityDeputyDashboard />;
    if (role === "admin-deputy")      return <AdminDeputyDashboard />;
    if (role === "dean")              return <DeanDashboard />;

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <UniversitySidebar role={role} currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <UniversityHeader role={role} onPageChange={setCurrentPage} />

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={role + currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {role === "student" || role === "lecturer" ? (
                <StudentDashboard currentPage={currentPage as StudentPage} />
              ) : (
                renderAdminContent()
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}