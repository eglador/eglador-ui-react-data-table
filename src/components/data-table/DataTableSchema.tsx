"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { laravelAdapter } from "../../adapters/laravel";
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
import { inferSchemaEndpoint, useSchema } from "./use-schema";
import { useUrlSyncedState } from "./url-sync";
import type { QueryAction } from "./state";
import type {
  AddedColumnDef,
  ColumnFilterConfig,
  CustomColumnDef,
  DataMutations,
  DataSource,
  FilterOperator,
  FilterValue,
  GetRowId,
  ResourceSchema,
  RetryBackoff,
  SchemaFilter,
  SelectionMode,
  SelectionState,
  SortValue,
  TableQueryState,
} from "./types";

export interface SearchConfigInput {
  placeholder?: string;
  debounceMs?: number;
}

export interface PaginationConfigInput {
  pageSizeOptions?: number[];
  showInfo?: boolean;
  variant?: "full" | "simple";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableSchemaProps<TData = any> {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;

  endpoint: string;
  schemaEndpoint?: string;
  headers?: Record<string, string> | (() => Record<string, string>);

  getRowId?: GetRowId<TData>;

  visibleColumns?: string[];
  hideColumns?: string[];
  customColumns?: CustomColumnDef<TData>[];
  addColumns?: AddedColumnDef<TData>[];

  sortable?: boolean;
  filters?: boolean;
  search?: boolean | SearchConfigInput;
  pagination?: boolean | PaginationConfigInput;
  density?: boolean;
  columnVisibility?: boolean;
  refresh?: boolean;

  defaultPageSize?: number;
  defaultSort?: SortValue[];
  defaultFilters?: FilterValue[];
  includes?: string[];

  selection?: SelectionMode | SelectionConfigInput;

  stickyHeader?: boolean;
  footerHeader?: boolean;
  maxHeight?: number | string;

  urlSync?: boolean | UrlSyncConfigInput;

  debounce?: number;
  retry?: number | RetryConfigInput;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  keepPreviousData?: boolean;

  bulkActions?: (ctx: BulkActionsContext<TData>) => React.ReactNode;

  optimisticUpdates?: boolean;
  mutations?: DataMutations<TData>;

  onRowClick?: (row: TData, rowIndex: number) => void;
  onSelectionChange?: (state: SelectionState) => void;
  onStateChange?: (state: TableQueryState, action: QueryAction) => void;
  onError?: (error: unknown) => void;

  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  emptyState?:
    | React.ReactNode
    | ((ctx: { search: string; hasFilters: boolean }) => React.ReactNode);
  loadingState?: React.ReactNode;
  errorState?:
    | React.ReactNode
    | ((error: unknown, retry: () => void) => React.ReactNode);

  className?: string;
  variant?: "default" | "bordered" | "striped" | "minimal";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTableSchema<TData = any>(
  props: DataTableSchemaProps<TData>,
): React.ReactElement {
  const schemaEndpoint =
    props.schemaEndpoint ?? inferSchemaEndpoint(props.endpoint);
  const { schema, isLoading, error, refresh } = useSchema(
    schemaEndpoint,
    props.headers,
  );

  if (error) {
    return (
      <SchemaShell
        title={props.title}
        description={props.description}
        className={props.className}
      >
        {typeof props.errorState === "function"
          ? props.errorState(error, refresh)
          : (props.errorState ?? <SchemaError error={error} onRetry={refresh} />)}
      </SchemaShell>
    );
  }

  if (isLoading || !schema) {
    return (
      <SchemaShell
        title={props.title}
        description={props.description}
        className={props.className}
      >
        {props.loadingState ?? <SchemaLoading />}
      </SchemaShell>
    );
  }

  const innerKey = JSON.stringify([
    props.defaultPageSize,
    props.defaultSort,
    props.defaultFilters,
    props.includes,
    props.urlSync,
  ]);

  return <DataTableInner key={innerKey} schema={schema} {...props} />;
}

DataTableSchema.displayName = "DataTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableInnerProps<TData = any> extends DataTableSchemaProps<TData> {
  schema: ResourceSchema;
}

function DataTableInner<TData>(
  props: DataTableInnerProps<TData>,
): React.ReactElement {
  const { schema } = props;
  const paginationCfg: PaginationConfigInput =
    typeof props.pagination === "object" ? props.pagination : {};
  const paginationEnabled = props.pagination !== false;

  const derived = React.useMemo(() => deriveFromSchema(schema), [schema]);

  const source = React.useMemo<DataSource<TData>>(
    () =>
      laravelAdapter<TData>({
        endpoint: props.endpoint,
        headers: props.headers,
        paramNames: {
          page: "page[number]",
          pageSize: "page[size]",
          sort: "sort",
          search: `filter[${derived.searchField ?? "search"}]`,
          include: "include",
        },
      }),
    [props.endpoint, props.headers, derived.searchField],
  );

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

  const initialState = React.useMemo<Partial<TableQueryState>>(() => {
    const fromUrl = urlSyncEnabled ? urlSync.initialState : {};
    return {
      pagination: fromUrl.pagination ?? {
        mode: "offset",
        page: 1,
        pageSize: props.defaultPageSize ?? derived.defaultPageSize,
      },
      sorting:
        fromUrl.sorting ?? props.defaultSort ?? derived.defaultSort,
      filters: fromUrl.filters ?? props.defaultFilters ?? [],
      search: fromUrl.search ?? "",
      includes:
        fromUrl.includes ?? props.includes ?? derived.defaultIncludes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [discovered, setDiscovered] = React.useState<string[]>([]);
  const tableRef = React.useRef<DataTableInstance<TData> | null>(null);
  const refresh = React.useCallback(() => tableRef.current?.refresh(), []);

  const mergedCustomColumns = React.useMemo(
    () => mergeCustomColumns(props.customColumns, derived.filterMap),
    [props.customColumns, derived.filterMap],
  );

  const columns = useAutoColumns<TData>({
    fields: discovered,
    visibleColumns:
      props.visibleColumns ?? derived.listFields ?? undefined,
    hideColumns: props.hideColumns,
    customColumns: mergedCustomColumns,
    addColumns: props.addColumns,
    sortable: props.sortable,
    allowedSorts: derived.allowedSorts,
    allowedFilters: derived.allowedFilters,
    refresh,
  });

  const selectionMode: SelectionMode =
    typeof props.selection === "string"
      ? props.selection
      : (props.selection?.mode ?? "none");
  const selectionStateProp =
    typeof props.selection === "object" ? props.selection.state : undefined;
  const selectionOnChange =
    typeof props.selection === "object" ? props.selection.onChange : undefined;

  const retry =
    typeof props.retry === "number" ? { count: props.retry } : props.retry;

  const stateChangeHandler = React.useCallback(
    (state: TableQueryState, action: QueryAction) => {
      if (urlSyncEnabled) urlSync.onStateChange(state, action);
      props.onStateChange?.(state, action);
    },
    [urlSyncEnabled, urlSync, props.onStateChange],
  );

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
  tableRef.current = table;

  React.useEffect(() => {
    if (discovered.length > 0) return;
    if (table.rows.length === 0) return;
    const first = table.rows[0] as Record<string, unknown>;
    if (first && typeof first === "object") {
      setDiscovered(Object.keys(first));
    }
  }, [table.rows, discovered.length]);

  const errorRef = React.useRef<unknown>(null);
  React.useEffect(() => {
    if (table.request.error && table.request.error !== errorRef.current) {
      errorRef.current = table.request.error;
      props.onError?.(table.request.error);
    } else if (!table.request.error) {
      errorRef.current = null;
    }
  }, [table.request.error, props.onError]);

  const searchEnabled = props.search != null && props.search !== false;
  const searchCfg: SearchConfigInput =
    typeof props.search === "object" ? props.search : {};

  const variantClasses = resolveVariant(props.variant);
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
          pageSizeOptions={
            paginationCfg.pageSizeOptions ?? derived.pageSizeOptions
          }
          showInfo={paginationCfg.showInfo}
          variant={paginationCfg.variant}
        />
      )}
    </DataTableRoot>
  );
}

interface DerivedConfig {
  searchField: string | null;
  allowedSorts: string[];
  allowedFilters: string[];
  defaultIncludes: string[];
  defaultSort: SortValue[];
  defaultPageSize: number;
  pageSizeOptions: number[];
  filterMap: Map<string, ColumnFilterConfig>;
  listFields: string[] | null;
}

function deriveFromSchema(schema: ResourceSchema): DerivedConfig {
  const filterMap = new Map<string, ColumnFilterConfig>();
  let searchField: string | null = null;
  for (const f of schema.filters ?? []) {
    if (f.operator === "fulltext") {
      searchField = f.field;
      continue;
    }
    const cfg = schemaFilterToConfig(f);
    if (cfg) filterMap.set(f.field, cfg);
  }

  const defaultSort: SortValue[] = [];
  if (schema.default_sort) {
    const desc = schema.default_sort.startsWith("-");
    const column = desc ? schema.default_sort.slice(1) : schema.default_sort;
    defaultSort.push({ column, direction: desc ? "desc" : "asc" });
  }

  const defaultPageSize = schema.pagination?.default_size ?? 25;
  const maxPageSize = schema.pagination?.max_size;
  const pageSizeOptions = buildPageSizeOptions(defaultPageSize, maxPageSize);

  const listView = schema.views?.list;
  const listRelations = listView?.relations;
  const listFields = listView?.fields;
  const defaultIncludes =
    listRelations && listRelations.length > 0
      ? listRelations
      : (schema.default_includes ?? []);

  const visibleFields =
    listFields && listFields.length > 0
      ? mergeListFieldsWithRelations(listFields, listRelations)
      : null;

  return {
    searchField,
    allowedSorts: schema.sorts ?? [],
    allowedFilters: Array.from(filterMap.keys()),
    defaultIncludes,
    defaultSort,
    defaultPageSize,
    pageSizeOptions,
    filterMap,
    listFields: visibleFields,
  };
}

function mergeListFieldsWithRelations(
  fields: string[],
  relations: string[] | undefined,
): string[] {
  if (!relations || relations.length === 0) return fields;
  const out = [...fields];
  for (const r of relations) {
    if (!out.includes(r)) out.push(r);
  }
  return out;
}

function schemaFilterToConfig(f: SchemaFilter): ColumnFilterConfig | null {
  if (f.type === "boolean") return { type: "boolean" };

  if (f.type === "enum" && f.values && f.values.length > 0) {
    return {
      type: "select",
      options: f.values.map((v) => ({
        value: v as string | number | boolean,
        label: String(v),
      })),
      defaultOperator: "eq",
    };
  }

  if (f.type === "integer" || f.type === "number") {
    return { type: "number", defaultOperator: "eq" };
  }

  if (f.type === "string") {
    return {
      type: "text",
      defaultOperator: f.operator === "partial" ? "contains" : "eq",
    };
  }

  if (f.type === "date" || f.type === "datetime") {
    const op: FilterOperator =
      f.operator === "gte"
        ? "gte"
        : f.operator === "lte"
          ? "lte"
          : f.operator === "gt"
            ? "gt"
            : f.operator === "lt"
              ? "lt"
              : "eq";
    return { type: "date", defaultOperator: op };
  }

  return null;
}

function buildPageSizeOptions(def: number, max?: number): number[] {
  const candidates = [10, 15, 25, 50, 100, 200];
  const set = new Set<number>();
  for (const c of candidates) {
    if (max != null && c > max) continue;
    set.add(c);
  }
  set.add(def);
  if (max != null) set.add(max);
  return Array.from(set).sort((a, b) => a - b);
}

function mergeCustomColumns<TData>(
  user: CustomColumnDef<TData>[] | undefined,
  filterMap: Map<string, ColumnFilterConfig>,
): CustomColumnDef<TData>[] {
  const userArr = user ?? [];
  const seen = new Set<string>();
  const merged: CustomColumnDef<TData>[] = [];
  for (const col of userArr) {
    seen.add(col.field);
    const inferred = filterMap.get(col.field);
    if (!col.filter && inferred) {
      merged.push({ ...col, filter: inferred });
    } else {
      merged.push(col);
    }
  }
  for (const [field, filter] of filterMap) {
    if (!seen.has(field)) {
      merged.push({ field, filter });
    }
  }
  return merged;
}

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

function SchemaShell({
  title,
  description,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-data-table=""
      className={cn("flex flex-col gap-3 w-full", className)}
    >
      {(title || description) && (
        <div className="flex flex-col gap-0.5 mb-1">
          {title && (
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-zinc-500">{description}</p>
          )}
        </div>
      )}
      <div className="relative w-full rounded-sm border border-zinc-200 bg-white overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SchemaLoading() {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 rounded-sm bg-zinc-100 eglador-dt-pulse" />
      ))}
    </div>
  );
}

function SchemaError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <div className="text-sm font-medium text-zinc-900">
        Couldn't load schema
      </div>
      <div className="text-xs text-zinc-500">{message}</div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 h-8 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
