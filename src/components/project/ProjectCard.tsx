"use client";

import { useState, useCallback } from "react";
import {
  Star,
  MoreHorizontal,
  Users,
  FileText,
  Globe,
  Lock,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  Pencil,
  FolderOpen,
  Heart,
} from "lucide-react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ContextMenu } from "@/components/ui/context-menu";

export interface IProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  visibility?: "public" | "private";
  myRole?: "owner" | "editor" | "viewer";
  memberCount?: number;
  pagesCount?: number;
  owner?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  } | null;
  User?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string;
    imageUrl?: string | null;
  } | null;
}

interface ProjectCardProps {
  project: IProject;
  onClick?: (project: IProject) => void;
  onRename?: (project: IProject) => void;
  onDelete?: (project: IProject) => void;
  onDuplicate?: (project: IProject) => void;
}

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

function createdAt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ownerDisplay(
  owner?: { firstName: string | null; lastName: string | null; imageUrl: string | null } | null,
  User?: { firstName: string | null; lastName: string | null; email?: string; imageUrl?: string | null } | null,
) {
  const u = owner || User;
  if (!u) return null;
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
  return { name, imageUrl: u.imageUrl ?? null };
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((s) => s[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  editor: "bg-blue-50 text-blue-700 border-blue-200",
  viewer: "bg-gray-100 text-gray-500 border-gray-200",
};

const THUMBNAIL_GRADIENTS = [
  "from-blue-100 via-blue-50 to-indigo-100",
  "from-emerald-100 via-teal-50 to-cyan-100",
  "from-violet-100 via-purple-50 to-fuchsia-100",
  "from-amber-100 via-orange-50 to-rose-100",
  "from-rose-100 via-pink-50 to-purple-100",
  "from-cyan-100 via-sky-50 to-blue-100",
];

function thumbnailGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return THUMBNAIL_GRADIENTS[Math.abs(hash) % THUMBNAIL_GRADIENTS.length];
}

function getFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("project-favorites");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function toggleFavorite(id: string) {
  const favs = getFavorites();
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  localStorage.setItem("project-favorites", JSON.stringify([...favs]));
  window.dispatchEvent(new Event("storage"));
}

export function ProjectCard({
  project,
  onClick,
  onRename,
  onDelete,
  onDuplicate,
}: ProjectCardProps) {
  const [favorite, setFavorite] = useState(() => getFavorites().has(project.id));

  const handleStar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(project.id);
    setFavorite((prev) => !prev);
  }, [project.id]);

  const owner = ownerDisplay(project.owner, project.User);
  const gradient = thumbnailGradient(project.id);

  const menuItems = [
    {
      label: "Open Project",
      icon: <ExternalLink size={12} />,
      onClick: () => onClick?.(project),
    },
    {
      label: favorite ? "Remove Favorite" : "Add to Favorites",
      icon: <Heart size={12} />,
      onClick: () => { toggleFavorite(project.id); setFavorite((p) => !p); },
    },
    { label: "Rename", icon: <Pencil size={12} />, onClick: () => onRename?.(project) },
    { label: "Duplicate", icon: <Copy size={12} />, onClick: () => onDuplicate?.(project) },
    { label: "Delete", icon: <Trash2 size={12} />, danger: true, onClick: () => onDelete?.(project) },
  ];

  return (
    <ContextMenu items={menuItems}>
      <div
        onClick={() => onClick?.(project)}
        className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {project.thumbnail ? (
            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-50 group-hover:opacity-70 transition-opacity">
              <FolderOpen size={28} className="text-white/70" />
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                {project.name.slice(0, 2).toUpperCase() || "PR"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors" />

          <button
            onClick={handleStar}
            className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all ${
              favorite
                ? "text-amber-400 bg-white/80 hover:bg-white"
                : "text-white/0 hover:text-amber-400 bg-white/0 hover:bg-white/80 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star size={13} fill={favorite ? "currentColor" : "none"} />
          </button>

          <div className="absolute top-2 right-2">
            <DropdownMenu
              align="end"
              trigger={
                <div className="p-1.5 rounded-lg bg-white/0 hover:bg-white/80 text-white/0 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal size={14} />
                </div>
              }
              items={menuItems}
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            {project.myRole && (
              <span
                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md border capitalize ${ROLE_BADGE[project.myRole] || ROLE_BADGE.viewer}`}
              >
                {project.myRole}
              </span>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
              {project.description}
            </p>
          )}

          <div className="space-y-1.5">
            {owner && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-500 shrink-0 overflow-hidden">
                  {owner.imageUrl ? (
                    <img src={owner.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    owner.name ? initials(owner.name) : "?"
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {owner.name || "Unknown"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {project.memberCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {project.pagesCount ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {project.visibility === "private" ? (
                  <Lock size={11} />
                ) : (
                  <Globe size={11} />
                )}
                {project.visibility || "public"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground" title={createdAt(project.createdAt)}>
                <Clock size={11} />
                {timeAgo(project.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ContextMenu>
  );
}
