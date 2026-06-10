"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "../ui/button";
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

const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

type Props = {
  requestId: number;
  requesterName: string;
  purpose: string;
  submitting: boolean;
  onReject: (requestId: number) => Promise<void> | void;
  onNotify?: (message: string) => void;
};

export default function RejectDialog({
  requestId,
  requesterName,
  purpose,
  submitting,
  onReject,
  onNotify,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Your request has been rejected (REQ-${requestId})`);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function reset() {
    setSubject(`Your request has been rejected (REQ-${requestId})`);
    setReason("");
    setAttachment(null);
    setError(null);
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

  async function submitReject() {
    setError(null);

    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setError("Message must be at least 10 characters.");
      return;
    }

    setSending(true);

    try {
      // If backend is wired to accept message+attachment, it should use these fields.
      // We still call the existing reject endpoint, passing subject/reason/attachment_url.
      let attachmentUrl: string | null = null;

      if (attachment) {
        const formData = new FormData();
        formData.set("file", attachment);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadPayload = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) {
          throw new Error(uploadPayload?.error || "Failed to upload attachment");
        }
        attachmentUrl = uploadPayload?.url ?? uploadPayload?.path ?? null;
      }

      const res = await fetch(`/api/vehicle-requests/${requestId}/reject`, {
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
      if (!res.ok) {
        throw new Error(payload?.error || `Failed to reject request #${requestId}`);
      }

      onNotify?.(`Request #${requestId} rejected and notification sent.`);
      toast.success(`Request #${requestId} rejected.`);

      // Allow parent to refresh its list.
      await onReject(requestId);

      setOpen(false);
      reset();
    } catch (err: any) {
      const errorMsg = err?.message || "Could not send rejection.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
        disabled={submitting || sending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          reset();
        }}
      >
        Reject
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-lg p-4 border border-gray-200">
          <DialogHeader>
            <DialogTitle>Reject Request & Notify User</DialogTitle>
            <DialogDescription>
              Send a rejection with a message and optional attachment to the requester.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Requester</p>
                  <p className="font-semibold text-gray-900">{requesterName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Purpose</p>
                  <p className="font-semibold text-gray-900">{purpose}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor={`reject-subject-${requestId}`} className="text-sm font-semibold">
                Subject <span className="text-red-600">*</span>
              </Label>
              <Input
                id={`reject-subject-${requestId}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor={`reject-reason-${requestId}`} className="text-sm font-semibold">
                Message / Rejection Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id={`reject-reason-${requestId}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this request is being rejected (minimum 10 characters)"
                className="min-h-[120px]"
              />
              {reason.length > 0 ? (
                <p className="text-xs text-gray-600">{reason.length} characters</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <Label htmlFor={`reject-attachment-${requestId}`} className="text-sm font-semibold">
                Attach File (optional)
              </Label>
              <Input
                id={`reject-attachment-${requestId}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleAttachmentChange}
              />
              {attachment ? <p className="text-sm text-gray-600">Selected: {attachment.name}</p> : null}
            </div>

            {error ? (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>
            ) : null}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={submitReject}
                disabled={submitting || sending}
                className="bg-red-600 hover:bg-red-700"
              >
                {sending ? "Sending..." : "Send & Reject"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                disabled={submitting || sending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
