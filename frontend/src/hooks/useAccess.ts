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

export function useAccess() {
  const api = useApi();
  const socket = useSocket();
  const [incoming, setIncoming] = useState<AccessItem[]>([]);
  const [outgoing, setOutgoing] = useState<AccessItem[]>([]);
  const [history, setHistory] = useState<AccessItem[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchAll = useCallback(async () => {
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
      setError(null);
    } catch {
      setError("Failed to load access data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAll();
  }, [fetchAll]);

  const acceptInvitation = useCallback(async (token: string) => {
    const res = await api.post(`invitations/${token}/accept`, {});
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  const declineInvitation = useCallback(async (token: string) => {
    const res = await api.post(`invitations/${token}/decline`, {});
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  const cancelInvitation = useCallback(async (id: string) => {
    const res = await api.post(`invitations/${id}/cancel`, {});
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  const resendInvitation = useCallback(async (id: string) => {
    const res = await api.post(`invitations/${id}/resend`, {});
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  const approveRequest = useCallback(async (id: string) => {
    const res = await api.patch(`access-requests/${id}/respond`, { approved: true });
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  const rejectRequest = useCallback(async (id: string) => {
    const res = await api.patch(`access-requests/${id}/respond`, { approved: false });
    await fetchAll();
    return res;
  }, [api, fetchAll]);

  return {
    incoming,
    outgoing,
    history,
    badgeCount,
    loading,
    error,
    refresh: fetchAll,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    approveRequest,
    rejectRequest,
  };
}
