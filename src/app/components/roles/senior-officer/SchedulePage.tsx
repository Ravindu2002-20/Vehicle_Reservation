"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Car,
  User,
  CalendarDays,
  MapPin,
} from "lucide-react";

type TripStatus = "ongoing" | "completed" | "postponed" | "cancelled";

type Allocation = {
  id: string;

  purpose?: string | null;
  travel_date_from?: string | null;
  travel_date_to?: string | null;
  required_time_from?: string | null;
  required_time_to?: string | null;
  places_to_visit?: string | null;
  distance_type?: string | null;
  allocation_status?: string | null;
  trip_remarks?: string | null;
  requester?: { full_name?: string | null } | null;
  vehicle?: { vehicle_number?: string | null; vehicle_type?: string | null } | null;
  driver?: { full_name?: string | null } | null;
};

function parseTripStatus(a: Allocation): TripStatus {
  if (a.allocation_status === "completed") return "completed";
  if (a.allocation_status === "cancelled") return "cancelled";

  const remarks = a.trip_remarks ?? "";
  if (remarks.startsWith("trip_status:")) {
    const val = remarks.split(":")[1]?.split("|")[0]?.trim();
    if (val === "completed" || val === "cancelled" || val === "postponed") return val;
  }

  return "ongoing";
}

function parseTripNote(trip_remarks?: string | null): string {
  if (!trip_remarks) return "";
  const idx = trip_remarks.indexOf("|");
  if (idx === -1) return "";
  return trip_remarks.slice(idx + 1).trim();
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_CFG: Record<
  TripStatus,
  { label: string; badgeCls: string; stripCls: string; Icon: React.ElementType }
> = {
  ongoing: {
    label: "Ongoing",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
    stripCls: "bg-amber-400",
    Icon: Clock,
  },
  completed: {
    label: "Completed",
    badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-300",
    stripCls: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  postponed: {
    label: "Postponed",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-300",
    stripCls: "bg-blue-400",
    Icon: PauseCircle,
  },
  cancelled: {
    label: "Cancelled",
    badgeCls: "bg-rose-100 text-rose-800 border-rose-300",
    stripCls: "bg-rose-400",
    Icon: XCircle,
  },
};

function StatusBadge({ status }: { status: TripStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.Icon;
  return (
    <Badge
      className={`${cfg.badgeCls} border flex items-center gap-1 text-xs px-2 py-0.5 whitespace-nowrap`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function UpdateDialog({
  allocation,
  open,
  onClose,
  onSaved,
}: {
  allocation: Allocation | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentStatus: TripStatus = allocation ? parseTripStatus(allocation) : "ongoing";
  const [selected, setSelected] = useState<TripStatus>(currentStatus);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && allocation) {
      setSelected(parseTripStatus(allocation));
      setNote(parseTripNote(allocation.trip_remarks));
    }
  }, [open, allocation]);

  async function handleSave() {
    if (!allocation) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicle-requests/${allocation.id}/trip-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected, note }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Update failed");

      toast.success(
        payload?.freedResources
          ? `Marked as "${selected}". Vehicle and driver are now available.`
          : `Status updated to "${selected}".`
      );

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Could not update status");
    } finally {
      setSaving(false);
    }
  }

  if (!allocation) return null;

  const isCurrentFinal =
    currentStatus === "completed" ||
    currentStatus === "postponed" ||
    currentStatus === "cancelled";

  const willFree = selected === "completed" || selected === "cancelled";
  const unchanged = selected === currentStatus;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <DialogHeader className="-mx-4 -mt-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Update Trip Status
            </p>
            <DialogTitle className="mt-0.5 text-lg font-semibold text-slate-900">
              REQ-{allocation.id}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-50/70 p-3.5 text-sm border border-slate-100/80">
            <p className="font-semibold text-slate-800">
              {allocation.requester?.full_name ?? "Unknown"}
            </p>
            <p className="mt-1 text-slate-600 line-clamp-2 leading-relaxed">
              {allocation.purpose ?? "—"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200/60 pt-2.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(allocation.travel_date_from)} → {formatDate(allocation.travel_date_to)}
              </span>

              {allocation.vehicle && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Car className="w-3.5 h-3.5 text-indigo-500" />
                  {allocation.vehicle.vehicle_number}
                </span>
              )}

              {allocation.driver && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {allocation.driver.full_name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">New Status</Label>
            <Select
              value={selected}
              onValueChange={(v) => setSelected(v as TripStatus)}
              disabled={isCurrentFinal}
            >
              <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">⏳ Ongoing</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
                <SelectItem value="postponed">⏸ Postponed</SelectItem>
                <SelectItem value="cancelled">❌ Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {willFree && (
              <div className="mt-2 rounded-md border border-emerald-100 bg-emerald-50/60 p-2 text-xs text-emerald-800">
                ✓ Vehicle and driver will be freed and marked as available.
              </div>
            )}

            {selected === "postponed" && (
              <div className="mt-2 rounded-md border border-blue-100 bg-blue-50/60 p-2 text-xs text-blue-800">
                Vehicle and driver remain allocated until the trip is completed or cancelled.
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for this status change..."
              className="min-h-[85px] resize-none border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            {isCurrentFinal ? "Close" : "Cancel"}
          </Button>

          {!isCurrentFinal ? (
            <Button
              onClick={handleSave}
              disabled={saving || unchanged}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              {saving ? "Saving..." : "Save Status"}
            </Button>
          ) : (
            <Button
              disabled
              className="bg-slate-100 text-slate-400 border border-slate-200 shadow-none"
            >
              Status finalized
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TABS: { key: TripStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "postponed", label: "Postponed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function SchedulePage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TripStatus | "all">("all");
  const [editing, setEditing] = useState<Allocation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule/senior-officer");
      const json = res.ok ? await res.json() : null;
      setAllocations(Array.isArray(json?.data?.allocations) ? json.data.allocations : []);
    } catch {
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = allocations.reduce<Record<string, number>>((acc, a) => {
    acc.all = (acc.all ?? 0) + 1;
    const st = parseTripStatus(a);
    acc[st] = (acc[st] ?? 0) + 1;
    return acc;
  }, { all: 0 });

  const visible =
    activeTab === "all" ? allocations : allocations.filter((a) => parseTripStatus(a) === activeTab);

  return (
    <SeniorOfficerLayout
      title="Schedule & Trip Tracking"
      subtitle="View all allocated trips and update their status."
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-700"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                  active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading trips...</div>
      ) : visible.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          No {activeTab === "all" ? "" : activeTab + " "}trips found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a) => {
            const status = parseTripStatus(a);
            const cfg = STATUS_CFG[status];
            const isFinished =
              status === "completed" || status === "cancelled" || status === "postponed";
            const note = parseTripNote(a.trip_remarks);

            return (
              <Card
                key={a.id}
                className={`shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                  isFinished ? "opacity-70" : ""
                }`}
              >
                <div className={`h-1 ${cfg.stripCls}`} />

                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">REQ-{a.id}</p>
                      <p className="font-semibold text-gray-900 leading-tight mt-0.5 truncate">
                        {a.requester?.full_name ?? "Unknown"}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-2.5">
                  {a.purpose && (
                    <p className="text-sm text-gray-700 line-clamp-2">{a.purpose}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {formatDate(a.travel_date_from)} → {formatDate(a.travel_date_to)}
                    </span>
                  </div>

                  {a.places_to_visit && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
                      <span className="line-clamp-1">{a.places_to_visit}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {a.vehicle ? (
                      <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700 px-2 py-0.5">
                        <Car className="w-3 h-3" />
                        {a.vehicle.vehicle_number}
                        {a.vehicle.vehicle_type ? ` · ${a.vehicle.vehicle_type}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No vehicle assigned</span>
                    )}

                    {a.driver && (
                      <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700 px-2 py-0.5">
                        <User className="w-3 h-3" />
                        {a.driver.full_name}
                      </span>
                    )}
                  </div>

                  {note && (
                    <p className="text-xs italic text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1 line-clamp-2">
                      "{note}"
                    </p>
                  )}

                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant={isFinished ? "outline" : "default"}
                      className={
                        isFinished
                          ? "w-full border-gray-300 text-gray-600"
                          : "w-full bg-orange-600 hover:bg-orange-700 text-white"
                      }
                      onClick={() => setEditing(a)}
                    >
                      {isFinished ? "View" : "Update Status"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <UpdateDialog
        allocation={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={load}
      />
    </SeniorOfficerLayout>
  );
}

