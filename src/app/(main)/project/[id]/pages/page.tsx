"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ArrowLeft, Pencil, Trash2, Check, X, Settings,
  Lock, Users, Loader2, Send, LogIn, Clock,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SkeletonGrid } from "@/components/custom/SkeletonGrid";
import { EmptyState } from "@/components/custom/EmptyState";

interface IPage {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  projectId: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  visibility: "public" | "private";
  owner: { id: string; firstName: string | null; lastName: string | null; imageUrl: string | null };
  memberCount: number;
  pagesCount: number;
  isMember: boolean;
  myRole: string | null;
  hasPendingRequest: boolean;
  pendingRequestId: string | null;
  hasPendingInvitation: boolean;
}

const LIMIT = 8;

export default function PagesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const apiRef = useRef(useApi());

  const [pages, setPages] = useState<IPage[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessCheck, setAccessCheck] = useState<"loading" | "member" | "nonmember">("loading");
  const [publicProject, setPublicProject] = useState<PublicProject | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Check access first
  useEffect(() => {
    let cancelled = false;
    apiRef.current.get(`project/public/${projectId}`).then((data: any) => {
      if (cancelled) return;
      setPublicProject(data);
      setAccessCheck(data.isMember ? "member" : "nonmember");
    }).catch(() => {
      if (!cancelled) {
        toast.error("Failed to load project");
        setAccessCheck("nonmember");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const fetchPages = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await apiRef.current.get(
          `project/${projectId}/pages?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`,
        );
        setPages(res.data);
        setMeta(res.meta);
      } catch {
        toast.error("Failed to load pages");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, page, debouncedSearch],
  );

  useEffect(() => {
    if (accessCheck === "member") fetchPages();
  }, [fetchPages, accessCheck]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await apiRef.current.post(`project/${projectId}/pages`);
      toast.success("Page created successfully");
      fetchPages(true);
    } catch {
      toast.error("Failed to create page");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (pageId: string) => {
    if (!editingName.trim()) return;
    try {
      const updated = await apiRef.current.patch(`project/${projectId}/pages/${pageId}`, { name: editingName });
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, name: updated.name } : p)));
      setEditingId(null);
      toast.success("Page renamed successfully");
    } catch {
      toast.error("Failed to rename page");
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      await apiRef.current.delete(`project/${projectId}/pages/${pageId}`);
      toast.success("Page deleted successfully");
      fetchPages(true);
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      await apiRef.current.post("access-requests", { projectId });
      toast.success("Access request sent");
      setPublicProject((prev) => prev ? { ...prev, hasPendingRequest: true } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to request access");
    } finally {
      setRequesting(false);
    }
  };

  // Non-member view
  if (accessCheck === "nonmember" && publicProject) {
    const p = publicProject;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-100 rounded-2xl max-w-md w-full overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-gray-900 to-gray-700 flex items-end p-6">
            <h1 className="text-xl font-bold text-white">{p.name}</h1>
          </div>
          <div className="p-6">
            {p.description && (
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{p.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {p.memberCount} member{p.memberCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {p.visibility === "public" ? "Public project" : "Private project"}
              </span>
            </div>

            {p.hasPendingRequest ? (
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                <Clock size={14} className="text-amber-600" />
                <p className="text-xs text-amber-700">Access request pending — waiting for the owner to respond.</p>
              </div>
            ) : p.hasPendingInvitation ? (
              <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                <Send size={14} className="text-blue-600" />
                <p className="text-xs text-blue-700">You have a pending invitation. Check your invitations.</p>
              </div>
            ) : (
              <button
                onClick={handleRequestAccess}
                disabled={requesting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {requesting ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                {requesting ? "Sending request..." : "Request access to this project"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Member view
  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle={meta ? `${meta.total} page${meta.total !== 1 ? "s" : ""}` : ""}
        actionLabel={creating ? "Adding..." : "Add page"}
        onAction={handleCreate}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search pages..."
        refreshing={refreshing}
        onRefresh={() => fetchPages(true)}
      />

      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => router.push(`/project/${projectId}/settings`)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Project Settings
        </button>
      </div>

      {loading ? (
        <SkeletonGrid count={LIMIT} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
      ) : pages.length === 0 ? (
        <EmptyState
          illustration="pages"
          title={debouncedSearch ? `No results for "${debouncedSearch}"` : "No pages yet"}
          description={debouncedSearch ? "Try a different search term." : "Add your first page to start designing."}
          action={debouncedSearch ? undefined : { label: "Add Page", onClick: handleCreate }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/editor/${projectId}/page/${p.id}`)}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="w-full aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300 text-sm border border-gray-100">
                {p.order + 1}
              </div>

              {editingId === p.id ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(p.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-7 text-xs px-2 flex-1"
                    autoFocus
                  />
                  <button onClick={() => handleRename(p.id)} className="text-green-600 hover:text-green-700 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditingName(p.name); }}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || (p >= page - 1 && p <= page + 1))
              .map((p, i, arr) => {
                const prev = arr[i - 1];
                return (
                  <span key={p} className="flex items-center">
                    {prev && p - prev > 1 && (
                      <PaginationItem><PaginationEllipsis /></PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                );
              })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className={page === meta.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
