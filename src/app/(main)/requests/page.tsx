// app/requests/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Users,
  FolderOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Globe,
  Lock,
  RefreshCw,
  Crown,
  Pencil,
  Eye,
} from "lucide-react";
import { useMyProjects, MyProject, ProjectRole } from "@/hooks/useMyProjects";
import { useMyRequests, RequestStatus } from "@/hooks/useMyRequests";
import { useProjectSearch, SearchProject } from "@/hooks/useProjectSearch";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

type Tab = "projects" | "requests";

const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; icon: React.ReactNode; className: string }
> = {
  owner: {
    label: "Owner",
    icon: <Crown size={10} />,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  editor: {
    label: "Editor",
    icon: <Pencil size={10} />,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye size={10} />,
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock size={11} />,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 size={11} />,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  denied: {
    label: "Denied",
    icon: <XCircle size={11} />,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ownerName(user: SearchProject["User"]) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

function RoleBadge({ role }: { role: ProjectRole }) {
  const config = ROLE_CONFIG[role];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border capitalize ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ProjectCard({ project }: { project: MyProject }) {
  const router = useRouter();
  const firstPageId = project.pages[0]?.id;

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200">
      <div
        className="h-32 bg-gray-50 relative overflow-hidden cursor-pointer"
        onClick={() =>
          firstPageId &&
          router.push(`/editor/${project.id}/page/${firstPageId}`)
        }
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen size={28} className="text-gray-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {project.name}
          </p>
          <RoleBadge role={project.role} />
        </div>

        {project.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {project._count.members + 1}
            </span>
            <span className="flex items-center gap-1">
              <FolderOpen size={11} />
              {project._count.pages}
            </span>
            <span className="flex items-center gap-1">
              {project.visibility === "public" ? (
                <Globe size={11} />
              ) : (
                <Lock size={11} />
              )}
              {project.visibility}
            </span>
          </div>

          {firstPageId && (
            <button
              onClick={() =>
                router.push(`/editor/${project.id}/page/${firstPageId}`)
              }
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Open
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onRefetch,
}: {
  request: ReturnType<typeof useMyRequests>["requests"][number];
  onRefetch: () => void;
}) {
  const router = useRouter();
  const firstPageId = request.project.pages?.[0]?.id;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-gray-200 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
        {request.project.thumbnail ? (
          <img
            src={request.project.thumbnail}
            alt={request.project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FolderOpen size={16} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {request.project.name}
          </p>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-gray-400">
            Requested {formatDate(request.createdAt)}
          </p>
          {request.updatedAt !== request.createdAt && (
            <p className="text-xs text-gray-400">
              Updated {formatDate(request.updatedAt)}
            </p>
          )}
        </div>
        {request.message && (
          <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">
            "{request.message}"
          </p>
        )}
      </div>

      {request.status === "approved" && firstPageId && (
        <button
          onClick={() =>
            router.push(`/editor/${request.project.id}/page/${firstPageId}`)
          }
          className="flex items-center gap-1.5 text-xs font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Open
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

function SearchResultCard({
  project,
  onRequested,
}: {
  project: SearchProject;
  onRequested: () => void;
}) {
  const api = useApi();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const existingRequest = project.accessRequests[0];

  const sendRequest = useCallback(async () => {
    setSending(true);
    try {
      await api.post("access-requests", {
        projectId: project.id,
        message: message.trim() || undefined,
      });
      toast.success("Request sent successfully");
      onRequested();
    } catch {
      toast.error("Failed to send request");
    } finally {
      setSending(false);
      setShowMessage(false);
    }
  }, [api, project.id, message, onRequested]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
          <FolderOpen size={16} className="text-gray-300" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {project.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              {project.User.imageUrl && (
                <img
                  src={project.User.imageUrl}
                  className="w-3.5 h-3.5 rounded-full"
                  alt=""
                />
              )}
              <p className="text-xs text-gray-400 truncate">
                {ownerName(project.User)}
              </p>
            </div>
            <span className="text-gray-200">·</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={10} />
              {project._count.members + 1}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {project.description}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {existingRequest ? (
            <StatusBadge status={existingRequest.status as RequestStatus} />
          ) : (
            <button
              onClick={() => setShowMessage((v) => !v)}
              className="text-xs font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Request access
            </button>
          )}
        </div>
      </div>

      {showMessage && !existingRequest && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendRequest()}
            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
          />
          <button
            onClick={sendRequest}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={11} className="animate-spin" /> : null}
            Send
          </button>
          <button
            onClick={() => setShowMessage(false)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [projectSearch, setProjectSearch] = useState("");

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useMyProjects();
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useMyRequests();
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clear,
  } = useProjectSearch();

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setProjectSearch(val);
      if (activeTab === "requests") {
        if (val) search(val);
        else clear();
      }
    },
    [activeTab, search, clear],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Browse your projects and manage access requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={
                activeTab === "projects"
                  ? "Filter projects…"
                  : "Search public projects…"
              }
              value={projectSearch}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            />
            {searchLoading && (
              <Loader2
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              />
            )}
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => {
                setActiveTab("projects");
                setProjectSearch("");
                clear();
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "projects"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              My projects
            </button>
            <button
              onClick={() => {
                setActiveTab("requests");
                setProjectSearch("");
                clear();
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "requests"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Requests
              {requests.filter((r) => r.status === "pending").length > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === "requests"
                      ? "bg-white/20 text-white"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {requests.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              refetchProjects();
              refetchRequests();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {activeTab === "projects" && (
          <>
            {projectsError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                <p className="text-sm text-red-600">{projectsError}</p>
                <button
                  onClick={refetchProjects}
                  className="text-xs text-red-500 hover:text-red-700 underline ml-4"
                >
                  Try again
                </button>
              </div>
            )}

            {projectsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={18} className="animate-spin text-gray-300" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={20} className="text-gray-300" />}
                title={
                  projectSearch ? "No matching projects" : "No projects yet"
                }
                description={
                  projectSearch
                    ? "Try a different search term."
                    : "Projects you own or have been added to will appear here."
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <>
            {requestsError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                <p className="text-sm text-red-600">{requestsError}</p>
                <button
                  onClick={refetchRequests}
                  className="text-xs text-red-500 hover:text-red-700 underline ml-4"
                >
                  Try again
                </button>
              </div>
            )}

            {projectSearch.trim() && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Search results
                </p>
                {searchLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={16} className="animate-spin text-gray-300" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <EmptyState
                    icon={<Search size={18} className="text-gray-300" />}
                    title="No public projects found"
                    description="Try searching with a different name."
                  />
                ) : (
                  <div className="flex flex-col gap-3 mb-8">
                    {searchResults.map((p) => (
                      <SearchResultCard
                        key={p.id}
                        project={p}
                        onRequested={refetchRequests}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!projectSearch.trim() && (
              <>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  My requests
                </p>
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={18} className="animate-spin text-gray-300" />
                  </div>
                ) : requests.length === 0 ? (
                  <EmptyState
                    icon={<Users size={20} className="text-gray-300" />}
                    title="No requests yet"
                    description="Search for a public project above to request access."
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {requests.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        onRefetch={refetchRequests}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
