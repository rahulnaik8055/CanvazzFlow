"use client";

import { motion } from "motion/react";
import { Clock, ArrowRight } from "lucide-react";
import type { DashboardActivity } from "@/hooks/useDashboard";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface RecentActivityProps {
  activities: DashboardActivity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, i) => (
            <motion.div
              key={`${activity.projectId}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                  {activity.projectName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span>{activity.userName}</span>
                  <span>·</span>
                  <span>{timeAgo(activity.timestamp)}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
