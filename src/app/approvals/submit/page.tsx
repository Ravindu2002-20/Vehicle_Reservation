"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitRequestPage() {
  const router = useRouter();
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [approverType, setApproverType] = useState("DEAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleDetails, purpose, approverType }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      router.push("/approvals/my-requests");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Submit Vehicle Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm">Vehicle Details</label>
          <input value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-sm">Purpose</label>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full" required />
        </div>
        <div>
          <label className="block text-sm">Approver</label>
          <select value={approverType} onChange={(e) => setApproverType(e.target.value)} className="w-full">
            <option value="DEAN">Dean</option>
            <option value="UDR">University Deputy Registrar</option>
          </select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
        </div>
      </form>
    </div>
  );
}
