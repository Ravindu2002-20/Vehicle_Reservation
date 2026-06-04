"use client";

import { useEffect, useState } from "react";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";

type AllocationCell = {
  dateLabel: string;
  allocations: Array<{ id: string; destination?: string | null }>;
};

export default function SchedulePage() {
  const [cells, setCells] = useState<AllocationCell[]>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const res = await fetch("/api/schedule?type=senior-officer-week");
        const json = res.ok ? await res.json() : null;
        const data = Array.isArray(json?.data) ? json.data : [];
        if (mounted) setCells(data);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const days = cells.length ? cells : [{ dateLabel: "Mon", allocations: [] }, { dateLabel: "Tue", allocations: [] }, { dateLabel: "Wed", allocations: [] }, { dateLabel: "Thu", allocations: [] }, { dateLabel: "Fri", allocations: [] }, { dateLabel: "Sat", allocations: [] }, { dateLabel: "Sun", allocations: [] }];

  return (
    <SeniorOfficerLayout title="Schedule" subtitle="Weekly allocations where allocation_status=allocated">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-900">This week</CardTitle>
          <CardDescription>Mon..Sun view</CardDescription>
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
                    d.allocations.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Allocated</Badge>
                        <div className="text-xs text-gray-700 truncate">{a.id}</div>
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

