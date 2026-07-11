"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import type { DashboardPendingRequest } from "@/hooks/useDashboard";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function userName(u: { firstName: string | null; lastName: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

interface PendingRequestsProps {
  requests: DashboardPendingRequest[];
  onRespond?: () => void;
}

export function PendingRequests({ requests, onRespond }: PendingRequestsProps) {
  const apiRef = useRef(useApi());
  const [local, setLocal] = useState(requests);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLocal(requests);
  }, [requests]);

  const handleApprove = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await apiRef.current.patch(`access-requests/${id}/respond`, { approved: true });
      setLocal((prev) => prev.filter((r) => r.id !== id));
      toast.success("Request approved");
      onRespond?.();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }, [onRespond]);

  const handleDeny = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await apiRef.current.patch(`access-requests/${id}/respond`, { approved: false });
      setLocal((prev) => prev.filter((r) => r.id !== id));
      toast.success("Request denied");
      onRespond?.();
    } catch {
      toast.error("Failed to deny");
    } finally {
      setActionLoading(null);
    }
  }, [onRespond]);

  if (local.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-gray-900">Pending Requests</h2>
        </div>
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">No pending requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-gray-900">Pending Requests</h2>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          {local.length}
        </span>
      </div>

      <div className="space-y-2">
        {local.map((req, i) => {
          const loading = actionLoading === req.id;
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {userName(req.user)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {req.project.name} · {timeAgo(req.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={loading}
                  className="p-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                </button>
                <button
                  onClick={() => handleDeny(req.id)}
                  disabled={loading}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
