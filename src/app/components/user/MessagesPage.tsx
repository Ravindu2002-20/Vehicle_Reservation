"use client";

import { useEffect, useState } from "react";
import { useSession } from "../../../lib/session";
import { useNotifications } from "../notifications/notifications-context";

import { Mail, User, Shield, Send, Plus } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type TabType = "inbox" | "sent";

interface InboxMessage {
  id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_user?: { full_name: string };
  sender_admin?: { full_name: string };
}

interface SentMessage {
  id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  receiver_user?: { full_name: string };
  receiver_admin?: { full_name: string };
}

export function MessagesPage() {
  const { markAllAsRead } = useNotifications();

  const [messages, setMessages] = useState<InboxMessage[] | SentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>("inbox");

  const [showCompose, setShowCompose] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const { user } = useSession();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId == null) return;

    markAllAsRead().catch(() => undefined);

    fetchMessages("inbox");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId == null) return;
    fetchMessages(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  async function fetchMessages(tab: TabType) {
    setLoading(true);

    const res = await fetch(`/api/messages/inbox?tab=${tab}`);
    const payload = await res.json().catch(() => null);

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

    setSubject("");
    setMessage("");
    setRecipientEmail("");
    setShowCompose(false);

    fetchMessages(activeTab);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-600 mt-1">Inbox and communication center</p>
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

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList>
          <TabsTrigger
            value="inbox"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            Inbox
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-3">
          {loading && (
            <Card>
              <CardContent className="p-6 text-center">
                Loading messages...
              </CardContent>
            </Card>
          )}

          {!loading && (messages as InboxMessage[]).length === 0 && (
            <Card>
              <CardContent className="p-10 text-center">
                <Mail className="mx-auto mb-3 w-10 h-10" />
                No messages in inbox
              </CardContent>
            </Card>
          )}

          {(messages as InboxMessage[]).map((msg) => {
            const sender =
              msg.sender_admin?.full_name ||
              msg.sender_user?.full_name ||
              "Unknown";

            return (
              <Card key={msg.id} className="hover:shadow-lg transition">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      {msg.sender_admin ? (
                        <Shield className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}

                      <span>{sender}</span>
                    </div>

                    <Badge variant={msg.is_read ? "secondary" : "default"}>
                      {msg.is_read ? "Read" : "New"}
                    </Badge>
                  </div>

                  {msg.subject && (
                    <p className="font-semibold">{msg.subject}</p>
                  )}

                  <p className="text-sm text-gray-600">{msg.message}</p>

                  <p className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {loading && (
            <Card>
              <CardContent className="p-6 text-center">
                Loading messages...
              </CardContent>
            </Card>
          )}

          {!loading && (messages as SentMessage[]).length === 0 && (
            <Card>
              <CardContent className="p-10 text-center">
                <Send className="mx-auto mb-3 w-10 h-10" />
                No sent messages yet.
              </CardContent>
            </Card>
          )}

          {(messages as SentMessage[]).map((msg) => {
            const recipient =
              msg.receiver_admin?.full_name ||
              msg.receiver_user?.full_name ||
              "Unknown";

            return (
              <Card key={msg.id} className="hover:shadow-lg transition">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">To: {recipient}</span>
                    </div>
                    <Badge variant="secondary">Sent</Badge>
                  </div>

                  {msg.subject && <p className="font-semibold">{msg.subject}</p>}

                  <p className="text-sm text-gray-600">{msg.message}</p>

                  <p className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

