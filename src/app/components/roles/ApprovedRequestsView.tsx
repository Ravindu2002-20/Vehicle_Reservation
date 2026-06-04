"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileCheck } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type ApprovedRequest = {
  id: number;
  requester: { id: number; full_name: string };
  created_at: string;
  approved_at?: string | null;
  approval_status: string;
  allocation_status?: string | null;
  travel_date_from?: string | null;
  travel_date_to?: string | null;
  purpose?: string | null;
  vehicle_nature?: string | null;
  distance_type?: string | null;
  request_letter_path?: string | null;
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

function tripStatusFromAllocation(allocationStatus?: string | null, approvalStatus?: string | null) {
  if (approvalStatus === "rejected") return "Rejected";
  if (allocationStatus === "allocated") return "Allocated";
  if (approvalStatus === "approved_for_allocation") return "Awaiting Allocation";
  return "-";
}

export function ApprovedRequestsView() {
  const [loading, setLoading] = useState(true);
  const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovedRequest | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vehicle-requests?status=approved_for_allocation,allocated,rejected");
        const payload = await res.json();
        if (cancelled) return;
        setApprovedRequests(payload?.data ?? []);
      } catch {
        if (!cancelled) setApprovedRequests([]);
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
      .filter((r) =>
        ["approved_for_allocation", "allocated", "rejected"].includes((r.approval_status ?? "").toLowerCase())
      )
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
          Approved Requests
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((r) => {
                    const tripStatus = tripStatusFromAllocation(r.allocation_status, r.approval_status);
                    const badgeClass =
                      tripStatus === "Allocated"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : tripStatus === "Awaiting Allocation"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : tripStatus === "Rejected"
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Button
                            variant="outline"
                            className="text-orange-600 border-orange-500 hover:bg-orange-50"
                            onClick={() => setSelectedRequest(r)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
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

      {selectedRequest && (
        <Card className="shadow-lg border-orange-200 bg-white">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">REQ-{selectedRequest.id}</h3>
                <p className="text-sm text-gray-600">{selectedRequest.requester?.full_name ?? "Unknown"}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Purpose</div>
                <div className="font-medium text-gray-900">{selectedRequest.purpose ?? "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Vehicle Nature</div>
                <div className="font-medium text-gray-900">{selectedRequest.vehicle_nature ?? "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Trip Type</div>
                <div className="font-medium text-gray-900">{selectedRequest.distance_type ?? "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Travel Dates</div>
                <div className="font-medium text-gray-900">
                  {formatDate(selectedRequest.travel_date_from)} to {formatDate(selectedRequest.travel_date_to)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Uploaded Letter</div>
                {selectedRequest.request_letter_path ? (
                  <a
                    href={`/api/vehicle-requests/${selectedRequest.id}/letter/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                  >
                    Open PDF in browser
                  </a>
                ) : (
                  <div className="font-medium text-gray-900">No attachment</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

