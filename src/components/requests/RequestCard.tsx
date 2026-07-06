"use client";

import { CheckCircle2, XCircle, Clock, ArrowUpRight, MessageSquare } from "lucide-react";
import { AccessRequestItem } from "@/hooks/useAccessRequestsManagement";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: <Clock size={11} />,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 size={11} />,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  denied: {
    label: "Denied",
    icon: <XCircle size={11} />,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle size={11} />,
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayName(u: { firstName?: string | null; lastName?: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

interface RequestCardProps {
  request: AccessRequestItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (request: AccessRequestItem) => void;
}

export function RequestCard({ request, selected, onSelect, onClick }: RequestCardProps) {
  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all cursor-pointer ${
        selected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
      onClick={() => onClick?.(request)}
    >
      {onSelect && (
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onSelect(request.id)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
        </div>
      )}

      <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
        {request.user.imageUrl ? (
          <img
            src={request.user.imageUrl}
            alt={displayName(request.user)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-gray-500">
            {displayName(request.user).charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            {displayName(request.user)}
          </span>
          <span className="text-xs text-gray-400">{request.user.email}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{request.project.name}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{timeAgo(request.createdAt)}</span>
        </div>
        {request.message && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <MessageSquare size={10} className="text-gray-300 shrink-0" />
            <span className="text-xs text-gray-400 italic truncate">
              &ldquo;{request.message}&rdquo;
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${statusConfig.className}`}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </div>
  );
}
