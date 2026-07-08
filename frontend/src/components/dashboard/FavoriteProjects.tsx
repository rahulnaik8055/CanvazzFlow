"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import type { DashboardProject } from "@/hooks/useDashboard";

interface FavoriteProjectsProps {
  projects: DashboardProject[];
}

const GRADIENTS = [
  "from-rose-100 via-pink-50 to-purple-100",
  "from-amber-100 via-orange-50 to-rose-100",
  "from-blue-100 via-blue-50 to-indigo-100",
  "from-emerald-100 via-teal-50 to-cyan-100",
];

function gradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function FavoriteProjects({ projects }: FavoriteProjectsProps) {
  const router = useRouter();

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
        <h2 className="text-sm font-semibold text-gray-900">Favorites</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/project/${p.id}/pages`)}
            className="group text-left"
          >
            <div className={`relative aspect-video rounded-lg bg-gradient-to-br ${gradient(p.id)} flex items-center justify-center mb-1.5 overflow-hidden`}>
              <span className="text-lg font-bold text-white/70">
                {p.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors" />
            </div>
            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
              {p.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
