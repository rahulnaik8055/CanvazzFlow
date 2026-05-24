"use client";

import { useParams } from "next/navigation";

import { useState, useEffect, useCallback, useRef } from "react";

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

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { projectId } = useParams();

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests/pending`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch {
      setError("Could not load requests");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    intervalRef.current = setInterval(() => fetchRequests(true), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRequests]);

  const approve = useCallback(
    async (requestId: string) => {
      const prev = requests;
      setRequests((r) => r.filter((req) => req.id !== requestId));
      setActionLoading(requestId);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${requestId}/approve`,
          { method: "POST", credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to approve");
      } catch {
        setRequests(prev);
        setError("Failed to approve — please try again");
      } finally {
        setActionLoading(null);
      }
    },
    [requests],
  );

  const deny = useCallback(
    async (requestId: string) => {
      const prev = requests;
      setRequests((r) => r.filter((req) => req.id !== requestId));
      setActionLoading(requestId);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${requestId}/deny`,
          { method: "POST", credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to deny");
      } catch {
        setRequests(prev);
        setError("Failed to deny — please try again");
      } finally {
        setActionLoading(null);
      }
    },
    [requests],
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
