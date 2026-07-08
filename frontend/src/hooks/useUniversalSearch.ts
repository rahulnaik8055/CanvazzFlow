"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  updatedAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  memberCount: number;
  myRole: string | null;
}

export interface SearchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  mutualProjectsCount: number;
  isCollaborator: boolean;
}

export interface SearchResults {
  projects: SearchProject[];
  users: SearchUser[];
}

const RECENT_KEY = "universal-search-recent";

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

export function useUniversalSearch() {
  const apiRef = useRef(useApi());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ projects: [], users: [] });
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
          setResults({ projects: [], users: [] });
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

  const totalCount = results.projects.length + results.users.length;

  return {
    query,
    setQuery,
    results,
    loading,
    searched,
    recent,
    submitSearch,
    clearRecent,
    totalCount,
  };
}

export function highlightText(text: string, query: string): string | null {
  if (!query.trim() || !text) return null;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return null;
  return text.slice(idx, idx + qLower.length);
}

export function highlightParts(text: string, query: string): { before: string; match: string; after: string } | null {
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
