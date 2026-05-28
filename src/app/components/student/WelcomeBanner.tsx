"use client";

import { useState, useEffect } from "react";
import { Car, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { getAuth } from "@/lib/api";

interface Stats {
  availableVehicles: number;
  activeBookings: number;
  unreadMessages: number;
}

export function WelcomeBanner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = getAuth()?.full_name || "User";

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats?type=student");
        const data = await res.json();
        if (data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statsItems = loading
    ? [
        { label: "Available", value: "Loading...", icon: Car },
        { label: "Your Bookings", value: "Loading...", icon: Calendar },
        { label: "Messages", value: "Loading...", icon: MessageSquare },
      ]
    : [
        { label: "Available", value: `${stats?.availableVehicles || 0} Vehicles`, icon: Car },
        { label: "Your Bookings", value: `${stats?.activeBookings || 0} Active`, icon: Calendar },
        { label: "Messages", value: `${stats?.unreadMessages || 0} Unread`, icon: MessageSquare },
      ];

  return (
    <Card className="shadow-lg border-0 mb-6 overflow-hidden rounded-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-orange-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Welcome to Vehicle Reservation System</h2>
              <p className="text-amber-100 mb-4">
                Quick and easy vehicle reservation for university {userName.toLowerCase().includes("student") ? "students" : "staff"}
              </p>
              <div className="flex flex-wrap gap-6">
                {statsItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-orange-500 bg-opacity-50 p-2 rounded-lg">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-200">{item.label}</p>
                      <p className="font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}