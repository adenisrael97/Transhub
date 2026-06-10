"use client";

/**
 * Drives a server-paginated, filterable, searchable list against the backend
 * list contract: `{ <itemsKey>: T[], pagination: { page, limit, total, totalPages } }`.
 *
 * Why a hook (vs. client-side filtering): the old dashboards fetched only the
 * first page (backend default limit=20) and filtered/searched in the browser, so
 * search silently missed every row past #20. This pushes page/filter/search to
 * the server so the full dataset is queried.
 *
 * Behaviour:
 *  - `search` is debounced (default 350ms); structural filters apply immediately.
 *  - Any filter or search change resets to page 1.
 *  - Out-of-order responses are dropped (last request wins) so fast typing /
 *    filter toggling can't render a stale page.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/utils";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Query = Record<string, string | number | boolean | undefined>;

interface Config<T> {
  /** Calls the backend with the assembled query and resolves the raw envelope. */
  fetcher: (query: Query) => Promise<Record<string, unknown>>;
  /** Pulls the row array out of the envelope (envelope keys differ per resource). */
  select: (res: Record<string, unknown>) => T[];
  /** Structural filters (status, operatorId, …). Empty/undefined values are dropped. */
  initialFilters?: Query;
  limit?: number;
  debounceMs?: number;
}

export interface UseServerListResult<T> {
  items: T[];
  pagination: PageMeta | null;
  loading: boolean;
  error: string;
  page: number;
  setPage: (page: number) => void;
  filters: Query;
  /** Merge a patch into the structural filters and reset to page 1. */
  setFilter: (patch: Query) => void;
  /** Replace all structural filters and reset to page 1. */
  resetFilters: (next?: Query) => void;
  /** Raw search box value (undebounced) — bind this to the input. */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Force a refetch with the current query (e.g. after a mutation). */
  refetch: () => void;
}

/** Strip empty strings / undefined so they never hit the query string. */
function clean(query: Query): Query {
  const out: Query = {};
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "" || v === null) continue;
    out[k] = v;
  }
  return out;
}

export function useServerList<T>(config: Config<T>): UseServerListResult<T> {
  const { initialFilters = {}, limit = 20, debounceMs = 350 } = config;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Query>(initialFilters);
  const [searchInput, setSearchInput] = useState<string>(
    typeof initialFilters.search === "string" ? initialFilters.search : ""
  );
  const [search, setSearch] = useState<string>(searchInput);

  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0); // bump to force refetch

  // `fetcher` is expected to be a stable reference (a module-level service fn) and
  // `select` a useCallback'd selector — callers in this codebase always pass those,
  // so depending on them directly is safe and keeps the hook React-Compiler clean.
  const { fetcher, select } = config;

  // Debounce the search box → committed `search`; reset to page 1 on change.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [searchInput, debounceMs]);

  const reqId = useRef(0);
  useEffect(() => {
    const id = ++reqId.current;
    // Intentional: flip to the loading state immediately when the query changes so
    // the UI shows a spinner during the refetch. This is the standard data-fetching
    // effect pattern (synchronize React with an external system — the API), not an
    // accidental cascading render.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError("");
    /* eslint-enable react-hooks/set-state-in-effect */
    const query = clean({ ...filters, search: search || undefined, page, limit });
    Promise.resolve(fetcher(query))
      .then((res) => {
        if (id !== reqId.current) return; // a newer request superseded this one
        setItems(select(res) ?? []);
        setPagination((res.pagination as PageMeta) ?? null);
      })
      .catch((err) => {
        if (id !== reqId.current) return;
        setError(getErrorMessage(err, "Failed to load"));
        setItems([]);
        setPagination(null);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [fetcher, select, filters, search, page, limit, tick]);

  const setFilter = useCallback((patch: Query) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const resetFilters = useCallback(
    (next: Query = {}) => {
      setPage(1);
      setFilters(next);
      setSearchInput("");
      setSearch("");
    },
    []
  );

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    pagination,
    loading,
    error,
    page,
    setPage,
    filters,
    setFilter,
    resetFilters,
    searchInput,
    setSearchInput,
    refetch,
  };
}
