"use client";

import { Check, X, Loader2, Clock, Users } from "lucide-react";
import { useAccessRequests, AccessRequest } from "@/hooks/useAccessRequests";

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

export default function Dashboard() {
  const { requests, count, loading, actionLoading, error, approve, deny } =
    useAccessRequests();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Access requests
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            People who want to join your projects
          </p>
        </div>
        {count > 0 && (
          <span className="bg-red-500 text-white text-sm font-medium px-2.5 py-1 rounded-full">
            {count} pending
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={18} className="animate-spin text-gray-300" />
        </div>
      ) : requests.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Users size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No pending requests
          </p>
          <p className="text-xs text-gray-400 mt-1">
            When someone requests access to your project it will appear here
          </p>
        </div>
      ) : (
        /* Request list */
        <div className="flex flex-col gap-3">
          {requests.map((req) => {
            const isActioning = actionLoading === req.id;
            return (
              <div
                key={req.id}
                className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userName(req.user)}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={10} />
                      {formatTime(req.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {req.user.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    wants to join{" "}
                    <span className="font-medium text-gray-700">
                      {req.project.name}
                    </span>
                  </p>
                  {req.message && (
                    <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">
                      "{req.message}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approve(req.id)}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Check size={11} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => deny(req.id)}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
          })}
        </div>
      )}
    </div>
  );
}
