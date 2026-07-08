"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";

var SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useSocket(projectId?: string) {
  var { getToken } = useAuth();
  var [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    var cancelled = false;

    async function connect() {
      var token = await getToken();
      if (cancelled || !token) return;

      var s = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      s.on("connect", () => {
        if (projectId) {
          s.emit("join-project", projectId);
        }
      });

      s.on("connect_error", () => {});

      setSocket(s);
    }

    connect();

    return () => {
      cancelled = true;
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
    };
  }, [getToken, projectId]);

  return socket;
}
