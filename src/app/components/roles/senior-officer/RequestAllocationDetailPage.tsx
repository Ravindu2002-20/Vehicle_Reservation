"use client";

import { useEffect, useState } from "react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

type Vehicle = { id: number | string; vehicle_number: string; vehicle_type: string };
type Driver = { id: number | string; full_name: string };

type RequestDetail = {
  id: string;
  distance_type?: string | null;
  vehicle_nature?: string | null;
  purpose?: string | null;
  number_of_persons?: number | null;
  travel_date_from?: string | null;
  travel_date_to?: string | null;
  request_letter_path?: string | null;
  places_to_visit?: string | null;
  travel_route?: string | null;
};

export default function RequestAllocationDetailPage({
  requestId,
  onAllocated,
  onCancel,
}: {
  requestId: string;
  onAllocated: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<RequestDetail | null>(null);

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availablePrimaryDrivers, setAvailablePrimaryDrivers] = useState<Driver[]>([]);
  const [availableSecondaryDrivers, setAvailableSecondaryDrivers] = useState<Driver[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [primaryDriverId, setPrimaryDriverId] = useState<string>("");
  const [secondaryDriverId, setSecondaryDriverId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [dRes, vRes, pRes, sRes] = await Promise.all([
          fetch(`/api/vehicle-requests/senior-officer-detail?requestId=${encodeURIComponent(requestId)}`),
          fetch("/api/vehicles/available"),
          fetch("/api/availability/drivers?tripType=short"),
          fetch("/api/availability/drivers?tripType=long"),
        ]);

        const dJson = dRes.ok ? await dRes.json() : null;
        const vJson = vRes.ok ? await vRes.json() : null;
        const pJson = pRes.ok ? await pRes.json() : null;
        const sJson = sRes.ok ? await sRes.json() : null;

        if (!mounted) return;

        setDetail(dJson?.data ?? dJson ?? null);
        setAvailableVehicles(Array.isArray(vJson?.data) ? vJson.data : Array.isArray(vJson) ? vJson : []);

        const driversPrimary = Array.isArray(pJson?.data?.drivers)
          ? pJson.data.drivers
          : Array.isArray(pJson?.data)
            ? pJson.data
            : Array.isArray(pJson)
              ? pJson
              : [];
        const driversSecondary = Array.isArray(sJson?.data?.drivers)
          ? sJson.data.drivers
          : Array.isArray(sJson?.data)
            ? sJson.data
            : Array.isArray(sJson)
              ? sJson
              : [];
        setAvailablePrimaryDrivers(driversPrimary);
        setAvailableSecondaryDrivers(driversSecondary.length ? driversSecondary : driversPrimary);
      } catch (err: any) {
        if (mounted) {
          setDetail(null);
          setError(err?.message || "Failed to load allocation details.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  useEffect(() => {
    if (primaryDriverId && secondaryDriverId === primaryDriverId) {
      setSecondaryDriverId("");
    }
  }, [primaryDriverId, secondaryDriverId]);

  const isLongTrip = (detail?.distance_type ?? "short").toLowerCase() === "long";
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
                            <SelectItem key={v.id} value={String(v.id)}>
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
                            <SelectItem key={d.id} value={String(d.id)}>
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
                            .filter((d) => String(d.id) !== primaryDriverId)
                            .map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

                  <div className="flex gap-3">
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={!canSubmit || submitting}
                      onClick={async () => {
                        if (!canSubmit || submitting) return;

                        setSubmitting(true);
                        setError(null);
                        try {
                          const res = await fetch(`/api/vehicle-requests/${encodeURIComponent(detail.id)}/allocate`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              vehicleId: Number(selectedVehicleId),
                              primaryDriverId: Number(primaryDriverId),
                              secondaryDriverId: isLongTrip ? Number(secondaryDriverId) : null,
                            }),
                          });

                          const payload = await res.json().catch(() => null);
                          if (!res.ok) {
                            throw new Error(payload?.error || "Failed to allocate request.");
                          }

                          onAllocated();
                        } catch (err: any) {
                          setError(err?.message || "Failed to allocate request.");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      {submitting ? "Allocating..." : "Allocate"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={onCancel}
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
                <div className="text-sm text-gray-500">Places to Visit</div>
                <div className="font-medium text-gray-900">{detail?.places_to_visit ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Passenger Count</div>
                <div className="font-medium text-gray-900">{detail?.number_of_persons ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Trip Type</div>
                <div className="font-medium text-gray-900">{detail?.distance_type ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Vehicle Nature</div>
                <div className="font-medium text-gray-900">{detail?.vehicle_nature ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Travel Dates</div>
                <div className="font-medium text-gray-900">
                  {detail?.travel_date_from ?? "-"} to {detail?.travel_date_to ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Purpose</div>
                <div className="font-medium text-gray-900">{detail?.purpose ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Travel Route</div>
                <div className="font-medium text-gray-900">{detail?.travel_route ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Uploaded Letter</div>
                {detail?.request_letter_path ? (
                  <a
                    href={`/api/vehicle-requests/${encodeURIComponent(requestId)}/letter/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                  >
                    Open PDF in browser
                  </a>
                ) : (
                  <div className="font-medium text-gray-900">No attachment</div>
                )}
              </div>
              <div className="pt-2">
                <div className="text-xs text-gray-500">
                  Allocation endpoint must enforce role permissions and only update allocation status plus vehicle and driver references.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SeniorOfficerLayout>
  );
}
