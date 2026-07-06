"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  FileText,
  Users,
  Bell,
  Clock,
  Loader2,
  Hash,
  Globe,
  Lock,
  X,
  Trash2,
  ArrowUpDown,
  User,
} from "lucide-react";
import { useGlobalSearch, highlightText, SearchResults } from "@/hooks/useGlobalSearch";

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = highlightText(text, query);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.before}
      <mark className="bg-yellow-200/70 text-gray-900 rounded-sm px-0.5">{parts.match}</mark>
      {parts.after}
    </>
  );
}

function useKeyboard(
  listLength: number,
  onSelect: (idx: number) => void,
  onClose: () => void,
) {
  const [cursor, setCursor] = useState(-1);

  const reset = useCallback(() => setCursor(-1), []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((prev) => (prev < listLength - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((prev) => (prev > 0 ? prev - 1 : listLength - 1));
      } else if (e.key === "Enter" && cursor >= 0) {
        e.preventDefault();
        onSelect(cursor);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [listLength, cursor, onSelect, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return { cursor, reset };
}

function flattenResults(results: SearchResults) {
  const items: Array<{
    type: "project" | "page" | "member" | "request";
    label: string;
    sublabel: string;
    href: string;
    data: any;
  }> = [];

  if (results.projects.length) {
    items.push({ type: "project", label: "", sublabel: "", href: "", data: "__header__" });
    for (const p of results.projects) {
      items.push({
        type: "project",
        label: p.name,
        sublabel: p.description || "",
        href: `/project/${p.id}`,
        data: p,
      });
    }
  }
  if (results.pages.length) {
    items.push({ type: "page", label: "", sublabel: "", href: "", data: "__header__" });
    for (const p of results.pages) {
      items.push({
        type: "page",
        label: p.name,
        sublabel: p.project.name,
        href: `/editor/${p.projectId}/page/${p.id}`,
        data: p,
      });
    }
  }
  if (results.members.length) {
    items.push({ type: "member", label: "", sublabel: "", href: "", data: "__header__" });
    const seen = new Set<string>();
    for (const m of results.members) {
      if (seen.has(m.userId)) continue;
      seen.add(m.userId);
      const name = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email;
      items.push({
        type: "member",
        label: name,
        sublabel: `${m.project.name} · ${m.role}`,
        href: "",
        data: m,
      });
    }
  }
  if (results.requests.length) {
    items.push({ type: "request", label: "", sublabel: "", href: "", data: "__header__" });
    for (const r of results.requests) {
      const name = [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.email;
      items.push({
        type: "request",
        label: name,
        sublabel: `${r.project.name} · ${r.status}`,
        href: `/requests`,
        data: r,
      });
    }
  }
  return items;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  project: <FolderOpen size={14} />,
  page: <FileText size={14} />,
  member: <User size={14} />,
  request: <Bell size={14} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  project: "Projects",
  page: "Pages",
  member: "Members",
  request: "Requests",
};

const STATUS_VARIANTS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  approved: "text-green-600 bg-green-50",
  denied: "text-red-600 bg-red-50",
};

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { query, setQuery, results, loading, searched, recent, submitSearch, clearRecent, totalCount } =
    useGlobalSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const flatItems = flattenResults(results);
  const headerIndices = flatItems.filter((i) => i.data === "__header__").map((_, idx) => idx);
  const selectableIndices = flatItems
    .map((item, idx) => (item.data !== "__header__" ? idx : -1))
    .filter((i) => i >= 0);

  const handleSelect = useCallback(
    (idx: number) => {
      const item = flatItems[idx];
      if (!item || item.data === "__header__") return;
      submitSearch(query);
      onClose();
      if (item.href) router.push(item.href);
    },
    [flatItems, query, submitSearch, onClose, router],
  );

  const { cursor, reset } = useKeyboard(flatItems.length, handleSelect, onClose);

  useEffect(() => {
    if (open) {
      reset();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, reset]);

  useEffect(() => {
    reset();
  }, [results, reset]);

  if (!open) return null;

  const resultCount =
    results.projects.length +
    results.pages.length +
    results.members.length +
    results.requests.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, pages, members, requests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400"
          />
          {loading && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
          {query && (
            <button onClick={() => setQuery("")} className="p-0.5 text-gray-300 hover:text-gray-500">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {!query.trim() && recent.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} />
                Recent searches
              </span>
              <button
                onClick={clearRecent}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Trash2 size={11} />
                Clear
              </button>
            </div>
            {recent.map((r, i) => (
              <button
                key={`${r}-${i}`}
                onClick={() => setQuery(r)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Clock size={13} className="text-gray-300 shrink-0" />
                <span className="truncate">{r}</span>
              </button>
            ))}
          </div>
        )}

        {query.trim() && !loading && searched && resultCount === 0 && (
          <div className="flex flex-col items-center py-12 text-center px-4">
            <Search size={24} className="text-gray-200 mb-2" />
            <p className="text-sm font-medium text-gray-500">No results found</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Try a different search term
            </p>
          </div>
        )}

        {query.trim() && !loading && resultCount > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {flatItems.map((item, idx) => {
              if (item.data === "__header__") {
                const icon = CATEGORY_ICONS[item.type];
                return (
                  <div
                    key={`header-${item.type}`}
                    className="flex items-center gap-2 px-3 py-1.5 mt-1 first:mt-0"
                  >
                    <span className="text-gray-300">{icon}</span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {CATEGORY_LABELS[item.type]}
                    </span>
                  </div>
                );
              }
              const isActive = cursor === idx;
              const icon = CATEGORY_ICONS[item.type];
              return (
                <button
                  key={`${item.type}-${item.data.id}`}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => {}}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      <Highlighted text={item.label} query={query} />
                    </div>
                    <div className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                      {item.type === "project" && (
                        <span className="flex items-center gap-1">
                          {item.data.visibility === "public" ? (
                            <Globe size={10} />
                          ) : (
                            <Lock size={10} />
                          )}
                        </span>
                      )}
                      <Highlighted text={item.sublabel} query={query} />
                      {item.type === "request" && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                            STATUS_VARIANTS[item.data.status] || "text-gray-500 bg-gray-50"
                          }`}
                        >
                          {item.data.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.type === "page" && (
                    <span className="text-xs text-gray-300 shrink-0">{item.data.project.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {query.trim() && loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}
