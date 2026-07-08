"use client";

import React, { useEffect, useRef } from "react";
import { Check, X, Loader2, Users, Clock } from "lucide-react";
import { AccessRequest } from "@/hooks/useAccessRequests";

interface Props {
  requests: AccessRequest[];
  actionLoading: string | null;
  error: string | null;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onClose: () => void;
  collapsed: boolean;
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function userName(user: AccessRequest["user"]) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return full || user.email;
}

export function RequestsPanel({
  requests,
  actionLoading,
  error,
  onApprove,
  onDeny,
  onClose,
  collapsed,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      style={{ left: collapsed ? 60 : 220 }}
      className="fixed top-16 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-left-2 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            Access requests
          </span>
          {requests.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full leading-none">
              {requests.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-xs text-red-600 border-b border-red-100">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Users size={20} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No pending requests</p>
          </div>
        ) : (
          requests.map((req) => {
            const isActioning = actionLoading === req.id;
            return (
              <div
                key={req.id}
                className="px-4 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-start gap-2.5 mb-2.5">
                  {req.user.imageUrl ? (
                    <img
                      src={req.user.imageUrl}
                      alt={userName(req.user)}
                      className="w-7 h-7 rounded-full shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-gray-500">
                        {(
                          req.user.firstName?.[0] ?? req.user.email[0]
                        ).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {userName(req.user)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {req.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300 shrink-0">
                    <Clock size={10} />
                    <span className="text-xs">{formatTime(req.createdAt)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-1">
                  wants to join{" "}
                  <span className="font-medium text-gray-700">
                    {req.project.name}
                  </span>
                </p>

                {req.message && (
                  <p className="text-xs text-gray-400 italic mb-2.5 line-clamp-2">
                    "{req.message}"
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onApprove(req.id)}
                    disabled={isActioning}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Check size={11} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => onDeny(req.id)}
                    disabled={isActioning}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <X size={11} />
                    )}
                    Deny
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
