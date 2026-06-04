"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

import { getUserRequestById } from "@/lib/api";
import type { VehicleRequest } from "./types";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr?: string) {
  if (!timeStr) return "N/A";
  return String(timeStr);
}

function getStatusBadge(status: string) {
  const s = String(status ?? "").toLowerCase();
  if (s === "approved" || s === "approved_for_allocation" || s === "allocated") {
    return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</Badge>;
  }
  if (s.startsWith("pending")) {
    return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Pending</Badge>;
  }
  if (s === "rejected") {
    return <Badge className="bg-red-100 text-red-800 border border-red-200">Rejected</Badge>;
  }
  return <Badge>{status}</Badge>;
}

export default function RequestDetailPage({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<VehicleRequest | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setRequest(null);

      try {
        const data = await getUserRequestById(Number(id));
        if (cancelled) return;
        setRequest(data);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || "Failed to load request");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/requests")}
            className="border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        {request ? getStatusBadge(request.approval_status) : null}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Detail #{id}</h1>
        {request?.requester?.full_name ? (
          <p className="text-sm text-gray-500 mt-1">Submitted by {request.requester.full_name}</p>
        ) : null}
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="p-6 text-red-700">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && request === null && (
        <Card>
          <CardContent className="p-6 text-gray-500">Request not found.</CardContent>
        </Card>
      )}

      {!loading && !error && request && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Request Type</p>
                <p className="text-gray-900 font-medium">{request.request_type}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Vehicle Nature</p>
                <p className="text-gray-900 font-medium">{request.vehicle_nature}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Number of Persons</p>
                <p className="text-gray-900 font-medium">{request.number_of_persons}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Allocation Status</p>
                <p className="text-gray-900 font-medium">{request.allocation_status ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Submitted At</p>
                <p className="text-gray-900 font-medium">{formatDate(request.created_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Trip Type</p>
                <p className="text-gray-900 font-medium">{request.distance_type ?? "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Travel Dates</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(request.travel_date_from)}{" -> "}{formatDate(request.travel_date_to)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Time Range</p>
                <p className="text-gray-900 font-medium">
                  {formatTime(request.required_time_from)}{" -> "}{formatTime(request.required_time_to)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-gray-500">Purpose</p>
              <p className="text-gray-900 font-medium">{request.purpose}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Route</p>
                <p className="text-gray-900 font-medium">{request.travel_route ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Destination</p>
                <p className="text-gray-900 font-medium">{request.places_to_visit ?? "N/A"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-gray-500">Special Notes</p>
              <p className="text-gray-900 font-medium">{request.special_notes ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-gray-500">Request Letter</p>
              {request.request_letter_path ? (
                <a
                  href={`/api/vehicle-requests/${id}/letter/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                >
                  Open PDF in browser
                </a>
              ) : (
                <p className="text-gray-900 font-medium">No attachment</p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase text-gray-500">Approval Status</p>
              <p className="text-gray-900 font-medium">{request.approval_status}</p>
            </div>

            {request.rejection_reason ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase text-red-600">Rejection Reason</p>
                <p className="text-red-800 font-medium mt-1">{request.rejection_reason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
