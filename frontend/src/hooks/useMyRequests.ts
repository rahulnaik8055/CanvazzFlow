// hooks/useMyRequests.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/lib/api";

export type RequestStatus = "pending" | "approved" | "denied";

export interface MyRequest {
  id: string;
  status: RequestStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    thumbnail?: string | null;
    pages: { id: string }[];
  };
}

export function useMyRequests() {
  const api = useApi();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    api
      .get("access-requests/mine")
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { requests, loading, error, refetch };
}
