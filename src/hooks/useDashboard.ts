"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "@/lib/api";

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  visibility: "public" | "private";
  owner: { id: string; firstName: string | null; lastName: string | null; imageUrl: string | null } | null;
  memberCount: number;
  pagesCount: number;
}

export interface DashboardPendingRequest {
  id: string;
  message: string | null;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; imageUrl: string | null };
  project: { id: string; name: string };
}

export interface DashboardActivity {
  type: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface DashboardCollaborator {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

export interface DashboardStats {
  totalProjects: number;
  totalPages: number;
  totalMembers: number;
  pendingRequests: number;
}

export interface DashboardData {
  stats: DashboardStats;
  projects: DashboardProject[];
  recentProjects: DashboardProject[];
  pendingRequests: DashboardPendingRequest[];
  recentActivity: DashboardActivity[];
  collaborators: DashboardCollaborator[];
}

export function useDashboard() {
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRef.current.get("dashboard");
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
}
