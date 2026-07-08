"use client";

import { useRouter } from "next/navigation";
import { History, ExternalLink, FileText } from "lucide-react";
import type { RecentPage } from "@/hooks/useDashboard";

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

interface RecentPagesProps {
  pages: RecentPage[];
}

export function RecentPages({ pages }: RecentPagesProps) {
  const router = useRouter();

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-gray-700" />
        <h2 className="text-sm font-semibold text-gray-900">Recent Pages</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pages.map((p) => (
          <button
            key={p.pageId}
            onClick={() => router.push(`/editor/${p.projectId}/page/${p.pageId}`)}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                {p.pageName}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {p.projectName} · {timeAgo(p.visitedAt)}
              </p>
            </div>
            <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </section>
  );
}
