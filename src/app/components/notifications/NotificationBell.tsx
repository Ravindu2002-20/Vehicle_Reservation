"use client";

import { Bell, Shield, User } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { NotificationMessage } from "./notifications-context";

function truncatePreview(text: string, max = 60) {
  const s = (text ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffSec < minute) return `${diffSec} sec ago`;
  if (diffSec < hour) return `${Math.floor(diffSec / minute)} min ago`;
  if (diffSec < day) return `${Math.floor(diffSec / hour)} hr ago`;
  return `${Math.floor(diffSec / day)} day ago`;
}

function initialsFromName(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function NotificationBell({
  unreadCount,
  unreadMessages,
  onMarkAllAsRead,
}: {
  unreadCount: number;
  unreadMessages: NotificationMessage[];
  onMarkAllAsRead: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    // Group by sender (admin vs user both supported by whichever exists)
    const map = new Map<string, NotificationMessage[]>();
    for (const m of unreadMessages) {
      const sender = m.sender_admin?.full_name || m.sender_user?.full_name || "Unknown";
      const arr = map.get(sender) ?? [];
      arr.push(m);
      map.set(sender, arr);
    }

    const groups: { sender: string; messages: NotificationMessage[]; latestAt: string }[] = [];

    // Build groups array without relying on MapIterator spread/iteration typing
    map.forEach((arr, sender) => {
      const sorted = [...arr].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      groups.push({ sender, messages: sorted, latestAt: sorted[0]?.created_at ?? "" });
    });

    // Order by most recent in the group
    groups.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
    return groups;
  }, [unreadMessages]);

  const badgeText = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-orange-50 transition-all duration-300 hover:scale-105"
          aria-label="Notifications"
          onClick={() => {
            // Do not clear badge here; only auto-clear when visiting messages page.
          }}
        >
          <Bell className="w-6 h-6 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 min-w-6 px-1 rounded-full flex items-center justify-center p-0 bg-orange-500 text-white text-xs animate-pulse">
              {badgeText}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-white shadow-lg rounded-md p-1">
        {unreadMessages.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No unread messages</div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            {grouped.map((group) => {
              const top = group.messages[0];
              const sender = group.sender;

              return (
                <React.Fragment key={sender}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400">{sender}</div>
                  {group.messages.slice(0, 3).map((m) => {
                    const icon = m.sender_admin ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    );

                    return (
                      <button
                        key={m.id}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-orange-50"
                        onClick={() => {
                          // Navigate to inbox/messages. Thread-level routing isn't available in current schema.
                          router.push("/dashboard?messages=1");
                          // (No auto-clear here; it will clear on messages page mount)
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900">{sender}</span>
                              <span className="text-xs text-gray-400">{timeAgo(m.created_at)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {truncatePreview(m.message, 60)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <DropdownMenuSeparator className="my-1" />
                </React.Fragment>
              );
            })}
            <div className="px-3 pb-2 text-xs text-gray-500">
              Tip: open the Messages page to mark everything as read.
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

