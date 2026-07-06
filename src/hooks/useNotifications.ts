"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useSocket } from "./useSocket";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  projectId: string | null;
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

export function useNotifications(projectId?: string) {
  const { getToken } = useAuth();
  const socket = useSocket(projectId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [getToken]);

  const fetchNotifications = useCallback(async () => {
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<NotificationsResponse>(
        `${BASE_URL}/notifications?limit=50`,
        { headers },
      );
      setNotifications(data.items);
      setUnreadCount(data.items.filter((n) => !n.read).length);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const fetchUnreadCount = useCallback(async () => {
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<number>(
        `${BASE_URL}/notifications/unread-count`,
        { headers },
      );
      setUnreadCount(data);
    } catch {}
  }, [getHeaders]);

  const markAsRead = useCallback(
    async (id: string) => {
      const headers = await getHeaders();
      try {
        await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, { headers });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    },
    [getHeaders],
  );

  const markAllAsRead = useCallback(async () => {
    const headers = await getHeaders();
    try {
      await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, [getHeaders]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handler = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [socket]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
