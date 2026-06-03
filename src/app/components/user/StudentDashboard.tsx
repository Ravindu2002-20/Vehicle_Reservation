import { useEffect, useMemo, useState } from "react";

import { VehicleReservationForm } from "./VehicleReservationForm";

import { MessagesPage } from "./MessagesPage";
import { PreviousRequestsPage } from "./PreviousRequestsPage";
import { AccountDetailsPage } from "./AccountDetailsPage";
import { WelcomeBanner } from "./WelcomeBanner";
import type { StudentPage } from "../UniversityDashboard";
import { getUserRequests } from "@/lib/api";

interface StudentDashboardProps {
  currentPage: StudentPage;
}

type VehicleRequest = {
  id: number;
  request_type: string;
  vehicle_nature: string;
  number_of_persons: number;
  travel_date_from: string;
  travel_date_to: string;
  purpose: string;
  places_to_visit: string | null;
  approval_status: string;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StudentDashboard({ currentPage }: StudentDashboardProps) {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);





  useEffect(() => {
    if (currentPage !== "dashboard") return;

    let mounted = true;
    async function load() {
      setLoadingRequests(true);
      try {
        const data = await getUserRequests();
        const list: VehicleRequest[] = data?.data ?? [];
        if (mounted) setRequests(list);
      } finally {
        if (mounted) setLoadingRequests(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [currentPage]);

  const { pendingRequests, rejectedRequests } = useMemo(() => {
    const pending = requests.filter((r) => r.approval_status?.toLowerCase() === "pending");
    const rejected = requests.filter((r) => r.approval_status?.toLowerCase() === "rejected");
    return { pendingRequests: pending, rejectedRequests: rejected };
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Show welcome banner only on main pages */}
      {(currentPage === "reservation-form" || currentPage === "messages" || currentPage === "previous-requests") && (
        <WelcomeBanner />
      )}

      {currentPage === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your vehicle request status</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending request</h2>


              {loadingRequests ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No pending requests</div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Request #{req.id} • {req.request_type}
                          </p>
                          <p className="text-sm text-gray-600">Vehicle: {req.vehicle_nature}</p>
                          <p className="text-sm text-gray-600">From {formatDate(req.travel_date_from)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs px-3 py-1 font-medium">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Rejected */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejected request</h2>

              {loadingRequests ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : rejectedRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No rejected requests</div>
              ) : (
                <div className="space-y-3">
                  {rejectedRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Request #{req.id} • {req.request_type}
                          </p>
                          <p className="text-sm text-gray-600">Vehicle: {req.vehicle_nature}</p>
                          <p className="text-sm text-gray-600">From {formatDate(req.travel_date_from)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 text-xs px-3 py-1 font-medium">
                          Rejected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}


      {currentPage === "reservation-form" && <VehicleReservationForm />}
      {currentPage === "messages" && <MessagesPage />}
      {currentPage === "previous-requests" && <PreviousRequestsPage />}
      {currentPage === "account-details" && <AccountDetailsPage />}
    </div>
  );
}

