"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  async function load() {
    const res = await fetch(`/api/requests/${params.id}`);
    const j = await res.json();
    setRequest(j.data);
  }

  if (!request) {
    load();
    return <div className="p-6">Loading...</div>;
  }

  async function doApprove() {
    setLoading(true);
    await fetch(`/api/requests/${params.id}/approve`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function doReject() {
    if (!reason) return alert("Enter reason");
    setLoading(true);
    await fetch(`/api/requests/${params.id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Request #{request.id}</h2>
      <div className="border p-4">
        <div><strong>Vehicle:</strong> {request.vehicleDetails}</div>
        <div><strong>Purpose:</strong> {request.purpose}</div>
        <div><strong>Status:</strong> {request.status}</div>
        {request.rejectionReason && <div className="text-red-600">Rejection: {request.rejectionReason}</div>}
      </div>

      <div className="mt-4 space-x-2">
        <button onClick={doApprove} className="px-3 py-2 bg-green-600 text-white" disabled={loading}>Approve</button>
        <button onClick={() => { }} className="px-3 py-2 bg-gray-200">Open Reject</button>
      </div>

      <div className="mt-4">
        <textarea placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full" />
        <div className="mt-2">
          <button onClick={doReject} className="px-3 py-2 bg-red-600 text-white" disabled={loading}>Reject</button>
        </div>
      </div>
    </div>
  );
}
