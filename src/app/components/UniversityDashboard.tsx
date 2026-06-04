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
import VehicleStatusPage from "./roles/senior-officer/VehicleStatusPage";
import DriversPage from "./roles/senior-officer/DriversPage";
import VehiclesPage from "./roles/senior-officer/VehiclesPage";
import MessagesPage from "./roles/senior-officer/MessagesPage";

import { AdminAccountDetailsPage } from "./roles/AdminAccountDetailsPage";
import { ApprovedRequestsView } from "./roles/ApprovedRequestsView";
import { DeanApprovedRequestsTable } from "./roles/DeanApprovedRequestsTable";
import { AdminMessagesPage } from "./roles/AdminMessagesPage";


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

// Note: keep union types separate for typing convenience.
// `SeniorOfficerPage` is handled exclusively for `role === "senior-officer"`.


export type AdminPage = "dashboard" | "approvals" | "messages";

export type SeniorOfficerPage =
  | "senior-dashboard"
  | "vehicle-allocation"
  | "schedule"
  | "vehicle-status"
  | "drivers"
  | "vehicles"
  | "messages";




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
    // Senior Officer pages (fully isolated)
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
      if (effectiveSeniorOfficerPage === "schedule") return <SchedulePage />;
      if (effectiveSeniorOfficerPage === "vehicle-status") return <VehicleStatusPage />;
      if (effectiveSeniorOfficerPage === "drivers") return <DriversPage />;
      if (effectiveSeniorOfficerPage === "vehicles") return <VehiclesPage />;
      if (effectiveSeniorOfficerPage === "messages") return <MessagesPage />;
      return <SeniorOfficerDashboardPage onSelectRequest={setSelectedRequestId} />;
    }


    // Admin "account-details" should show admin account details
    if (currentPage === "account-details") {
      return <AdminAccountDetailsPage />;
    }

    // Admin "messages" tab
    if (currentPage === "messages") {
      return <AdminMessagesPage />;
    }

    // Admin "approvals" tab should show the approved requests table
    if (effectiveAdminPage === "approvals") {
      // Dean should see the table in the Dean style/spec
      if (role === "dean") {
        return <DeanApprovedRequestsTable />;
      }
      return <ApprovedRequestsView />;
    }


    // Default dashboard view for each admin role
    if (role === "university-deputy") return <UniversityDeputyDashboard />;
    if (role === "admin-deputy") return <AdminDeputyDashboard />;
    if (role === "dean") return <DeanDashboard />;

    return null;
  };




  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <UniversitySidebar role={role} currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <UniversityHeader role={role} onPageChange={setCurrentPage} />

        {/* Dashboard Content with Animation */}
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
