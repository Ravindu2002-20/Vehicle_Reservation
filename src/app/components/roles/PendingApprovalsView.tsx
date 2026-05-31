"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Car,
  Calendar,
  Mail,
  MapPin,
  Send,
  Users,
  FileCheck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

import { toast } from "sonner";
import { useSession } from "@/lib/session";

type PendingRequest = {
  id: number;
  requester: { id: number; full_name: string };
  vehicle_nature: string;
  number_of_persons: number;
  travel_date_from: string;
  travel_date_to: string;
  places_to_visit?: string | null;
  purpose: string;
  created_at: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PendingApprovalsView() {
  const { user } = useSession();

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<PendingRequest | null>(
    null
  );
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingReject, setSendingReject] = useState(false);

  const canSend = useMemo(() => {
    return !!user?.id && !!messageTarget?.requester?.id;
  }, [user?.id, messageTarget?.requester?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vehicle-requests?status=pending");
        const payload = await res.json();
        if (cancelled) return;
        setPendingRequests(payload?.data ?? []);
      } catch (e) {
        console.error("Failed to fetch pending approvals:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const removeFromList = (id: number) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    setExpandedId((cur) => (cur === id ? null : cur));
  };

  async function onApprove(requestId: number) {
    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || `Failed to approve request #${requestId}`);
        return;
      }
      toast.success(`Request #${requestId} approved successfully!`);
      removeFromList(requestId);
    } catch {
      toast.error("An error occurred");
    }
  }

  async function onReject(requestId: number) {
    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || `Failed to reject request #${requestId}`);
        return;
      }
      toast.success(`Request #${requestId} rejected`);
      removeFromList(requestId);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSendingReject(false);
    }
  }

  function openMessageModal(target: PendingRequest) {
    setMessageTarget(target);
    setSubject("");
    setMessageBody("");
    setMessageOpen(true);
  }

  async function onSendMessage() {
    if (!user?.id || !messageTarget?.requester?.id) return;
    if (!messageBody) return;

    try {
      setSending(true);
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_type: "admin",
          sender_id: user.id,
          receiver_user_id: messageTarget.requester.id,
          subject: subject || null,
          message: messageBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to send message");
        return;
      }

      toast.success("Message sent successfully!");
      setMessageOpen(false);
      setMessageTarget(null);
      setSubject("");
      setMessageBody("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-orange-600" />
          Pending Approvals
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Review vehicle reservation requests awaiting approval.
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center text-gray-500">
            No pending approvals.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const isOpen = expandedId === req.id;
            return (
              <Card
                key={req.id}
                className={`border transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-[1px] ${
                  isOpen
                    ? "border-orange-300 shadow-md"
                    : "border-gray-200"
                }`}
              >
                {/* HEADER */}
                <div
                  className="p-4 flex justify-between items-center"
                  onClick={() => setExpandedId(isOpen ? null : req.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Car className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        REQ-{req.id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {req.requester?.full_name ?? "Unknown"} • Created{" "}
                        {formatDate(req.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                      pending
                    </Badge>
                    {isOpen ? (
                      <ChevronUp className="text-gray-500" />
                    ) : (
                      <ChevronDown className="text-gray-500" />
                    )}
                  </div>
                </div>

                {/* DETAILS */}
                <div
                  className={`
                    transition-[max-height,opacity,transform] duration-300 ease-in-out overflow-hidden
                    ${isOpen ? "max-h-[520px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                  `}
                >
                  {isOpen && (
                    <CardContent className="border-t bg-gray-50/50 p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{req.places_to_visit || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{req.number_of_persons} passengers</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {formatDate(req.travel_date_from)} →{" "}
                            {formatDate(req.travel_date_to)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs uppercase text-gray-500">Purpose</p>
                        <p className="text-gray-800 font-medium">
                          {req.purpose}
                        </p>
                      </div>

                      {/* ACTIONS (exactly 3 buttons) */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(req.id);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSendingReject(false);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Reject request #{req.id}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the request as rejected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSendingReject(true);
                                  onReject(req.id);
                                }}
                              >
                                {sendingReject ? "Rejecting..." : "Reject"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openMessageModal(req);
                          }}
                          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MESSAGE MODAL */}
      {messageOpen && messageTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setMessageOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <Card
            className="relative z-10 w-full max-w-lg shadow-xl border bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Compose Message</h3>
                <p className="text-sm text-gray-500 mt-1">
                  To: {messageTarget.requester.full_name}
                </p>
              </div>

              <Input
                value={String(messageTarget.requester.id)}
                disabled
                aria-label="Receiver"
              />

              <Input
                placeholder="Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <Textarea
                placeholder="Write your message..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setMessageOpen(false)}
                  className="border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  Cancel
                </Button>

                <Button
                  onClick={onSendMessage}
                  disabled={!canSend || !messageBody || sending}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

