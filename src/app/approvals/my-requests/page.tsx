export const dynamic = "force-dynamic";

import React from "react";

async function fetchMyRequests() {
  const res = await fetch("/api/requests/inbox/USER", { cache: "no-store" });
  // This endpoint is not implemented; using inbox USER as placeholder.
  const j = await res.json().catch(() => null);
  return j?.data || [];
}

export default async function MyRequestsPage() {
  const items = await fetchMyRequests();
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">My Requests</h2>
      {items.length === 0 ? (
        <div>No requests found.</div>
      ) : (
        <ul>
          {items.map((it: any) => (
            <li key={it.id} className="border p-3 mb-2">
              <div className="font-semibold">{it.vehicleDetails}</div>
              <div className="text-sm">Status: {it.status}</div>
              {it.rejectionReason && <div className="text-red-600">Reason: {it.rejectionReason}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
