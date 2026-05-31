"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

type RequestStatus = "pending" | "approved" | "rejected";

function statusBadgeProps(status: RequestStatus) {
  switch (status) {
    case "approved":
      return { className: "bg-green-100 text-green-800", label: "approved" };
    case "rejected":
      return { className: "bg-red-100 text-red-800", label: "rejected" };
    case "pending":
    default:
      return { className: "bg-yellow-100 text-yellow-800", label: "pending" };
  }
}

export function FacultyDeputyApprovalsView() {
  // Placeholder data so the UI renders immediately.
  // Replace with real API fetching when approvals endpoint is ready.
  const [items, setItems] = useState<
    Array<{ id: string; student: string; requestType: string; status: RequestStatus; createdAt: string }>
  >([]);

  useEffect(() => {
    setItems([
      {
        id: "REQ-1001",
        student: "Sarah Johnson",
        requestType: "Van",
        status: "pending",
        createdAt: "Today",
      },
      {
        id: "REQ-0998",
        student: "Mike Chen",
        requestType: "Sedan",
        status: "approved",
        createdAt: "Yesterday",
      },
      {
        id: "REQ-0990",
        student: "Emma Davis",
        requestType: "SUV",
        status: "pending",
        createdAt: "2 days ago",
      },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Faculty Deputy Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve faculty-level vehicle requests.</p>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
          <CardTitle className="flex items-center gap-2 text-teal-900">
            Approvals Queue
          </CardTitle>
          <CardDescription>Pending items will appear here.</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Loading approvals…</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const badge = statusBadgeProps(item.status);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.student}</p>
                      <p className="text-sm text-gray-500">
                        {item.requestType} • {item.id} • {item.createdAt}
                      </p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            This is a placeholder view. Hook up the real approval actions and data fetching next.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

