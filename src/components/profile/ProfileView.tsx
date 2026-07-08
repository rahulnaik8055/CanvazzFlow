"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit3, FolderOpen, Clock, Users, FileText, Activity, ExternalLink, Shield, UserPlus, Check, Globe } from "lucide-react";
import { useProfile, Profile, ProjectCard, Activity as ActivityType } from "@/hooks/useProfile";
import { RequestAccessModal } from "@/components/requests/RequestAccessModal";
import { useAuth } from "@clerk/nextjs";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).map((s) => (s as string)[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-gray-200 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function ProjectCardView({ project }: { project: ProjectCard }) {
  return (
    <Link
      href={`/project/${project.id}/pages`}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer"
    >
      <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <FolderOpen size={28} className="text-gray-300" />
        )}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize cursor-default ${
            project.visibility === "public" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
          }`}>
            {project.visibility}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1.5">
          <span className="flex items-center gap-1">
            <Shield size={10} />
            {project.role}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Users size={10} />
            {project.memberCount}
          </span>
          <span>·</span>
          <span>{timeAgo(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function PublicProjectCard({
  project,
  currentUserId,
  onRequestAccess,
}: {
  project: ProjectCard & { role: string | null };
  currentUserId?: string;
  onRequestAccess: (project: ProjectCard & { role: string | null }) => void;
}) {
  const isMember = project.role !== null;
  const isOwn = project.owner?.id === currentUserId;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all group">
      <Link
        href={isMember ? `/project/${project.id}/pages` : "#"}
        className="block cursor-pointer"
        onClick={(e) => { if (!isMember) e.preventDefault(); }}
      >
        <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
          {project.thumbnail ? (
            <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <FolderOpen size={28} className="text-gray-300" />
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {project.visibility && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600 cursor-default">
                {project.visibility}
              </span>
            )}
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{project.description}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1.5">
            <span className="flex items-center gap-1">
              <Users size={10} />
              {project.memberCount}
            </span>
            <span>·</span>
            <span>{timeAgo(project.updatedAt)}</span>
          </div>
        </div>
      </Link>

      {!isOwn && !isMember && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onRequestAccess(project)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus size={12} />
            Request Access
          </button>
        </div>
      )}

      {isMember && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-green-600 bg-green-50 rounded-lg">
            <Check size={12} />
            Member
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileHeader({ profile, isOwnProfile }: { profile: Profile; isOwnProfile: boolean }) {
  const name = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";
  const initials = getInitials(profile.firstName, profile.lastName);
  const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-start gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            {profile.imageUrl ? (
              <img src={profile.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl font-bold text-gray-400">{initials}</span>
              </div>
            )}
          </div>
          {profile.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Joined {joinedDate}
                </span>
                {profile.isOnline && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Online
                    </span>
                  </>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
              >
                <Edit3 size={12} />
                Edit profile
              </Link>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-lg">{profile.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsSection({ profile }: { profile: Profile }) {
  const { stats } = profile;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={FolderOpen} label="Projects Owned" value={stats.projectsOwned} />
      <StatCard icon={Users} label="Projects Joined" value={stats.projectsJoined} />
      <StatCard icon={FileText} label="Pages Created" value={stats.pagesCreated} />
      <StatCard icon={Activity} label="Collaborations" value={stats.totalCollaborations} />
    </div>
  );
}

function ProjectsSection({
  owned,
  shared,
  loading,
}: {
  owned: ProjectCard[];
  shared: ProjectCard[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Owned Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
                <div className="h-24 bg-gray-50" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-50 rounded w-2/3" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {owned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FolderOpen size={14} className="text-gray-400" />
            Owned Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {owned.map((p) => (
              <ProjectCardView key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      {shared.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            Shared Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shared.map((p) => (
              <ProjectCardView key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      {owned.length === 0 && shared.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-2xl">
          <FolderOpen size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No projects yet</p>
          <p className="text-xs text-gray-400 mt-1">Projects you own or collaborate on will appear here.</p>
        </div>
      )}
    </div>
  );
}

function ActivitySection({ activity }: { activity: ActivityType | null }) {
  if (!activity) return null;
  const hasActivity = activity.recentlyJoined.length > 0 || activity.recentlyEdited.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity size={14} className="text-gray-400" />
        Activity
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {activity.recentlyJoined.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Recently Joined</h3>
            <div className="space-y-2">
              {activity.recentlyJoined.map((j) => (
                <Link
                  key={j.projectId}
                  href={`/project/${j.projectId}/pages`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FolderOpen size={14} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {j.projectName}
                    </p>
                    <p className="text-[11px] text-gray-400">{timeAgo(j.joinedAt)}</p>
                  </div>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {activity.recentlyEdited.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Recently Edited</h3>
            <div className="space-y-2">
              {activity.recentlyEdited.map((v) => (
                <Link
                  key={v.pageId}
                  href={`/editor/${v.projectId}/page/${v.pageId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText size={14} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {v.pageName}
                    </p>
                    <p className="text-[11px] text-gray-400">{v.projectName} · {timeAgo(v.visitedAt)}</p>
                  </div>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-3.5 bg-gray-100 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProfileViewProps {
  userId?: string;
}

export function ProfileView({ userId }: ProfileViewProps) {
  const { userId: currentUserId } = useAuth();
  const {
    profile,
    ownedProjects,
    sharedProjects,
    publicProjects,
    activity,
    loading,
    isOwnProfile,
    touchActive,
  } = useProfile(userId);

  const [requestProject, setRequestProject] = useState<(ProjectCard & { role: string | null }) | null>(null);

  useEffect(() => {
    if (isOwnProfile) touchActive();
  }, [isOwnProfile, touchActive]);

  if (loading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <Users size={28} className="text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">User not found</h2>
        <p className="text-sm text-gray-400 mt-1">This profile doesn&apos;t exist or is private.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
      <StatsSection profile={profile} />

      {isOwnProfile && activity && <ActivitySection activity={activity} />}

      {isOwnProfile && (
        <ProjectsSection owned={ownedProjects} shared={sharedProjects} loading={loading} />
      )}

      {!isOwnProfile && publicProjects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe size={14} className="text-gray-400" />
            Public Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicProjects.map((p) => (
              <PublicProjectCard
                key={p.id}
                project={p}
                currentUserId={currentUserId ?? undefined}
                onRequestAccess={setRequestProject}
              />
            ))}
          </div>
        </div>
      )}

      {!isOwnProfile && publicProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-2xl">
          <Globe size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No public projects</p>
          <p className="text-xs text-gray-400 mt-1">This user hasn&apos;t made any projects public.</p>
        </div>
      )}

      {requestProject && currentUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative">
            <RequestAccessModal
              projectId={requestProject.id}
              projectName={requestProject.name}
              currentUserId={currentUserId}
            />
            <button
              onClick={() => setRequestProject(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 hover:text-gray-900 shadow-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
