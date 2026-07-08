"use client";

import { useState, useCallback, useEffect } from "react";
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
  Archive,
  Pin,
  LogOut,
  Settings as SettingsIcon,
  UserPlus,
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
  isFavorited?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  membershipId?: string;
  lastOpenedAt?: string | null;
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
  onToggleFavorite?: (project: IProject) => void;
  onToggleArchive?: (project: IProject) => void;
  onTogglePin?: (project: IProject) => void;
  onSettings?: (project: IProject) => void;
  onInvite?: (project: IProject) => void;
  onLeave?: (project: IProject) => void;
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

export function ProjectCard({
  project,
  onClick,
  onRename,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onToggleArchive,
  onTogglePin,
  onSettings,
  onInvite,
  onLeave,
}: ProjectCardProps) {
  const [favorite, setFavorite] = useState(project.isFavorited ?? false);

  useEffect(() => {
    setFavorite(project.isFavorited ?? false);
  }, [project.isFavorited]);

  const handleStar = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (onToggleFavorite) {
      onToggleFavorite(project);
    } else {
      setFavorite((prev) => !prev);
    }
  }, [project, onToggleFavorite]);

  const owner = ownerDisplay(project.owner, project.User);
  const gradient = thumbnailGradient(project.id);

  const isOwner = project.myRole === "owner";

  const menuItems = [
    { label: "Open Project", icon: <ExternalLink size={12} />, onClick: () => onClick?.(project) },
    { label: project.isPinned ? "Unpin" : "Pin Project", icon: <Pin size={12} />, onClick: () => onTogglePin?.(project) },
    { label: favorite ? "Remove Favorite" : "Add to Favorites", icon: <Heart size={12} />, onClick: handleStar },
    { label: project.isArchived ? "Unarchive" : "Archive", icon: <Archive size={12} />, onClick: () => onToggleArchive?.(project) },
    { label: "Rename", icon: <Pencil size={12} />, onClick: () => onRename?.(project) },
    { label: "Duplicate", icon: <Copy size={12} />, onClick: () => onDuplicate?.(project) },
    ...(isOwner ? [{ label: "Settings", icon: <SettingsIcon size={12} />, onClick: () => onSettings?.(project) }] : []),
    ...(isOwner ? [{ label: "Delete", icon: <Trash2 size={12} />, danger: true, onClick: () => onDelete?.(project) }] : []),
    ...(!isOwner ? [{ label: "Leave Project", icon: <LogOut size={12} />, danger: true, onClick: () => onLeave?.(project) }] : []),
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
            className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all z-10 ${
              favorite
                ? "text-amber-400 bg-white/80 hover:bg-white"
                : "text-gray-400 hover:text-amber-400 bg-white/0 hover:bg-white/80 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star size={13} fill={favorite ? "currentColor" : "none"} />
          </button>

          <div className="absolute top-2 right-2 flex items-center gap-1">
            {project.isPinned && (
              <div className="p-1 rounded-lg bg-white/80 text-gray-500">
                <Pin size={11} />
              </div>
            )}
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onSettings?.(project); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 bg-white/0 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-all"
                title="Settings"
              >
                <SettingsIcon size={13} />
              </button>
            )}
            <DropdownMenu
              align="end"
              trigger={
                <div className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 bg-white/0 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-all">
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

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onInvite?.(project); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <UserPlus size={12} />
                Invite
              </button>
              {!isOwner && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onLeave?.(project); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  title="Leave project"
                >
                  <LogOut size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContextMenu>
  );
}
