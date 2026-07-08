"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "@/lib/api";

export interface AccessRequestUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  createdAt?: string;
}

export interface AccessRequestProject {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  visibility?: "public" | "private";
  ownerId?: string;
  createdAt?: string;
  _count?: { members: number; pages?: number };
  User?: { id: string; firstName: string | null; lastName: string | null; imageUrl: string | null };
}

export interface AccessRequestEventItem {
  id: string;
  accessRequestId: string;
  fromStatus: string | null;
  toStatus: "pending" | "approved" | "denied" | "cancelled";
  reason: string | null;
  createdAt: string;
  changedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  } | null;
}

export interface AccessRequestItem {
  id: string;
  userId: string;
  projectId: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  message: string | null;
  requestedRole: string;
  createdAt: string;
  updatedAt: string;
  user: AccessRequestUser;
  project: AccessRequestProject;
  events?: AccessRequestEventItem[];
}

interface PaginatedResponse {
  items: AccessRequestItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface FetchParams {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function useAccessRequestsManagement() {
  const apiRef = useRef(useApi());
  const [items, setItems] = useState<AccessRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<FetchParams>({
    status: "all",
    search: "",
    sort: "createdAt",
    order: "desc",
    page: 1,
    limit: 20,
  });

  const fetch = useCallback(async (p: FetchParams) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (p.status && p.status !== "all") qs.set("status", p.status);
      if (p.search) qs.set("search", p.search);
      if (p.sort) qs.set("sort", p.sort);
      if (p.order) qs.set("order", p.order);
      if (p.page) qs.set("page", String(p.page));
      if (p.limit) qs.set("limit", String(p.limit));
      const res = await apiRef.current.get(`access-requests?${qs.toString()}`);
      const data = res as PaginatedResponse;
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(params);
  }, [params, fetch]);

  const updateParams = useCallback((patch: Partial<FetchParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
  }, []);

  const approve = useCallback(async (id: string) => {
    await apiRef.current.patch(`access-requests/${id}/respond`, { approved: true });
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
  }, []);

  const reject = useCallback(async (id: string, reason?: string) => {
    await apiRef.current.patch(`access-requests/${id}/respond`, { approved: false, reason });
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)));
  }, []);

  const cancel = useCallback(async (id: string) => {
    await apiRef.current.post(`access-requests/${id}/cancel`, {});
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  }, []);

  const bulkRespond = useCallback(async (ids: string[], approved: boolean) => {
    await apiRef.current.post("access-requests/bulk-respond", { ids, approved });
    setItems((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, status: approved ? "approved" : "denied" } : r)),
    );
  }, []);

  const refreshCurrent = useCallback(() => {
    fetch(params);
  }, [fetch, params]);

  return {
    items,
    total,
    pages,
    loading,
    error,
    params,
    updateParams,
    approve,
    reject,
    cancel,
    bulkRespond,
    refresh: refreshCurrent,
  };
}
