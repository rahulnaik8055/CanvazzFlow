"use client";

import { useCallback, useRef, useState } from "react";
import { useApi } from "@/lib/api";

export interface InvitationUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

export interface InvitationProject {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
}

export interface FoundUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  isMember?: boolean;
  memberRole?: string | null;
  hasPendingInvitation?: boolean;
}

export interface FullProjectInfo {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  visibility: string;
  ownerId: string;
  User: InvitationUser;
  _count: { members: number };
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  invitedById: string;
  email: string | null;
  userId: string | null;
  token: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  expiresAt: string;
  message: string | null;
  role: string;
  oneTime: boolean;
  createdAt: string;
  updatedAt: string;
  project?: InvitationProject & { User?: InvitationUser; _count?: { members: number } };
  invitedBy?: InvitationUser;
  user?: InvitationUser | null;
}

export function useInvitations() {
  const apiRef = useRef(useApi());
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query: string, projectId?: string) => {
    if (query.trim().length < 2) return [];
    let url = `users/search?q=${encodeURIComponent(query)}`;
    if (projectId) url += `&projectId=${projectId}`;
    return apiRef.current.get(url) as Promise<FoundUser[]>;
  }, []);

  const inviteByEmail = useCallback(async (
    projectId: string,
    email: string,
    role?: string,
    message?: string,
    expiresInHours?: number,
  ) => {
    return apiRef.current.post(`projects/${projectId}/invite/email`, { email, role, message, expiresInHours }) as Promise<ProjectInvitation>;
  }, []);

  const inviteByUser = useCallback(async (
    projectId: string,
    userId: string,
    role?: string,
    message?: string,
    expiresInHours?: number,
  ) => {
    return apiRef.current.post(`projects/${projectId}/invite/user`, { userId, role, message, expiresInHours }) as Promise<ProjectInvitation>;
  }, []);

  const generateLink = useCallback(async (
    projectId: string,
    role?: string,
    oneTime?: boolean,
    expiresInHours?: number,
  ) => {
    return apiRef.current.post(`projects/${projectId}/invite/link`, { role, oneTime, expiresInHours }) as Promise<ProjectInvitation>;
  }, []);

  const getByToken = useCallback(async (token: string) => {
    return apiRef.current.get(`invitations/${token}`) as Promise<ProjectInvitation>;
  }, []);

  const accept = useCallback(async (token: string) => {
    return apiRef.current.post(`invitations/${token}/accept`, {}) as Promise<{ ok: boolean; projectId: string; projectName: string }>;
  }, []);

  const decline = useCallback(async (token: string) => {
    return apiRef.current.post(`invitations/${token}/decline`, {}) as Promise<{ ok: boolean }>;
  }, []);

  const cancel = useCallback(async (id: string) => {
    return apiRef.current.post(`invitations/${id}/cancel`, {}) as Promise<{ ok: boolean }>;
  }, []);

  const resend = useCallback(async (id: string) => {
    return apiRef.current.post(`invitations/${id}/resend`, {}) as Promise<{ ok: boolean }>;
  }, []);

  const listForProject = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const data = await apiRef.current.get(`projects/${projectId}/invitations`) as ProjectInvitation[];
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const listMyPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRef.current.get("me/invitations") as ProjectInvitation[];
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const listSent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRef.current.get("me/invitations/sent") as ProjectInvitation[];
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    searchUsers,
    inviteByEmail,
    inviteByUser,
    generateLink,
    getByToken,
    accept,
    decline,
    cancel,
    resend,
    listForProject,
    listMyPending,
    listSent,
  };
}
