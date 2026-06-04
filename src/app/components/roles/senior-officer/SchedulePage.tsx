"use client";

import { useEffect, useState } from "react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

type AllocationCell = {
  dateLabel: string;
  allocations: Array<{
    id: string;
    requester?: { full_name?: string | null } | null;
    vehicle?: { vehicle_number?: string | null } | null;
    purpose?: string | null;
  }>;
};

export default function SchedulePage() {
  const [cells, setCells] = useState<AllocationCell[]>([]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const res = await fetch("/api/schedule/senior-officer");
        const json = res.ok ? await res.json() : null;
        const grouped: Record<string, any[]> = json?.data?.grouped ?? {};

        const nextCells = Object.entries(grouped).map(([date, allocations]) => ({
          dateLabel: new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          allocations,
        }));

        if (mounted) setCells(nextCells);
      } catch {
        if (mounted) setCells([]);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const days = cells.length
    ? cells
    : [
        { dateLabel: "Mon", allocations: [] },
        { dateLabel: "Tue", allocations: [] },
        { dateLabel: "Wed", allocations: [] },
        { dateLabel: "Thu", allocations: [] },
        { dateLabel: "Fri", allocations: [] },
        { dateLabel: "Sat", allocations: [] },
        { dateLabel: "Sun", allocations: [] },
      ];

  return (
    <SeniorOfficerLayout title="Schedule" subtitle="Weekly allocations where allocation_status=allocated">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-900">This week</CardTitle>
          <CardDescription>Week view of allocated requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((d) => (
              <div key={d.dateLabel} className="rounded-lg border p-3 bg-white">
                <div className="font-semibold text-gray-800">{d.dateLabel}</div>
                <div className="mt-2 space-y-2">
                  {d.allocations.length === 0 ? (
                    <div className="text-sm text-gray-400">No allocations</div>
                  ) : (
                    d.allocations.map((a: any) => (
                      <div key={a.id} className="text-xs bg-orange-50 border border-orange-200 rounded p-2 space-y-1">
                        <div className="font-semibold text-orange-800">REQ-{a.id}</div>
                        <div className="text-gray-600">{a.requester?.full_name ?? "-"}</div>
                        <div className="text-gray-500">{a.vehicle?.vehicle_number ?? "No vehicle"}</div>
                        {a.purpose ? <div className="text-gray-500">{a.purpose}</div> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SeniorOfficerLayout>
  );
}

