"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Loader2, Inbox, Search as SearchIcon, AlertCircle, CheckSquare, Square } from "lucide-react";
import { useAccessRequestsManagement, AccessRequestItem } from "@/hooks/useAccessRequestsManagement";
import { useDebounce } from "@/hooks/useDebounce";
import { RequestCard } from "@/components/requests/RequestCard";
import { RequestDetailsDrawer } from "@/components/requests/RequestDetailsDrawer";
import { RequestFilters } from "@/components/requests/RequestFilters";
import { BulkActionsToolbar } from "@/components/requests/BulkActionsToolbar";

export default function RequestsPage() {
  const {
    items,
    total,
    pages,
    loading,
    error,
    params,
    updateParams,
    approve,
    reject,
    bulkRespond,
    refresh,
  } = useAccessRequestsManagement();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerRequestId, setDrawerRequestId] = useState<string | null>(null);

  const drawerRequest = useMemo(
    () => (drawerRequestId ? items.find((i) => i.id === drawerRequestId) ?? null : null),
    [drawerRequestId, items],
  );

  useEffect(() => {
    updateParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, updateParams]);

  const computedCounts = useMemo(() => {
    const c = { all: total, pending: 0, approved: 0, denied: 0, cancelled: 0 };
    for (const item of items) {
      if (item.status === "pending") c.pending++;
      else if (item.status === "approved") c.approved++;
      else if (item.status === "denied") c.denied++;
      else if (item.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [items, total]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items, selectedIds.size]);

  const handleBulkApprove = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await bulkRespond(ids, true);
    setSelectedIds(new Set());
  }, [selectedIds, bulkRespond]);

  const handleBulkReject = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await bulkRespond(ids, false);
    setSelectedIds(new Set());
  }, [selectedIds, bulkRespond]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      await approve(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [approve],
  );

  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      await reject(id, reason);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [reject],
  );

  const handleClickCard = useCallback((request: AccessRequestItem) => {
    setDrawerRequestId(request.id);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerRequestId(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Access Requests</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage requests to join your projects
            </p>
          </div>
          <button
            onClick={() => {
              setBulkMode((v) => !v);
              setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
              bulkMode
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {bulkMode ? <CheckSquare size={13} /> : <Square size={13} />}
            Bulk
          </button>
        </div>

        <RequestFilters
          activeStatus={params.status || "all"}
          counts={computedCounts}
          search={searchInput}
          sort={params.sort || "createdAt"}
          order={params.order || "desc"}
          selectedCount={selectedIds.size}
          totalCount={items.length}
          showBulk={bulkMode}
          onStatusChange={(status) => updateParams({ status, page: 1 })}
          onSearchChange={setSearchInput}
          onSortChange={(sort) => updateParams({ sort, page: 1 })}
          onOrderToggle={() =>
            updateParams({ order: params.order === "desc" ? "asc" : "desc" })
          }
          onSelectAll={handleSelectAll}
          allSelected={selectedIds.size === items.length && items.length > 0}
          loading={loading}
        />

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={refresh}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                {searchInput ? (
                  <SearchIcon size={20} className="text-gray-300" />
                ) : (
                  <Inbox size={20} className="text-gray-300" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">
                {searchInput ? "No matching requests" : "No requests yet"}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {searchInput
                  ? "Try a different search term or filter."
                  : "When someone requests access to your project, it will appear here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <RequestCard
                  key={item.id}
                  request={item}
                  selected={selectedIds.has(item.id)}
                  onSelect={bulkMode ? handleSelect : undefined}
                  onClick={handleClickCard}
                />
              ))}
            </div>
          )}
        </div>

        {pages > 1 && !loading && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => updateParams({ page: Math.max(1, (params.page || 1) - 1) })}
              disabled={(params.page || 1) <= 1}
              className="h-8 px-3 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {params.page || 1} of {pages}
            </span>
            <button
              onClick={() => updateParams({ page: Math.min(pages, (params.page || 1) + 1) })}
              disabled={(params.page || 1) >= pages}
              className="h-8 px-3 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {bulkMode && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          onApproveAll={handleBulkApprove}
          onRejectAll={handleBulkReject}
          onClear={handleClearSelection}
        />
      )}

      <RequestDetailsDrawer
        request={drawerRequest}
        open={!!drawerRequest}
        onClose={handleCloseDrawer}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
