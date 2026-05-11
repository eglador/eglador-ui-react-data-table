import type * as React from "react";

// === Primitives ====================================================

export type RowId = string | number;

export type GetRowId<TData> = (row: TData, index: number) => RowId;

export type TableDensity = "spacious" | "comfortable" | "compact";

// === Sort ==========================================================

export type SortDirection = "asc" | "desc";

export interface SortValue {
  /** Column id (or `sortKey` if the column overrides it). */
  column: string;
  direction: SortDirection;
}

// === Filter ========================================================

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "between"
  | "is_null"
  | "is_not_null"
  | "is_true"
  | "is_false";

export type TextOperator =
  | "eq"
  | "neq"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "is_null"
  | "is_not_null";

export type NumberOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type DateOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "is_null"
  | "is_not_null";

export type SelectOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type BooleanOperator = "is_true" | "is_false" | "is_null" | "is_not_null";

export interface FilterValue {
  /** Stable id for this filter row in the active filter list. */
  id: string;
  /** Column id (or `filterKey` if the column overrides it). */
  column: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterOption {
  value: string | number | boolean;
  label: React.ReactNode;
}

export type FilterOptionsResolver =
  | FilterOption[]
  | (() => FilterOption[] | Promise<FilterOption[]>);

export interface FilterRenderProps {
  value: unknown;
  operator: FilterOperator;
  onChange: (value: unknown) => void;
  onOperatorChange: (operator: FilterOperator) => void;
}

export type ColumnFilterConfig =
  | {
      type: "text";
      defaultOperator?: TextOperator;
      allowedOperators?: TextOperator[];
      placeholder?: string;
    }
  | {
      type: "number";
      defaultOperator?: NumberOperator;
      allowedOperators?: NumberOperator[];
    }
  | {
      type: "date";
      defaultOperator?: DateOperator;
      allowedOperators?: DateOperator[];
    }
  | {
      type: "boolean";
      labels?: { true: React.ReactNode; false: React.ReactNode };
    }
  | {
      type: "select";
      options: FilterOptionsResolver;
      defaultOperator?: SelectOperator;
      allowedOperators?: SelectOperator[];
    }
  | {
      type: "multi-select";
      options: FilterOptionsResolver;
    }
  | {
      type: "custom";
      defaultOperator?: FilterOperator;
      render: (props: FilterRenderProps) => React.ReactNode;
    };

// === Pagination ====================================================

export interface OffsetPagination {
  mode: "offset";
  /** 1-indexed page number. */
  page: number;
  pageSize: number;
}

export interface CursorPagination {
  mode: "cursor";
  cursor: string | null;
  pageSize: number;
  direction: "forward" | "backward";
}

export type PaginationValue = OffsetPagination | CursorPagination;

// === Query state ===================================================

export interface TableQueryState {
  pagination: PaginationValue;
  sorting: SortValue[];
  filters: FilterValue[];
  /** Global search string. */
  search: string;
  /** Relations / includes to eagerly load (Spatie / Payload / GraphQL). */
  includes: string[];
}

// === Data source ===================================================

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface FetchResult<TData> {
  rows: TData[];
  /** Total row count for offset pagination. Adapters that don't expose this
   *  may omit — the table falls back to "show next button while page is full". */
  total?: number;
  /** Cursor pagination meta. */
  pageInfo?: PageInfo;
  /** Adapter-specific extras (Laravel `current_page`, Payload `totalDocs`, …). */
  meta?: Record<string, unknown>;
}

export interface DataSourceCapabilities {
  serverSort?: boolean;
  serverFilter?: boolean;
  serverSearch?: boolean;
  serverPagination?: "offset" | "cursor" | "both";
  multiSort?: boolean;
  includes?: boolean;
  /** Per-operator support map. Operators not listed default to `true` for
   *  remote sources. UI hides operators reported `false`. */
  supportedOperators?: Partial<Record<FilterOperator, boolean>>;
}

export interface DataSource<TData> {
  /** Async loader. Receives normalized table state + abort signal so the
   *  adapter can cancel in-flight requests when state changes. */
  fetch: (
    state: TableQueryState,
    signal: AbortSignal,
  ) => Promise<FetchResult<TData>>;
  capabilities?: DataSourceCapabilities;
}

// === Column ========================================================

export type AccessorKey<TData> = keyof TData & string;

export type ColumnAlign = "left" | "center" | "right";

export interface CellContext<TData, TValue = unknown> {
  row: TData;
  rowId: RowId;
  rowIndex: number;
  value: TValue;
  column: ColumnDef<TData>;
}

export interface HeaderContext<TData> {
  column: ColumnDef<TData>;
  /** Current sort state for this column, if sortable. */
  sort: {
    direction: SortDirection | null;
    index: number | null;
    toggle: (multi?: boolean) => void;
  };
}

export interface BaseColumnDef {
  id: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlign;
  sticky?: "left" | "right";
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  meta?: Record<string, unknown>;
}

export interface DataColumnDef<TData, TValue = unknown> extends BaseColumnDef {
  type?: "data";
  accessorKey?: AccessorKey<TData>;
  accessorFn?: (row: TData) => TValue;
  header?: React.ReactNode | ((ctx: HeaderContext<TData>) => React.ReactNode);
  cell?: (ctx: CellContext<TData, TValue>) => React.ReactNode;
  footer?: React.ReactNode;
  /** Enable client- or server-side sort on this column. */
  sortable?: boolean;
  /** Server-side sort key when it differs from `id`. */
  sortKey?: string;
  /** Client-side comparator override. */
  sortFn?: (a: TValue, b: TValue) => number;
  filter?: ColumnFilterConfig;
  /** Server-side filter key when it differs from `id`. */
  filterKey?: string;
  /** Include this column's value in global search (client-side only). */
  searchable?: boolean;
  /** Default visibility. User can toggle via the visibility menu. */
  visible?: boolean;
  hideable?: boolean;
  resizable?: boolean;
}

export interface SelectColumnDef extends BaseColumnDef {
  type: "select";
  /** Override the default header (select-all checkbox). */
  header?: React.ReactNode;
}

export interface DragColumnDef extends BaseColumnDef {
  type: "drag";
  header?: React.ReactNode;
}

export interface ActionsColumnDef<TData> extends BaseColumnDef {
  type: "actions";
  header?: React.ReactNode;
  cell: (ctx: CellContext<TData>) => React.ReactNode;
}

export interface ExpanderColumnDef extends BaseColumnDef {
  type: "expander";
  header?: React.ReactNode;
}

export type ColumnDef<TData> =
  | DataColumnDef<TData>
  | SelectColumnDef
  | DragColumnDef
  | ActionsColumnDef<TData>
  | ExpanderColumnDef;

// === Selection =====================================================

export type SelectionMode = "none" | "single" | "multiple";

export interface SelectionState {
  /** When `all` is `true`, every loaded row is selected and `excluded` lists
   *  individual deselections (handy for "select all 1.2M rows" patterns). */
  all: boolean;
  selected: Set<RowId>;
  excluded: Set<RowId>;
}

// === Mutations =====================================================

export interface DataMutations<TData> {
  onDelete?: (rows: TData[]) => Promise<void> | void;
  onUpdate?: (
    row: TData,
    patch: Partial<TData>,
  ) => Promise<TData | void> | TData | void;
  onReorder?: (newOrder: TData[]) => Promise<void> | void;
}

// === Search ========================================================

export interface SearchConfig {
  /** `global` puts a single search box in the toolbar that hits the server
   *  search endpoint or matches every `searchable: true` column client-side.
   *  `per-column` adds a dedicated input under each searchable header.
   *  `both` enables both. */
  mode: "global" | "per-column" | "both";
  placeholder?: string;
  /** Debounce window (ms) before triggering a refetch. Default `300`. */
  debounceMs?: number;
  /** Columns to include in global client-side search. Defaults to every
   *  column with `searchable: true`. */
  columns?: string[];
}

// === Request lifecycle =============================================

export type RetryBackoff = "linear" | "exponential";

export interface RequestConfig {
  /** Debounce in ms applied to filter/search/sort changes before a fetch. */
  debounceMs?: number;
  retry?: { count: number; backoff?: RetryBackoff; baseDelayMs?: number };
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  /** Keep showing the previous result while the next page is loading
   *  (stale-while-revalidate). Default `true`. */
  keepPreviousData?: boolean;
}

export type RequestStatus = "idle" | "loading" | "success" | "error";

export interface RequestState<TData> {
  status: RequestStatus;
  data: FetchResult<TData> | null;
  error: unknown;
  /** `true` while a request is in flight (regardless of `status`). Useful for
   *  showing a soft loading indicator during stale-while-revalidate. */
  isFetching: boolean;
}

// === Schema-driven column overrides ================================

export interface SchemaCellContext {
  rowIndex: number;
  rowId: RowId;
  refresh: () => void;
}

/** Override entry for an auto-discovered column. Match by `field`. Any
 *  property left undefined inherits the auto-discovered default. */
export interface CustomColumnDef<TData> {
  field: string;
  label?: React.ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlign;
  sticky?: "left" | "right";
  hideable?: boolean;
  visible?: boolean;
  accessor?: (row: TData) => unknown;
  sortable?: boolean;
  sortKey?: string;
  filterable?: boolean;
  filterKey?: string;
  filter?: ColumnFilterConfig;
  searchable?: boolean;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (
    value: unknown,
    row: TData,
    ctx: SchemaCellContext,
  ) => React.ReactNode;
}

/** Extra column not present in the API response. Use for selection / drag
 *  handles / actions / computed cells. */
export interface AddedColumnDef<TData> {
  field: string;
  /** "data" | "select" | "drag" | "actions" | "expander". Default `"data"`. */
  type?: "data" | "select" | "drag" | "actions" | "expander";
  /** `"start"` (push to front), `"end"` (push to back), or numeric index. */
  position?: "start" | "end" | number;
  label?: React.ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlign;
  sticky?: "left" | "right";
  hideable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  accessor?: (row: TData) => unknown;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (
    value: unknown,
    row: TData,
    ctx: SchemaCellContext,
  ) => React.ReactNode;
}

// === URL sync ======================================================

export type UrlRouterAdapter = "next-app" | "next-pages" | "react-router" | "manual";

export interface UrlSyncConfig {
  enabled?: boolean;
  /** Prefix every search-param to avoid collisions when multiple tables
   *  coexist on the same page (e.g. `users_page`, `posts_page`). */
  paramPrefix?: string;
  router?: UrlRouterAdapter;
  /** When `manual`, you receive `(state) => void` and apply it however you
   *  want. */
  onChange?: (params: URLSearchParams) => void;
  /** Read the initial state from these params on mount. */
  initialParams?: URLSearchParams;
}
