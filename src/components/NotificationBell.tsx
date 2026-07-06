"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatLastActive } from "@/lib/presence";

function NotificationItem({
  n,
  onMarkRead,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
}) {
  const typeStyles: Record<string, string> = {
    access_request: "border-l-blue-400",
    access_request_approved: "border-l-green-400",
    access_request_denied: "border-l-red-400",
    role_changed: "border-l-amber-400",
    member_removed: "border-l-red-400",
    project_renamed: "border-l-purple-400",
  };

  const style = typeStyles[n.type] || "border-l-gray-300";

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-l-4 ${style} ${
        n.read ? "opacity-60" : ""
      } hover:bg-gray-50 transition-colors cursor-pointer`}
      onClick={() => !n.read && onMarkRead(n.id)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
        {n.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {n.message}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatLastActive(new Date(n.createdAt).getTime())}
        </p>
      </div>
      {!n.read && (
        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
      )}
    </div>
  );
}

interface NotificationBellProps {
  projectId?: string;
}

export default function NotificationBell({ projectId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(projectId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onMarkRead={markAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
