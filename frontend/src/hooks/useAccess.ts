"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "@/lib/api";
import { useSocket } from "./useSocket";

export interface AccessItem {
  id: string;
  type: "invitation" | "access_request";
  projectId: string;
  projectName: string;
  senderId?: string | null;
  senderName?: string | null;
  senderImage?: string | null;
  receiverId?: string | null;
  receiverName?: string | null;
  receiverImage?: string | null;
  role: string;
  status: string;
  message?: string | null;
  token?: string;
  expiresAt?: string;
  createdAt: string;
}

type Tab = "incoming" | "outgoing" | "history";

export function useAccess(activeTab?: Tab) {
  const api = useApi();
  const socket = useSocket();
  const [incoming, setIncoming] = useState<AccessItem[]>([]);
  const [outgoing, setOutgoing] = useState<AccessItem[]>([]);
  const [history, setHistory] = useState<AccessItem[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedTabsRef = useRef<Set<Tab>>(new Set());
  const fetchedCountRef = useRef(false);

  const fetchBadgeCount = useCallback(async () => {
    if (fetchedCountRef.current) return;
    fetchedCountRef.current = true;
    try {
      const count = await api.get("access/count");
      setBadgeCount(count.count);
    } catch {
      // ignore
    }
  }, [api]);

  const fetchIncoming = useCallback(async () => {
    if (fetchedTabsRef.current.has("incoming")) return;
    fetchedTabsRef.current.add("incoming");
    setLoading(true);
    try {
      const inc = await api.get("access/incoming");
      setIncoming(inc);
      setError(null);
    } catch {
      setError("Failed to load incoming data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchOutgoing = useCallback(async () => {
    if (fetchedTabsRef.current.has("outgoing")) return;
    fetchedTabsRef.current.add("outgoing");
    setLoading(true);
    try {
      const out = await api.get("access/outgoing");
      setOutgoing(out);
      setError(null);
    } catch {
      setError("Failed to load outgoing data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchHistory = useCallback(async () => {
    if (fetchedTabsRef.current.has("history")) return;
    fetchedTabsRef.current.add("history");
    setLoading(true);
    try {
      const hist = await api.get("access/history");
      setHistory(hist);
      setError(null);
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchBadgeCount();
  }, [fetchBadgeCount]);

  useEffect(() => {
    if (!activeTab) return;
    if (activeTab === "incoming") fetchIncoming();
    else if (activeTab === "outgoing") fetchOutgoing();
    else if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchIncoming, fetchOutgoing, fetchHistory]);

  const refreshAll = useCallback(async () => {
    fetchedTabsRef.current.clear();
    fetchedCountRef.current = false;
    setLoading(true);
    try {
      const [inc, out, hist, count] = await Promise.all([
        api.get("access/incoming"),
        api.get("access/outgoing"),
        api.get("access/history"),
        api.get("access/count"),
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setHistory(hist);
      setBadgeCount(count.count);
      fetchedTabsRef.current.add("incoming");
      fetchedTabsRef.current.add("outgoing");
      fetchedTabsRef.current.add("history");
      fetchedCountRef.current = true;
      setError(null);
    } catch {
      setError("Failed to load access data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const refreshTab = useCallback(async (tab: Tab) => {
    fetchedTabsRef.current.delete(tab);
    if (tab === "incoming") {
      fetchedTabsRef.current.delete("incoming");
      await fetchIncoming();
    } else if (tab === "outgoing") {
      fetchedTabsRef.current.delete("outgoing");
      await fetchOutgoing();
    } else if (tab === "history") {
      fetchedTabsRef.current.delete("history");
      await fetchHistory();
    }
    fetchedCountRef.current = false;
    fetchBadgeCount();
  }, [fetchIncoming, fetchOutgoing, fetchHistory, fetchBadgeCount]);

  const acceptInvitation = useCallback(async (token: string) => {
    const res = await api.post(`invitations/${token}/accept`, {});
    await refreshTab("incoming");
    return res;
  }, [api, refreshTab]);

  const declineInvitation = useCallback(async (token: string) => {
    const res = await api.post(`invitations/${token}/decline`, {});
    await refreshTab("incoming");
    return res;
  }, [api, refreshTab]);

  const cancelInvitation = useCallback(async (id: string) => {
    const res = await api.post(`invitations/${id}/cancel`, {});
    await refreshTab("outgoing");
    return res;
  }, [api, refreshTab]);

  const resendInvitation = useCallback(async (id: string) => {
    const res = await api.post(`invitations/${id}/resend`, {});
    await refreshTab("outgoing");
    return res;
  }, [api, refreshTab]);

  const approveRequest = useCallback(async (id: string) => {
    const res = await api.patch(`access-requests/${id}/respond`, { approved: true });
    await refreshTab("incoming");
    return res;
  }, [api, refreshTab]);

  const rejectRequest = useCallback(async (id: string) => {
    const res = await api.patch(`access-requests/${id}/respond`, { approved: false });
    await refreshTab("incoming");
    return res;
  }, [api, refreshTab]);

  return {
    incoming,
    outgoing,
    history,
    badgeCount,
    loading,
    error,
    refresh: refreshAll,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    approveRequest,
    rejectRequest,
  };
}
