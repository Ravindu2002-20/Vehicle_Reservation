"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Mail } from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

import RejectDialog from "./RejectDialog";

import { toast } from "sonner";

type OngoingRequest = {
  id: number;
  requester: { id: number; full_name: string };
  vehicle_nature: string;
  number_of_persons: number;
  travel_date_from: string;
  travel_date_to: string;
  places_to_visit?: string | null;
  travel_route?: string | null;
  distance_type?: string | null;
  purpose: string;
  created_at: string;
  request_letter_path?: string | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Maps each stage to the inbox role string expected by /api/vehicle-requests/inbox/[role]
const STAGE_TO_INBOX_ROLE: Record<OngoingRequestsStage, string> = {
  dean: "dean",
  "admin-deputy": "admin-deputy",
  "university-deputy": "university-deputy",
};

export type OngoingRequestsStage = "dean" | "admin-deputy" | "university-deputy";

export function OngoingRequestsView({ stage }: { stage: OngoingRequestsStage }) {
  const [ongoingRequests, setOngoingRequests] = useState<OngoingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const inboxRole = STAGE_TO_INBOX_ROLE[stage];
        const res = await fetch(`/api/vehicle-requests/inbox/${inboxRole}`);
        const payload = await res.json();
        if (cancelled) return;
        setOngoingRequests(payload?.data ?? []);
      } catch (e) {
        console.error("Failed to fetch ongoing requests:", e);
        if (!cancelled) setOngoingRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage]);

  const summary = useMemo(() => ongoingRequests.length, [ongoingRequests]);

  const removeFromList = (id: number) => {
    setOngoingRequests((prev) => prev.filter((r) => r.id !== id));
    setExpandedId((cur) => (cur === id ? null : cur));
  };

  async function onApprove(requestId: number) {
    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || `Failed to approve request #${requestId}`);
        return;
      }
      toast.success(`Request #${requestId} approved successfully!`);
      removeFromList(requestId);
    } catch {
      toast.error("An error occurred");
    }
  }

  const onReject = async (requestId: number) => {
    removeFromList(requestId);
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center text-gray-500">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Ongoing Requests
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {summary} request{summary === 1 ? "" : "s"} currently in progress.
        </p>
      </div>

      {ongoingRequests.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center text-gray-500">No ongoing requests</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ongoingRequests.map((req) => {
            const isOpen = expandedId === req.id;

            return (
              <Card
                key={req.id}
                className={`border transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-[1px] ${
                  isOpen ? "border-amber-400 bg-amber-50 shadow-md" : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className="p-4 flex justify-between items-center"
                  onClick={() => setExpandedId(isOpen ? null : req.id)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">REQ-{req.id}</p>
                    <p className="text-sm text-gray-500 truncate">{req.requester?.full_name ?? "Unknown"}</p>
                  </div>

                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200">pending</Badge>
                </div>

                {isOpen && (
                  <CardContent className="border-t bg-white p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span>{req.vehicle_nature}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span>{req.number_of_persons} passengers</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span>
                          {formatDate(req.travel_date_from)}{" -> "}{formatDate(req.travel_date_to)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs uppercase text-gray-500">Purpose</p>
                        <p className="text-gray-800 font-medium">{req.purpose}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Trip Type</p>
                        <p className="text-gray-800 font-medium">{req.distance_type ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Route</p>
                        <p className="text-gray-800 font-medium">{req.travel_route ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Destination</p>
                        <p className="text-gray-800 font-medium">{req.places_to_visit ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Submitted</p>
                        <p className="text-gray-800 font-medium">{formatDate(req.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Uploaded Letter</p>
                        {req.request_letter_path ? (
                          <a
                            href={`/api/vehicle-requests/${req.id}/letter/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                          >
                            Open PDF in browser
                          </a>
                        ) : (
                          <p className="font-medium text-gray-900">No attachment</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(req.id);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>

                      <RejectDialog
                        requestId={req.id}
                        requesterName={req.requester?.full_name ?? "Unknown"}
                        purpose={req.purpose}
                        submitting={false}
                        onReject={onReject}
                        onNotify={(msg) => toast.success(msg)}
                      />

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info("Message feature not wired in Ongoing view yet.");
                        }}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
