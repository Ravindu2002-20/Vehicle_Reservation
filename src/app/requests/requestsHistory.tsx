"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Clock,
  MapPin,
  Users,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";

import { getUserRequests, deleteUserRequest } from "@/lib/api";
import type { VehicleRequest } from "./types";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusBadge(status: string) {
  const s = String(status ?? "").toLowerCase();

  if (s === "approved")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</Badge>
    );
  if (s === "pending")
    return (
      <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Pending</Badge>
    );
  if (s === "rejected")
    return (
      <Badge className="bg-red-100 text-red-800 border border-red-200">Rejected</Badge>
    );
  return <Badge>{status}</Badge>;
}

export default function RequestsHistoryPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const payload = await getUserRequests();
      if (cancelled) return;
      // backend returns: { data: requests }
      setRequests((payload as any)?.data ?? []);


      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRequests = useMemo(() => requests.length > 0, [requests.length]);

  async function onDelete(id: number) {
    const ok = window.confirm("Delete this request? This action cannot be undone.");
    if (!ok) return;

    // Optimistic UI
    const prev = requests;
    setRequests((p) => p.filter((r) => r.id !== id));
    setExpandedId((cur) => (cur === id ? null : cur));

    setDeletingIds((s) => new Set(s).add(id));

    try {
      const success = await deleteUserRequest(id);
      if (!success) throw new Error("Delete failed");
    } catch (e) {
      // rollback
      setRequests(prev);
      setExpandedId((cur) => (cur === null ? id : cur));
      alert((e as Error).message || "Failed to delete request");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }

  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!hasRequests) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Request History</h1>
        <p className="text-sm text-gray-500">No requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request History</h1>
        <p className="text-sm text-gray-500">View and manage your vehicle reservations</p>
      </div>

      <div className="space-y-4">
        {requests.map((req) => {
          const isOpen = expandedId === req.id;
          const isDeleting = deletingIds.has(req.id);

          return (
            <Card
              key={req.id}
              className={`
                border transition-all duration-200 cursor-pointer
                hover:shadow-lg hover:-translate-y-[1px]
                ${isOpen ? "border-blue-300 shadow-md" : "border-gray-200"}
              `}
            >
              <div
                className="p-4 flex justify-between items-center"
                onClick={() => setExpandedId(isOpen ? null : req.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {req.request_type} • {req.vehicle_nature}
                    </p>
                    <p className="text-xs text-gray-500">Request #{req.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(req.approval_status)}
                  {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                </div>
              </div>

              {/* Accordion expand/collapse */}
              <div
                className={`
                  transition-[max-height,opacity,transform] duration-300 ease-in-out overflow-hidden
                  ${isOpen ? "max-h-[500px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                `}
              >
                {isOpen && (
                  <CardContent className="border-t bg-gray-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{req.places_to_visit || "Not specified"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{req.number_of_persons} passengers</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {formatDate(req.travel_date_from)} → {formatDate(req.travel_date_to)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs uppercase text-gray-500">Purpose</p>
                      <p className="text-gray-800 font-medium">{req.purpose}</p>
                    </div>

                    {/* One action button: Delete */}
                    <div className="flex justify-end pt-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="
                              flex items-center gap-1
                              text-sm text-red-500
                              px-3 py-1 rounded-md
                              hover:bg-red-50
                              hover:text-red-600
                              transition
                              disabled:opacity-50 disabled:cursor-not-allowed
                            "
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete request #{req.id}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the request from the database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => onDelete(req.id)}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>

                      </AlertDialog>
                    </div>

                    {/* Optional: click card to go to detail */}
                    <div className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/requests/${req.id}`);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View details
                      </button>
                    </div>
                  </CardContent>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

