"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
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

const LIMIT = 12;

export default function PagesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [pages, setPages] = useState<IPage[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchPages = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get(
          `project/${projectId}/pages?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`,
        );
        setPages(res.data);
        setMeta(res.meta);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, page, debouncedSearch],
  );

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post(`project/${projectId}/pages`);
      fetchPages(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (pageId: string) => {
    if (!editingName.trim()) return;
    try {
      const updated = await api.patch(`project/${projectId}/pages/${pageId}`, {
        name: editingName,
      });
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, name: updated.name } : p)),
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      await api.delete(`project/${projectId}/pages/${pageId}`);
      fetchPages(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle={
          meta ? `${meta.total} page${meta.total !== 1 ? "s" : ""}` : ""
        }
        actionLabel={creating ? "Adding..." : "Add page"}
        onAction={handleCreate}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search pages..."
        refreshing={refreshing}
        onRefresh={() => fetchPages(true)}
      />

      {/* Grid */}
      {loading ? (
        <SkeletonGrid
          count={LIMIT}
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        />
      ) : pages.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? "No results found" : "No pages yet"}
          description={
            debouncedSearch
              ? `No pages match "${debouncedSearch}"`
              : "Add your first page to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/editor/${p.id}`)}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {/* Thumbnail placeholder */}
              <div className="w-full aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300 text-sm border border-gray-100">
                {p.order + 1}
              </div>

              {/* Name + actions */}
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
                  <button
                    onClick={() => handleRename(p.id)}
                    className="text-green-600 hover:text-green-700 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(p.id);
                        setEditingName(p.name);
                      }}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
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
    </div>
  );
}
