"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const LIMIT = 6;

export default function ProjectsPage() {
  const api = useApi();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<IProject | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const debouncedSearch = useDebounce(search);
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get(
        `project?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`,
      );
      setProjects(res);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch]);

  // reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (data: { name: string; description: string }) => {
    try {
      await api.post("project", data);
      toast.success("Project created successfully");
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project");
    }
  };

  const handleRename = useCallback(
    async (project: IProject) => {
      setRenameTarget(project);
      setRenameValue(project.name);
    },
    [],
  );

  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await api.patch(`project/${renameTarget.id}`, { name: renameValue.trim() });
      toast.success("Project renamed");
      setRenameTarget(null);
      fetchProjects();
    } catch {
      toast.error("Failed to rename project");
    }
  }, [renameTarget, renameValue, api, fetchProjects]);

  const handleDelete = useCallback(
    async (project: IProject) => {
      if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
      try {
        await api.delete(`project/${project.id}`);
        toast.success("Project deleted");
        fetchProjects();
      } catch {
        toast.error("Failed to delete project");
      }
    },
    [api, fetchProjects],
  );

  const handleDuplicate = useCallback(
    async (project: IProject) => {
      try {
        await api.post("project", {
          name: `${project.name} (copy)`,
          description: project.description,
          visibility: project.visibility,
        });
        toast.success("Project duplicated");
        fetchProjects();
      } catch {
        toast.error("Failed to duplicate project");
      }
    },
    [api, fetchProjects],
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <PageHeader
          title="Projects"
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search projects..."
          refreshing={refreshing}
          onRefresh={() => fetchProjects()}
          actionLabel="New project"
          onAction={() => setModalOpen(true)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={LIMIT} />
      ) : projects && projects.length === 0 ? (
        <EmptyState
          title={search ? "No results found" : "No projects yet"}
          description={
            search
              ? `No projects match "${search}"`
              : "Create your first project to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects &&
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/project/${project.id}/pages`)}
                onRename={handleRename}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
        </div>
      )}

      {/* Pagination */}
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
