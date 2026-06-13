"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

type VehicleRow = {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  availability_status?: string | null;
};

type VehicleAddPayload = {
  vehicle_number: string;
  vehicle_type: string;
  capacity: number;
  availability_status: string;
};

function AddVehicleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [vehicle_number, setVehicleNumber] = useState("");
  const [vehicle_type, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState<string>("1");
  const [availability_status, setAvailabilityStatus] = useState("available");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const numCapacity = Number(capacity);
    const payload: VehicleAddPayload = {
      vehicle_number: vehicle_number.trim(),
      vehicle_type: vehicle_type.trim(),
      capacity: Number.isFinite(numCapacity) && numCapacity > 0 ? Math.trunc(numCapacity) : 1,
      availability_status,
    };

    if (!payload.vehicle_number) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!payload.vehicle_type) {
      toast.error("Vehicle type is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to add vehicle");

      toast.success("Vehicle added successfully");
      onCreated();
      onOpenChange(false);

      setVehicleNumber("");
      setVehicleType("");
      setCapacity("1");
      setAvailabilityStatus("available");
    } catch (e: any) {
      toast.error(e?.message || "Could not add vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-gray-900">Add Vehicle</DialogTitle>
          <DialogDescription>
            Create a new vehicle. Availability can be updated later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Vehicle number</Label>
            <Input
              value={vehicle_number}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. ABC-123"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Vehicle type</Label>
            <Input
              value={vehicle_type}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="e.g. Bus"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min={1}
              step={1}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Availability</Label>
            <Select
              value={availability_status}
              onValueChange={(v) => setAvailabilityStatus(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={handleSubmit}
            disabled={saving || !vehicle_number.trim() || !vehicle_type.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving ? "Saving..." : "Add Vehicle"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const loadVehicles = async () => {
    let mounted = true;
    try {
      const res = await fetch("/api/vehicles/available");
      const json = res.ok ? await res.json() : null;
      const data = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];
      if (mounted) setVehicles(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <SeniorOfficerLayout title="Vehicles" subtitle="Manage and review vehicles">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-orange-900">Vehicle List</CardTitle>
            <CardDescription>Add vehicles using the button on the right.</CardDescription>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => setAddOpen(true)}
          >
            Add Vehicle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      No vehicles loaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.vehicle_number}</TableCell>
                      <TableCell>{v.vehicle_type}</TableCell>
                      <TableCell>{v.availability_status ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddVehicleDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={loadVehicles}
      />
    </SeniorOfficerLayout>
  );
}

