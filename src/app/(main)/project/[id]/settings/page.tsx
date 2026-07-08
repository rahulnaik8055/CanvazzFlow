"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { ArrowLeft, Globe, Lock, Check, X, Trash2, Shield, Users, Archive, ChevronDown, UserCog, UserPlus, LogOut } from "lucide-react";
import { EmptyState } from "@/components/custom/EmptyState";
import { InviteDialog } from "@/components/invitations/InviteDialog";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Anyone can find and request access" },
  { value: "private", label: "Private", desc: "Only invited members can access" },
] as const;

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer", desc: "Can only view and comment" },
  { value: "editor", label: "Editor", desc: "Can edit the canvas" },
  { value: "owner", label: "Owner", desc: "Full access and settings" },
] as const;

export default function SettingsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const apiRef = useRef(useApi());
  const socket = useSocket(projectId);

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const { user } = useUser();

  const fetchSettings = useCallback(async () => {
    try {
      const [proj, settings] = await Promise.all([
        apiRef.current.get(`project/${projectId}`),
        apiRef.current.get(`project/${projectId}/settings`),
      ]);
      setProject(proj);
      setMembers(settings.members);
      setMyRole(settings.myRole);
      setName(proj.name);
      setDescription(proj.description ?? "");
      setVisibility(proj.visibility ?? "public");
    } catch {
      toast.error("Failed to load project settings");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchSettings();
    socket.on("project-updated", handler);
    return () => { socket.off("project-updated", handler); };
  }, [socket, fetchSettings]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const updated = await apiRef.current.patch(`project/${projectId}`, { name, description, visibility });
      setProject((prev: any) => ({ ...prev, ...updated }));
      socket?.emit("project-updated", { projectId });
      toast.success("Project updated");
    } catch {
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await apiRef.current.patch(`projects/${projectId}/members/${userId}/role`, { role });
      setMembers((prev: any[]) =>
        prev.map((m) => (m.id === userId ? { ...m, role } : m)),
      );
      socket?.emit("project-updated", { projectId });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await apiRef.current.delete(`projects/${projectId}/members/${userId}`);
      setMembers((prev: any[]) => prev.filter((m) => m.id !== userId));
      socket?.emit("project-updated", { projectId });
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget || !window.confirm("Transfer project ownership? This cannot be undone.")) return;
    try {
      await apiRef.current.post(`project/${projectId}/transfer-ownership`, { userId: transferTarget });
      toast.success("Ownership transferred");
      setTransferOpen(false);
      setTransferTarget("");
      fetchSettings();
      socket?.emit("project-updated", { projectId });
    } catch {
      toast.error("Failed to transfer ownership");
    }
  };

  const handleToggleArchive = async () => {
    try {
      const res = await apiRef.current.post(`project/${projectId}/toggle-archive`);
      toast.success(res.isArchived ? "Project archived" : "Project unarchived");
      fetchSettings();
      socket?.emit("project-updated", { projectId });
    } catch {
      toast.error("Failed to archive project");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project permanently? All data will be lost.")) return;
    if (!window.confirm("Are you absolutely sure? This cannot be undone.")) return;
    try {
      await apiRef.current.delete(`project/${projectId}`);
      toast.success("Project deleted");
      router.push("/project");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleLeaveProject = async () => {
    if (!window.confirm("Leave this project? You will lose access to all its content.")) return;
    if (!user?.id) return;
    try {
      await apiRef.current.delete(`projects/${projectId}/members/${user.id}`);
      toast.success("Left project");
      router.push("/project");
    } catch {
      toast.error("Failed to leave project");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const isOwner = myRole === "owner";
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex items-center justify-center text-lg font-bold text-blue-600">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Project Settings</h1>
          <p className="text-sm text-gray-500">{name}</p>
        </div>
      </div>

      {/* General */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Icon</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex items-center justify-center text-base font-bold text-blue-600">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs text-gray-400">Auto-generated from project name</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner}
              rows={3}
              className="w-full max-w-lg px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
            <div className="flex flex-wrap gap-3">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => isOwner && setVisibility(opt.value)}
                  disabled={!isOwner}
                  className={`flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${
                    visibility === opt.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!isOwner ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {opt.value === "public" ? <Globe className="w-4 h-4 mt-0.5 text-gray-500" /> : <Lock className="w-4 h-4 mt-0.5 text-gray-500" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                  {visibility === opt.value && <Check className="w-4 h-4 text-gray-900 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="pt-2">
              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Members</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <UserPlus size={13} />
              Invite
            </button>
            <span className="text-xs text-gray-400">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="space-y-2">
          {members.length === 0 ? (
            <EmptyState
              illustration="members"
              title="No members yet"
              description="Invite team members to collaborate on this project."
            />
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden shrink-0">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      [member.firstName, member.lastName].filter(Boolean).map((s: string) => s[0]).join("").toUpperCase().slice(0, 2) || "?"
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") || "Unknown"}
                      {member.role === "owner" && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && member.role !== "owner" ? (
                    <div className="relative group">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="appearance-none text-xs px-2.5 py-1.5 pr-6 border border-gray-200 rounded-md bg-white text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      >
                        {ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${
                      member.role === "owner" ? "bg-amber-50 text-amber-700" :
                      member.role === "editor" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {member.role}
                    </span>
                  )}

                  {isOwner && member.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove member"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Permissions */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Permissions</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Shield className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-500">
            {visibility === "public"
              ? "This project is public. Anyone can find it and request access."
              : "This project is private. Only invited members can access it."}
          </p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-red-200 rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-red-600 mb-5">Danger Zone</h2>
        <div className="space-y-4">
          {isOwner && (
            <>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Archive Project</div>
                  <div className="text-xs text-gray-500">Hide from active project list</div>
                </div>
                <button
                  onClick={handleToggleArchive}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  {project?.isArchived ? "Unarchive" : "Archive"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Transfer Ownership</div>
                  <div className="text-xs text-gray-500">Give ownership to another member</div>
                </div>
                <div className="relative">
                  {transferOpen ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        className="text-xs px-2.5 py-1.5 pr-6 border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Select member...</option>
                        {nonOwnerMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {[m.firstName, m.lastName].filter(Boolean).join(" ") || "Unknown"}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleTransferOwnership}
                        disabled={!transferTarget}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => { setTransferOpen(false); setTransferTarget(""); }}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setTransferOpen(true)}
                      className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Transfer
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-red-600">Delete Project</div>
                  <div className="text-xs text-red-400">Permanently delete this project and all its data</div>
                </div>
                <button
                  onClick={handleDeleteProject}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}

          {!isOwner && (
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-red-600">Leave Project</div>
                <div className="text-xs text-red-400">Remove yourself from this project</div>
              </div>
              <button
                onClick={handleLeaveProject}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Leave
              </button>
            </div>
          )}
        </div>
      </section>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} projectId={projectId} />
    </div>
  );
}
