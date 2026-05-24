"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useApi } from "@/lib/api";

type State = "idle" | "sending" | "pending" | "approved" | "denied";

interface Props {
  projectId: string;
  projectName: string;
  currentUserId: string;
}

export function RequestAccessModal({
  projectId,
  projectName,
  currentUserId,
}: Props) {
  const router = useRouter();
  const socket = useSocket();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const api = useApi();

  useEffect(() => {
    if (!socket) return;

    function onResponse(data: { projectId: string; approved: boolean }) {
      if (data.projectId !== projectId) return;
      if (data.approved) {
        setState("approved");
        setTimeout(() => router.refresh(), 1200);
      } else {
        setState("denied");
      }
    }

    socket.on("access-request-response", onResponse);
    return () => {
      socket.off("access-request-response", onResponse);
    };
  }, [socket, projectId, router]);

  const sendRequest = useCallback(async () => {
    setState("sending");

    const res = await api.post("access-requests", {
      projectId,
      message: message.trim() || undefined,
    });
    setState(res.ok ? "pending" : "idle");
  }, [projectId, message]);

  return (
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {state === "approved"
            ? "Access granted"
            : state === "denied"
              ? "Request denied"
              : state === "pending"
                ? "Waiting for approval"
                : `Request access to ${projectName}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {state === "approved"
            ? "Joining now…"
            : state === "denied"
              ? "The owner declined your request."
              : state === "pending"
                ? "The owner will be notified shortly."
                : "The owner will approve or deny your request."}
        </p>
      </div>

      {state === "idle" && (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)"
            rows={3}
            className="w-full resize-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={sendRequest}
            className="w-full py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Send request
          </button>
        </>
      )}

      {state === "sending" && <p className="text-xs text-gray-400">Sending…</p>}

      {state === "pending" && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
          Waiting for the owner…
        </div>
      )}

      {state === "approved" && (
        <div className="text-xs text-green-600 font-medium">✓ Redirecting…</div>
      )}

      {state === "denied" && (
        <button
          onClick={() => setState("idle")}
          className="w-full py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Send another request
        </button>
      )}
    </div>
  );
}
