"use client";

import { Bell, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import type { UserRole } from "./UniversityDashboard";
import type { StudentPage } from "./UniversityDashboard";
import { getAuth } from "@/lib/api";

interface UniversityHeaderProps {
  role: UserRole;
  onPageChange: (page: StudentPage) => void;
}

export function UniversityHeader({ role, onPageChange }: UniversityHeaderProps) {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const user = getAuth();
    if (user && user.full_name) {
      setUserName(user.full_name);
    }
    fetchNotificationCount();
  }, []);

  async function fetchNotificationCount() {
    try {
      const res = await fetch("/api/stats?type=student");
      const data = await res.json();
      if (data.data?.unreadMessages !== undefined) {
        setNotificationCount(data.data.unreadMessages);
      }
    } catch {
      // ignore
    }
  }

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join("");

  const rolePossessionLabel =
    role === "student" ? "Student" : role.replace("-", " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const userInitials = getInitials(userName);

  const handleSignOut = () => {
    sessionStorage.removeItem("user");
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-orange-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Page title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500">Welcome back, {userName}!</p>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-orange-50 transition-all duration-300 hover:scale-105">
            <Bell className="w-6 h-6 text-gray-600" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500 text-white text-xs animate-pulse">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </button>

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