"use client";

import React, { useState, useRef, useEffect } from "react";
import { Users, MoreHorizontal } from "lucide-react";
import { getInitials, formatLastActive } from "@/lib/presence";

interface Collaborator {
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
}

interface CollaboratorAvatarsProps {
  others: Collaborator[];
  currentUser?: {
    name: string;
    avatar: string;
    color: string;
  };
}

const MAX_VISIBLE = 4;

export default function CollaboratorAvatars({
  others,
  currentUser,
}: CollaboratorAvatarsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = others.filter((o) => !o.presence.isIdle);
  const idle = others.filter((o) => o.presence.isIdle);
  const all = [...active, ...idle];
  const total = all.length + (currentUser ? 1 : 0);

  if (total === 0) return null;

  const visible = all.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, all.length - MAX_VISIBLE);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        title={`${total} collaborator${total !== 1 ? "s" : ""}`}
      >
        <div className="flex -space-x-1.5">
          {currentUser && (
            <AvatarBadge
              name={currentUser.name}
              avatar={currentUser.avatar}
              color={currentUser.color}
              isSelf
            />
          )}
          {visible.map((user) => (
            <AvatarBadge
              key={user.connectionId}
              name={user.presence.userName}
              avatar={user.presence.userAvatar}
              color={user.presence.userColor}
              isIdle={user.presence.isIdle}
            />
          ))}
          {overflowCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-gray-500">
              +{overflowCount}
            </div>
          )}
        </div>
        <Users size={13} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-30">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Collaborators &mdash; {total}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {currentUser && (
              <CollaboratorRow
                name={currentUser.name}
                avatar={currentUser.avatar}
                color={currentUser.color}
                isSelf
                isIdle={false}
                lastActive={Date.now()}
                page=""
                selectedId={null}
                selectedName={null}
              />
            )}

            {active.map((user) => (
              <CollaboratorRow
                key={user.connectionId}
                name={user.presence.userName}
                avatar={user.presence.userAvatar}
                color={user.presence.userColor}
                isIdle={false}
                lastActive={user.presence.lastActive}
                page={user.presence.page}
                selectedId={user.presence.selectedId}
                selectedName={user.presence.selectedName}
              />
            ))}

            {idle.length > 0 && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                Away
              </div>
            )}

            {idle.map((user) => (
              <CollaboratorRow
                key={user.connectionId}
                name={user.presence.userName}
                avatar={user.presence.userAvatar}
                color={user.presence.userColor}
                isIdle
                lastActive={user.presence.lastActive}
                page={user.presence.page}
                selectedId={user.presence.selectedId}
                selectedName={user.presence.selectedName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarBadge({
  name,
  avatar,
  color,
  isSelf,
  isIdle,
}: {
  name: string;
  avatar: string;
  color: string;
  isSelf?: boolean;
  isIdle?: boolean;
}) {
  return (
    <div className="relative" title={`${name}${isSelf ? " (you)" : ""}`}>
      <div
        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden"
        style={{ background: color }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
          isIdle ? "bg-yellow-400" : "bg-green-400"
        }`}
      />
    </div>
  );
}

function CollaboratorRow({
  name,
  avatar,
  color,
  isSelf,
  isIdle,
  lastActive,
  page,
  selectedId,
  selectedName,
}: {
  name: string;
  avatar: string;
  color: string;
  isSelf?: boolean;
  isIdle?: boolean;
  lastActive: number;
  page: string;
  selectedId: string | null;
  selectedName: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden"
          style={{ background: color }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(name)
          )}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isIdle ? "bg-yellow-400" : "bg-green-400"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-gray-900 truncate">
            {name}
          </span>
          {isSelf && (
            <span className="text-[10px] text-gray-400 font-medium">(you)</span>
          )}
          {isIdle && (
            <span className="text-[10px] text-yellow-500 font-medium">Away</span>
          )}
        </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-400">
            {page && <span>Viewing page</span>}
            {!isIdle && selectedId && (
              <>
                <span>&middot;</span>
                <span className="text-blue-400 truncate max-w-[120px]">
                  Editing {selectedName || "..."}
                </span>
              </>
            )}
            {isIdle && (
              <>
                <span>&middot;</span>
                <span>{formatLastActive(lastActive)}</span>
              </>
            )}
          </div>
      </div>
    </div>
  );
}
