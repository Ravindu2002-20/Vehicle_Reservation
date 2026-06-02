"use client";

import { useEffect, useState } from "react";
import { useSession } from "../../../lib/session";

import {
  Mail,
  User,
  Shield,
  Send,
  Plus,
} from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface Message {
  id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;

  sender_user?: { full_name: string };
  sender_admin?: { full_name: string };
}

export function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCompose, setShowCompose] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [receiverAdminId, setReceiverAdminId] = useState("");

  const { user } = useSession();
  const userId = user?.id ?? null;


  useEffect(() => {
    if (userId == null) return;
    fetchMessages();
  }, [userId]);

  async function fetchMessages() {
    setLoading(true);

    const res = await fetch(`/api/messages/inbox`);
    const payload = await res.json();

    setMessages(payload?.data ?? []);
    setLoading(false);
  }


  async function sendMessage() {
    if (userId == null) return;
    if (!message || !receiverAdminId) return;

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_type: "user",
        sender_id: userId,
        receiver_admin_id: Number(receiverAdminId),
        subject,
        message,
      }),
    });

    if (res.ok) {
      setSubject("");
      setMessage("");
      setReceiverAdminId("");
      setShowCompose(false);
      fetchMessages();
    }
  }


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Messages
          </h1>
          <p className="text-gray-600 mt-1">
            Inbox and communication center
          </p>
        </div>

        <Button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* COMPOSE */}
      {showCompose && (
        <Card className="border shadow-md">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">
              Compose Message
            </h2>

            <Input
              placeholder="Receiver Admin ID"
              value={receiverAdminId}
              onChange={(e) =>
                setReceiverAdminId(e.target.value)
              }
            />

            <Input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <Textarea
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowCompose(false)}
                className="border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </Button>

              <Button 
                onClick={sendMessage}
                 className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INBOX */}
      <div className="space-y-3">
        {loading && (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Loading messages...
            </CardContent>
          </Card>
        )}

        {!loading && messages.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-gray-500">
              <Mail className="mx-auto mb-3 w-10 h-10" />
              No messages in inbox
            </CardContent>
          </Card>
        )}

        {messages.map((msg) => {
          const sender =
            msg.sender_admin?.full_name ||
            msg.sender_user?.full_name ||
            "Unknown";

          return (
            <Card
              key={msg.id}
              className="hover:shadow-lg transition border"
            >
              <CardContent className="p-4 space-y-2">
                {/* top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {msg.sender_admin ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}

                    <span className="font-medium text-gray-800">
                      {sender}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        msg.is_read ? "secondary" : "default"
                      }
                    >
                      {msg.is_read ? "Read" : "New"}
                    </Badge>
                  </div>
                </div>

                {/* subject */}
                {msg.subject && (
                  <p className="font-semibold text-gray-900">
                    {msg.subject}
                  </p>
                )}

                {/* preview */}
                <p className="text-gray-600 text-sm line-clamp-2">
                  {msg.message}
                </p>

                {/* time */}
                <p className="text-xs text-gray-400">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}