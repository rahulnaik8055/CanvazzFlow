"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import CollaboratorAvatars from "./CollaboratorAvatars";
import NotificationBell from "./NotificationBell";

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
  others,
  currentUser,
  members,
  onRoleChange,
  onRemoveMember,
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (membersRef.current && !membersRef.current.contains(e.target as Node)) {
        setMembersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

        <h1 className="text-sm font-semibold text-gray-900">Canvas editor</h1>

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

        {/* Members dropdown (owner only) */}
        {role === "owner" && members && members.length > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <div className="relative" ref={membersRef}>
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  membersOpen ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users size={14} />
                Members
                <ChevronDown size={12} />
              </button>
              {membersOpen && (
                <div className="absolute top-full mt-1 right-0 w-72 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="max-h-80 overflow-y-auto py-1">
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
                          ) : (
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
                          )}
                        </div>
                      );
                    })}
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


