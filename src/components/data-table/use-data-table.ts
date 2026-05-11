"use client";

import * as React from "react";
import { useDataSource } from "./request";
import {
  createInitialState,
  queryReducer,
  type QueryAction,
} from "./state";
import type {
  ColumnDef,
  DataSource,
  DataMutations,
  FilterValue,
  GetRowId,
  PageInfo,
  PaginationValue,
  RequestConfig,
  RequestState,
  RowId,
  SearchConfig,
  SelectionMode,
  SelectionState,
  SortDirection,
  SortValue,
  TableDensity,
  TableQueryState,
} from "./types";

export interface UseDataTableOptions<TData> {
  source: DataSource<TData>;
  columns: ColumnDef<TData>[];
  /** How to compute a stable id for each row. Defaults to `row.id`. */
  getRowId?: GetRowId<TData>;
  /** Initial / default query state. Each field is optional. */
  initialState?: Partial<TableQueryState>;
  /** Controlled state — when provided, the hook stays in sync with `state` /
   *  `onStateChange` instead of owning its own copy. */
  state?: TableQueryState;
  onStateChange?: (next: TableQueryState, action: QueryAction) => void;
  request?: RequestConfig;
  selection?: {
    mode?: SelectionMode;
    state?: SelectionState;
    onChange?: (selection: SelectionState) => void;
  };
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  /** Default `true`: server-side sort/filter/search are decided based on the
   *  source's `capabilities`. Set `false` to force everything client-side. */
  serverMode?: boolean;
  search?: SearchConfig;
  mutations?: DataMutations<TData>;
}

export interface DataTableInstance<TData> {
  // === Query state ===
  state: TableQueryState;
  dispatch: (action: QueryAction) => void;

  // === Data + lifecycle ===
  rows: TData[];
  total: number | null;
  pageInfo: PageInfo | null;
  request: RequestState<TData>;
  refresh: () => void;

  // === Columns (resolved + visible) ===
  columns: ColumnDef<TData>[];
  visibleColumns: ColumnDef<TData>[];
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  toggleColumnVisibility: (columnId: string) => void;
  isColumnVisible: (columnId: string) => boolean;

  // === Pagination ===
  pagination: {
    value: PaginationValue;
    page: number;
    pageSize: number;
    pageCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    setCursor: (cursor: string | null) => void;
  };

  // === Sorting ===
  sorting: {
    value: SortValue[];
    toggle: (column: string, multi?: boolean) => void;
    set: (sorting: SortValue[]) => void;
    clear: () => void;
    get: (column: string) => { direction: SortDirection; index: number } | null;
  };

  // === Filters ===
  filters: {
    value: FilterValue[];
    add: (filter: Omit<FilterValue, "id"> & { id?: string }) => void;
    update: (id: string, patch: Partial<Omit<FilterValue, "id">>) => void;
    remove: (id: string) => void;
    set: (filters: FilterValue[]) => void;
    clear: () => void;
  };

  // === Search ===
  search: {
    value: string;
    set: (value: string) => void;
  };

  // === Density ===
  density: TableDensity;
  setDensity: (density: TableDensity) => void;

  // === Selection ===
  selection: {
    mode: SelectionMode;
    state: SelectionState;
    isSelected: (rowId: RowId) => boolean;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    toggle: (rowId: RowId) => void;
    toggleAll: () => void;
    clear: () => void;
    selectedRows: TData[];
    selectedCount: number;
  };

  // === Row identity ===
  getRowId: GetRowId<TData>;

  // === Mutations ===
  mutations: DataMutations<TData> | undefined;
}

const DEFAULT_GET_ROW_ID: GetRowId<unknown> = (row, index) => {
  const candidate = (row as { id?: RowId } | null)?.id;
  return candidate ?? index;
};

const EMPTY_SELECTION: SelectionState = {
  all: false,
  selected: new Set(),
  excluded: new Set(),
};

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>,
): DataTableInstance<TData> {
  const {
    source,
    columns: rawColumns,
    getRowId = DEFAULT_GET_ROW_ID as GetRowId<TData>,
    initialState,
    state: controlledState,
    onStateChange,
    request,
    selection: selectionOpts,
    density: controlledDensity,
    onDensityChange,
    search: searchConfig,
    mutations,
  } = options;

  // === Query state ===
  const [internalState, dispatchInternal] = React.useReducer(
    queryReducer,
    initialState,
    createInitialState,
  );
  const stateIsControlled = controlledState != null;
  const state = stateIsControlled ? controlledState : internalState;

  const dispatch = React.useCallback(
    (action: QueryAction) => {
      if (stateIsControlled) {
        const next = queryReducer(state, action);
        onStateChange?.(next, action);
      } else {
        dispatchInternal(action);
        if (onStateChange) {
          const next = queryReducer(state, action);
          onStateChange(next, action);
        }
      }
    },
    [stateIsControlled, state, onStateChange],
  );

  // === Fetch ===
  const { status, data, error, isFetching, refresh } = useDataSource(
    source,
    state,
    request,
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? null;
  const pageInfo = data?.pageInfo ?? null;

  // === Column visibility ===
  const [hiddenColumns, setHiddenColumns] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const col of rawColumns) {
      if (col.id != null && (col as { visible?: boolean }).visible === false) {
        initial.add(col.id);
      }
    }
    return initial;
  });

  const setColumnVisibility = React.useCallback(
    (columnId: string, visible: boolean) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (visible) next.delete(columnId);
        else next.add(columnId);
        return next;
      });
    },
    [],
  );

  const toggleColumnVisibility = React.useCallback((columnId: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  }, []);

  const isColumnVisible = React.useCallback(
    (columnId: string) => !hiddenColumns.has(columnId),
    [hiddenColumns],
  );

  const visibleColumns = React.useMemo(
    () => rawColumns.filter((col) => !hiddenColumns.has(col.id)),
    [rawColumns, hiddenColumns],
  );

  // === Density ===
  const [internalDensity, setInternalDensity] = React.useState<TableDensity>(
    "comfortable",
  );
  const density = controlledDensity ?? internalDensity;
  const setDensity = React.useCallback(
    (next: TableDensity) => {
      if (controlledDensity != null) onDensityChange?.(next);
      else {
        setInternalDensity(next);
        onDensityChange?.(next);
      }
    },
    [controlledDensity, onDensityChange],
  );

  // === Selection ===
  const selectionMode = selectionOpts?.mode ?? "none";
  const [internalSelection, setInternalSelection] =
    React.useState<SelectionState>(() => cloneSelection(EMPTY_SELECTION));
  const selectionIsControlled = selectionOpts?.state != null;
  const selectionState = selectionIsControlled
    ? selectionOpts!.state!
    : internalSelection;

  const updateSelection = React.useCallback(
    (next: SelectionState) => {
      if (selectionIsControlled) {
        selectionOpts!.onChange?.(next);
      } else {
        setInternalSelection(next);
        selectionOpts?.onChange?.(next);
      }
    },
    [selectionIsControlled, selectionOpts],
  );

  const rowIds = React.useMemo(
    () => rows.map((row, i) => getRowId(row, i)),
    [rows, getRowId],
  );

  const isSelected = React.useCallback(
    (rowId: RowId) => {
      if (selectionState.all) return !selectionState.excluded.has(rowId);
      return selectionState.selected.has(rowId);
    },
    [selectionState],
  );

  const isAllSelected =
    rowIds.length > 0 && rowIds.every((id) => isSelected(id));
  const isSomeSelected =
    !isAllSelected && rowIds.some((id) => isSelected(id));

  const toggleRow = React.useCallback(
    (rowId: RowId) => {
      if (selectionMode === "none") return;
      const next = cloneSelection(selectionState);

      if (selectionMode === "single") {
        const wasOnly =
          next.selected.size === 1 && next.selected.has(rowId) && !next.all;
        next.all = false;
        next.excluded.clear();
        next.selected.clear();
        if (!wasOnly) next.selected.add(rowId);
        updateSelection(next);
        return;
      }

      if (next.all) {
        if (next.excluded.has(rowId)) next.excluded.delete(rowId);
        else next.excluded.add(rowId);
      } else {
        if (next.selected.has(rowId)) next.selected.delete(rowId);
        else next.selected.add(rowId);
      }
      updateSelection(next);
    },
    [selectionMode, selectionState, updateSelection],
  );

  const toggleAllRows = React.useCallback(() => {
    if (selectionMode !== "multiple") return;
    const next = cloneSelection(selectionState);
    if (isAllSelected) {
      for (const id of rowIds) {
        if (next.all) next.excluded.add(id);
        else next.selected.delete(id);
      }
    } else {
      for (const id of rowIds) {
        if (next.all) next.excluded.delete(id);
        else next.selected.add(id);
      }
    }
    updateSelection(next);
  }, [selectionMode, selectionState, isAllSelected, rowIds, updateSelection]);

  const clearSelection = React.useCallback(() => {
    updateSelection(cloneSelection(EMPTY_SELECTION));
  }, [updateSelection]);

  const selectedRows = React.useMemo(
    () => rows.filter((row, i) => isSelected(getRowId(row, i))),
    [rows, getRowId, isSelected],
  );

  const selectedCount = selectionState.all
    ? Math.max((total ?? rows.length) - selectionState.excluded.size, 0)
    : selectionState.selected.size;

  // === Pagination derived ===
  const pageSize =
    state.pagination.mode === "offset"
      ? state.pagination.pageSize
      : state.pagination.pageSize;
  const page = state.pagination.mode === "offset" ? state.pagination.page : 1;
  const pageCount =
    total != null && pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const canPreviousPage =
    state.pagination.mode === "offset"
      ? state.pagination.page > 1
      : pageInfo?.hasPreviousPage ?? false;
  const canNextPage =
    state.pagination.mode === "offset"
      ? pageCount === 0
        ? rows.length === pageSize
        : state.pagination.page < pageCount
      : pageInfo?.hasNextPage ?? false;

  // === Sorting helpers ===
  const sortingGet = React.useCallback(
    (column: string) => {
      const idx = state.sorting.findIndex((s) => s.column === column);
      if (idx === -1) return null;
      return { direction: state.sorting[idx].direction, index: idx };
    },
    [state.sorting],
  );

  return {
    state,
    dispatch,

    rows,
    total,
    pageInfo,
    request: { status, data, error, isFetching },
    refresh,

    columns: rawColumns,
    visibleColumns,
    setColumnVisibility,
    toggleColumnVisibility,
    isColumnVisible,

    pagination: {
      value: state.pagination,
      page,
      pageSize,
      pageCount,
      canPreviousPage,
      canNextPage,
      setPage: (p) => dispatch({ type: "set-page", page: p }),
      setPageSize: (s) => dispatch({ type: "set-page-size", pageSize: s }),
      nextPage: () =>
        state.pagination.mode === "offset"
          ? dispatch({ type: "set-page", page: state.pagination.page + 1 })
          : pageInfo?.endCursor != null
            ? dispatch({
                type: "set-cursor",
                cursor: pageInfo.endCursor,
                direction: "forward",
              })
            : undefined,
      previousPage: () =>
        state.pagination.mode === "offset"
          ? dispatch({ type: "set-page", page: Math.max(1, state.pagination.page - 1) })
          : pageInfo?.startCursor != null
            ? dispatch({
                type: "set-cursor",
                cursor: pageInfo.startCursor,
                direction: "backward",
              })
            : undefined,
      setCursor: (cursor) => dispatch({ type: "set-cursor", cursor }),
    },

    sorting: {
      value: state.sorting,
      toggle: (column, multi) => dispatch({ type: "toggle-sort", column, multi }),
      set: (sorting) => dispatch({ type: "set-sorting", sorting }),
      clear: () => dispatch({ type: "clear-sorting" }),
      get: sortingGet,
    },

    filters: {
      value: state.filters,
      add: (filter) => dispatch({ type: "add-filter", filter }),
      update: (id, patch) => dispatch({ type: "update-filter", id, patch }),
      remove: (id) => dispatch({ type: "remove-filter", id }),
      set: (filters) => dispatch({ type: "set-filters", filters }),
      clear: () => dispatch({ type: "clear-filters" }),
    },

    search: {
      value: state.search,
      set: (value) => dispatch({ type: "set-search", search: value }),
    },

    density,
    setDensity,

    selection: {
      mode: selectionMode,
      state: selectionState,
      isSelected,
      isAllSelected,
      isSomeSelected,
      toggle: toggleRow,
      toggleAll: toggleAllRows,
      clear: clearSelection,
      selectedRows,
      selectedCount,
    },

    getRowId,
    mutations,
  };

  // searchConfig is consumed by UI components, not the hook itself —
  // kept on the options surface so consumers receive a single config object.
  void searchConfig;
}

function cloneSelection(s: SelectionState): SelectionState {
  return {
    all: s.all,
    selected: new Set(s.selected),
    excluded: new Set(s.excluded),
  };
}
