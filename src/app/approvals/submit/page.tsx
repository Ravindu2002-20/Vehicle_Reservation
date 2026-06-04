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
      const path_type = approverType === "DEAN" ? "via_dean" : "skip_dean";
      const today = new Date().toISOString().slice(0, 10);

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path_type,
          request_type: "official",
          vehicle_nature: "university_owned",
          number_of_persons: 1,
          travel_date_from: today,
          travel_date_to: today,
          required_time_from: "09:00",
          required_time_to: "17:00",
          purpose,
          distance_type: "local",
          places_to_visit: vehicleDetails,
          travel_route: vehicleDetails,
        }),
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
          <label htmlFor="vehicleDetails" className="block text-sm">Vehicle Details</label>
          <input
            id="vehicleDetails"
            value={vehicleDetails}
            onChange={(e) => setVehicleDetails(e.target.value)}
            className="w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm">Purpose</label>
          <input
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="approverType" className="block text-sm">Approver</label>
          <select
            id="approverType"
            value={approverType}
            onChange={(e) => setApproverType(e.target.value)}
            className="w-full"
          >
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
