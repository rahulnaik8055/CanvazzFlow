"use client";

import { useState } from "react";
import { X, Mail, User, Loader2, Clock, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInvitations } from "@/hooks/useInvitations";
import { toast } from "sonner";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

type InviteMode = "email" | "username";

export function InviteDialog({ open, onOpenChange, projectId }: InviteDialogProps) {
  const { inviteByEmail, inviteByUser } = useInvitations();
  const [mode, setMode] = useState<InviteMode>("email");
  const [input, setInput] = useState("");
  const [role, setRole] = useState("editor");
  const [message, setMessage] = useState("");
  const [expiresIn, setExpiresIn] = useState(48);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      if (mode === "email") {
        await inviteByEmail(projectId, input.trim(), role, message || undefined, expiresIn);
      } else {
        await inviteByUser(projectId, input.trim(), role, message || undefined, expiresIn);
      }
      toast.success(mode === "email" ? "Invitation sent" : "User invited");
      onOpenChange(false);
      setInput("");
      setMessage("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send invitation";
      toast.error(msg);
    } finally {
      setSending(false);
    }
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
              onClick={() => { setMode("email"); setInput(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail size={13} />
              Email
            </button>
            <button
              onClick={() => { setMode("username"); setInput(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "username" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User size={13} />
              User ID
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              {mode === "email" ? "Email address" : "User ID"}
            </label>
            <input
              type={mode === "email" ? "email" : "text"}
              placeholder={mode === "email" ? "colleague@company.com" : "user_id_123"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            />
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
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending..." : "Send invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
