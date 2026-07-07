"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Send,
  XCircle,
  RefreshCw,
  Link2,
  Check,
  Mail,
  Clock,
  CheckCircle,
  Ban,
} from "lucide-react";
import { useInvitations, ProjectInvitation } from "@/hooks/useInvitations";
import { toast } from "sonner";

type Tab = "received" | "sent";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  accepted: "bg-green-50 text-green-600",
  declined: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  expired: "bg-gray-100 text-gray-500",
};

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).map((s) => (s as string)[0]).join("").toUpperCase().slice(0, 2);
}

function InvitationRow({
  invitation,
  variant,
  onCancel,
  onResend,
  onAccept,
  onDecline,
  copiedId,
  setCopiedId,
}: {
  invitation: ProjectInvitation;
  variant: "sent" | "received";
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
}) {
  const isPending = invitation.status === "pending";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${baseUrl}/invitations/${invitation.token}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (variant === "received") {
    const inviter = invitation.invitedBy;
    const inviterName = inviter
      ? [inviter.firstName, inviter.lastName].filter(Boolean).join(" ") || inviter.email
      : "Someone";
    return (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
          {inviter?.imageUrl ? (
            <img src={inviter.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-gray-500">
              {inviter ? getInitials(inviter.firstName, inviter.lastName) : <Mail size={14} />}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {inviterName} invited you to <span className="font-semibold">{invitation.project?.name || "a project"}</span>
            </span>
            {!isPending && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${STATUS_BADGE[invitation.status] || ""}`}>
                {invitation.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>Role: {invitation.role}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeAgo(invitation.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPending ? (
            <>
              <button
                onClick={() => onAccept(invitation.token)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                title="Accept invitation"
              >
                <CheckCircle size={14} />
                Accept
              </button>
              <button
                onClick={() => onDecline(invitation.token)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Decline invitation"
              >
                <Ban size={14} />
                Decline
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 px-2">
              {invitation.status === "accepted" && "Accepted"}
              {invitation.status === "declined" && "Declined"}
              {invitation.status === "cancelled" && "Cancelled"}
              {invitation.status === "expired" && "Expired"}
            </span>
          )}
        </div>
      </div>
    );
  }

  const name = invitation.user
    ? [invitation.user.firstName, invitation.user.lastName].filter(Boolean).join(" ") || invitation.user.email
    : invitation.email || "Link invite";
  const email = invitation.user?.email || invitation.email || "";

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
        {invitation.user?.imageUrl ? (
          <img src={invitation.user.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-gray-500">
            {invitation.user ? getInitials(invitation.user.firstName, invitation.user.lastName) : <Mail size={14} />}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${STATUS_BADGE[invitation.status] || ""}`}>
            {invitation.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          {email && <span className="truncate">{email}</span>}
          {email && <span>·</span>}
          {invitation.project && <span className="truncate">{invitation.project.name}</span>}
          <span>·</span>
          <span>Role: {invitation.role}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Send size={10} />
            {timeAgo(invitation.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isPending && (
          <>
            <button
              onClick={copyLink}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Copy invite link"
            >
              {copiedId === invitation.id ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
            </button>
            <button
              onClick={() => onResend(invitation.id)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Resend invitation"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => onCancel(invitation.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cancel invitation"
            >
              <XCircle size={14} />
            </button>
          </>
        )}
        {!isPending && (
          <span className="text-xs text-gray-400 px-2">
            {invitation.status === "accepted" && "Joined"}
            {invitation.status === "declined" && "Declined"}
            {invitation.status === "cancelled" && "Cancelled"}
            {invitation.status === "expired" && "Expired"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function InvitationsPage() {
  const router = useRouter();
  const { listSent, listMyPending, cancel, resend, accept, decline } = useInvitations();
  const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sent, received] = await Promise.all([listSent(), listMyPending()]);
      setSentInvitations(sent || []);
      setReceivedInvitations(received || []);
    } catch {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, [listSent, listMyPending]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id: string) => {
    try {
      await cancel(id);
      toast.success("Invitation cancelled");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resend(id);
      toast.success("Invitation resent");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend");
    }
  };

  const handleAccept = async (token: string) => {
    try {
      await accept(token);
      toast.success("Invitation accepted!");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to accept");
    }
  };

  const handleDecline = async (token: string) => {
    try {
      await decline(token);
      toast.success("Invitation declined");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to decline");
    }
  };

  const items = activeTab === "received" ? receivedInvitations : sentInvitations;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invitations</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeTab === "received" ? "Invitations sent to you" : "Invitations you have sent"}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "received" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Received ({receivedInvitations.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "sent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent ({sentInvitations.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Send size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No invitations yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            {activeTab === "received"
              ? "No one has invited you to any projects yet."
              : "Invite someone to a project to see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((inv) => (
            <InvitationRow
              key={inv.id}
              invitation={inv}
              variant={activeTab}
              onCancel={handleCancel}
              onResend={handleResend}
              onAccept={handleAccept}
              onDecline={handleDecline}
              copiedId={copiedId}
              setCopiedId={setCopiedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
