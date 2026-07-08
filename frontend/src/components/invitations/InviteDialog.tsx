"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mail, User, Loader2, Send, Search, Check, Ban, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInvitations, FoundUser } from "@/hooks/useInvitations";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

type InviteMode = "email" | "user";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).map((s) => (s as string)[0]).join("").toUpperCase().slice(0, 2);
}

export function InviteDialog({ open, onOpenChange, projectId }: InviteDialogProps) {
  const { searchUsers, inviteByEmail, inviteByUser } = useInvitations();
  const [mode, setMode] = useState<InviteMode>("email");
  const [input, setInput] = useState("");
  const [role, setRole] = useState("editor");
  const [message, setMessage] = useState("");
  const [expiresIn, setExpiresIn] = useState(48);
  const [sending, setSending] = useState(false);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(input, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "user" || !debouncedQuery.trim() || debouncedQuery.trim().length < 2 || selectedUser) {
      setFoundUsers([]);
      return;
    }
    setSearching(true);
    searchUsers(debouncedQuery.trim(), projectId)
      .then((users) => {
        setFoundUsers(users);
        setShowDropdown(users.length > 0);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedQuery, mode, projectId, searchUsers, selectedUser]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSend = async () => {
    if (mode === "user" && !selectedUser) return;
    if (mode === "email" && !input.trim()) return;
    setSending(true);
    try {
      if (mode === "email") {
        await inviteByEmail(projectId, input.trim(), role, message || undefined, expiresIn);
      } else if (selectedUser) {
        await inviteByUser(projectId, selectedUser.id, role, message || undefined, expiresIn);
      }
      toast.success("Invitation sent");
      onOpenChange(false);
      setInput("");
      setMessage("");
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const resetMode = (newMode: InviteMode) => {
    setMode(newMode);
    setInput("");
    setSelectedUser(null);
    setFoundUsers([]);
    setShowDropdown(false);
  };

  const selectUser = (user: FoundUser) => {
    setSelectedUser(user);
    setInput([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email);
    setShowDropdown(false);
    setFoundUsers([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to project</DialogTitle>
          <DialogDescription>Send an invitation to join this project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => resetMode("email")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail size={13} />
              Email
            </button>
            <button
              onClick={() => resetMode("user")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "user" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Search size={13} />
              Search user
            </button>
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              {mode === "email" ? "Email address" : "Search by name or email"}
            </label>
            <div className="relative">
              <input
                type={mode === "email" ? "email" : "text"}
                placeholder={mode === "email" ? "colleague@company.com" : "Type to search users..."}
                value={input}
                onChange={(e) => { setInput(e.target.value); setSelectedUser(null); }}
                onFocus={() => { if (foundUsers.length > 0) setShowDropdown(true); }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              />
              {searching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
              {selectedUser && (
                <button
                  onClick={() => { setSelectedUser(null); setInput(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>

              {showDropdown && foundUsers.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
                >
                  {foundUsers.map((user) => {
                    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                    const initials = getInitials(user.firstName, user.lastName);
                    const disabled = user.isMember || user.hasPendingInvitation;
                    return (
                      <button
                        key={user.id}
                        onClick={() => !disabled && selectUser(user)}
                        disabled={disabled}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                          {user.imageUrl ? (
                            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-500">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                          <div className="text-xs text-gray-400 truncate">{user.email}</div>
                          {user.isMember && (
                            <div className="flex items-center gap-1 text-[11px] text-green-600 mt-0.5">
                              <Check size={10} /> Already a member
                            </div>
                          )}
                          {user.hasPendingInvitation && !user.isMember && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-0.5">
                              <Clock size={10} /> Invitation pending
                            </div>
                          )}
                        </div>
                        {!disabled && <Check size={14} className="text-gray-300 shrink-0" />}
                        {disabled && <Ban size={14} className="text-gray-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Expires in</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={48}>2 days</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Message <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Hey, join our design project!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={handleSend}
            disabled={sending || (mode === "email" ? !input.trim() : !selectedUser || selectedUser.isMember || selectedUser.hasPendingInvitation)}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending..." : "Send invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
