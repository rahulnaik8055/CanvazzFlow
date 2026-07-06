"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, FolderOpen, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

const actions = [
  {
    label: "New Project",
    icon: Plus,
    desc: "Create a new design project",
    href: null,
    color: "text-blue-600",
    bg: "bg-blue-50",
    hoverBg: "hover:bg-blue-50",
  },
  {
    label: "All Projects",
    icon: FolderOpen,
    desc: "Browse and manage projects",
    href: "/project",
    color: "text-violet-600",
    bg: "bg-violet-50",
    hoverBg: "hover:bg-violet-50",
  },
  {
    label: "Invite Team",
    icon: Users,
    desc: "Add collaborators to projects",
    href: null,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    hoverBg: "hover:bg-emerald-50",
  },
  {
    label: "View Requests",
    icon: ArrowRight,
    desc: "See pending access requests",
    href: "/requests",
    color: "text-amber-600",
    bg: "bg-amber-50",
    hoverBg: "hover:bg-amber-50",
  },
];

export function QuickActions() {
  const router = useRouter();
  const api = useApi();
  const [creating, setCreating] = useState(false);

  const handleAction = async (action: (typeof actions)[0]) => {
    if (action.href) {
      router.push(action.href);
      return;
    }

    if (action.label === "New Project") {
      setCreating(true);
      try {
        const project = await api.post("project", {
          name: "Untitled Project",
        });
        toast.success("Project created");
        router.push(`/project/${project.id}/pages`);
      } catch {
        toast.error("Failed to create project");
      } finally {
        setCreating(false);
      }
    }

    if (action.label === "Invite Team") {
      router.push("/project");
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
      <div className="space-y-1.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              onClick={() => handleAction(action)}
              disabled={creating}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors disabled:opacity-50 group"
            >
              <div className={`p-1.5 rounded-md ${action.bg} ${action.color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{action.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
