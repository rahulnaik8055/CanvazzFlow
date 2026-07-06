// hooks/useProjectSearch.ts
"use client";

import { useState, useCallback, useRef } from "react";
import { useApi } from "@/lib/api";

export interface SearchProject {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  _count: { members: number };
  User: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    imageUrl?: string | null;
  };
  accessRequests: { status: string; id: string }[];
}

export function useProjectSearch() {
  const api = useApi();
  const [results, setResults] = useState<SearchProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    cancelledRef.current = false;

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(
          `project/search?q=${encodeURIComponent(query)}`,
        );
        if (!cancelledRef.current) setResults(data);
      } catch {
        if (!cancelledRef.current) setError("Search failed.");
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cancelledRef.current = true;
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
