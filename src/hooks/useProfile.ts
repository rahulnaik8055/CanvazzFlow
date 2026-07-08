"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useSocket } from "./useSocket";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ProfileStats {
  projectsOwned: number;
  projectsJoined: number;
  pagesCreated: number;
  totalCollaborations: number;
  lastActive: string | null;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  displayName: string | null;
  username: string | null;
  bio: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isOnline: boolean;
  profileVisibility: "public" | "private";
  showEmail: boolean;
  stats: ProfileStats;
}

export interface ProjectCard {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; firstName: string | null; lastName: string | null; imageUrl: string | null };
  memberCount: number;
  pagesCount: number;
  role: string;
  joinedAt?: string;
}

export interface Activity {
  recentlyJoined: Array<{
    projectId: string;
    projectName: string;
    projectThumbnail: string | null;
    owner: { id: string; firstName: string | null; lastName: string | null; imageUrl: string | null };
    joinedAt: string;
    role: string;
  }>;
  recentlyEdited: Array<{
    pageId: string;
    pageName: string;
    projectId: string;
    projectName: string;
    visitedAt: string;
  }>;
}

export function useProfile(userId?: string) {
  const { getToken, userId: currentUserId } = useAuth();
  const socket = useSocket();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ownedProjects, setOwnedProjects] = useState<ProjectCard[]>([]);
  const [sharedProjects, setSharedProjects] = useState<ProjectCard[]>([]);
  const [publicProjects, setPublicProjects] = useState<(ProjectCard & { role: string | null })[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = !userId || userId === currentUserId;
  const targetId = isOwnProfile ? currentUserId : userId;

  const getHeaders = useCallback(async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const headers = await getHeaders();
    try {
      if (isOwnProfile) {
        const { data } = await axios.get<Profile>(`${BASE_URL}/users/me`, { headers });
        setProfile(data);
      } else {
        const { data } = await axios.get<Profile>(`${BASE_URL}/users/profile/${targetId}`, { headers });
        setProfile(data);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [targetId, isOwnProfile, getHeaders]);

  const fetchOwnedProjects = useCallback(async () => {
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<ProjectCard[]>(`${BASE_URL}/users/me/projects/owned`, { headers });
      setOwnedProjects(data);
    } catch {}
  }, [getHeaders]);

  const fetchSharedProjects = useCallback(async () => {
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<ProjectCard[]>(`${BASE_URL}/users/me/projects/shared`, { headers });
      setSharedProjects(data);
    } catch {}
  }, [getHeaders]);

  const fetchPublicProjects = useCallback(async () => {
    if (!targetId) return;
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<ProjectCard[]>(`${BASE_URL}/users/${targetId}/projects`, { headers });
      setPublicProjects(data);
    } catch {}
  }, [targetId, getHeaders]);

  const fetchActivity = useCallback(async () => {
    const headers = await getHeaders();
    try {
      const { data } = await axios.get<Activity>(`${BASE_URL}/users/me/activity`, { headers });
      setActivity(data);
    } catch {}
  }, [getHeaders]);

  useEffect(() => {
    fetchProfile();
    if (isOwnProfile) {
      fetchOwnedProjects();
      fetchSharedProjects();
      fetchActivity();
    } else {
      fetchPublicProjects();
    }
  }, [fetchProfile, fetchOwnedProjects, fetchSharedProjects, fetchActivity, fetchPublicProjects, isOwnProfile]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
    };
    socket.on("profile-updated", handler);
    return () => { socket.off("profile-updated", handler); };
  }, [socket]);

  const updateProfile = useCallback(async (data: {
    displayName?: string;
    username?: string;
    bio?: string;
    imageUrl?: string;
  }) => {
    const headers = await getHeaders();
    const res = await axios.patch(`${BASE_URL}/users/me`, data, { headers });
    setProfile((prev) => (prev ? { ...prev, ...res.data } : prev));
    return res.data;
  }, [getHeaders]);

  const updatePrivacy = useCallback(async (data: {
    profileVisibility?: "public" | "private";
    showEmail?: boolean;
  }) => {
    const headers = await getHeaders();
    const res = await axios.patch(`${BASE_URL}/users/me/privacy`, data, { headers });
    setProfile((prev) => (prev ? { ...prev, ...res.data } : prev));
    return res.data;
  }, [getHeaders]);

  const checkUsername = useCallback(async (username: string) => {
    const headers = await getHeaders();
    const { data } = await axios.get<{ available: boolean }>(
      `${BASE_URL}/users/check-username/${encodeURIComponent(username)}`,
      { headers },
    );
    return data.available;
  }, [getHeaders]);

  const touchActive = useCallback(async () => {
    const headers = await getHeaders();
    try { await axios.post(`${BASE_URL}/users/me/active`, {}, { headers }); } catch {}
  }, [getHeaders]);

  return {
    profile,
    ownedProjects,
    sharedProjects,
    publicProjects,
    activity,
    loading,
    isOwnProfile,
    fetchProfile,
    updateProfile,
    updatePrivacy,
    checkUsername,
    touchActive,
  };
}
