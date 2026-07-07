"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export interface AccessRequest {
  id: string;
  message?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl?: string | null;
  };
  project: {
    id: string;
    name: string;
  };
}

const POLL_INTERVAL = 15_000;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useAccessRequests() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [getToken]);

  const apiCall = useCallback(async (method: string, path: string, body?: any) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, [authHeaders]);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiCall("GET", "/access-requests/pending");
      setRequests(data);
      setError(null);
    } catch {
      setError("Could not load requests");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchRequests();
    intervalRef.current = setInterval(() => fetchRequests(true), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRequests]);

  const approve = useCallback(
    async (requestId: string) => {
      const targetReq = requests.find((req) => req.id === requestId);
      const prev = requests;
      setRequests((r) => r.filter((req) => req.id !== requestId));
      setActionLoading(requestId);
      try {
        await apiCall("PATCH", `/access-requests/${requestId}/respond`, { approved: true });
        const userName = targetReq?.user?.firstName || targetReq?.user?.email || "user";
        toast.success(`Approved access for ${userName}`);
      } catch {
        setRequests(prev);
        setError("Failed to approve — please try again");
        toast.error("Failed to approve access request");
      } finally {
        setActionLoading(null);
      }
    },
    [requests, apiCall],
  );

  const deny = useCallback(
    async (requestId: string) => {
      const targetReq = requests.find((req) => req.id === requestId);
      const prev = requests;
      setRequests((r) => r.filter((req) => req.id !== requestId));
      setActionLoading(requestId);
      try {
        await apiCall("PATCH", `/access-requests/${requestId}/respond`, { approved: false });
        const userName = targetReq?.user?.firstName || targetReq?.user?.email || "user";
        toast.success(`Denied access for ${userName}`);
      } catch {
        setRequests(prev);
        setError("Failed to deny — please try again");
        toast.error("Failed to deny access request");
      } finally {
        setActionLoading(null);
      }
    },
    [requests, apiCall],
  );

  return {
    requests,
    count: requests.length,
    loading,
    actionLoading,
    error,
    approve,
    deny,
    refresh: () => fetchRequests(true),
  };
}
