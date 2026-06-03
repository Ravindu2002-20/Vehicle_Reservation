export const dynamic = "force-dynamic";

import React from "react";

async function fetchInbox(role: string) {
  const res = await fetch(`/api/requests/inbox/${role}`, { cache: "no-store" });
  const j = await res.json().catch(() => null);
  return j?.data || [];
}

export default async function InboxPage({ params }: { params: { role: string } }) {
  const items = await fetchInbox(params.role);
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Inbox — {params.role}</h2>
      {items.length === 0 ? (
        <div>No pending requests.</div>
      ) : (
        <ul>
          {items.map((it: any) => (
            <li key={it.id} className="border p-3 mb-2">
              <div className="font-semibold">{it.vehicleDetails}</div>
              <div className="text-sm">Submitted: {new Date(it.requestDate).toLocaleString()}</div>
              <div className="mt-2">
                <a className="text-blue-600" href={`/approvals/${it.id}`}>View</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
