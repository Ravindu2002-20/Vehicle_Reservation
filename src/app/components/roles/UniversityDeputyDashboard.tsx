"use client";

import { useEffect, useState } from "react";
import { Clock, Car, TrendingUp, Award } from "lucide-react";

import { PendingApprovalsView } from "./PendingApprovalsView";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type FacultyStat = {
  id?: number;
  name: string;
  requestsCount: number;
  vehiclesCount: number;
};

export function UniversityDeputyDashboard({ currentPage }: { currentPage?: string }) {
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [facultyStats, setFacultyStats] = useState<FacultyStat[]>([]);


  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats?type=admin");
        const payload = await res.json();
        setPendingRequests(payload?.data?.pendingApprovals ?? 0);
      } catch {
        setPendingRequests(0);
      }
    }

    async function loadFacultyStats() {
      try {
        const res = await fetch("/api/stats/faculty");
        const payload = await res.json();
        setFacultyStats(payload?.data ?? []);
      } catch {
        setFacultyStats([]);
      }
    }

    loadStats();
    loadFacultyStats();
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">University Deputy Registrar Dashboard</h1>
        <p className="text-gray-600 mt-2">University-wide vehicle management and oversight</p>
      </div>

      {/* University-Wide Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-orange-600">12</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Car className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-amber-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Requests</p>
                <p className="text-3xl font-bold text-amber-600">284</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-rose-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending request</p>
                <p className="text-3xl font-bold text-rose-600">{pendingRequests}</p>
              </div>
              <div className="bg-rose-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Performance */}
      <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Award className="w-5 h-5" />
            Faculty Performance Overview
          </CardTitle>
          <CardDescription>Reservation statistics by faculty</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-amber-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(facultyStats ?? []).map((faculty, i) => (
              <div
                key={faculty.id ?? i}
                className="p-4 bg-white rounded-lg border-l-4 border-orange-500 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                <h4 className="font-semibold text-gray-800 mb-3">{faculty.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Requests</span>
                    <span className="font-bold text-orange-600">{faculty.requestsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vehicles</span>
                    <span className="font-bold text-orange-600">{faculty.vehiclesCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals (Admin) */}
      <div className="pt-4">
        {/* Render only for admin-role users (handled in PendingApprovalsView via supabase session) */}
        {/* Lazy UI: if user is null, view will still render and disable actions */}
        <PendingApprovalsView />
      </div>
    </div>

  );
}



