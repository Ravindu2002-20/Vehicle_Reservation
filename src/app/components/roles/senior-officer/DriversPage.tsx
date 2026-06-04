"use client";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";

type DriverRow = { id: string; full_name: string; license_number?: string | null; availability_status?: string | null };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const res = await fetch("/api/drivers?type=all");
        const json = res.ok ? await res.json() : null;
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (mounted) setDrivers(data);
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
    <SeniorOfficerLayout title="Drivers" subtitle="Manage and review drivers">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-orange-900">Driver List</CardTitle>
            <CardDescription>Add Driver UI will be connected in later steps.</CardDescription>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add Driver</Button>
        </CardHeader>
        <CardContent>
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
                ) : (
                  drivers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.full_name}</TableCell>
                      <TableCell>{d.license_number ?? "-"}</TableCell>
                      <TableCell>{d.availability_status ?? "-"}</TableCell>
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

