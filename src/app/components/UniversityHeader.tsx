"use client";

import { User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import type { UserRole } from "./UniversityDashboard";
import { useSession } from "@/lib/session";
import { NotificationBell } from "./notifications/NotificationBell";
import { useNotifications } from "./notifications/notifications-context";


/** Human-readable labels for every UserRole value */
const ROLE_LABELS: Record<UserRole, string> = {
  "student": "Student",
  "lecturer": "Lecturer",
  "university-deputy": "University Deputy",
  "admin-deputy": "Admin Deputy",
  "dean": "Dean",
  "senior-officer": "Senior Officer",
};

interface UniversityHeaderProps {
  role: UserRole;
  onPageChange: (page: any) => void;
}



export function UniversityHeader({ role, onPageChange }: UniversityHeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("User");

  const { user } = useSession();
  const { unreadCount, unreadMessages, markAllAsRead } = useNotifications();

  // keep existing userName behavior (this header currently uses a placeholder)
  useEffect(() => {
    void user?.email;
  }, [user?.email]);

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join("");

  const rolePossessionLabel = ROLE_LABELS[role] || role;


  const userInitials = getInitials(userName);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-orange-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Page title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500">Welcome back !</p>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell
            unreadCount={unreadCount}
            unreadMessages={unreadMessages}
            onMarkAllAsRead={markAllAsRead}
          />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-all duration-300 hover:scale-[1.02]">
                <Avatar className="h-10 w-10 border-2 border-orange-500">
                  <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-600 text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {rolePossessionLabel}: {userName}
                  </p>
                  <p className="text-xs text-gray-500">{rolePossessionLabel}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" 
                                className="w-56 bg-white shadow-lg rounded-md p-1">
              <DropdownMenuItem
                onClick={() => onPageChange("account-details")}
                className="cursor-pointer hover:bg-orange-50"
              >
                <User className="w-4 h-4 mr-2" />
                Account Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}