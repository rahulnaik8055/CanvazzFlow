
"use client";
import useSWR from "swr";

type Role = "owner" | "editor" | "viewer" | null;

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

export function useProjectRole(projectId: string) {
  const { data, isLoading } = useSWR<Role>(
    projectId ? `/api/projects/${projectId}/members/my-role` : null,
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
