"use client";

import { useEffect, useState } from "react";
import { useSession } from "../../../lib/session";

import { Mail, User, Shield, Send, Plus } from "lucide-react";

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

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { user } = useSession();
  const adminId = user?.id ?? null;

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);

    const res = await fetch("/api/messages/inbox");
    const payload = await res.json();

    setMessages(payload?.data ?? []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!recipientEmail || !message) return;

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: recipientEmail,
        subject,
        message,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to send message");
      return;
    }

    alert("Message sent!");

    setSubject("");
    setMessage("");
    setRecipientEmail("");
    setShowCompose(false);

    fetchMessages();
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-600 mt-1">
            Admin inbox and communication center
          </p>
        </div>

        <Button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* COMPOSE */}
      {showCompose && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Compose Message</h2>

            <Input
              placeholder="Recipient Email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
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

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCompose(false)}
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
            <CardContent className="p-6 text-center">
              Loading messages...
            </CardContent>
          </Card>
        )}

        {!loading && messages.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
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
            <Card key={msg.id} className="hover:shadow-lg transition">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    {msg.sender_admin ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}

                    <span className="font-medium">{sender}</span>
                  </div>

                  <Badge variant={msg.is_read ? "secondary" : "default"}>
                    {msg.is_read ? "Read" : "New"}
                  </Badge>
                </div>

                {msg.subject && (
                  <p className="font-semibold">{msg.subject}</p>
                )}

                <p className="text-gray-600 text-sm line-clamp-2">
                  {msg.message}
                </p>

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