import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Node } from "@/types/CanvasTypes";

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
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
  info: { name: string; color: string };
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
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export type { LiveMap } from "@liveblocks/client";
