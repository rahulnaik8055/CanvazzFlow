"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useNotificationContext } from "@/components/notifications/notification-context";
import type { Notification } from "@/components/notifications/notification-context";

export type { Notification };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface NotificationsResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UseNotificationsOptions {
  filter?: string;
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function useNotifications(opts?: UseNotificationsOptions) {
  const { getToken } = useAuth();
  const ctx = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchNotifications = useCallback(async (overrideOpts?: UseNotificationsOptions) => {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const filter = overrideOpts?.filter ?? opts?.filter;
    const search = overrideOpts?.search ?? opts?.search;
    const type = overrideOpts?.type ?? opts?.type;
    const page = overrideOpts?.page ?? opts?.page ?? 1;
    const limit = overrideOpts?.limit ?? opts?.limit ?? 20;

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter && filter !== "all") params.set("filter", filter);
    if (search) params.set("search", search);
    if (type) params.set("type", type);

    try {
      const { data } = await axios.get<NotificationsResponse>(
        `${BASE_URL}/notifications?${params}`,
        { headers },
      );
      setNotifications(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [getToken, opts?.filter, opts?.search, opts?.type, opts?.page, opts?.limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount: ctx.unreadCount,
    loading,
    total,
    pages,
    markAsRead: ctx.markAsRead,
    markAllAsRead: ctx.markAllAsRead,
    deleteNotification: ctx.deleteNotification,
    refresh: fetchNotifications,
  };
}
