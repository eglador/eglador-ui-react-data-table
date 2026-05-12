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
  FilterOption,
  GetRowId,
  ResourceSchema,
  RetryBackoff,
  SchemaField,
  SchemaRelation,
  SchemaVirtualFilter,
  SelectionMode,
  SelectionState,
  SortValue,
  TableQueryState,
} from "./types";

export interface SearchConfigInput {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
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

  const derived = React.useMemo(
    () => deriveFromSchema(schema, props.endpoint, props.headers),
    [schema, props.endpoint, props.headers],
  );

  const source = React.useMemo<DataSource<TData>>(
    () =>
      laravelAdapter<TData>({
        endpoint: props.endpoint,
        headers: props.headers,
        paramNames: {
          page: derived.pageParam,
          pageSize: derived.pageSizeParam,
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
      sorting: fromUrl.sorting ?? derived.defaultSort,
      filters: fromUrl.filters ?? [],
      search: fromUrl.search ?? "",
      includes: fromUrl.includes ?? derived.defaultIncludes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [discovered, setDiscovered] = React.useState<string[]>([]);
  const tableRef = React.useRef<DataTableInstance<TData> | null>(null);
  const refresh = React.useCallback(() => tableRef.current?.refresh(), []);

  const mergedCustomColumns = React.useMemo(
    () =>
      mergeCustomColumns(
        props.customColumns,
        derived.filterMap,
        derived.relationFields,
        derived.fieldLabels,
      ),
    [
      props.customColumns,
      derived.filterMap,
      derived.relationFields,
      derived.fieldLabels,
    ],
  );

  const columns = useAutoColumns<TData>({
    fields: discovered,
    visibleColumns: derived.listFields ?? undefined,
    customColumns: mergedCustomColumns,
    addColumns: props.addColumns,
    sortable: props.sortable ?? (derived.allowedSorts.length > 0),
    allowedSorts: derived.allowedSorts,
    allowedFilters: derived.allowedFilters,
    fieldLabels: derived.fieldLabels,
    hiddenByDefault: derived.hiddenByDefault,
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

  const resolvedTitle = props.title ?? schema.labels?.plural;

  return (
    <DataTableRoot table={table} className={cn(variantClasses, props.className)}>
      {(resolvedTitle || props.description) && (
        <div className="flex flex-col gap-0.5 mb-1">
          {resolvedTitle && (
            <h2 className="text-base font-semibold text-zinc-900">
              {resolvedTitle}
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
              placeholder={
                searchCfg.placeholder ?? derived.searchPlaceholder ?? undefined
              }
              debounceMs={searchCfg.debounceMs}
              minLength={searchCfg.minLength ?? derived.searchMinLength}
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

interface FilterMapEntry {
  config: ColumnFilterConfig;
  label?: string;
}

interface DerivedConfig {
  searchField: string | null;
  searchPlaceholder: string | null;
  searchMinLength: number;
  allowedSorts: string[];
  allowedFilters: string[];
  defaultIncludes: string[];
  defaultSort: SortValue[];
  defaultPageSize: number;
  pageSizeOptions: number[];
  filterMap: Map<string, FilterMapEntry>;
  listFields: string[] | null;
  relationFields: string[];
  fieldLabels: Record<string, string>;
  hiddenByDefault: Set<string>;
  pageParam: string;
  pageSizeParam: string;
}

function deriveFromSchema(
  schema: ResourceSchema,
  endpoint: string,
  headers: Record<string, string> | (() => Record<string, string>) | undefined,
): DerivedConfig {
  const list = schema.endpoints?.list;
  const fields = schema.fields ?? {};
  const relations = schema.relations ?? {};
  const virtuals = schema.virtual_filters ?? [];

  const filterMap = new Map<string, FilterMapEntry>();
  let searchField: string | null = null;
  let searchPlaceholderDescription: string | null = null;
  let searchMinLength = 0;

  for (const [name, f] of Object.entries(fields)) {
    if (!f.filter) continue;
    const cfg = fieldToFilterConfig(f, endpoint, headers);
    if (cfg) filterMap.set(name, { config: cfg, label: f.label });
  }

  for (const [name, r] of Object.entries(relations)) {
    if (!r.filter) continue;
    const cfg = relationToFilterConfig(r, endpoint, headers);
    if (cfg) filterMap.set(name, { config: cfg, label: r.label });
  }

  for (const vf of virtuals) {
    if (vf.operator === "fulltext") {
      searchField = vf.field;
      searchPlaceholderDescription = vf.description ?? vf.label ?? null;
      searchMinLength = vf.min_length ?? 0;
      continue;
    }
    const cfg = virtualFilterToConfig(vf);
    if (cfg) filterMap.set(vf.field, { config: cfg, label: vf.label });
  }

  const searchableLabels: string[] = [];
  for (const f of Object.values(fields)) {
    if (f.searchable && f.label) searchableLabels.push(f.label);
  }
  const searchPlaceholder =
    searchableLabels.length > 0
      ? `${searchableLabels.join(", ")} içinde ara…`
      : searchPlaceholderDescription;

  const defaultSort: SortValue[] = [];
  const rawSort = list?.default_sort;
  if (rawSort) {
    const desc = rawSort.startsWith("-");
    const column = desc ? rawSort.slice(1) : rawSort;
    defaultSort.push({ column, direction: desc ? "desc" : "asc" });
  }

  const defaultPageSize = list?.pagination?.default_size ?? 25;
  const maxPageSize = list?.pagination?.max_size;
  const pageSizeOptions = buildPageSizeOptions(defaultPageSize, maxPageSize);

  const listFieldNames = Object.entries(fields)
    .filter(([, f]) => f.in.includes("list"))
    .map(([name]) => name);
  const listRelationNames = Object.entries(relations)
    .filter(([, r]) => r.in.includes("list"))
    .map(([name]) => name);
  const visibleFields = [...listFieldNames, ...listRelationNames];

  const defaultIncludes = Object.entries(relations)
    .filter(([, r]) => r.default_loaded === true && r.in.includes("list"))
    .map(([name]) => name);

  const allowedSorts = Object.entries(fields)
    .filter(([, f]) => f.sortable === true)
    .map(([name]) => name);

  const fieldLabels: Record<string, string> = {};
  for (const [name, f] of Object.entries(fields)) {
    if (f.label) fieldLabels[name] = f.label;
  }
  for (const [name, r] of Object.entries(relations)) {
    if (r.label) fieldLabels[name] = r.label;
  }

  const hiddenByDefault = new Set<string>();
  for (const [name, f] of Object.entries(fields)) {
    if (f.default_visible === false) hiddenByDefault.add(name);
  }

  const pageParam = list?.pagination?.number_parameter ?? "page[number]";
  const pageSizeParam = list?.pagination?.size_parameter ?? "page[size]";

  return {
    searchField,
    searchPlaceholder,
    searchMinLength,
    allowedSorts,
    allowedFilters: Array.from(filterMap.keys()),
    defaultIncludes,
    defaultSort,
    defaultPageSize,
    pageSizeOptions,
    filterMap,
    listFields: visibleFields.length > 0 ? visibleFields : null,
    relationFields: listRelationNames,
    fieldLabels,
    hiddenByDefault,
    pageParam,
    pageSizeParam,
  };
}

const sourceOptionsCache = new Map<string, Promise<FilterOption[]>>();

function buildSourceEndpoint(baseEndpoint: string, source: string): string {
  const queryIndex = baseEndpoint.indexOf("?");
  const path = queryIndex === -1 ? baseEndpoint : baseEndpoint.slice(0, queryIndex);
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return source;
  return path.slice(0, lastSlash + 1) + source;
}

function fetchSourceOptions(
  url: string,
  headers: Record<string, string> | (() => Record<string, string>) | undefined,
): Promise<FilterOption[]> {
  const cached = sourceOptionsCache.get(url);
  if (cached) return cached;
  const resolvedHeaders = typeof headers === "function" ? headers() : headers;
  const promise = fetch(`${url}?page[size]=200`, {
    headers: { Accept: "application/json", ...(resolvedHeaders ?? {}) },
  })
    .then(async (res) => {
      if (!res.ok) return [] as FilterOption[];
      const body = (await res.json()) as { data?: unknown[] };
      const items = Array.isArray(body.data) ? body.data : [];
      return items.map((raw) => {
        const item = raw as { id?: string | number; name?: string; title?: string };
        return {
          value: (item.id ?? "") as string | number,
          label: item.name ?? item.title ?? String(item.id ?? ""),
        };
      });
    })
    .catch(() => [] as FilterOption[]);
  sourceOptionsCache.set(url, promise);
  return promise;
}

function fieldToFilterConfig(
  f: SchemaField,
  baseEndpoint: string,
  headers: Record<string, string> | (() => Record<string, string>) | undefined,
): ColumnFilterConfig | null {
  if (f.type === "boolean") return { type: "boolean" };

  if (f.source && (f.type === "integer" || f.type === "number")) {
    const sourceUrl = buildSourceEndpoint(baseEndpoint, f.source);
    return {
      type: "select",
      options: () => fetchSourceOptions(sourceUrl, headers),
      defaultOperator: "eq",
    };
  }

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
      defaultOperator: f.filter?.operator === "partial" ? "contains" : "eq",
    };
  }

  if (f.type === "date" || f.type === "datetime") {
    return { type: "date", defaultOperator: "eq" };
  }

  return null;
}

function relationToFilterConfig(
  r: SchemaRelation,
  baseEndpoint: string,
  headers: Record<string, string> | (() => Record<string, string>) | undefined,
): ColumnFilterConfig | null {
  const op = r.filter?.operator;
  if (!r.source) return null;
  const sourceUrl = buildSourceEndpoint(baseEndpoint, r.source);
  if (op === "in") {
    return {
      type: "multi-select",
      options: () => fetchSourceOptions(sourceUrl, headers),
    };
  }
  return {
    type: "select",
    options: () => fetchSourceOptions(sourceUrl, headers),
    defaultOperator: "eq",
  };
}

function virtualFilterToConfig(
  vf: SchemaVirtualFilter,
): ColumnFilterConfig | null {
  if (vf.type === "date" || vf.type === "datetime") {
    const op: FilterOperator =
      vf.operator === "gte" ? "gte" : vf.operator === "lte" ? "lte" : "eq";
    return { type: "date", defaultOperator: op };
  }
  if (vf.type === "string") {
    return {
      type: "text",
      defaultOperator: vf.operator === "partial" ? "contains" : "eq",
    };
  }
  if (vf.type === "integer" || vf.type === "number") {
    return { type: "number", defaultOperator: "eq" };
  }
  if (vf.type === "boolean") return { type: "boolean" };
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
  filterMap: Map<string, FilterMapEntry>,
  relationFields: string[],
  fieldLabels: Record<string, string>,
): CustomColumnDef<TData>[] {
  const userArr = user ?? [];
  const seen = new Set<string>();
  const merged: CustomColumnDef<TData>[] = [];
  const relationSet = new Set(relationFields);
  const resolveLabel = (field: string): string | undefined =>
    fieldLabels[field] ?? filterMap.get(field)?.label;
  for (const col of userArr) {
    seen.add(col.field);
    const inferred = filterMap.get(col.field);
    const patch: Partial<CustomColumnDef<TData>> = {};
    if (!col.filter && inferred) patch.filter = inferred.config;
    if (col.label == null) {
      const label = resolveLabel(col.field);
      if (label) patch.label = label;
    }
    if (
      col.render == null &&
      col.accessor == null &&
      relationSet.has(col.field)
    ) {
      patch.render = defaultRelationRenderer as CustomColumnDef<TData>["render"];
    }
    merged.push(Object.keys(patch).length > 0 ? { ...col, ...patch } : col);
  }
  for (const [field, entry] of filterMap) {
    if (!seen.has(field)) {
      merged.push({
        field,
        label: fieldLabels[field] ?? entry.label,
        filter: entry.config,
      });
    }
  }
  for (const field of relationFields) {
    if (!seen.has(field)) {
      merged.push({
        field,
        label: fieldLabels[field],
        render: defaultRelationRenderer as CustomColumnDef<TData>["render"],
      });
      seen.add(field);
    }
  }
  return merged;
}

function defaultRelationRenderer(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const labels = value
      .map((item) => relationLabel(item))
      .filter((s): s is string => !!s);
    if (labels.length === 0) return null;
    return labels.join(", ");
  }
  return relationLabel(value);
}

function relationLabel(item: unknown): string | null {
  if (item == null) return null;
  if (typeof item !== "object") return String(item);
  const obj = item as Record<string, unknown>;
  for (const key of ["name", "title", "label", "slug"]) {
    const v = obj[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  if (typeof obj.id === "number" || typeof obj.id === "string") {
    return `#${obj.id}`;
  }
  return null;
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
