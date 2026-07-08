"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";

export interface Notification {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  title: string;
  message: string | null;
  projectId: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface NotificationContextValue {
  unreadCount: number;
  recentNotifications: Notification[];
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const socket = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const getHeaders = useCallback(async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, [getToken]);

  const fetchInitial = useCallback(async () => {
    if (fetchedRef.current) return;
    const headers = await getHeaders();
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get<NotificationsResponse>(`${BASE_URL}/notifications?page=1&limit=20`, { headers }),
        axios.get<number>(`${BASE_URL}/notifications/unread-count`, { headers }),
      ]);
      setRecentNotifications(notifRes.data.items);
      setUnreadCount(countRes.data);
    } catch {
    } finally {
      setLoading(false);
      fetchedRef.current = true;
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (n: Notification) => {
      setRecentNotifications((prev) => [n, ...prev].slice(0, 100));
      setUnreadCount((prev) => prev + 1);
    };

    const onRead = (data: { notificationId: string; count: number }) => {
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === data.notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount(data.count);
    };

    const onReadAll = (data: { count: number }) => {
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(data.count);
    };

    const onDeleted = (data: { notificationId: string; count: number }) => {
      setRecentNotifications((prev) => prev.filter((n) => n.id !== data.notificationId));
      setUnreadCount(data.count);
    };

    const onCountUpdated = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    socket.on("notification:new", onNew);
    socket.on("notification:read", onRead);
    socket.on("notification:read-all", onReadAll);
    socket.on("notification:deleted", onDeleted);
    socket.on("notification:count-updated", onCountUpdated);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:read", onRead);
      socket.off("notification:read-all", onReadAll);
      socket.off("notification:deleted", onDeleted);
      socket.off("notification:count-updated", onCountUpdated);
    };
  }, [socket]);

  const markAsRead = useCallback(async (id: string) => {
    const headers = await getHeaders();
    try {
      await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, { headers });
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, [getHeaders]);

  const markAllAsRead = useCallback(async () => {
    const headers = await getHeaders();
    try {
      await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { headers });
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, [getHeaders]);

  const deleteNotification = useCallback(async (id: string) => {
    const headers = await getHeaders();
    try {
      await axios.delete(`${BASE_URL}/notifications/${id}`, { headers });
      setRecentNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const wasUnread = recentNotifications.find((n) => n.id === id)?.read === false;
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch {}
  }, [getHeaders, recentNotifications]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const headers = await getHeaders();
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get<NotificationsResponse>(`${BASE_URL}/notifications?page=1&limit=20`, { headers }),
        axios.get<number>(`${BASE_URL}/notifications/unread-count`, { headers }),
      ]);
      setRecentNotifications(notifRes.data.items);
      setUnreadCount(countRes.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, recentNotifications, loading, markAsRead, markAllAsRead, deleteNotification, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
  return ctx;
}
