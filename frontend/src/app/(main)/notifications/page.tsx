"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCheck, Trash2, Bell, Inbox, ArrowLeft } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useDebounce } from "@/hooks/useDebounce";
import { timeAgo } from "@/lib/notificationUtils";
import { toast } from "sonner";

const TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  project_invitation: "Invitation",
  invitation_accepted: "Invitation Accepted",
  invitation_declined: "Invitation Declined",
  access_request: "Access Request",
  access_request_approved: "Access Approved",
  access_request_denied: "Access Denied",
  role_changed: "Role Updated",
  member_removed: "Removed",
  project_renamed: "Project Renamed",
  project_updated: "Project Updated",
  project_deleted: "Project Deleted",
  ownership_transferred: "Ownership Transferred",
  ownership_received: "Ownership Received",
  ownership_changed: "Ownership Changed",
};

const TYPE_FILTERS = Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { notifications, loading, total, pages, markAsRead, markAllAsRead, deleteNotification, refresh } =
    useNotifications({ filter: tab, search: debouncedSearch, type: typeFilter, page, limit: 20 });

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, typeFilter]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = async (n: Notification) => {
    await deleteNotification(n.id);
    toast.success("Notification deleted");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-2 transition-colors"
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <CheckCheck size={13} />
          Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === t.value
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Type filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">All types</option>
          {TYPE_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={32} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            {search || typeFilter ? "No matching notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer ${
                !n.read ? "bg-blue-50/20 border-blue-100/50" : ""
              }`}
              onClick={() => {
                if (!n.read) markAsRead(n.id);
                const accessTypes = ["access_request", "access_request_approved", "access_request_denied", "project_invitation", "invitation_accepted", "invitation_declined"];
                if (accessTypes.includes(n.type)) {
                  router.push("/access");
                } else if (n.projectId) {
                  router.push(`/project/${n.projectId}/pages`);
                }
              }}
            >
              <div className="shrink-0 mt-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    !n.read ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{n.title}</span>
                  {n.type && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                      {NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                    </span>
                  )}
                </div>
                {n.message && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                  {n.projectId && (
                    <span className="text-[10px] text-blue-500 font-medium">
                      {["access_request", "access_request_approved", "access_request_denied", "project_invitation", "invitation_accepted", "invitation_declined"].includes(n.type) ? "View in Access Center" : "View project"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck size={13} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 px-3">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
