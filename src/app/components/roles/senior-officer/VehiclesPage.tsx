"use client";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";

type VehicleRow = { id: string; vehicle_number: string; vehicle_type: string; availability_status?: string | null; status?: string | null };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const res = await fetch("/api/vehicles?type=all");
        const json = res.ok ? await res.json() : null;
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (mounted) setVehicles(data);
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
    <SeniorOfficerLayout title="Vehicles" subtitle="Manage and review vehicles">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-orange-900">Vehicle List</CardTitle>
            <CardDescription>Add Vehicle UI will be connected in later steps.</CardDescription>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add Vehicle</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No vehicles loaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.vehicle_number}</TableCell>
                      <TableCell>{v.vehicle_type}</TableCell>
                      <TableCell>{v.status ?? "-"}</TableCell>
                      <TableCell>{v.availability_status ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SeniorOfficerLayout>
  );
}

