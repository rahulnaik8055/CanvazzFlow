"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Move,
  MousePointer,
  RotateCcw,
  Save,
  ArrowLeft,
  Loader2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Columns3,
  Rows3,
  Users,
  ChevronDown,
  X,
  LogOut,
} from "lucide-react";
import CollaboratorAvatars from "./CollaboratorAvatars";
import NotificationBell from "./NotificationBell";
import { useSocket } from "@/hooks/useSocket";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

type Role = "owner" | "editor" | "viewer";

const ROLE_STYLES: Record<Role, string> = {
  owner: "bg-amber-50  text-amber-700  border-amber-200",
  editor: "bg-blue-50   text-blue-700   border-blue-200",
  viewer: "bg-gray-100  text-gray-500   border-gray-200",
};

interface AlignmentHandlers {
  alignLeft: (ids: string[]) => void;
  alignCenterX: (ids: string[]) => void;
  alignRight: (ids: string[]) => void;
  alignTop: (ids: string[]) => void;
  alignCenterY: (ids: string[]) => void;
  alignBottom: (ids: string[]) => void;
  distributeHorizontally: (ids: string[]) => void;
  distributeVertically: (ids: string[]) => void;
}

interface MemberUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  role: string;
}

interface PendingRequest {
  requestId: string;
  projectId: string;
  userId: string;
  userName: string;
  userImage?: string;
  message?: string;
}

interface ApiAccessRequest {
  id: string;
  projectId: string;
  userId: string;
  message?: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  };
}

function toRequest(r: ApiAccessRequest): PendingRequest {
  return {
    requestId: r.id,
    projectId: r.projectId,
    userId: r.userId,
    userName:
      [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") ||
      r.user.email,
    userImage: r.user.imageUrl,
    message: r.message,
  };
}

interface TopToolbarProps {
  tool: "select" | "pan";
  setTool: (tool: "select" | "pan") => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveIndicator: "Live" | "Reconnecting" | "Connecting...";
  role: Role;
  onSave: () => void;
  onBack: () => void;
  selectedIds: string[];
  canEdit: boolean;
  alignment: AlignmentHandlers;
  projectId?: string;
  projectName?: string;
  others?: Array<{
    connectionId: number;
    presence: {
      userName: string;
      userAvatar: string;
      userColor: string;
      page: string;
      lastActive: number;
      isIdle: boolean;
      selectedId: string | null;
      selectedName: string | null;
    };
  }>;
  currentUser?: {
    name: string;
    avatar: string;
    color: string;
  };
  members?: MemberUser[];
  onRoleChange?: (userId: string, role: string) => void;
  onRemoveMember?: (userId: string) => void;
  currentUserId?: string;
  onLeaveProject?: () => void;
}

export default function TopToolbar({
  tool,
  setTool,
  undo,
  redo,
  canUndo,
  canRedo,
  saveIndicator,
  role,
  onSave,
  onBack,
  selectedIds,
  canEdit,
  alignment,
  projectId,
  projectName,
  others,
  currentUser,
  members,
  onRoleChange,
  onRemoveMember,
  currentUserId,
  onLeaveProject,
}: TopToolbarProps) {
  const isLive = saveIndicator === "Live";

  const saveLabel =
    saveIndicator === "Live"
      ? "All changes saved"
      : saveIndicator === "Reconnecting"
        ? "Reconnecting..."
        : "Connecting...";

  const [membersOpen, setMembersOpen] = useState(false);
  const membersRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const api = useApi();
  const [accessRequests, setAccessRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (membersRef.current && !membersRef.current.contains(e.target as Node)) {
        setMembersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (role !== "owner" || !projectId) return;
    api
      .get(`access-requests/project/${projectId}/pending`)
      .then((data: ApiAccessRequest[]) => setAccessRequests(data.map(toRequest)))
      .catch(() => {});
  }, [projectId, role]);

  useEffect(() => {
    if (!socket || role !== "owner") return;
    function onRequest(req: PendingRequest) {
      if (req.projectId !== projectId) return;
      setAccessRequests((prev) => {
        if (prev.some((r) => r.requestId === req.requestId)) return prev;
        return [req, ...prev];
      });
    }
    socket.on("access-request", onRequest);
    return () => {
      socket.off("access-request", onRequest);
    };
  }, [socket, projectId, role]);

  const respondToRequest = useCallback(async (requestId: string, approved: boolean) => {
    const target = accessRequests.find((r) => r.requestId === requestId);
    setAccessRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    try {
      await api.patch(`access-requests/${requestId}/respond`, { approved });
      toast.success(
        approved
          ? `Approved access for ${target?.userName ?? "user"}`
          : `Denied access for ${target?.userName ?? "user"}`
      );
    } catch {
      toast.error("Failed to update access request");
      if (target) setAccessRequests((prev) => [target, ...prev]);
    }
  }, [accessRequests]);

  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm px-3 z-20 flex items-center justify-between h-14">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <h1 className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">{projectName || "Untitled"}</h1>

        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${ROLE_STYLES[role]}`}
        >
          {role}
        </span>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTool("select")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              tool === "select"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MousePointer size={15} />
            <span className="text-sm font-medium">Select</span>
          </button>
          <button
            onClick={() => setTool("pan")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              tool === "pan"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Move size={15} />
            <span className="text-sm font-medium">Pan</span>
          </button>
        </div>

        {selectedIds.length > 0 && canEdit && (
          <>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => alignment.alignLeft(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align left"
              >
                <AlignStartVertical size={14} />
              </button>
              <button
                onClick={() => alignment.alignCenterX(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align center horizontally"
              >
                <AlignCenterVertical size={14} />
              </button>
              <button
                onClick={() => alignment.alignRight(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align right"
              >
                <AlignEndVertical size={14} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => alignment.alignTop(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align top"
              >
                <AlignStartHorizontal size={14} />
              </button>
              <button
                onClick={() => alignment.alignCenterY(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align center vertically"
              >
                <AlignCenterHorizontal size={14} />
              </button>
              <button
                onClick={() => alignment.alignBottom(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Align bottom"
              >
                <AlignEndHorizontal size={14} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => alignment.distributeHorizontally(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Distribute horizontally"
              >
                <Columns3 size={14} />
              </button>
              <button
                onClick={() => alignment.distributeVertically(selectedIds)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Distribute vertically"
              >
                <Rows3 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCcw size={15} className="scale-x-[-1]" />
          </button>
        </div>

        {/* Members dropdown */}
        {members && members.length > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <div className="relative" ref={membersRef}>
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                  membersOpen ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users size={14} />
                Members
                {role === "owner" && accessRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {accessRequests.length}
                  </span>
                )}
                <ChevronDown size={12} />
              </button>
              {membersOpen && (
                <div className="absolute top-full mt-1 right-0 w-80 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="max-h-96 overflow-y-auto py-1">
                    {/* Pending access requests (owner only) */}
                    {role === "owner" && accessRequests.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending requests</div>
                        {accessRequests.map((req) => (
                          <div key={req.requestId} className="flex items-start gap-3 px-3 py-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                              {req.userImage ? (
                                <img src={req.userImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-semibold text-gray-500">{req.userName[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{req.userName}</div>
                              <div className="text-[10px] text-gray-400">{req.message ? `"${req.message}"` : "wants to join"}</div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => respondToRequest(req.requestId, false)}
                                className="px-2 py-1 text-[10px] text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                Deny
                              </button>
                              <button
                                onClick={() => respondToRequest(req.requestId, true)}
                                className="px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}

                    {/* Members list */}
                    {role === "owner" && accessRequests.length > 0 && (
                      <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Members</div>
                    )}
                    {members.map((m, idx) => {
                      const initials = [m.firstName, m.lastName].filter(Boolean).map((s) => (s as string)[0]).join("").toUpperCase().slice(0, 2);
                      const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
                      const isOwner = m.role === "owner";
                      return (
                        <div key={`${m.id}-${idx}`} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                            {m.imageUrl ? (
                              <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-semibold text-gray-500">{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900 truncate">{name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{m.email}</div>
                          </div>
                          {isOwner ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 capitalize shrink-0">Owner</span>
                          ) : role === "owner" ? (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) => onRoleChange?.(m.id, e.target.value)}
                                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 capitalize shrink-0"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                              </select>
                              <button
                                onClick={() => onRemoveMember?.(m.id)}
                                className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                title="Remove member"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Leave project (non-owner) */}
                    {role !== "owner" && onLeaveProject && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={onLeaveProject}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={13} />
                          Leave project
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="w-px h-5 bg-gray-200" />

        <NotificationBell projectId={projectId} />

        <div className="w-px h-5 bg-gray-200" />

        <CollaboratorAvatars others={others ?? []} currentUser={currentUser} />

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={onSave}
          disabled={!isLive}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isLive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600"
          }`}
          title={saveLabel}
        >
          {isLive ? (
            <Save size={15} />
          ) : (
            <Loader2 size={15} className="animate-spin" />
          )}
          <span className="text-sm font-medium">{saveLabel}</span>
        </button>
      </div>
    </div>
  );
}


