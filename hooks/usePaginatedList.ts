"use client";

/**
 * usePaginatedList — one place to handle server-side pagination + debounced
 * search for admin lists, so no page fetches "every row then filters in JS".
 *
 * It is query-agnostic: you pass a `fetchPage` that runs the Supabase query for
 * a given range + search and returns { rows, count }. The hook owns page state,
 * loading, the debounced search term, and resets to page 1 when search or any
 * `deps` change. Nothing in the app imports it yet — it's a Phase-1 primitive
 * the later phases (Students, Finance, History…) will adopt.
 *
 * Example:
 *   const list = usePaginatedList<Student>({
 *     pageSize: 25,
 *     deps: [classFilter, statusFilter],
 *     fetchPage: async ({ from, to, search }) => {
 *       let q = supabase.from("students")
 *         .select("*", { count: "exact" })
 *         .order("first_name")
 *         .range(from, to);
 *       if (search) q = q.ilike("first_name", `%${search}%`);
 *       if (classFilter) q = q.eq("class_id", classFilter);
 *       const { data, count } = await q;
 *       return { rows: data ?? [], count: count ?? 0 };
 *     },
 *   });
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface FetchPageArgs {
  from: number;
  to: number;
  search: string;
}

export interface UsePaginatedListOptions<T> {
  /** Rows per page (default 25). */
  pageSize?: number;
  /** Initial search term (default ""). */
  initialSearch?: string;
  /** Debounce for the search term in ms (default 350). */
  debounceMs?: number;
  /**
   * Extra values (filters) that, when changed, reset to page 1 and refetch.
   * Keep it to primitives so the shallow compare works.
   */
  deps?: ReadonlyArray<unknown>;
  /** Runs the actual Supabase query for one page. */
  fetchPage: (args: FetchPageArgs) => Promise<{ rows: T[]; count: number }>;
}

export interface UsePaginatedListResult<T> {
  rows: T[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number; // 1-based
  pageSize: number;
  pageCount: number;
  from: number; // 1-based display index of first row
  to: number; // 1-based display index of last row
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
}

export function usePaginatedList<T>({
  pageSize = 25,
  initialSearch = "",
  debounceMs = 350,
  deps = [],
  fetchPage,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Keep the latest fetchPage without making it a refetch trigger.
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  // Debounce the search term.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), debounceMs);
    return () => clearTimeout(t);
  }, [searchInput, debounceMs]);

  // Reset to page 1 when the (debounced) search or any external dep changes.
  useEffect(() => {
    setPageState(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, ...deps]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    try {
      const { rows: r, count } = await fetchRef.current({
        from,
        to,
        search: debouncedSearch.trim(),
      });
      setRows(r);
      setTotal(count);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const setPage = useCallback(
    (p: number) => setPageState(Math.min(Math.max(1, p), pageCount)),
    [pageCount],
  );

  return {
    rows,
    total,
    loading,
    error,
    page,
    pageSize,
    pageCount,
    from: total === 0 ? 0 : (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, total),
    search: searchInput,
    setSearch: setSearchInput,
    setPage,
    nextPage: () => setPage(page + 1),
    prevPage: () => setPage(page - 1),
    refresh: run,
  };
}
