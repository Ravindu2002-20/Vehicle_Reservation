"use client";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { AvailabilityBadge, AvailabilityFilter, AvailabilityFilterTabs } from "./_statusFilters";
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
import { toast } from "sonner";

type DriverRow = { id: string; full_name: string; license_number?: string | null; availability_status?: string | null };

function AddDriverDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [full_name, setFullName] = useState("");
  const [license_number, setLicenseNumber] = useState("");
  const [telephone, setTelephone] = useState("");
  const [availability_status, setAvailabilityStatus] = useState("available");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const payload = {
      full_name,
      license_number,
      telephone: telephone || null,
      availability_status,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to add driver");

      toast.success("Driver added successfully");
      onCreated();
      onOpenChange(false);
      setFullName("");
      setLicenseNumber("");
      setTelephone("");
      setAvailabilityStatus("available");
    } catch (e: any) {
      toast.error(e?.message || "Could not add driver");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-gray-900">
            Add Driver
          </DialogTitle>
          <DialogDescription>
            Enter driver details. Availability can be updated later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <Label>License number</Label>
            <Input
              value={license_number}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. LIC-12345"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Telephone (optional)</Label>
            <Input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="e.g. +94..."
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
            disabled={saving || !full_name.trim() || !license_number.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving ? "Saving..." : "Add Driver"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [filter, setFilter] = useState<AvailabilityFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const loadDrivers = async () => {
    let mounted = true;
    try {
      const res = await fetch("/api/availability/drivers-today?includeAllocated=true");
      const json = res.ok ? await res.json() : null;
      const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (mounted) setDrivers(data);
    } catch {
      // ignore
    }
    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const filteredDrivers = drivers.filter((d) => {
    if (filter === "all") return true;
    const normalized = (d.availability_status ?? "").toLowerCase();
    if (filter === "available") return normalized === "available";
    if (filter === "allocated") return normalized === "allocated";
    return true;
  });

  return (
    <SeniorOfficerLayout title="Drivers" subtitle="Manage and review drivers">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-orange-900">Driver List</CardTitle>
            <CardDescription>Add Driver UI will be connected in later steps.</CardDescription>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => setAddOpen(true)}
          >
            Add Driver
          </Button>
        </CardHeader>
        <CardContent>
          <AvailabilityFilterTabs value={filter} onChange={setFilter} />
          <div className="overflow-x-auto">
            <Table>

              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      No drivers loaded.
                    </TableCell>
                  </TableRow>
                ) : filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      No drivers match this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.full_name}</TableCell>
                      <TableCell>{d.license_number ?? "-"}</TableCell>
                      <TableCell>
                        <AvailabilityBadge status={d.availability_status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddDriverDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={loadDrivers}
      />
    </SeniorOfficerLayout>
  );
}



