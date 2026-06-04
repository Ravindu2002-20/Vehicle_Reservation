"use client";

import { useEffect, useState } from "react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

type Vehicle = { id: string; vehicle_number: string; vehicle_type: string };
type Driver = { id: string; full_name: string };

type RequestDetail = {
  id: string;
  trip_type?: string | null;
  vehicle_nature?: string | null;
  destination?: string | null;
};

export default function RequestAllocationDetailPage({
  requestId,
}: {
  requestId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RequestDetail | null>(null);

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availablePrimaryDrivers, setAvailablePrimaryDrivers] = useState<Driver[]>([]);
  const [availableSecondaryDrivers, setAvailableSecondaryDrivers] = useState<Driver[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [primaryDriverId, setPrimaryDriverId] = useState<string>("");
  const [secondaryDriverId, setSecondaryDriverId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const [dRes, vRes, pRes, sRes] = await Promise.all([
          fetch(`/api/vehicle-requests/${encodeURIComponent(requestId)}?type=senior-officer-detail`),
          fetch("/api/vehicles?type=available"),
          fetch(`/api/availability/drivers?type=available&tripType=short`),
          fetch(`/api/availability/drivers?type=available&tripType=long`),
        ]);

        const dJson = dRes.ok ? await dRes.json() : null;
        const vJson = vRes.ok ? await vRes.json() : null;
        const pJson = pRes.ok ? await pRes.json() : null;
        const sJson = sRes.ok ? await sRes.json() : null;

        if (!mounted) return;
        setDetail(dJson?.data ?? dJson ?? null);
        setAvailableVehicles(Array.isArray(vJson?.data) ? vJson.data : Array.isArray(vJson) ? vJson : []);

        // Basic fallback: use same list if long/short APIs not implemented.
        const driversPrimary = Array.isArray(pJson?.data) ? pJson.data : Array.isArray(pJson) ? pJson : [];
        const driversSecondary = Array.isArray(sJson?.data) ? sJson.data : Array.isArray(sJson) ? sJson : [];
        setAvailablePrimaryDrivers(driversPrimary);
        setAvailableSecondaryDrivers(driversSecondary.length ? driversSecondary : driversPrimary);
      } catch {
        // swallow
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  const isLongTrip = (detail?.trip_type ?? "short") === "long";

  const canSubmit = Boolean(selectedVehicleId) && Boolean(primaryDriverId) && (!isLongTrip || Boolean(secondaryDriverId));

  return (
    <SeniorOfficerLayout title="Request Allocation" subtitle="Select an available vehicle and drivers, then allocate.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
              <CardTitle className="text-orange-900">Allocation Details</CardTitle>
              <CardDescription>Trip type affects driver selection.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : !detail ? (
                <div className="text-gray-600">Request not found or not accessible.</div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-gray-500">Request ID</div>
                    <div className="font-semibold text-gray-900">{detail.id}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vehicle</Label>
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select available vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.vehicle_number} ({v.vehicle_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Driver</Label>
                      <Select value={primaryDriverId} onValueChange={setPrimaryDriverId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select available driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrimaryDrivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isLongTrip ? (
                    <div className="space-y-2">
                      <Label>Secondary Driver</Label>
                      <Select value={secondaryDriverId} onValueChange={setSecondaryDriverId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select secondary driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSecondaryDrivers
                            .filter((d) => d.id !== primaryDriverId)
                            .map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={!canSubmit}
                      onClick={async () => {
                        if (!canSubmit) return;
                        // Step 4 will implement allocation endpoint.
                        // Keep it non-breaking for now.
                        await fetch(`/api/vehicle-requests/${encodeURIComponent(detail.id)}/allocate`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            vehicle_id: selectedVehicleId,
                            primary_driver_id: primaryDriverId,
                            secondary_driver_id: isLongTrip ? secondaryDriverId : null,
                          }),
                        });
                        window.location.href = `/dashboard/senior-officer/vehicle-allocation`;
                      }}
                    >
                      Allocate
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        window.history.back();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Read-only request</CardTitle>
              <CardDescription>Preview fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Destination</div>
                <div className="font-medium text-gray-900">{detail?.destination ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Trip Type</div>
                <div className="font-medium text-gray-900">{detail?.trip_type ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Vehicle Nature</div>
                <div className="font-medium text-gray-900">{detail?.vehicle_nature ?? "-"}</div>
              </div>
              <div className="pt-2">
                <div className="text-xs text-gray-500">
                  Allocation endpoint must enforce role permissions and only update allocation_status + vehicle/driver references.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SeniorOfficerLayout>
  );
}

