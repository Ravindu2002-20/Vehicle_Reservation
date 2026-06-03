import { FileText, MessageSquare, History, LayoutDashboard, Settings, FileCheck, Users, BarChart3, Car } from "lucide-react";
import type { AdminPage, StudentPage, UserRole } from "./UniversityDashboard";


/** Human-readable labels for every UserRole value */
const ROLE_LABELS: Record<UserRole, string> = {
  "student": "Student",
  "lecturer": "Lecturer",
  "university-deputy": "University Deputy",
  "admin-deputy": "Admin Deputy",
  "dean": "Dean",
  "senior-officer": "Senior Officer",
};

type UniversitySidebarPage = StudentPage | AdminPage;

interface UniversitySidebarProps {
  role: UserRole;
  currentPage: StudentPage;
  onPageChange: (page: StudentPage) => void;
}

export function UniversitySidebar({ role, currentPage, onPageChange }: UniversitySidebarProps) {
  // Student menu items
  const studentMenuItems: Array<{ id: StudentPage; label: string; icon: any }> = [
    { id: "dashboard" as StudentPage, label: "Dashboard", icon: LayoutDashboard },
    { id: "reservation-form" as StudentPage, label: "Vehicle Reservation", icon: FileText },
    { id: "messages" as StudentPage, label: "Messages", icon: MessageSquare },
    { id: "previous-requests" as StudentPage, label: "Previous Requests", icon: History },
  ];


  // Admin menu items.
  const adminMenuItems: Array<{ id: AdminPage; label: string; icon: any }> = [
    { id: "dashboard" as AdminPage, label: "Dashboard", icon: LayoutDashboard },
    { id: "approvals" as AdminPage, label: "Approvals", icon: FileCheck },
    { id: "messages" as AdminPage, label: "Messages", icon: MessageSquare },
  ];

  const menuItems = role === "student" || role === "lecturer" ? studentMenuItems : adminMenuItems;


  return (
    <div className="w-64 bg-gradient-to-b from-amber-600 to-orange-600 text-white shadow-xl relative">
      {/* Logo/Title */}
      <div className="p-6 border-b border-orange-500">
        <h1 className="text-xl font-bold">Vehicle Reservation</h1>
        <p className="text-sm text-amber-100 mt-1">Management System</p>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              currentPage === item.id
                ? "bg-orange-500 shadow-lg scale-103 brightness-110"
                : "hover:bg-orange-500 hover:scale-103 hover:shadow-md hover:brightness-110"
            }`}
          >
            <item.icon
              className={`w-5 h-5 transition-transform duration-300 ${currentPage !== item.id ? "group-hover:translate-x-1" : ""}`}
            />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Role Badge */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-orange-900 bg-opacity-60 rounded-lg p-3 text-center">
          <p className="text-xs text-amber-200">Current Role</p>
          <p className="text-sm font-semibold">
            {ROLE_LABELS[role] || role}
          </p>
        </div>
      </div>
    </div>
  );
}

