"use client";

import { motion } from "motion/react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PendingRequests } from "@/components/dashboard/PendingRequests";
import { RecentCollaborations } from "@/components/dashboard/RecentCollaborations";

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-900 text-white">
            <LayoutDashboard size={16} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your projects and activity</p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <OverviewCards stats={data.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProjectsSection projects={data.projects} />
            </div>

            <div className="space-y-4">
              <QuickActions />
              <RecentActivity activities={data.recentActivity} />
              <PendingRequests requests={data.pendingRequests} onRespond={refresh} />
              <RecentCollaborations collaborators={data.collaborators} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
