"use client";

import { motion } from "motion/react";
import { Users } from "lucide-react";
import type { DashboardCollaborator } from "@/hooks/useDashboard";

function initials(first: string | null, last: string | null) {
  return [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

interface RecentCollaborationsProps {
  collaborators: DashboardCollaborator[];
}

export function RecentCollaborations({ collaborators }: RecentCollaborationsProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-gray-900">Collaborators</h2>
      </div>

      {collaborators.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">No collaborators yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.slice(0, 6).map((collab, i) => {
            const name = [collab.firstName, collab.lastName].filter(Boolean).join(" ") || collab.email;
            const colorIndex = collab.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;

            return (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full ${AVATAR_COLORS[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}
                >
                  {collab.imageUrl ? (
                    <img src={collab.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials(collab.firstName, collab.lastName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{collab.email}</p>
                </div>
              </motion.div>
            );
          })}

          {collaborators.length > 6 && (
            <p className="text-[11px] text-center text-muted-foreground pt-1">
              +{collaborators.length - 6} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
