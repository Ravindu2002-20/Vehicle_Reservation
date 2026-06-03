"use client";

import { useEffect, useState } from "react";
import { Clock, Award, CheckCircle2 } from "lucide-react";

import { PendingApprovalsView } from "./PendingApprovalsView";
import { OngoingRequestsView } from "./OngoingRequestsView";

import {
  Card,

  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type FacultyStat = {
  id?: number;
  name: string;
  requestsCount: number;
  vehiclesCount: number;
};

export function DeanDashboard({ currentPage }: { currentPage?: string }) {
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [approvedThisMonth, setApprovedThisMonth] = useState<number>(0);
  const [facultyStats, setFacultyStats] = useState<FacultyStat[]>([]);


  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats?type=admin");
        const payload = await res.json();
        setPendingRequests(payload?.data?.pendingApprovals ?? 0);
        setApprovedThisMonth(payload?.data?.approvedThisMonth ?? 0);

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
        <h1 className="text-3xl font-bold text-gray-800">Dean's Dashboard</h1>
        <p className="text-gray-600 mt-2">Executive overview of faculty vehicle management</p>
      </div>

      {/* University-Wide Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-green-500 border-l-green-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved request</p>
                <p className="text-3xl font-bold text-green-600">{approvedThisMonth}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
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

        {/* Faculty Summary Card */}
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-amber-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 mb-1">Faculty name</p>
                <p className="text-xl font-bold text-orange-700 truncate">
                  {facultyStats?.[0]?.name ?? "—"}
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Vehicles</span>
                    <span className="font-bold text-orange-600">
                      {facultyStats?.[0]?.vehiclesCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Requests</span>
                    <span className="font-bold text-orange-600">
                      {facultyStats?.[0]?.requestsCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-100 p-3 rounded-full shrink-0">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>




      {/* Pending Approvals */}
      <div className="pt-4">
        <PendingApprovalsView />
      </div>

      {/* Ongoing Request */}
      <div className="pt-4">
        <OngoingRequestsView />
      </div>

    </div>
  );
}


