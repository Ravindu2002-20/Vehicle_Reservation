"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type SenderKey = string;

export type NotificationMessage = {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_user?: { id?: number; full_name: string; email?: string };
  sender_admin?: { id?: number; full_name: string; email?: string };
  subject?: string;
};

type NotificationsContextValue = {
  unreadCount: number;
  unreadMessages: NotificationMessage[];
  lastReadMessageId: number | null;
  refresh: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const LAST_READ_KEY = "notifications:lastReadMessageId";

function clamp99Plus(count: number) {
  if (count > 99) return 99;
  return count;
}

function safeJsonParse<T>(val: string | null): T | null {
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

function normalizeSenderName(msg: NotificationMessage) {
  return msg.sender_admin?.full_name || msg.sender_user?.full_name || "Unknown";
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(null);

  const pollingRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const stored = safeJsonParse<number>(typeof window !== "undefined" ? localStorage.getItem(LAST_READ_KEY) : null);
    if (stored != null && !Number.isNaN(stored)) {
      setLastReadMessageId(stored);
    }
  }, []);

  const computeUnread = useCallback((allMessages: NotificationMessage[]) => {
    // Backend already returns `is_read`, but we also use lastReadMessageId to prevent badge reappearing
    // after navigating away/back without new messages.
    const effectiveLastRead = lastReadMessageId;

    const unread = allMessages.filter((m) => {
      if (!m.is_read) {
        if (effectiveLastRead == null) return true;
        return m.id > effectiveLastRead;
      }
      return false;
    });

    setUnreadMessages(unread);
    setUnreadCount(unread.length);
  }, [lastReadMessageId]);

  const fetchInbox = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/messages/inbox", { cache: "no-store" });
      if (!res.ok) return;
      const payload = await res.json();
      const data = (payload?.data ?? []) as NotificationMessage[];
      computeUnread(data);
    } finally {
      inFlightRef.current = false;
    }
  }, [computeUnread]);

  const refresh = useCallback(async () => {
    await fetchInbox();
  }, [fetchInbox]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update: set lastReadMessageId from current unread, then call backend.
    const maxUnreadId = unreadMessages.reduce((max, m) => Math.max(max, m.id), 0);
    const nextLastRead = unreadMessages.length > 0 ? maxUnreadId : lastReadMessageId;

    setLastReadMessageId(nextLastRead);
    if (typeof window !== "undefined") {
      if (nextLastRead != null) localStorage.setItem(LAST_READ_KEY, JSON.stringify(nextLastRead));
    }

    // Call backend to persist read state.
    try {
      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readToMessageId: nextLastRead }),
      });
    } catch {
      // ignore
    }

    // Refresh from backend after marking.
    await fetchInbox();
  }, [fetchInbox, lastReadMessageId, unreadMessages]);

  // Initial load + polling for new messages.
  useEffect(() => {
    refresh();

    const startPolling = () => {
      if (pollingRef.current != null) window.clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(() => {
        // Keep it light: only refresh when tab is active/visible.
        if (document.visibilityState === "visible") {
          refresh();
        }
      }, 5000);
    };

    startPolling();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (pollingRef.current != null) window.clearInterval(pollingRef.current);
    };
  }, [refresh]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      unreadCount: clamp99Plus(unreadCount),
      unreadMessages,
      lastReadMessageId,
      refresh,
      markAllAsRead,
    }),
    [markAllAsRead, lastReadMessageId, refresh, unreadCount, unreadMessages]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}


