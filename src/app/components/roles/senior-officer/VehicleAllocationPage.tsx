"use client";

import { useEffect, useMemo, useState } from "react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { Search } from "lucide-react";

type Row = {
  id: string;
  destination?: string | null;
  requester?: { full_name: string } | null;
  travel_date_from?: string | Date | null;
  allocation_status?: string;
  approval_status?: string;
  trip_type?: string | null;
};

function formatDate(d?: string | Date | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

export default function VehicleAllocationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch("/api/vehicle-requests?type=senior-officer-pending-allocation");
        const json = res.ok ? await res.json() : null;
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (mounted) setRows(data);
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
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const requester = r.requester?.full_name ?? "";
      return (
        (r.id ?? "").toLowerCase().includes(q) ||
        (requester ?? "").toLowerCase().includes(q) ||
        (r.destination ?? "").toLowerCase().includes(q) ||
        (r.trip_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  return (
    <SeniorOfficerLayout
      title="Vehicle Allocation"
      subtitle="Allocate available vehicles and drivers for pending requests."
    >
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">Pending Requests</CardTitle>
          <CardDescription>approval_status=approved_for_allocation & allocation_status=pending</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
          </div>

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Trip Type</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No pending requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-orange-700">{r.id}</TableCell>
                      <TableCell>{r.requester?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.destination ?? "-"}</TableCell>
                      <TableCell>{r.trip_type ?? "-"}</TableCell>
                      <TableCell>{formatDate(r.travel_date_from)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => {
                            window.location.href = `/dashboard/senior-officer/allocations/${encodeURIComponent(r.id)}`;
                          }}
                        >
                          Allocate
                        </Button>
                      </TableCell>
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

