import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Node } from "@/types/CanvasTypes";
import { toast } from "sonner";

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export const client = createClient({
  authEndpoint: async (room) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/liveblocks/auth`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ room }),
        },
      );

      if (!response.ok) {
        throw new Error("Not authorized to join this room");
      }

      return await response.json();
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to collaboration session");
      throw err;
    }
  },
});

type Presence = {
  cursor: { x: number; y: number } | null;
  selectedId: string | null;
  selectedName: string | null;
  userName: string;
  userAvatar: string;
  userColor: string;
  page: string;
  lastActive: number;
  isIdle: boolean;
};

type Storage = {
  nodes: LiveMap<string, Node>;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    color: string;
    role: "owner" | "editor" | "viewer";
  };
};

type RoomEvent = never;

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useStatus,
  useSelf,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export type { LiveMap };
