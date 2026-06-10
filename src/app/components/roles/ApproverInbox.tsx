"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";

const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

interface VehicleRequestItem {
  id: number;
  requester_id: number;
  requester: { full_name: string };
  vehicle_nature?: string | null;
  number_of_persons?: number | null;
  purpose: string;
  travel_date_from: string;
  travel_date_to: string;
  places_to_visit?: string | null;
  travel_route?: string | null;
  distance_type?: string | null;
  approval_status: string;
  created_at: string;
  request_letter_path?: string | null;
}

export default function ApproverInbox({ role }: { role: "dean" | "admin-deputy" | "university-deputy" }) {
  const [items, setItems] = useState<VehicleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [role]);

  const selectedRequest = items.find((item) => item.id === selectedId) || null;

  async function load() {
    setLoading(true);
    setSelectedId(null);
    setShowRejectDialog(false);
    setError(null);
    setSubject("");
    setReason("");
    setAttachment(null);

    const res = await fetch(`/api/vehicle-requests/inbox/${role}`);
    const j = await res.json().catch(() => null);
    setItems(j?.data || []);
    setLoading(false);
  }

  async function handleApprove(id: number) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicle-requests/${id}/approve`, { method: "POST" });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to approve request");
      toast.success("Request approved successfully.");
      await load();
    } catch (err: any) {
      const errorMsg = err?.message || "Could not approve the request.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectSubmit() {
    if (!selectedId) return;
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Message must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let attachmentUrl: string | null = null;
      if (attachment) {
        const formData = new FormData();
        formData.set("file", attachment);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadPayload = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) throw new Error(uploadPayload?.error || "Failed to upload attachment");
        attachmentUrl = uploadPayload?.url ?? uploadPayload?.path ?? null;
      }

      const res = await fetch(`/api/vehicle-requests/${selectedId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          rejection_reason: reason.trim(),
          reason: reason.trim(),
          attachment_url: attachmentUrl,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to send rejection");

      toast.success("Request rejected and message sent to user.");
      setShowRejectDialog(false);
      setSubject("");
      setReason("");
      setAttachment(null);
      setSelectedId(null);
      await load();
    } catch (err: any) {
      const errorMsg = err?.message || "Could not send rejection.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("Attachment must be 2MB or smaller.");
      event.target.value = "";
      return;
    }
    setAttachment(file);
  }

  function handleCloseDialog() {
    setShowRejectDialog(false);
    setSubject("");
    setReason("");
    setAttachment(null);
    setError(null);
  }

  if (loading) return <div className="p-4 text-gray-600">Loading inbox...</div>;
  if (items.length === 0) return <div className="p-4 text-gray-600">No pending requests.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Approvals</h2>
      </div>

      <div className="grid gap-4">
        {items.map((it) => (
          <Card
            key={it.id}
            className={`border cursor-pointer transition-all duration-150 hover:shadow-md ${
              selectedId === it.id
                ? "border-orange-500 shadow-lg bg-orange-100 ring-1 ring-orange-200"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => {
              setSelectedId(it.id);
              setShowRejectDialog(false);
              setError(null);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{it.requester?.full_name || "Unknown"}</div>
                  <div className="text-sm text-gray-600 mt-1">{it.purpose}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(it.travel_date_from).toLocaleDateString()} to{" "}
                    {new Date(it.travel_date_to).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{it.approval_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRequest && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Requester</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.requester?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.purpose}</p>
                </div>
                  <div>
                    <p className="text-sm text-gray-500">Travel Dates</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.travel_date_from).toLocaleDateString()} to{" "}
                      {new Date(selectedRequest.travel_date_to).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Nature</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.vehicle_nature ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passengers</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.number_of_persons ?? "-"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.approval_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded Letter</p>
                  {selectedRequest.request_letter_path ? (
                    <a
                      href={`/api/vehicle-requests/${selectedRequest.id}/letter/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-orange-600 underline underline-offset-4 hover:text-orange-700"
                    >
                      Open PDF in browser
                    </a>
                  ) : (
                      <p className="font-semibold text-gray-900">No attachment</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trip Type</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.distance_type ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.travel_route ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.places_to_visit ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <Button onClick={() => handleApprove(selectedRequest.id)} disabled={submitting}>
                Approve
              </Button>
              <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={submitting}>
                Send Back to User
              </Button>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog Modal */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reject Request & Notify User</DialogTitle>
            <DialogDescription>
              Send a rejection with an optional attachment to the requester.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Request Summary */}
<div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Requester</p>
                  <p className="font-semibold text-gray-900">{selectedRequest?.requester?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Purpose</p>
                  <p className="font-semibold text-gray-900">{selectedRequest?.purpose}</p>
                </div>
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="reject-subject" className="text-sm font-semibold">
                Subject <span className="text-red-600">*</span>
              </Label>
              <Input
                id="reject-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your vehicle request has been rejected"
                defaultValue="Your vehicle request has been rejected"
              />
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="reject-message" className="text-sm font-semibold">
                Message / Rejection Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reject-message"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this request is being rejected (minimum 10 characters)"
                className="min-h-[120px]"
              />
              {reason.length > 0 && (
                <p className="text-xs text-gray-600">{reason.length} characters</p>
              )}
            </div>

            {/* Attachment Field */}
            <div className="space-y-2">
              <Label htmlFor="reject-attachment" className="text-sm font-semibold">
                Attach File (optional)
              </Label>
              <Input
                id="reject-attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleAttachmentChange}
              />
              {attachment && (
                <p className="text-sm text-gray-600">Selected: {attachment.name}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleRejectSubmit}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Sending..." : "Send & Reject"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
