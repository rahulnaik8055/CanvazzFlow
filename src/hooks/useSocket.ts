
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function useSocket(): Socket | null {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(_socket);

  useEffect(() => {
    if (_socket) {
      setSocket(_socket);
      return;
    }

    getToken().then((token) => {
      if (!token || _socket) return;

      _socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        withCredentials: true,

        auth: (cb) => {
          getToken().then((t) => cb({ token: t }));
        },
      });

      setSocket(_socket);
    });
  }, [getToken]);

  return socket;
}
