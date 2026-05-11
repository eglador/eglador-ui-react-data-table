"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  laravelAdapter,
  type LaravelAdapterOptions,
  type LaravelPaginationOptions,
} from "../../adapters/laravel";
import { staticAdapter } from "../../adapters/static";
import {
  DataTableBody,
  DataTableBulkActions,
  DataTableColumnVisibilityMenu,
  DataTableContainer,
  DataTableDensityToggle,
  DataTableFilterBar,
  DataTableFooter,
  DataTableHeader,
  DataTablePagination,
  DataTableRefreshButton,
  DataTableRoot,
  DataTableSearch,
  DataTableTable,
  DataTableToolbar,
} from "./parts";
import { useAutoColumns } from "./use-auto-columns";
import { useDataTable, type DataTableInstance } from "./use-data-table";
import { useUrlSyncedState } from "./url-sync";
import type { QueryAction } from "./state";
import type {
  AddedColumnDef,
  CustomColumnDef,
  DataMutations,
  DataSource,
  FilterValue,
  GetRowId,
  RetryBackoff,
  SelectionMode,
  SelectionState,
  SortValue,
  TableQueryState,
} from "./types";

// =====================================================================
// Configuration sub-types
// =====================================================================

export interface SearchConfigInput {
  placeholder?: string;
  debounceMs?: number;
  columns?: string[];
  mode?: "global" | "per-column" | "both";
}

export interface PaginationConfigInput {
  pageSizeOptions?: number[];
  showInfo?: boolean;
  variant?: "full" | "simple";
  options?: LaravelPaginationOptions;
}

export interface SelectionConfigInput {
  mode: SelectionMode;
  state?: SelectionState;
  onChange?: (state: SelectionState) => void;
}

export interface UrlSyncConfigInput {
  paramPrefix?: string;
  replace?: boolean;
}

export interface RetryConfigInput {
  count: number;
  backoff?: RetryBackoff;
  baseDelayMs?: number;
}

export interface BulkActionsContext<TData> {
  rows: TData[];
  selection: SelectionState;
  clear: () => void;
}

// =====================================================================
// Props
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableSchemaProps<TData = any> {
  // Identity
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;

  // Backend — pick one
  endpoint?: string;
  source?: DataSource<TData>;
  data?: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: Record<string, string> | (() => Record<string, string>) | any;
  responseShape?: { rows?: string };
  paramNames?: LaravelAdapterOptions["paramNames"];
  /** Sparse fieldsets: `?fields[articles]=id,title,slug`. */
  sparseFields?: Record<string, string[]>;

  // Row identity
  getRowId?: GetRowId<TData>;

  // Columns
  visibleColumns?: string[];
  hideColumns?: string[];
  customColumns?: CustomColumnDef<TData>[];
  addColumns?: AddedColumnDef<TData>[];

  // Sort
  sortable?: boolean;
  allowedSorts?: string[];
  defaultSort?: SortValue[];

  // Filter
  filters?: boolean;
  allowedFilters?: string[];
  defaultFilters?: FilterValue[];

  // Includes
  allowedIncludes?: string[];
  includes?: string[];

  // Search
  search?: boolean | SearchConfigInput;

  // Pagination
  pagination?: boolean | PaginationConfigInput;
  defaultPageSize?: number;

  // Toolbar features
  density?: boolean;
  columnVisibility?: boolean;
  refresh?: boolean;

  // Selection
  selection?: SelectionMode | SelectionConfigInput;

  // Layout
  stickyHeader?: boolean;
  /** Mirror the header at the bottom of the table (sticky-bottom). */
  footerHeader?: boolean;
  maxHeight?: number | string;

  // URL sync
  urlSync?: boolean | UrlSyncConfigInput;

  // Lifecycle
  debounce?: number;
  retry?: number | RetryConfigInput;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  keepPreviousData?: boolean;

  // Bulk Actions
  bulkActions?: (ctx: BulkActionsContext<TData>) => React.ReactNode;

  // Mutations
  optimisticUpdates?: boolean;
  mutations?: DataMutations<TData>;

  // Events
  onRowClick?: (row: TData, rowIndex: number) => void;
  onSelectionChange?: (state: SelectionState) => void;
  onStateChange?: (state: TableQueryState, action: QueryAction) => void;
  onError?: (error: unknown) => void;

  // Slots
  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  emptyState?:
    | React.ReactNode
    | ((ctx: { search: string; hasFilters: boolean }) => React.ReactNode);
  loadingState?: React.ReactNode;
  errorState?:
    | React.ReactNode
    | ((error: unknown, retry: () => void) => React.ReactNode);

  // Styling
  className?: string;
  variant?: "default" | "bordered" | "striped" | "minimal";
}

// =====================================================================
// Component
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTableSchema<TData = any>(
  props: DataTableSchemaProps<TData>,
): React.ReactElement {
  // === Adapter / source =============================================
  const paginationCfg: PaginationConfigInput =
    typeof props.pagination === "object" ? props.pagination : {};
  const paginationEnabled = props.pagination !== false;

  const source = React.useMemo<DataSource<TData>>(() => {
    if (props.source) return props.source;
    if (props.data) return staticAdapter({ data: props.data });
    if (props.endpoint) {
      return laravelAdapter<TData>({
        endpoint: props.endpoint,
        headers: props.headers as Record<string, string>,
        responseShape: props.responseShape,
        paramNames: props.paramNames,
        paginationOptions: paginationCfg.options,
        sparseFields: props.sparseFields,
      });
    }
    throw new Error("DataTable: provide one of `endpoint`, `source`, or `data`.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.source,
    props.data,
    props.endpoint,
    props.headers,
    props.responseShape,
    props.paramNames,
    paginationCfg.options,
    props.sparseFields,
  ]);

  // === URL sync =====================================================
  const urlSyncEnabled = props.urlSync != null && props.urlSync !== false;
  const urlSyncConfig: UrlSyncConfigInput =
    typeof props.urlSync === "object" ? props.urlSync : {};
  const computedPrefix =
    urlSyncConfig.paramPrefix ?? (props.id ? `${props.id}_` : "");

  const urlSync = useUrlSyncedState({
    paramPrefix: computedPrefix,
    replace: urlSyncConfig.replace ?? true,
    readOnMount: urlSyncEnabled,
  });

  // === Initial state ================================================
  const initialState = React.useMemo<Partial<TableQueryState>>(() => {
    const fromUrl = urlSyncEnabled ? urlSync.initialState : {};
    return {
      pagination: fromUrl.pagination ?? {
        mode: "offset",
        page: 1,
        pageSize: props.defaultPageSize ?? 25,
      },
      sorting: fromUrl.sorting ?? props.defaultSort ?? [],
      filters: fromUrl.filters ?? props.defaultFilters ?? [],
      search: fromUrl.search ?? "",
      includes: fromUrl.includes ?? props.includes ?? [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Discovery state (driven by table.rows after first fetch) =====
  const [discovered, setDiscovered] = React.useState<string[]>([]);

  // === Stable refresh ref (used inside column render callbacks) =====
  const tableRef = React.useRef<DataTableInstance<TData> | null>(null);
  const refresh = React.useCallback(() => tableRef.current?.refresh(), []);

  // === Columns ======================================================
  const columns = useAutoColumns<TData>({
    fields: discovered,
    visibleColumns: props.visibleColumns,
    hideColumns: props.hideColumns,
    customColumns: props.customColumns,
    addColumns: props.addColumns,
    sortable: props.sortable,
    allowedSorts: props.allowedSorts,
    allowedFilters: props.allowedFilters,
    refresh,
  });

  // === Selection ====================================================
  const selectionMode: SelectionMode =
    typeof props.selection === "string"
      ? props.selection
      : (props.selection?.mode ?? "none");
  const selectionStateProp =
    typeof props.selection === "object" ? props.selection.state : undefined;
  const selectionOnChange =
    typeof props.selection === "object" ? props.selection.onChange : undefined;

  // === Retry normalize ==============================================
  const retry =
    typeof props.retry === "number"
      ? { count: props.retry }
      : props.retry;

  // === State change forwarding ======================================
  const stateChangeHandler = React.useCallback(
    (state: TableQueryState, action: QueryAction) => {
      if (urlSyncEnabled) urlSync.onStateChange(state, action);
      props.onStateChange?.(state, action);
    },
    [urlSyncEnabled, urlSync, props.onStateChange],
  );

  // === Headless table ===============================================
  const table = useDataTable<TData>({
    source,
    columns,
    getRowId: props.getRowId,
    initialState,
    onStateChange: stateChangeHandler,
    request: {
      debounceMs: props.debounce,
      retry,
      refetchOnWindowFocus: props.refetchOnFocus,
      refetchOnReconnect: props.refetchOnReconnect,
      refetchInterval: props.refetchInterval,
      keepPreviousData: props.keepPreviousData ?? true,
    },
    selection: {
      mode: selectionMode,
      state: selectionStateProp,
      onChange: (state) => {
        selectionOnChange?.(state);
        props.onSelectionChange?.(state);
      },
    },
    mutations: props.mutations,
  });

  // Keep ref fresh so column render callbacks can fire `refresh()` correctly.
  tableRef.current = table;

  // === Field discovery effect =======================================
  React.useEffect(() => {
    if (discovered.length > 0) return;
    if (table.rows.length === 0) return;
    const first = table.rows[0] as Record<string, unknown>;
    if (first && typeof first === "object") {
      setDiscovered(Object.keys(first));
    }
  }, [table.rows, discovered.length]);

  // === Error forwarding =============================================
  const errorRef = React.useRef<unknown>(null);
  React.useEffect(() => {
    if (table.request.error && table.request.error !== errorRef.current) {
      errorRef.current = table.request.error;
      props.onError?.(table.request.error);
    } else if (!table.request.error) {
      errorRef.current = null;
    }
  }, [table.request.error, props.onError]);

  // === Search config ================================================
  const searchEnabled = props.search != null && props.search !== false;
  const searchCfg: SearchConfigInput =
    typeof props.search === "object" ? props.search : {};

  // === Variant classes ==============================================
  const variantClasses = resolveVariant(props.variant);

  // === Render =======================================================
  const toolbarHasContent =
    searchEnabled ||
    props.filters !== false ||
    props.toolbarStart != null ||
    props.toolbarEnd != null ||
    props.refresh ||
    props.density ||
    props.columnVisibility;

  return (
    <DataTableRoot table={table} className={cn(variantClasses, props.className)}>
      {(props.title || props.description) && (
        <div className="flex flex-col gap-0.5 mb-1">
          {props.title && (
            <h2 className="text-base font-semibold text-zinc-900">
              {props.title}
            </h2>
          )}
          {props.description && (
            <p className="text-sm text-zinc-500">{props.description}</p>
          )}
        </div>
      )}

      {toolbarHasContent && (
        <DataTableToolbar>
          {props.toolbarStart}
          {searchEnabled && (
            <DataTableSearch
              placeholder={searchCfg.placeholder}
              debounceMs={searchCfg.debounceMs}
            />
          )}
          {props.filters !== false && <DataTableFilterBar />}
          <div className="ml-auto flex items-center gap-2">
            {props.refresh && <DataTableRefreshButton />}
            {props.density && <DataTableDensityToggle />}
            {props.columnVisibility && <DataTableColumnVisibilityMenu />}
            {props.toolbarEnd}
          </div>
        </DataTableToolbar>
      )}

      {props.bulkActions && (
        <DataTableBulkActions>
          {props.bulkActions({
            rows: table.selection.selectedRows,
            selection: table.selection.state,
            clear: table.selection.clear,
          })}
        </DataTableBulkActions>
      )}

      <DataTableContainer
        stickyHeader={props.stickyHeader ?? true}
        maxHeight={props.maxHeight}
      >
        <DataTableTable>
          <DataTableHeader />
          <DataTableBody
            emptyState={props.emptyState}
            loadingState={props.loadingState}
            errorState={props.errorState}
          />
          {props.footerHeader && <DataTableFooter />}
        </DataTableTable>
      </DataTableContainer>

      {paginationEnabled && (
        <DataTablePagination
          pageSizeOptions={paginationCfg.pageSizeOptions}
          showInfo={paginationCfg.showInfo}
          variant={paginationCfg.variant}
        />
      )}
    </DataTableRoot>
  );
}

DataTableSchema.displayName = "DataTable";

// =====================================================================
// Helpers
// =====================================================================

function resolveVariant(
  variant?: "default" | "bordered" | "striped" | "minimal",
): string {
  switch (variant) {
    case "bordered":
      return "data-[variant=bordered]";
    case "striped":
      return "data-[variant=striped]";
    case "minimal":
      return "data-[variant=minimal]";
    default:
      return "";
  }
}
