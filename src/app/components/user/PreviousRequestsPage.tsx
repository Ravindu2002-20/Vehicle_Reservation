"use client";

import { useEffect, useState } from "react";
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

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface VehicleRequest {
  id: number;
  vehicleDetails: string;
  requestDate: string;
  purpose: string;
  approverType: string;
  status: string;
  rejectionReason?: string | null;
}

export function PreviousRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    loadRequests();
  }, []);


  async function loadRequests() {
    setLoading(true);
    const res = await fetch("/api/vehicle-requests?userId=me");
    const data = await res.json().catch(() => null);
    if (data?.data) setRequests(data.data);
    setLoading(false);
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("Delete this request?");
    if (!ok) return;

    setRequests((prev) => prev.filter((r) => r.id !== id));

    if (expandedId === id) setExpandedId(null);
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();

    if (s === "approved")
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
          Approved
        </Badge>
      );

    if (s === "pending")
      return (
        <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
          Pending
        </Badge>
      );

    if (s === "rejected")
      return (
        <Badge className="bg-red-100 text-red-800 border border-red-200">
          Rejected
        </Badge>
      );

    return <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const filteredRequests = requests.filter((req) => {
    const s = (req.status || "").toLowerCase();
    const matchesStatus = statusFilter === "all" ? true : s === statusFilter;

    const q = query.trim().toLowerCase();
    const matchesQuery = !q
      ? true
      : String(req.id).includes(q) ||
        (req.vehicleDetails || "").toLowerCase().includes(q) ||
        (req.purpose || "").toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Request History
        </h1>
        <p className="text-sm text-gray-500">
          View and manage your vehicle reservations
        </p>
      </div>

      {/* Search + Status Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by request id / type / vehicle"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="text-sm text-gray-500 flex items-center">
          Showing {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"}
        </div>
      </div>


      {filteredRequests.map((req) => {
        const isOpen = expandedId === req.id;


        return (
          <Card
            key={req.id}
            className={`
              border transition-all duration-200 cursor-pointer
              hover:shadow-lg hover:-translate-y-[1px]
              ${isOpen ? "border-blue-300 shadow-md" : "border-gray-200"}
            `}
          >
            {/* HEADER */}
            <div
              className="p-4 flex justify-between items-center"
              onClick={() =>
                setExpandedId(isOpen ? null : req.id)
              }
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    {req.vehicleDetails}
                  </p>
                  <p className="text-xs text-gray-500">
                    Request #{req.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(req.status)}
                {isOpen ? (
                  <ChevronUp className="text-gray-500" />
                ) : (
                  <ChevronDown className="text-gray-500" />
                )}
              </div>
            </div>

            {/* DETAILS */}
            {isOpen && (
              <CardContent className="border-t bg-gray-50/50 p-4 space-y-4">
                <div className="pt-2">
                  <p className="text-xs uppercase text-gray-500">Submitted</p>
                  <p className="text-gray-800 font-medium">{new Date(req.requestDate).toLocaleString()}</p>
                </div>

                <div className="pt-2">
                  <p className="text-xs uppercase text-gray-500">Purpose</p>
                  <p className="text-gray-800 font-medium">{req.purpose}</p>
                </div>

                {req.status?.toUpperCase() === "REJECTED" && req.rejectionReason && (
                  <div className="text-orange-600 mt-2">{req.rejectionReason}</div>
                )}

                {/* DELETE ONLY ACTION */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(req.id);
                    }}
                    className="
                      flex items-center gap-1
                      text-sm text-red-500
                      px-3 py-1 rounded-md
                      hover:bg-red-50
                      hover:text-red-600
                      transition
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}