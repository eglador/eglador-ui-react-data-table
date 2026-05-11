"use client";

import * as React from "react";
import type { QueryAction } from "./state";
import type {
  FilterValue,
  PaginationValue,
  SortDirection,
  SortValue,
  TableQueryState,
} from "./types";

export interface UrlSyncOptions {
  /** Prefix for every search-param to keep multiple tables on the same page
   *  isolated (e.g. `users_page`, `posts_page`). */
  paramPrefix?: string;
  /** Read the initial URL on mount and seed `initialState` from it. */
  readOnMount?: boolean;
  /** Replace history entry instead of pushing a new one. Default `true`. */
  replace?: boolean;
}

export interface UrlSyncReturn {
  /** Pass to `useDataTable({ initialState })`. */
  initialState: Partial<TableQueryState>;
  /** Pass to `useDataTable({ onStateChange })` so URL stays in sync. */
  onStateChange: (state: TableQueryState, action: QueryAction) => void;
}

const DEFAULT_PAGE_SIZE = 25;

/** URL ↔ table state sync. Framework-agnostic — uses the History API
 *  directly, so it works with Next.js App Router, Pages Router, React Router,
 *  Remix, Vite, anywhere there's a `window`. */
export function useUrlSyncedState(
  options: UrlSyncOptions = {},
): UrlSyncReturn {
  const { paramPrefix = "", replace = true } = options;
  const readOnMount = options.readOnMount ?? true;

  const initialState = React.useMemo<Partial<TableQueryState>>(() => {
    if (!readOnMount) return {};
    if (typeof window === "undefined") return {};
    return parseQueryFromUrl(window.location.search, paramPrefix);
  }, [paramPrefix, readOnMount]);

  const onStateChange = React.useCallback(
    (state: TableQueryState) => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams(window.location.search);
      writeQueryToUrl(sp, state, paramPrefix);
      const next = sp.toString();
      const url =
        window.location.pathname + (next ? `?${next}` : "") + window.location.hash;
      if (replace) {
        window.history.replaceState({}, "", url);
      } else {
        window.history.pushState({}, "", url);
      }
    },
    [paramPrefix, replace],
  );

  return { initialState, onStateChange };
}

// === Encode ========================================================

export function writeQueryToUrl(
  sp: URLSearchParams,
  state: TableQueryState,
  prefix = "",
): void {
  const k = (name: string) => `${prefix}${name}`;

  // Strip out keys we own first.
  const owned = [
    "page",
    "pageSize",
    "cursor",
    "cursorDir",
    "sort",
    "filters",
    "q",
    "include",
  ].map(k);
  for (const key of owned) sp.delete(key);

  // Pagination
  if (state.pagination.mode === "offset") {
    if (state.pagination.page !== 1) {
      sp.set(k("page"), String(state.pagination.page));
    }
    if (state.pagination.pageSize !== DEFAULT_PAGE_SIZE) {
      sp.set(k("pageSize"), String(state.pagination.pageSize));
    }
  } else {
    if (state.pagination.cursor) {
      sp.set(k("cursor"), state.pagination.cursor);
      sp.set(k("cursorDir"), state.pagination.direction);
    }
    if (state.pagination.pageSize !== DEFAULT_PAGE_SIZE) {
      sp.set(k("pageSize"), String(state.pagination.pageSize));
    }
  }

  // Sort: -name,createdAt
  if (state.sorting.length > 0) {
    sp.set(
      k("sort"),
      state.sorting
        .map((s) => (s.direction === "desc" ? `-${s.column}` : s.column))
        .join(","),
    );
  }

  // Search
  if (state.search.trim()) {
    sp.set(k("q"), state.search);
  }

  // Includes
  if (state.includes.length > 0) {
    sp.set(k("include"), state.includes.join(","));
  }

  // Filters: serialized as `column:operator:value` pipe-delimited.
  if (state.filters.length > 0) {
    sp.set(
      k("filters"),
      state.filters.map(serializeFilter).join("|"),
    );
  }
}

// === Decode ========================================================

export function parseQueryFromUrl(
  search: string,
  prefix = "",
): Partial<TableQueryState> {
  const sp = new URLSearchParams(search);
  const k = (name: string) => `${prefix}${name}`;
  const out: Partial<TableQueryState> = {};

  const cursor = sp.get(k("cursor"));
  const cursorDir = sp.get(k("cursorDir"));
  const pageSizeRaw = sp.get(k("pageSize"));
  const pageSize = pageSizeRaw ? Number(pageSizeRaw) : DEFAULT_PAGE_SIZE;

  if (cursor != null) {
    const pagination: PaginationValue = {
      mode: "cursor",
      cursor,
      direction: cursorDir === "backward" ? "backward" : "forward",
      pageSize,
    };
    out.pagination = pagination;
  } else {
    const page = Number(sp.get(k("page")) ?? 1);
    const pagination: PaginationValue = {
      mode: "offset",
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      pageSize,
    };
    out.pagination = pagination;
  }

  const sortRaw = sp.get(k("sort"));
  if (sortRaw) {
    const sorting: SortValue[] = sortRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (s.startsWith("-")) {
          return { column: s.slice(1), direction: "desc" as SortDirection };
        }
        return { column: s, direction: "asc" as SortDirection };
      });
    out.sorting = sorting;
  }

  const search_ = sp.get(k("q"));
  if (search_ != null) out.search = search_;

  const includesRaw = sp.get(k("include"));
  if (includesRaw) {
    out.includes = includesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const filtersRaw = sp.get(k("filters"));
  if (filtersRaw) {
    out.filters = filtersRaw
      .split("|")
      .map(parseFilter)
      .filter((f): f is FilterValue => f != null);
  }

  return out;
}

function serializeFilter(f: FilterValue): string {
  const value = encodeFilterValue(f.value);
  return `${encodeURIComponent(f.column)}:${f.operator}:${value}`;
}

function parseFilter(raw: string): FilterValue | null {
  const parts = raw.split(":");
  if (parts.length < 2) return null;
  const column = decodeURIComponent(parts[0]);
  const operator = parts[1] as FilterValue["operator"];
  const valueRaw = parts.slice(2).join(":");
  return {
    id: cryptoId(),
    column,
    operator,
    value: decodeFilterValue(valueRaw),
  };
}

function encodeFilterValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((v) => encodeURIComponent(String(v))).join(",");
  }
  if (typeof value === "object") return encodeURIComponent(JSON.stringify(value));
  return encodeURIComponent(String(value));
}

function decodeFilterValue(raw: string): unknown {
  if (!raw) return "";
  if (raw.includes(",")) {
    return raw.split(",").map(decodeURIComponent);
  }
  return decodeURIComponent(raw);
}

let counter = 0;
function cryptoId(): string {
  counter += 1;
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { crypto?: Crypto }).crypto?.randomUUID === "function"
  ) {
    return (globalThis as { crypto: Crypto }).crypto.randomUUID();
  }
  return `f-${Date.now().toString(36)}-${counter.toString(36)}`;
}
