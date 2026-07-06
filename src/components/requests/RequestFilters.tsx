"use client";

import { Search, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestFiltersProps {
  activeStatus: string;
  counts: { all: number; pending: number; approved: number; denied: number; cancelled: number };
  search: string;
  sort: string;
  order: "asc" | "desc";
  selectedCount: number;
  totalCount: number;
  showBulk: boolean;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onOrderToggle: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
  loading?: boolean;
}

export function RequestFilters({
  activeStatus,
  counts,
  search,
  sort,
  order,
  selectedCount,
  totalCount,
  showBulk,
  onStatusChange,
  onSearchChange,
  onSortChange,
  onOrderToggle,
  onSelectAll,
  allSelected,
  loading,
}: RequestFiltersProps) {
  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "denied", label: "Denied", count: counts.denied },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or project..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
          />
          {loading && (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>

        {showBulk && (
          <div className="flex items-center gap-1.5">
            {selectedCount > 0 && (
              <span className="text-xs text-gray-400 font-medium mr-1">
                {selectedCount} selected
              </span>
            )}
            <button
              onClick={onSelectAll}
              disabled={totalCount === 0}
              className="h-8 px-2.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-40"
            >
              {allSelected ? "Deselect" : "Select all"}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {tabs.map((tab) => {
            const isSelected = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onStatusChange(tab.key)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isSelected
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={onOrderToggle}
            className="h-8 px-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
            title={order === "desc" ? "Newest first" : "Oldest first"}
          >
            {order === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </div>
    </div>
  );
}
