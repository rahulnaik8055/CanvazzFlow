"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Lock,
  Users,
  FileText,
  User,
  MessageSquare,
  Shield,
  Loader2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessRequestItem } from "@/hooks/useAccessRequestsManagement";

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "bg-amber-50 text-amber-700 border-amber-200" },
  editor: { label: "Editor", className: "bg-blue-50 text-blue-700 border-blue-200" },
  viewer: { label: "Viewer", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode; dotColor: string }> = {
  pending: { label: "Requested", icon: null, dotColor: "bg-gray-900" },
  approved: { label: "Approved", icon: <CheckCircle2 size={12} />, dotColor: "bg-green-500" },
  denied: { label: "Denied", icon: <XCircle size={12} />, dotColor: "bg-red-500" },
  cancelled: { label: "Cancelled", icon: <Ban size={12} />, dotColor: "bg-gray-400" },
};

function displayName(u: { firstName?: string | null; lastName?: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface RequestDetailsDrawerProps {
  request: AccessRequestItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
}

export function RequestDetailsDrawer({
  request,
  open,
  onClose,
  onApprove,
  onReject,
}: RequestDetailsDrawerProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!open || !request) return null;

  const statusConfig = {
    pending: { icon: <Clock size={14} />, label: "Pending", className: "bg-yellow-50 text-yellow-700" },
    approved: { icon: <CheckCircle2 size={14} />, label: "Approved", className: "bg-green-50 text-green-700" },
    denied: { icon: <XCircle size={14} />, label: "Denied", className: "bg-red-50 text-red-700" },
    cancelled: { icon: <Ban size={14} />, label: "Cancelled", className: "bg-gray-50 text-gray-500" },
  }[request.status];

  const isPending = request.status === "pending";

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(request.id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(request.id, rejectReason || undefined);
    } finally {
      setRejecting(false);
    }
  };

  const events = request.events?.length
    ? request.events
    : [
        {
          id: "creation",
          accessRequestId: request.id,
          fromStatus: null,
          toStatus: "pending" as const,
          reason: request.message || null,
          createdAt: request.createdAt,
          changedBy: {
            id: request.user.id,
            firstName: request.user.firstName,
            lastName: request.user.lastName,
            email: request.user.email,
            imageUrl: request.user.imageUrl,
          },
        },
      ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-gray-100 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Request Details</h2>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusConfig.className}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="flex items-start gap-4 pb-5 border-b border-gray-50">
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                {request.user.imageUrl ? (
                  <img
                    src={request.user.imageUrl}
                    alt={displayName(request.user)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {displayName(request.user)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{request.user.email}</p>
                {request.user.createdAt && (
                  <p className="text-xs text-gray-300 mt-1">
                    Joined {formatDate(request.user.createdAt).split(",")[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="pb-5 border-b border-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    Project
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{request.project.name}</p>
                  {request.project.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {request.project.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {request.project.visibility === "public" ? (
                    <Globe size={11} />
                  ) : (
                    <Lock size={11} />
                  )}
                  {request.project.visibility}
                </span>
                {request.project._count && (
                  <>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users size={11} />
                      {(request.project._count as any).members ?? 0} members
                    </span>
                    {(request.project._count as any).pages !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FileText size={11} />
                        {(request.project as any)._count.pages} pages
                      </span>
                    )}
                  </>
                )}
              </div>
              {request.project.User && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Owned by</span>
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    {(request.project as any).User?.imageUrl && (
                      <img
                        src={(request.project as any).User.imageUrl}
                        className="h-4 w-4 rounded-full"
                        alt=""
                      />
                    )}
                    {displayName((request.project as any).User || {}) || "Unknown"}
                  </span>
                </div>
              )}
            </div>

            {request.message && (
              <div className="pb-5 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Message
                </p>
                <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                  <MessageSquare size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{request.message}</p>
                </div>
              </div>
            )}

            <div className="pb-5 border-b border-gray-50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Requested Role
              </p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${
                  ROLE_BADGES[request.requestedRole]?.className ||
                  "bg-gray-100 text-gray-500 border-gray-200"
                }`}
              >
                <Shield size={11} />
                {ROLE_BADGES[request.requestedRole]?.label || request.requestedRole}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                History
              </p>
              <div className="space-y-0">
                {events.map((event, idx) => {
                  const config = EVENT_LABELS[event.toStatus] || EVENT_LABELS.pending;
                  const isLast = idx === events.length - 1;
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${config.dotColor}`} />
                        {!isLast && <div className="flex-1 w-px bg-gray-100 min-h-6" />}
                      </div>
                      <div className={`pb-4 ${isLast ? "" : ""}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-900 capitalize">
                            {config.label}
                          </span>
                          {event.changedBy && event.changedBy.id !== request.user.id && (
                            <span className="text-xs text-gray-400">
                              by {displayName(event.changedBy)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(event.createdAt)}
                        </p>
                        {event.reason && (
                          <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                            &ldquo;{event.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            {showReason && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Reason for rejection (optional)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReject()}
                  className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowReason(false);
                    setRejectReason("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleApprove}
                disabled={approving || rejecting}
              >
                {approving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {approving ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (showReason) {
                    handleReject();
                  } else {
                    setShowReason(true);
                  }
                }}
                disabled={approving || rejecting}
              >
                {rejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                {rejecting ? "Rejecting..." : showReason ? "Confirm reject" : "Reject"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
