"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { FileCheck } from "lucide-react";

import { Badge } from "../ui/badge";

type ApprovedRequest = {
  id: number;
  requester: { id: number; full_name: string };
  created_at: string;
  approved_at?: string | null;
  approval_status: string;
  allocation_status?: string | null;
  travel_date_from?: string | null;
  travel_date_to?: string | null;
};

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

function tripStatusFromAllocation(allocationStatus?: string | null) {
  const v = allocationStatus?.toLowerCase() ?? "";
  if (!v) return "—";
  if (v.includes("allocated") || v.includes("ongoing") || v.includes("active")) return "Ongoing";
  if (v.includes("completed") || v.includes("done") || v.includes("finished")) return "Completed";
  if (v.includes("canceled") || v.includes("cancelled") || v.includes("rejected")) return "Canceled";
  return allocationStatus ?? "—";
}

export function ApprovedRequestsView() {
  const [loading, setLoading] = useState(true);
  const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        // API currently supports status=pending. We’ll call a generic endpoint and filter if needed.
        // If /api/vehicle-requests?status=approved is implemented in the backend, it will return exactly approved ones.
        const res = await fetch("/api/vehicle-requests?status=approved");
        const payload = await res.json();
        if (cancelled) return;

        const list: ApprovedRequest[] = payload?.data ?? [];
        setApprovedRequests(list);
      } catch {
        // fallback: if endpoint doesn’t exist/doesn’t support approved,
        // keep empty list
        setApprovedRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return approvedRequests
      .filter((r) => r.approval_status?.toLowerCase() === "approved")
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
  }, [approvedRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-orange-600" />
          Approved Request
        </h2>
        <p className="text-sm text-gray-600 mt-1">Approved vehicle reservations</p>
      </div>

      {rows.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center text-gray-500">No approved requests.</CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User name (request)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Approved Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trip Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((r) => {
                    const tripStatus = tripStatusFromAllocation(r.allocation_status);
                    const badgeClass =
                      tripStatus === "Ongoing"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : tripStatus === "Completed"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : tripStatus === "Canceled"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200";

                    return (
                      <tr key={r.id} className="hover:bg-orange-50/40">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">REQ-{r.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.requester?.full_name ?? "Unknown"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(r.approved_at ?? r.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge className={badgeClass}>{tripStatus}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

