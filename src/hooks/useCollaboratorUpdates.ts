"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";

export function useCollaboratorUpdates() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: {
      id: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
      bio: string | null;
    }) => {
      const event = new CustomEvent("collaborator-profile-updated", { detail: data });
      window.dispatchEvent(event);
    };

    socket.on("collaborator-profile-updated", handler);
    return () => { socket.off("collaborator-profile-updated", handler); };
  }, [socket]);
}
