"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  CheckCircle2,
  Eye,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type ApprovedRequestRow = {
  id: number;
  requester: { id: number; full_name: string };
  created_at: string;
  approved_at?: string | null;
  approval_status: string;
  allocation_status?: string | null;
};

type RequestStatus = "Ongoing" | "Completed" | "Canceled by user";

type SortKey = "requestId" | "userName" | "requestDate" | "approvedDate" | "requestStatus";

type SortDir = "asc" | "desc";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function requestStatusFromAllocation(allocationStatus?: string | null): RequestStatus {
  const v = (allocationStatus ?? "").toLowerCase();

  if (!v) return "Ongoing";
  if (v.includes("allocated") || v.includes("ongoing") || v.includes("active")) {
    return "Ongoing";
  }
  if (v.includes("completed") || v.includes("done") || v.includes("finished")) {
    return "Completed";
  }
  if (v.includes("canceled") || v.includes("cancelled") || v.includes("rejected")) {
    return "Canceled by user";
  }

  return "Ongoing";
}

function statusBadgeClass(status: RequestStatus) {
  // Exact badge colors per requirements
  switch (status) {
    case "Ongoing":
      return "bg-blue-600 text-white";
    case "Completed":
      return "bg-green-600 text-white";
    case "Canceled by user":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
}

function normalize(s: string) {
  return (s ?? "").toLowerCase().trim();
}

export function DeanApprovedRequestsTable() {
  const [loading, setLoading] = useState(true);
  const [rowsRaw, setRowsRaw] = useState<ApprovedRequestRow[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RequestStatus>("All");

  const [sortKey, setSortKey] = useState<SortKey>("requestDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vehicle-requests?status=approved");
        const payload = await res.json();
        if (cancelled) return;
        setRowsRaw((payload?.data ?? []) as ApprovedRequestRow[]);
      } catch {
        if (cancelled) return;
        setRowsRaw([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const computedRows = useMemo(() => {
    const withDerived = rowsRaw.map((r) => {
      const requestStatus = requestStatusFromAllocation(r.allocation_status);
      return {
        ...r,
        requestStatus,
      };
    });

    const filtered = withDerived.filter((r) => {
      const q = normalize(query);
      const requestIdStr = `REQ-${r.id}`;
      const userName = r.requester?.full_name ?? "";

      const matchesQuery =
        !q || normalize(requestIdStr).includes(q) || normalize(userName).includes(q);

      const matchesStatus = statusFilter === "All" ? true : r.requestStatus === statusFilter;

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      const cmpString = (x: string, y: string) => normalize(x).localeCompare(normalize(y)) * dir;
      const cmpDate = (x?: string | null, y?: string | null) => {
        const tx = x ? new Date(x).getTime() : 0;
        const ty = y ? new Date(y).getTime() : 0;
        return (tx - ty) * dir;
      };

      switch (sortKey) {
        case "requestId":
          return cmpString(`REQ-${a.id}`, `REQ-${b.id}`);
        case "userName":
          return cmpString(a.requester?.full_name ?? "", b.requester?.full_name ?? "");
        case "requestDate":
          return cmpDate(a.created_at, b.created_at);
        case "approvedDate":
          return cmpDate(a.approved_at ?? a.created_at, b.approved_at ?? b.created_at);
        case "requestStatus":
          return cmpString(a.requestStatus, b.requestStatus);
        default:
          return 0;
      }
    });

    return sorted;
  }, [rowsRaw, query, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(computedRows.length / pageSize));
  const pageRows = computedRows.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(nextKey: SortKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (k !== sortKey) return <span className="inline-block w-4" />;
    return sortDir === "asc" ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />;
  }

  const statusOptions: Array<{ value: "All" | RequestStatus; label: string }> = [
    { value: "All", label: "All" },
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Canceled by user", label: "Canceled by user" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Approved Requests
        </h2>
        <p className="text-sm text-gray-600 mt-1">Manage and track all approved vehicle reservation requests</p>
      </div>


      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <div className="p-5 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by Request ID or User Name"
                  className="pl-9"
                />
                {query ? (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="w-full md:w-auto">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#E65C00] text-white">

                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("requestId")}
                    >
                      <span className="inline-flex items-center gap-2">
                        Request ID <SortIcon k="requestId" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("userName")}
                    >
                      <span className="inline-flex items-center gap-2">
                        User Name <SortIcon k="userName" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("requestDate")}
                    >
                      <span className="inline-flex items-center gap-2">
                        Request Date <SortIcon k="requestDate" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("approvedDate")}
                    >
                      <span className="inline-flex items-center gap-2">
                        Approved Date <SortIcon k="approvedDate" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("requestStatus")}
                    >
                      <span className="inline-flex items-center gap-2">
                        Request Status <SortIcon k="requestStatus" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((r, idx) => {
                    const status = r.requestStatus as RequestStatus;
                    const approvedDateStr = formatDate(r.approved_at ?? r.created_at);
                    const rowBg = (idx + (page - 1) * pageSize) % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]";

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-orange-50/40 transition-colors ${rowBg}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          REQ-{r.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {r.requester?.full_name ?? "Unknown"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {approvedDateStr}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge className={`${statusBadgeClass(status)} rounded-full px-3 py-1`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Button
                            variant="outline"
                            className="text-orange-600 border-orange-500 hover:bg-orange-50"
                            onClick={() => {
                              // keep existing navigation patterns minimal; open request detail if route exists
                              window.location.href = `/requests/${r.id}`;
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {computedRows.length > 0 && !loading ? (
            <div className="p-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-600">
                Showing {Math.min((page - 1) * pageSize + 1, computedRows.length)} - {Math.min(page * pageSize, computedRows.length)} of {computedRows.length}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-100 text-gray-700"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>

                <div className="text-sm text-gray-700">
                  Page {page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-100 text-gray-700"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

