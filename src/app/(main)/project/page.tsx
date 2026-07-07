"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Search, Filter, Star, Archive, Plus } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { SkeletonGrid } from "@/components/custom/SkeletonGrid";
import { EmptyState } from "@/components/custom/EmptyState";
import { ProjectCard, IProject } from "@/components/project/ProjectCard";
import { ProjectModal } from "@/components/project/ProjectModal";
import { InviteDialog } from "@/components/invitations/InviteDialog";
import { useDebounce } from "@/hooks/useDebounce";

const LIMIT = 12;

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned" },
  { value: "shared", label: "Shared" },
  { value: "favorites", label: "Favorites" },
  { value: "archived", label: "Archived" },
] as const;

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ProjectsPage() {
  const apiRef = useRef(useApi());
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<IProject | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), filter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await apiRef.current.get(`project?${params}`);
      setProjects(res.items);
      setMeta(res);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleFavorite = useCallback(async (project: IProject) => {
    if (!project.membershipId) return;
    try {
      await apiRef.current.post(`project/membership/${project.membershipId}/toggle-favorite`);
      fetchProjects();
    } catch {
      toast.error("Failed to update favorite");
    }
  }, [fetchProjects]);

  const handleTogglePin = useCallback(async (project: IProject) => {
    try {
      await apiRef.current.post(`project/${project.id}/toggle-pin`);
      fetchProjects();
    } catch {
      toast.error("Failed to update pin");
    }
  }, [fetchProjects]);

  const handleToggleArchive = useCallback(async (project: IProject) => {
    if (!project.membershipId) return;
    try {
      await apiRef.current.post(`project/membership/${project.membershipId}/toggle-archive`);
      toast.success(project.isArchived ? "Project unarchived" : "Project archived");
      fetchProjects();
    } catch {
      toast.error("Failed to update archive status");
    }
  }, [fetchProjects]);

  const handleCreate = async (data: { name: string; description: string }) => {
    try {
      await apiRef.current.post("project", data);
      toast.success("Project created successfully");
      setModalOpen(false);
      fetchProjects();
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleRename = useCallback((project: IProject) => {
    setRenameTarget(project);
    setRenameValue(project.name);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await apiRef.current.patch(`project/${renameTarget.id}`, { name: renameValue.trim() });
      toast.success("Project renamed");
      setRenameTarget(null);
      fetchProjects();
    } catch {
      toast.error("Failed to rename project");
    }
  }, [renameTarget, renameValue, fetchProjects]);

  const handleDelete = useCallback(async (project: IProject) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await apiRef.current.delete(`project/${project.id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch {
      toast.error("Failed to delete project");
    }
  }, [fetchProjects]);

  const handleSettings = useCallback((project: IProject) => {
    router.push(`/project/${project.id}/settings`);
  }, [router]);

  const handleInvite = useCallback((project: IProject) => {
    setInviteProjectId(project.id);
  }, []);

  const handleDuplicate = useCallback(async (project: IProject) => {
    try {
      await apiRef.current.post("project", {
        name: `${project.name} (copy)`,
        description: project.description,
        visibility: project.visibility,
      });
      toast.success("Project duplicated");
      fetchProjects();
    } catch {
      toast.error("Failed to duplicate project");
    }
  }, [fetchProjects]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          />
        </div>

        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 text-sm transition-colors ${
                filter === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={LIMIT} />
      ) : projects.length === 0 ? (
        <EmptyState
          illustration="projects"
          title={debouncedSearch ? `No results for "${debouncedSearch}"` : "No projects yet"}
          description={
            debouncedSearch
              ? "Try a different search term or clear the search."
              : "Create your first project and start collaborating with your team."
          }
          action={
            debouncedSearch
              ? undefined
              : { label: "New Project", onClick: () => setModalOpen(true) }
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/project/${project.id}/pages`)}
                onRename={handleRename}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
                onTogglePin={handleTogglePin}
                onSettings={handleSettings}
                onInvite={handleInvite}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === meta.totalPages ||
                      (p >= page - 1 && p <= page + 1),
                  )
                  .map((p, i, arr) => {
                    const prev = arr[i - 1];
                    return (
                      <span key={p} className="flex items-center">
                        {prev && p - prev > 1 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      </span>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className={
                      page === meta.totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <InviteDialog
        open={inviteProjectId !== null}
        onOpenChange={(open) => { if (!open) setInviteProjectId(null); }}
        projectId={inviteProjectId ?? ""}
      />

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-80">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rename Project</h3>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-3"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-3 py-1.5 text-xs text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
