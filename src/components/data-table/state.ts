import type {
  FilterValue,
  PaginationValue,
  SortDirection,
  SortValue,
  TableQueryState,
} from "./types";

let counter = 0;
export function genFilterId(): string {
  counter += 1;
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { crypto?: Crypto }).crypto?.randomUUID === "function"
  ) {
    return (globalThis as { crypto: Crypto }).crypto.randomUUID();
  }
  return `f-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export const DEFAULT_PAGE_SIZE = 25;

export function createInitialState(
  overrides?: Partial<TableQueryState>,
): TableQueryState {
  return {
    pagination: overrides?.pagination ?? {
      mode: "offset",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    },
    sorting: overrides?.sorting ?? [],
    filters: overrides?.filters ?? [],
    search: overrides?.search ?? "",
    includes: overrides?.includes ?? [],
  };
}

export type QueryAction =
  | { type: "set-page"; page: number }
  | { type: "set-page-size"; pageSize: number }
  | { type: "set-cursor"; cursor: string | null; direction?: "forward" | "backward" }
  | { type: "set-pagination"; pagination: PaginationValue }
  | { type: "toggle-sort"; column: string; multi?: boolean; allowedDirections?: SortDirection[] }
  | { type: "set-sorting"; sorting: SortValue[] }
  | { type: "clear-sorting" }
  | { type: "add-filter"; filter: Omit<FilterValue, "id"> & { id?: string } }
  | { type: "update-filter"; id: string; patch: Partial<Omit<FilterValue, "id">> }
  | { type: "remove-filter"; id: string }
  | { type: "set-filters"; filters: FilterValue[] }
  | { type: "clear-filters" }
  | { type: "set-search"; search: string }
  | { type: "set-includes"; includes: string[] }
  | { type: "reset" };

export function queryReducer(
  state: TableQueryState,
  action: QueryAction,
): TableQueryState {
  switch (action.type) {
    case "set-page": {
      if (state.pagination.mode !== "offset") return state;
      if (state.pagination.page === action.page) return state;
      return {
        ...state,
        pagination: { ...state.pagination, page: action.page },
      };
    }
    case "set-page-size": {
      if (state.pagination.pageSize === action.pageSize) return state;
      const next: PaginationValue =
        state.pagination.mode === "offset"
          ? { ...state.pagination, page: 1, pageSize: action.pageSize }
          : { ...state.pagination, pageSize: action.pageSize, cursor: null };
      return { ...state, pagination: next };
    }
    case "set-cursor": {
      if (state.pagination.mode !== "cursor") return state;
      return {
        ...state,
        pagination: {
          ...state.pagination,
          cursor: action.cursor,
          direction: action.direction ?? state.pagination.direction,
        },
      };
    }
    case "set-pagination": {
      return { ...state, pagination: action.pagination };
    }
    case "toggle-sort": {
      const allowed = action.allowedDirections ?? ["asc", "desc"];
      const current = state.sorting.find((s) => s.column === action.column);
      const cycle: (SortDirection | null)[] = [...allowed, null];
      const currentIndex = current
        ? cycle.indexOf(current.direction)
        : -1;
      const nextDir = cycle[(currentIndex + 1) % cycle.length];
      const stripped = state.sorting.filter((s) => s.column !== action.column);
      const nextSorting: SortValue[] = nextDir
        ? action.multi
          ? [...stripped, { column: action.column, direction: nextDir }]
          : [{ column: action.column, direction: nextDir }]
        : action.multi
          ? stripped
          : [];
      const pagination = resetToFirstPage(state.pagination);
      return { ...state, sorting: nextSorting, pagination };
    }
    case "set-sorting": {
      return {
        ...state,
        sorting: action.sorting,
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "clear-sorting": {
      if (state.sorting.length === 0) return state;
      return {
        ...state,
        sorting: [],
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "add-filter": {
      const filter: FilterValue = {
        id: action.filter.id ?? genFilterId(),
        column: action.filter.column,
        operator: action.filter.operator,
        value: action.filter.value,
      };
      return {
        ...state,
        filters: [...state.filters, filter],
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "update-filter": {
      const next = state.filters.map((f) =>
        f.id === action.id ? { ...f, ...action.patch } : f,
      );
      return {
        ...state,
        filters: next,
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "remove-filter": {
      const next = state.filters.filter((f) => f.id !== action.id);
      if (next.length === state.filters.length) return state;
      return {
        ...state,
        filters: next,
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "set-filters": {
      return {
        ...state,
        filters: action.filters,
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "clear-filters": {
      if (state.filters.length === 0) return state;
      return {
        ...state,
        filters: [],
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "set-search": {
      if (state.search === action.search) return state;
      return {
        ...state,
        search: action.search,
        pagination: resetToFirstPage(state.pagination),
      };
    }
    case "set-includes": {
      return { ...state, includes: action.includes };
    }
    case "reset": {
      return createInitialState();
    }
    default: {
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}

function resetToFirstPage(p: PaginationValue): PaginationValue {
  if (p.mode === "offset") return p.page === 1 ? p : { ...p, page: 1 };
  return p.cursor === null ? p : { ...p, cursor: null };
}

export function serializeQueryState(state: TableQueryState): string {
  const sorting = state.sorting
    .map((s) => `${s.column}:${s.direction}`)
    .join(",");
  const filters = state.filters
    .slice()
    .sort((a, b) => a.column.localeCompare(b.column) || a.id.localeCompare(b.id))
    .map((f) => `${f.column}:${f.operator}:${stringifyValue(f.value)}`)
    .join("|");
  const includes = state.includes.slice().sort().join(",");
  const pagination =
    state.pagination.mode === "offset"
      ? `o:${state.pagination.page}:${state.pagination.pageSize}`
      : `c:${state.pagination.cursor ?? ""}:${state.pagination.direction}:${state.pagination.pageSize}`;
  return `${pagination}|${sorting}|${filters}|q=${state.search}|i=${includes}`;
}

function stringifyValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(stringifyValue).join(",");
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
