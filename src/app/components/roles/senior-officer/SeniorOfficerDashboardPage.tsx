"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Calendar, FileCheck, FileText, Search } from "lucide-react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";

type AllocationStatus = "allocated" | "pending" | "not-allocated";

type VehicleRequestRow = {
  id: string;
  travel_date_from?: string | Date | null;
  travel_date_to?: string | Date | null;
  approval_status?: string;
  allocation_status?: AllocationStatus;
  vehicle_nature?: string | null;
  requester?: { full_name: string } | null;
  requester_name?: string | null;
  faculty?: { name?: string | null } | null;
  destination?: string | null;
  purpose?: string | null;
  trip_type?: string | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

export default function SeniorOfficerDashboardPage() {
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    newRequests: 0,
    ongoingTrips: 0,
  });

  const [newRequests, setNewRequests] = useState<VehicleRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        // Stats endpoint to be implemented in Step 4.
        // For now, best-effort fetch; UI should not crash.
        const [sRes, rRes] = await Promise.all([
          fetch("/api/stats?type=senior-officer"),
          fetch("/api/vehicle-requests?type=senior-officer-pending-allocation"),
        ]);

        const sJson = sRes.ok ? await sRes.json() : null;
        const rJson = rRes.ok ? await rRes.json() : null;

        if (!mounted) return;

        if (sJson?.data) {
          setStats({
            totalDrivers: sJson.data.totalDrivers ?? 0,
            totalVehicles: sJson.data.totalVehicles ?? 0,
            newRequests: sJson.data.newRequestsAwaitingAllocation ?? 0,
            ongoingTrips: sJson.data.ongoingTrips ?? 0,
          });
        }

        if (Array.isArray(rJson?.data)) {
          setNewRequests(rJson.data);
        } else if (Array.isArray(rJson)) {
          setNewRequests(rJson);
        }
      } catch {
        // swallow
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return newRequests;
    return newRequests.filter((r) => {
      const requester = r.requester?.full_name ?? r.requester_name ?? "";
      return (
        (r.id ?? "").toLowerCase().includes(q) ||
        (requester ?? "").toLowerCase().includes(q) ||
        (r.destination ?? "").toLowerCase().includes(q) ||
        (r.purpose ?? "").toLowerCase().includes(q)
      );
    });
  }, [newRequests, search]);

  return (
    <SeniorOfficerLayout
      title="Senior Officer Dashboard"
      subtitle="Allocate vehicles/drivers for approved-for-allocation requests and monitor ongoing trips."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-600">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-600">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-600">New Requests</CardTitle>
            <CardDescription>Awaiting allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.newRequests}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <FileCheck className="w-5 h-5" />
            Approved Requests Awaiting Allocation
          </CardTitle>
          <CardDescription>approval_status=approved_for_allocation & allocation_status=pending</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by request id, requester, destination, purpose..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Trip Type</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      No pending allocation requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const requester = r.requester?.full_name ?? r.requester_name ?? "";
                    const facultyName = r.faculty?.name ?? "";
                    const tripType = r.trip_type ?? "";
                    const allocationStatus = r.allocation_status ?? "pending";

                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-orange-700">{r.id}</TableCell>
                        <TableCell>{requester || "-"}</TableCell>
                        <TableCell>{facultyName || "-"}</TableCell>
                        <TableCell>{r.destination || "-"}</TableCell>
                        <TableCell>{tripType || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {formatDate(r.travel_date_from)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {allocationStatus === "allocated" ? (
                            <Badge className="bg-blue-100 text-blue-800">Allocated</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              // Integration done in Step 6 via dedicated page routing.
                              // For now, keep button non-breaking.
                              window.location.href = `/dashboard/senior-officer/allocations/${encodeURIComponent(r.id)}`;
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Request
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-600">Ongoing Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.ongoingTrips}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-600">Tip</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            Use the <span className="font-semibold text-gray-900">Vehicle Allocation</span> page to allocate
            vehicles and drivers. The schedule page will display allocations once Step 4 APIs are implemented.
          </CardContent>
        </Card>
      </div>
    </SeniorOfficerLayout>
  );
}

