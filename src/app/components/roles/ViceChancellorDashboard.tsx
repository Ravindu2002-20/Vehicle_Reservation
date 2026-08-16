"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, TrendingUp, Award, Car, Users } from "lucide-react";

import { OngoingRequestsView } from "./OngoingRequestsView";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type FacultyStat = {
  id?: number;
  name: string;
  requestsCount: number;
  vehiclesCount: number;
};

type AllocatedRequest = {
  id: number;
  requester: { id: number; full_name: string };
  vehicle: { vehicle_number: string; vehicle_type: string } | null;
  driver: { full_name: string } | null;
  travel_date_from: string;
  travel_date_to: string;
  purpose: string;
  distance_type: string;
  places_to_visit?: string | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ViceChancellorDashboard({ currentPage }: { currentPage?: string }) {
  const [approvals, setApprovals] = useState<number>(0);
  const [approvedThisMonth, setApprovedThisMonth] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [facultyStats, setFacultyStats] = useState<FacultyStat[]>([]);
  const [allocatedRequests, setAllocatedRequests] = useState<AllocatedRequest[]>([]);
  const [allocatedLoading, setAllocatedLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats?type=admin");
        const payload = await res.json();
        setApprovals(payload?.data?.approvedToday ?? 0);
        setApprovedThisMonth(payload?.data?.approvedThisMonth ?? 0);
        setPendingRequests(payload?.data?.pendingApprovals ?? 0);
      } catch {
        setApprovals(0);
        setApprovedThisMonth(0);
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

    async function loadAllocated() {
      setAllocatedLoading(true);
      try {
        const res = await fetch("/api/vehicle-requests?status=allocated");
        const payload = await res.json();
        setAllocatedRequests(payload?.data ?? []);
      } catch {
        setAllocatedRequests([]);
      } finally {
        setAllocatedLoading(false);
      }
    }

    loadStats();
    loadFacultyStats();
    loadAllocated();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Vice Chancellor Dashboard</h1>
        <p className="text-gray-600 mt-2">University-wide vehicle management and oversight</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approvals</p>
                <p className="text-3xl font-bold text-orange-600">{approvals}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-amber-500 border-l-amber-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Approvals</p>
                <p className="text-3xl font-bold text-amber-600">{approvedThisMonth}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-rose-500 border-l-rose-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-rose-600">{pendingRequests}</p>
              </div>
              <div className="bg-rose-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Allocated Trips Section */}
      <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-t-2 border-t-emerald-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Car className="w-5 h-5" />
            Allocated Trips
          </CardTitle>
          <CardDescription>Requests that have been allocated with vehicle and driver</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {allocatedLoading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : allocatedRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No allocated trips yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Travel Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Trip Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-emerald-700">REQ-{r.id}</TableCell>
                      <TableCell>{r.requester?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.vehicle ? `${r.vehicle.vehicle_number} (${r.vehicle.vehicle_type})` : "-"}</TableCell>
                      <TableCell>{r.driver?.full_name ?? "-"}</TableCell>
                      <TableCell>
                        {formatDate(r.travel_date_from)} → {formatDate(r.travel_date_to)}
                      </TableCell>
                      <TableCell>{r.purpose ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {r.distance_type ?? "-"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4">
        <OngoingRequestsView stage="vice-chancellor" />
      </div>
    </div>
  );
}
