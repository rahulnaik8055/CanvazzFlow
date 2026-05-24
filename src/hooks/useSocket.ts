// hooks/useSocket.ts
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";

// Module-level singleton — one connection for the whole app
let _socket: Socket | null = null;

export function useSocket(): Socket | null {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(_socket);

  useEffect(() => {
    // Already connected — just expose it
    if (_socket) {
      setSocket(_socket);
      return;
    }

    getToken().then((token) => {
      if (!token || _socket) return; // guard against double init in StrictMode

      _socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        withCredentials: true,

        // auth as a callback — socket.io calls this on EVERY connect
        // and reconnect, so the token is always fresh even after expiry
        auth: (cb) => {
          getToken().then((t) => cb({ token: t }));
        },
      });

      setSocket(_socket);
    });
  }, [getToken]);

  return socket;
}
