"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import StatusBadge from "@/app/components/StatusBadge";
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
  purpose: string;
  travel_date_from: string;
  travel_date_to: string;
  approval_status: string;
  approver_type: string;
  created_at: string;
}

export default function ApproverInbox({ role }: { role: "DEAN" | "UDR" | "GENERAL_DEPUTY" }) {
  const [items, setItems] = useState<VehicleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReturnToDeanDialog, setShowReturnToDeanDialog] = useState(false);
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [role]);

  const selectedRequest = items.find((item) => item.id === selectedId) || null;

  async function load() {
    setLoading(true);
    setSelectedId(null);
    setShowRejectDialog(false);
    setShowReturnToDeanDialog(false);
    setSuccessMessage(null);
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
        attachmentUrl = uploadPayload.url;
      }

      const res = await fetch(`/api/vehicle-requests/${selectedId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), reason: reason.trim(), attachment_url: attachmentUrl }),
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

  async function handleReturnToDeanSubmit() {
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
        attachmentUrl = uploadPayload.url;
      }

      const res = await fetch(`/api/vehicle-requests/${selectedId}/return-to-dean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), reason: reason.trim(), attachment_url: attachmentUrl }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to return request to dean");

      toast.success("Request returned to Dean with your message.");
      setShowReturnToDeanDialog(false);
      setSubject("");
      setReason("");
      setAttachment(null);
      setSelectedId(null);
      await load();
    } catch (err: any) {
      const errorMsg = err?.message || "Could not return request to dean.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseDialog() {
    setShowRejectDialog(false);
    setShowReturnToDeanDialog(false);
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
              selectedId === it.id ? "border-orange-500 shadow-lg bg-orange-50" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => {
              setSelectedId(it.id);
              setShowRejectDialog(false);
              setError(null);
              setSuccessMessage(null);
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
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Approver Type</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.approver_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.approval_status}</p>
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
              {role === "GENERAL_DEPUTY" && (
                <Button variant="outline" onClick={() => setShowReturnToDeanDialog(true)} disabled={submitting}>
                  Send Back to Dean
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>

            {successMessage && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
                {successMessage}
              </div>
            )}
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

      {/* Return to Dean Dialog Modal */}
      <Dialog open={showReturnToDeanDialog} onOpenChange={setShowReturnToDeanDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return to Dean with Message</DialogTitle>
            <DialogDescription>
              Send the request back to the Dean with your feedback and optional attachment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Request Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
              <Label htmlFor="return-subject" className="text-sm font-semibold">
                Subject <span className="text-red-600">*</span>
              </Label>
              <Input
                id="return-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Request returned for further review"
              />
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="return-message" className="text-sm font-semibold">
                Your Feedback / Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="return-message"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you are returning this request to the Dean (minimum 10 characters)"
                className="min-h-[120px]"
              />
              {reason.length > 0 && (
                <p className="text-xs text-gray-600">{reason.length} characters</p>
              )}
            </div>

            {/* Attachment Field */}
            <div className="space-y-2">
              <Label htmlFor="return-attachment" className="text-sm font-semibold">
                Attach File (optional)
              </Label>
              <Input
                id="return-attachment"
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
                onClick={handleReturnToDeanSubmit}
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submitting ? "Sending..." : "Send & Return"}
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
