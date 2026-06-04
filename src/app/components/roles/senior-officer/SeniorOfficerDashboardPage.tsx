"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, Clock, FileText, TrendingUp, Users } from "lucide-react";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

type StatCard = {
  label: string;
  value: number;
  icon: typeof Car;
  iconClass: string;
  cardClass: string;
  valueClass: string;
  iconWrapClass: string;
};

type VehicleRequestRow = {
  id: string;
  travel_date_from?: string | Date | null;
  travel_date_to?: string | Date | null;
  approval_status?: string;
  allocation_status?: string | null;
  vehicle_nature?: string | null;
  requester?: { full_name: string } | null;
  requester_name?: string | null;
  faculty?: { name?: string | null } | null;
  places_to_visit?: string | null;
  purpose?: string | null;
  distance_type?: string | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function statusBadge(status?: string | null) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "allocated") {
    return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Allocated</Badge>;
  }
  if (normalized === "approved_for_allocation") {
    return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Awaiting Allocation</Badge>;
  }
  if (normalized === "rejected") {
    return <Badge className="bg-rose-100 text-rose-800 border border-rose-200">Rejected</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-800 border border-gray-200">{status ?? "-"}</Badge>;
}

export default function SeniorOfficerDashboardPage({
  onSelectRequest,
}: {
  onSelectRequest: (id: string) => void;
}) {
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
        const [sRes, rRes] = await Promise.all([
          fetch("/api/stats/senior-officer"),
          fetch("/api/vehicle-requests/senior-officer-pending"),
        ]);

        const sJson = sRes.ok ? await sRes.json() : null;
        const rJson = rRes.ok ? await rRes.json() : null;

        if (!mounted) return;

        if (sJson?.data) {
          setStats({
            totalDrivers: sJson.data.totalDrivers ?? 0,
            totalVehicles: sJson.data.totalVehicles ?? 0,
            newRequests: sJson.data.newRequestsAwaitingAllocation ?? 0,
            ongoingTrips: sJson.data.ongoingAllocations ?? 0,
          });
        }

        if (Array.isArray(rJson?.data)) {
          setNewRequests(rJson.data);
        } else if (Array.isArray(rJson)) {
          setNewRequests(rJson);
        }
      } catch {
        if (mounted) {
          setNewRequests([]);
        }
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
        requester.toLowerCase().includes(q) ||
        (r.places_to_visit ?? "").toLowerCase().includes(q) ||
        (r.purpose ?? "").toLowerCase().includes(q) ||
        (r.distance_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [newRequests, search]);

  const statCards: StatCard[] = [
    {
      label: "Total Vehicles",
      value: stats.totalVehicles,
      icon: Car,
      iconClass: "text-orange-600",
      cardClass: "border-t-orange-500 border-l-orange-500",
      valueClass: "text-orange-600",
      iconWrapClass: "bg-orange-100",
    },
    {
      label: "Total Drivers",
      value: stats.totalDrivers,
      icon: Users,
      iconClass: "text-amber-600",
      cardClass: "border-t-amber-500 border-l-amber-500",
      valueClass: "text-amber-600",
      iconWrapClass: "bg-amber-100",
    },
    {
      label: "Awaiting Allocation",
      value: stats.newRequests,
      icon: Clock,
      iconClass: "text-rose-600",
      cardClass: "border-t-rose-500 border-l-rose-500",
      valueClass: "text-rose-600",
      iconWrapClass: "bg-rose-100",
    },
    {
      label: "Ongoing Trips",
      value: stats.ongoingTrips,
      icon: TrendingUp,
      iconClass: "text-emerald-600",
      cardClass: "border-t-emerald-500 border-l-emerald-500",
      valueClass: "text-emerald-600",
      iconWrapClass: "bg-emerald-100",
    },
  ];

  return (
    <SeniorOfficerLayout
      title="Senior Officer Dashboard"
      subtitle="Allocate vehicles and drivers for approved requests, then monitor ongoing trips."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className={`shadow-lg border-0 border-l-4 border-t-2 ${card.cardClass} rounded-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.valueClass}`}>{card.value}</p>
                  </div>
                  <div className={`${card.iconWrapClass} p-3 rounded-full`}>
                    <Icon className={`w-8 h-8 ${card.iconClass}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <FileText className="w-5 h-5" />
            Approved Requests Awaiting Allocation
          </CardTitle>
          <CardDescription>Requests ready for vehicle allocation</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by request id, requester, place, purpose..."
                className="pl-4"
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
                    const tripType = r.distance_type ?? "";
                    const allocationStatus = r.allocation_status ?? "pending";

                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-orange-700">{r.id}</TableCell>
                        <TableCell>{requester || "-"}</TableCell>
                        <TableCell>{facultyName || "-"}</TableCell>
                        <TableCell>{r.places_to_visit || "-"}</TableCell>
                        <TableCell>{tripType || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {formatDate(r.travel_date_from)}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(allocationStatus)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => onSelectRequest(r.id)}
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

    </SeniorOfficerLayout>
  );
}
