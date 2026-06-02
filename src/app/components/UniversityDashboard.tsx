import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { StudentDashboard } from "./user/StudentDashboard";
import { UniversityDeputyDashboard } from "./roles/UniversityDeputyDashboard";
import { AdminDeputyDashboard } from "./roles/AdminDeputyDashboard";
import { DeanDashboard } from "./roles/DeanDashboard";
import { SeniorOfficerDashboard } from "./roles/SeniorOfficerDashboard";
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

export type AdminPage = "dashboard" | "approvals" | "messages";


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
  const [currentPage, setCurrentPage] = useState<StudentPage>(
    role === "student" || role === "lecturer" ? "reservation-form" : "dashboard"
  );

  // single navigation state: for admin roles we interpret it as AdminPage
  const effectiveAdminPage: AdminPage = (
    role && isAdminRole(role) ? (currentPage as unknown as AdminPage) : "dashboard"
  );


  const renderAdminContent = () => {
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
    if (role === "senior-officer") return <SeniorOfficerDashboard />;
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
                <StudentDashboard currentPage={currentPage} />
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