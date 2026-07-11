"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, RefreshCw, Inbox } from "lucide-react";
import { useAccess, AccessItem } from "@/hooks/useAccess";
import { useDebounce } from "@/hooks/useDebounce";
import AccessCard from "@/components/access/AccessCard";
import { toast } from "sonner";

const TABS = [
  { value: "incoming", label: "Incoming" },
  { value: "outgoing", label: "Outgoing" },
  { value: "history", label: "History" },
];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export default function AccessPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"incoming" | "outgoing" | "history">("incoming");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    incoming,
    outgoing,
    history,
    badgeCount,
    loading,
    refresh,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    approveRequest,
    rejectRequest,
  } = useAccess(tab);

  const handleAccept = async (item: AccessItem) => {
    if (item.token) {
      try {
        await acceptInvitation(item.token);
        toast.success("Invitation accepted!");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to accept");
      }
    }
  };

  const handleDecline = async (item: AccessItem) => {
    if (item.token) {
      try {
        await declineInvitation(item.token);
        toast.success("Invitation declined");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to decline");
      }
    }
  };

  const handleCancel = async (item: AccessItem) => {
    try {
      if (item.type === "invitation") {
        await cancelInvitation(item.id);
        toast.success("Invitation cancelled");
      } else {
        await cancelInvitation(item.id);
        toast.success("Request cancelled");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    }
  };

  const handleResend = async (item: AccessItem) => {
    try {
      await resendInvitation(item.id);
      toast.success("Invitation resent");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend");
    }
  };

  const handleApprove = async (item: AccessItem) => {
    try {
      await approveRequest(item.id);
      toast.success("Access approved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (item: AccessItem) => {
    try {
      await rejectRequest(item.id);
      toast.success("Access denied");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to deny");
    }
  };

  const getItems = () => {
    let items: AccessItem[];
    switch (tab) {
      case "incoming":
        items = incoming;
        break;
      case "outgoing":
        items = outgoing;
        break;
      case "history":
        items = history;
        break;
      default:
        items = [];
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(
        (i) =>
          i.projectName?.toLowerCase().includes(q) ||
          i.senderName?.toLowerCase().includes(q) ||
          i.receiverName?.toLowerCase().includes(q) ||
          i.role?.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      items = items.filter((i) => i.status === statusFilter);
    }

    return items;
  };

  const displayed = getItems();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Access Center</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage invitations and access requests in one place
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as "incoming" | "outgoing" | "history")}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === t.value
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {t.label}
            {t.value === "incoming" && badgeCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {badgeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "history" ? "Search by project, user, or role..." : "Filter by project or user..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        {tab === "history" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
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
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {tab === "incoming" && "Nothing to review"}
            {tab === "outgoing" && "Nothing sent"}
            {tab === "history" && "No history yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            {tab === "incoming" && "Invitations and access requests will appear here."}
            {tab === "outgoing" && "Invite someone to a project or request access to see it here."}
            {tab === "history" && "Completed invitations and requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((item) => (
            <AccessCard
              key={`${item.type}-${item.id}`}
              item={item}
              actions={tab as "incoming" | "outgoing" | "history"}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
              onResend={handleResend}
              onApprove={handleApprove}
              onReject={handleReject}
              onProjectClick={(pid) => router.push(`/project/${pid}/pages`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
