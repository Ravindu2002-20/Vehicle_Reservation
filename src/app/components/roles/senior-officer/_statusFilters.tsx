"use client";

import React from "react";
import { Badge } from "../../ui/badge";

export type AvailabilityFilter = "all" | "available" | "allocated";

export function AvailabilityBadge({ status }: { status?: string | null }) { 

  const normalized = (status ?? "").toLowerCase();

  // Green for available
  if (normalized === "available") {
    return <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>;
  }

  // Orange/amber for allocated
  if (normalized === "allocated") {
    return <Badge className="bg-orange-100 text-orange-800">Allocated</Badge>;
  }

  return <Badge className="bg-gray-100 text-gray-800">{status ?? "-"}</Badge>;
}

export function AvailabilityFilterTabs({
  value,
  onChange,
}: {
  value: AvailabilityFilter;
  onChange: (v: AvailabilityFilter) => void;
}) {
  const tabs: { key: AvailabilityFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "allocated", label: "Allocated" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              active
                ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-700"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

