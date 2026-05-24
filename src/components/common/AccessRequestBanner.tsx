
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useApi } from "@/lib/api";

interface PendingRequest {
  requestId: string;
  projectId: string;
  userId: string;
  userName: string;
  userImage?: string;
  message?: string;
}

interface ApiRequest {
  id: string;
  projectId: string;
  userId: string;
  message?: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  };
}

function toRequest(r: ApiRequest): PendingRequest {
  return {
    requestId: r.id,
    projectId: r.projectId,
    userId: r.userId,
    userName:
      [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") ||
      r.user.email,
    userImage: r.user.imageUrl,
    message: r.message,
  };
}

export function AccessRequestBanner({ projectId }: { projectId: string }) {
  const socket = useSocket();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const api = useApi();


  useEffect(() => {
    api
      .get(`access-requests/project/${projectId}/pending`)
      .then((data: ApiRequest[]) => setRequests(data.map(toRequest)))
      .catch(() => {});
  }, [projectId]);


  useEffect(() => {
    if (!socket) return;

    function onRequest(req: PendingRequest) {
      if (req.projectId !== projectId) return;
      setRequests((prev) => {
        if (prev.some((r) => r.requestId === req.requestId)) return prev;
        return [req, ...prev];
      });
    }

    socket.on("access-request", onRequest);
    return () => {
      socket.off("access-request", onRequest);
    };
  }, [socket, projectId]);


  const respond = useCallback(async (requestId: string, approved: boolean) => {
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    await api.patch(`access-requests/${requestId}/respond`, {
      approved,
    });
  }, []);

  if (requests.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        right: 16,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: 320,
      }}
    >
      {requests.map((req) => (
        <div
          key={req.requestId}
          className="bg-white border border-gray-200 rounded-xl shadow-md px-4 py-3 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            {req.userImage ? (
              <img
                src={req.userImage}
                alt={req.userName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-medium text-gray-500">
                {req.userName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {req.userName}
              </p>
              <p className="text-xs text-gray-400">wants to join</p>
            </div>
          </div>

          {req.message && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic line-clamp-2">
              "{req.message}"
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => respond(req.requestId, false)}
              className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Deny
            </button>
            <button
              onClick={() => respond(req.requestId, true)}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
