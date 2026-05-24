"use client";
import useSWR from "swr";
import { toast } from "sonner";

type Role = "owner" | "editor" | "viewer" | null;

const fetcher = async (url: string) => {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error("Failed to load project role");
    return await r.json();
  } catch (err) {
    console.error(err);
    toast.error("Failed to load project role");
    throw err;
  }
};

export function useProjectRole(projectId: string) {
  const { data, isLoading } = useSWR<Role>(
    projectId ? `projects/${projectId}/members/my-role` : null,
    fetcher,
  );

  return {
    role: data ?? null,
    isOwner: data === "owner",
    canEdit: data === "owner" || data === "editor",
    canView: !!data,
    isLoading,
  };
}
