import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";
  if (s === "PENDING") return <span className={`${base} bg-amber-100 text-amber-800`}>Pending</span>;
  if (s === "APPROVED_BY_DEAN") return <span className={`${base} bg-blue-100 text-blue-800`}>Approved (Dean)</span>;
  if (s === "APPROVED") return <span className={`${base} bg-emerald-100 text-emerald-800`}>Approved</span>;
  if (s === "REJECTED") return <span className={`${base} bg-red-100 text-red-800`}>Rejected</span>;
  return <span className={base}>{status}</span>;
}
