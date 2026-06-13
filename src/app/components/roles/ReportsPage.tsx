"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart2, FileText } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { UserRole } from "../UniversityDashboard";

// Dynamically import the PDF button with SSR disabled to avoid jspdf bundling issues
const ExportPDFButton = dynamic(() => import("./ExportPDFButton"), { ssr: false });

type FacultyOption = { id: number; name: string };
type VehicleOption = { id: number; vehicle_number: string; vehicle_type: string };
type DriverOption = { id: number; full_name: string };

type VehicleRequestRow = {
  id: number;
  requester?: {
    id: number;
    full_name: string;
    department: {
      id: number;
      department_name: string;
      faculty: {
        id: number;
        name: string;
      };
    };
  };
  vehicle?: {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    availability_status: string;
  } | null;
  driver?: {
    id: number;
    full_name: string;
    availability_status: string;
  } | null;
  distance_type: string;
  approval_status: string;
  travel_date_from: string;
  travel_date_to: string;
};

type ReportFilters = {

  facultyId: string;
  vehicleId: string;
  driverId: string;
  status: string; // approval_status value
  distanceType: string;
  dateFrom: string;
  dateTo: string;
};

const APPROVAL_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "__all__", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "approved_for_allocation", label: "Approved For Allocation" },
];

const ALL_FILTER_VALUE = "__all__";

function formatDateInputToISODate(dateInput: string) {
  if (!dateInput) return undefined;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function formatDateValue(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "approved_for_allocation":
      return "Approved For Allocation";
    case "allocated":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      if (status?.startsWith("pending_")) return "Pending";
      return status || "-";
  }
}

function isPendingStatus(approval_status: string) {
  return (approval_status || "").startsWith("pending_");
}

function isApprovedStatus(approval_status: string) {
  return approval_status === "approved_for_allocation" || approval_status === "allocated";
}

function isApprovedForAllocation(approval_status: string) {
  return approval_status === "approved_for_allocation";
}

function isRejectedStatus(approval_status: string) {
  return approval_status === "rejected";
}

interface ReportsPageProps {
  role: UserRole;
}

export default function ReportsPage({ role }: ReportsPageProps) {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  const [filters, setFilters] = useState<ReportFilters>({
    facultyId: "",
    vehicleId: "",
    driverId: "",
    status: "",
    distanceType: "",
    dateFrom: "",
    dateTo: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(filters);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VehicleRequestRow[]>([]);
  const [total, setTotal] = useState(0);

  const showPDFButton = role === "university-deputy" || role === "admin-deputy";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/reports/filter-options");
        const payload = await res.json();
        if (cancelled) return;
        setFaculties(payload?.faculties ?? []);
        setVehicles(payload?.vehicles ?? []);
        setDrivers(payload?.drivers ?? []);
      } catch {
        if (!cancelled) {
          setFaculties([]);
          setVehicles([]);
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (appliedFilters.facultyId) {
      const f = faculties.find((x) => String(x.id) === appliedFilters.facultyId);
      parts.push(`Faculty: ${f?.name ?? appliedFilters.facultyId}`);
    }
    if (appliedFilters.vehicleId) {
      const v = vehicles.find((x) => String(x.id) === appliedFilters.vehicleId);
      parts.push(`Vehicle: ${v ? `${v.vehicle_number} (${v.vehicle_type})` : appliedFilters.vehicleId}`);
    }
    if (appliedFilters.driverId) {
      const d = drivers.find((x) => String(x.id) === appliedFilters.driverId);
      parts.push(`Driver: ${d?.full_name ?? appliedFilters.driverId}`);
    }

    if (appliedFilters.status) {
      const opt = APPROVAL_STATUS_OPTIONS.find((x) => x.value === appliedFilters.status);
      parts.push(`Approval Status: ${opt?.label ?? appliedFilters.status}`);
    }

    if (appliedFilters.distanceType) {
      parts.push(`Trip Type: ${appliedFilters.distanceType}`);
    }

    const dateFrom = appliedFilters.dateFrom ? new Date(appliedFilters.dateFrom) : null;
    const dateTo = appliedFilters.dateTo ? new Date(appliedFilters.dateTo) : null;

    if (dateFrom && !Number.isNaN(dateFrom.getTime())) parts.push(`Date From: ${dateFrom.toLocaleDateString()}`);
    if (dateTo && !Number.isNaN(dateTo.getTime())) parts.push(`Date To: ${dateTo.toLocaleDateString()}`);

    if (parts.length === 0) return "No filters applied.";
    return parts.join(" | ");
  }, [appliedFilters, faculties, vehicles, drivers]);

  const summary = useMemo(() => {
    const approved = rows.filter((r) => isApprovedStatus(r.approval_status)).length;
    const rejected = rows.filter((r) => isRejectedStatus(r.approval_status)).length;
    const pending = rows.filter((r) => isPendingStatus(r.approval_status)).length;

    return {
      totalResults: total || rows.length,
      approved,
      rejected,
      pending,
    };
  }, [rows, total]);

  async function applyFilters() {
    setAppliedFilters(filters);
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.facultyId) params.set("facultyId", filters.facultyId);
      if (filters.vehicleId) params.set("vehicleId", filters.vehicleId);
      if (filters.driverId) params.set("driverId", filters.driverId);
      if (filters.distanceType) params.set("distanceType", filters.distanceType);

      if (filters.status) {
        if (filters.status === "pending") {
          // handled client-side
        } else if (filters.status === "approved") {
          // handled client-side
        } else if (filters.status === "rejected") {
          params.set("status", "rejected");
        } else if (filters.status === "approved_for_allocation") {
          params.set("status", "approved_for_allocation");
        }
      }

      const isoFrom = formatDateInputToISODate(filters.dateFrom);
      const isoTo = formatDateInputToISODate(filters.dateTo);
      if (isoFrom) params.set("dateFrom", isoFrom);
      if (isoTo) params.set("dateTo", isoTo);

      const url = `/api/reports/vehicle-requests?${params.toString()}`;
      const res = await fetch(url);
      const payload = await res.json();

      const apiRows = (payload?.data ?? []) as VehicleRequestRow[];
      let filtered = apiRows;

      if (filters.status === "pending") filtered = apiRows.filter((r) => isPendingStatus(r.approval_status));
      if (filters.status === "approved") filtered = apiRows.filter((r) => isApprovedStatus(r.approval_status));
      if (filters.status === "rejected") filtered = apiRows.filter((r) => isRejectedStatus(r.approval_status));
      if (filters.status === "approved_for_allocation") filtered = apiRows.filter((r) => isApprovedForAllocation(r.approval_status));

      setRows(filtered);
      setTotal(payload?.total ?? filtered.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function clearFilters() {
    const cleared: ReportFilters = {
      facultyId: "",
      vehicleId: "",
      driverId: "",
      status: "",
      distanceType: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(cleared);
    setAppliedFilters(cleared);

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/vehicle-requests`);
      const payload = await res.json();
      const apiRows = (payload?.data ?? []) as VehicleRequestRow[];
      setRows(apiRows);
      setTotal(payload?.total ?? apiRows.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-orange-600" />
            Reports
          </h1>
          <p className="text-gray-600 mt-2">Search and export vehicle reservation requests</p>
        </div>

        {showPDFButton && (
          <div className="flex items-center gap-2">
            <ExportPDFButton
              rows={rows}
              activeFilterSummary={activeFilterSummary}
              summary={summary}
            />
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 rounded-xl border-l-4 border-t-2 border-t-orange-500">
          <CardContent className="p-5">
            <div className="text-sm text-gray-600">Total Results</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{summary.totalResults}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 rounded-xl border-l-4 border-t-2 border-t-emerald-500">
          <CardContent className="p-5">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">{summary.approved}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 rounded-xl border-l-4 border-t-2 border-t-rose-500">
          <CardContent className="p-5">
            <div className="text-sm text-gray-600">Rejected</div>
            <div className="text-3xl font-bold text-rose-600 mt-1">{summary.rejected}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 rounded-xl border-l-4 border-t-2 border-t-amber-500">
          <CardContent className="p-5">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-amber-600 mt-1">{summary.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER PANEL */}
      <Card className="shadow-lg border-0 rounded-xl border-l-4 border-t-2 border-t-orange-500">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <FileText className="w-5 h-5" />
            Filter Panel
          </CardTitle>
          <CardDescription>Refine the report using the criteria below</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Faculty</label>
              <Select
                value={filters.facultyId || ALL_FILTER_VALUE}
                onValueChange={(v) => setFilters((p) => ({ ...p, facultyId: v === ALL_FILTER_VALUE ? "" : v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All faculties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle</label>
              <Select
                value={filters.vehicleId || ALL_FILTER_VALUE}
                onValueChange={(v) => setFilters((p) => ({ ...p, vehicleId: v === ALL_FILTER_VALUE ? "" : v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.vehicle_number} - {v.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Driver</label>
              <Select
                value={filters.driverId || ALL_FILTER_VALUE}
                onValueChange={(v) => setFilters((p) => ({ ...p, driverId: v === ALL_FILTER_VALUE ? "" : v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Approval Status</label>
              <Select
                value={filters.status || ALL_FILTER_VALUE}
                onValueChange={(v) => setFilters((p) => ({ ...p, status: v === ALL_FILTER_VALUE ? "" : v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Trip Type</label>
              <Select
                value={filters.distanceType || ALL_FILTER_VALUE}
                onValueChange={(v) => setFilters((p) => ({ ...p, distanceType: v === ALL_FILTER_VALUE ? "" : v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={clearFilters} disabled={loadingOptions}>
              Clear Filters
            </Button>
            <Button
              onClick={applyFilters}
              disabled={loadingOptions}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS TABLE */}
      <Card className="shadow-lg border-0 rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Faculty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trip Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Travel Date From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Travel Date To</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-600">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const badgeClass =
                      r.approval_status === "rejected"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : r.approval_status === "approved_for_allocation"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : r.approval_status === "allocated"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isPendingStatus(r.approval_status)
                              ? "bg-gray-100 text-gray-800 border border-gray-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200";

                    return (
                      <tr key={r.id} className="hover:bg-orange-50/40">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">REQ-{r.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.requester?.full_name ?? "Unknown"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.requester?.department?.faculty?.name ?? "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.vehicle ? `${r.vehicle.vehicle_number} (${r.vehicle.vehicle_type})` : "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.driver?.full_name ?? "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.distance_type ?? "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge className={badgeClass}>{statusLabel(r.approval_status)}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDateValue(r.travel_date_from)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDateValue(r.travel_date_to)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!loadingOptions && rows.length === 0 && total === 0 && !loading && (
        <div className="hidden" />
      )}
    </div>
  );
}