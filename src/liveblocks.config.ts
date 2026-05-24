import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Node } from "@/types/CanvasTypes";

export const client = createClient({
  authEndpoint: async (room) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/liveblocks-auth`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room }),
      },
    );

    if (!response.ok) {
      throw new Error("Not authorized to join this room");
    }

    return response.json();
  },
});

type Presence = {
  cursor: { x: number; y: number } | null;
  selectedId: string | null;
  userName: string;
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
