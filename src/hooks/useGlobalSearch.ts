"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useApi } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchProject {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  visibility: "public" | "private";
  ownerId: string;
  createdAt: string;
}

export interface SearchPage {
  id: string;
  name: string;
  projectId: string;
  project: { id: string; name: string };
}

export interface SearchMember {
  id: string;
  role: string;
  userId: string;
  projectId: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; imageUrl: string | null };
  project: { id: string; name: string };
}

export interface SearchRequest {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; imageUrl: string | null };
  project: { id: string; name: string };
}

export interface SearchResults {
  projects: SearchProject[];
  pages: SearchPage[];
  members: SearchMember[];
  requests: SearchRequest[];
}

const RECENT_KEY = "global-search-recent";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const recents = getRecent().filter((r) => r !== q);
    recents.unshift(q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 10)));
  } catch {}
}

export function useGlobalSearch() {
  const apiRef = useRef(useApi());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], pages: [], members: [], requests: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ projects: [], pages: [], members: [], requests: [] });
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ q: debouncedQuery.trim() });
        const data = await apiRef.current.get(`search?${qs.toString()}`) as SearchResults;
        if (!cancelled) {
          setResults(data);
        }
      } catch {
        if (!cancelled) {
          setResults({ projects: [], pages: [], members: [], requests: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedQuery, apiRef]);

  const submitSearch = useCallback((q: string) => {
    if (q.trim()) saveRecent(q.trim());
    setRecent(getRecent());
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }, []);

  const open = query.length > 0 || recent.length > 0;

  return {
    query,
    setQuery,
    results,
    loading,
    searched,
    recent,
    submitSearch,
    clearRecent,
    totalCount: results.projects.length + results.pages.length + results.members.length + results.requests.length,
    open,
  };
}

export function highlightText(text: string, query: string): { before: string; match: string; after: string } | null {
  if (!query.trim() || !text) return null;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + qLower.length),
    after: text.slice(idx + qLower.length),
  };
}
