"use client";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { useEffect, useState } from "react";

type VehicleRow = {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  status?: string;
  allocation_status?: string;
  driver?: { full_name: string } | null;
};

function badgeForStatus(v?: VehicleRow) {
  const allocation = v?.allocation_status ?? "";
  const status = v?.status ?? "";
  const key = allocation || status;

  if (key === "allocated") return <Badge className="bg-blue-100 text-blue-800">Allocated</Badge>;
  if (key === "Available" || key === "available") return <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>;
  if (key === "Under Repair" || key === "under_repair") return <Badge className="bg-amber-100 text-amber-800">Under Repair</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
}

export default function VehicleStatusPage() {
  const [rows, setRows] = useState<VehicleRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const res = await fetch("/api/vehicles?type=all");
        const json = res.ok ? await res.json() : null;
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (mounted) setRows(data);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SeniorOfficerLayout title="Vehicle Status" subtitle="Current fleet overview and availability">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-900">Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Current Driver</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-gray-900">{r.vehicle_number}</TableCell>
                    <TableCell>{r.vehicle_type}</TableCell>
                    <TableCell>{r.status ?? "-"}</TableCell>
                    <TableCell>{r.driver?.full_name ?? "-"}</TableCell>
                    <TableCell>{badgeForStatus(r)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No vehicles loaded.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SeniorOfficerLayout>
  );
}

