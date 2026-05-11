"use client";

import * as React from "react";
import { DEFAULT_PAGE_SIZE, genFilterId, type QueryAction } from "./state";
import type {
  FilterValue,
  PaginationValue,
  SortDirection,
  SortValue,
  TableQueryState,
} from "./types";

export interface UrlSyncOptions {
  paramPrefix?: string;
  readOnMount?: boolean;
  replace?: boolean;
}

export interface UrlSyncReturn {
  initialState: Partial<TableQueryState>;
  onStateChange: (state: TableQueryState, action: QueryAction) => void;
}

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

export function writeQueryToUrl(
  sp: URLSearchParams,
  state: TableQueryState,
  prefix = "",
): void {
  const k = (name: string) => `${prefix}${name}`;
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
  if (state.sorting.length > 0) {
    sp.set(
      k("sort"),
      state.sorting
        .map((s) => (s.direction === "desc" ? `-${s.column}` : s.column))
        .join(","),
    );
  }
  if (state.search.trim()) {
    sp.set(k("q"), state.search);
  }
  if (state.includes.length > 0) {
    sp.set(k("include"), state.includes.join(","));
  }
  if (state.filters.length > 0) {
    sp.set(
      k("filters"),
      state.filters.map(serializeFilter).join("|"),
    );
  }
}

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
    id: genFilterId(),
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
