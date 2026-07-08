"use client";

import { motion } from "motion/react";
import { FolderOpen, FileText, Users, Bell } from "lucide-react";
import type { DashboardStats } from "@/hooks/useDashboard";

const cards = [
  {
    label: "Total Projects",
    key: "totalProjects" as const,
    icon: FolderOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Total Pages",
    key: "totalPages" as const,
    icon: FileText,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    label: "Collaborators",
    key: "totalMembers" as const,
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Pending Requests",
    key: "pendingRequests" as const,
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function OverviewCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="group relative rounded-xl border border-gray-100 bg-white p-5 hover:shadow-sm hover:border-gray-200 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon size={16} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
