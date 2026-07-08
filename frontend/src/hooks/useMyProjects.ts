// hooks/useMyProjects.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/lib/api";

export type ProjectRole = "owner" | "editor" | "viewer";

export interface MyProject {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  visibility: "public" | "private";
  updatedAt: string;
  role: ProjectRole;
  pages: { id: string }[];
  _count: { members: number; pages: number };
}

export function useMyProjects() {
  const api = useApi();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    api
      .get("project")
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load projects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { projects, loading, error, refetch };
}
