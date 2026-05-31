import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { StudentDashboard } from "./student/StudentDashboard";
import { FacultyAdminDashboard } from "./roles/AdminDashboard";
import { UniversityDeputyDashboard } from "./roles/UniversityDeputyDashboard";
import { FacultyDeputyDashboard as GeneralDeputyDashboard } from "./roles/General DeputyDashboard";
import { DeanDashboard } from "./roles/DeanDashboard";
import { FleetStatusView } from "./roles/FleetStatusView";
import { SeniorOfficerDashboard } from "./roles/SeniorOfficerDashboard";

export type UserRole = "student" | "faculty-admin" | "university-deputy" | "faculty-deputy" | "general-deputy" | "dean" | "senior-officer";

export type StudentPage = "reservation-form" | "messages" | "previous-requests" | "account-details" | "edit-profile" | "dashboard" | "approvals" | "users" | "analytics" | "settings" | "fleet-status";

interface UniversityDashboardProps {
  role: UserRole;
}

export function UniversityDashboard({ role }: UniversityDashboardProps) {
  const [currentPage, setCurrentPage] = useState<StudentPage>(
    role === "student" ? "reservation-form" : "dashboard"
  );

  function normalizeRole(inputRole: string): UserRole {
    const map: Record<string, UserRole> = {
      // DB values (Postgres) -> UI roles
      "General_deputy": "faculty-deputy",
      "general_deputy": "faculty-deputy",
      "faculty-deputy": "faculty-deputy",

      "University_deputy": "university-deputy",
      "university_deputy": "university-deputy",
      "university-deputy": "university-deputy",

      "Dean": "dean",
      "dean": "dean",

      "Senior_officer": "senior-officer",
      "senior_officer": "senior-officer",
      "senior-officer": "senior-officer",

      "Faculty_admin": "faculty-admin",
      "faculty_admin": "faculty-admin",
      "faculty-admin": "faculty-admin",

      // already-normalized values
      "student": "student",
    };

    return map[inputRole] ?? ("student" as UserRole);
  }

  const normalizedRole = normalizeRole(String(role));

  const renderAdminContent = () => {
    if (currentPage === "fleet-status") {
      return <FleetStatusView />;
    }

    // Approvals tab for each admin role
    if (currentPage === "approvals") {
      if (normalizedRole === "faculty-deputy") {
        return <GeneralDeputyDashboard currentPage={currentPage} />;
      }

      // Placeholder for other roles (avoid blank screens)
      if (
        normalizedRole === "faculty-admin" ||
        normalizedRole === "university-deputy" ||
        normalizedRole === "dean" ||
        normalizedRole === "senior-officer"
      ) {
        return (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
              <p className="text-sm text-gray-500">Approvals view is not implemented for this role yet.</p>
            </div>
          </div>
        );
      }
    }

    // Default dashboard view for each role
    if (normalizedRole === "faculty-admin") return <FacultyAdminDashboard currentPage={currentPage} />;
    if (normalizedRole === "university-deputy") return <UniversityDeputyDashboard currentPage={currentPage} />;
    if (normalizedRole === "faculty-deputy") return <GeneralDeputyDashboard currentPage={currentPage} />;
    if (normalizedRole === "dean") return <DeanDashboard currentPage={currentPage} />;
    if (normalizedRole === "senior-officer") return <SeniorOfficerDashboard currentPage={currentPage} />;

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
              {role === "student" ? (
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