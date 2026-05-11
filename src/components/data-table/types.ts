import type * as React from "react";

export type RowId = string | number;

export type GetRowId<TData> = (row: TData, index: number) => RowId;

export type TableDensity = "spacious" | "comfortable" | "compact";

export type SortDirection = "asc" | "desc";

export interface SortValue {
  column: string;
  direction: SortDirection;
}

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
  id: string;
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

export interface OffsetPagination {
  mode: "offset";
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

export interface TableQueryState {
  pagination: PaginationValue;
  sorting: SortValue[];
  filters: FilterValue[];
  search: string;
  includes: string[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface FetchResult<TData> {
  rows: TData[];
  total?: number;
  pageInfo?: PageInfo;
  meta?: Record<string, unknown>;
}

export interface DataSourceCapabilities {
  serverSort?: boolean;
  serverFilter?: boolean;
  serverSearch?: boolean;
  serverPagination?: "offset" | "cursor" | "both";
  multiSort?: boolean;
  includes?: boolean;
  supportedOperators?: Partial<Record<FilterOperator, boolean>>;
}

export interface DataSource<TData> {
  fetch: (
    state: TableQueryState,
    signal: AbortSignal,
  ) => Promise<FetchResult<TData>>;
  capabilities?: DataSourceCapabilities;
}

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
  sortable?: boolean;
  sortKey?: string;
  sortFn?: (a: TValue, b: TValue) => number;
  filter?: ColumnFilterConfig;
  filterKey?: string;
  searchable?: boolean;
  visible?: boolean;
  hideable?: boolean;
  resizable?: boolean;
}

export interface SelectColumnDef extends BaseColumnDef {
  type: "select";
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

export type SelectionMode = "none" | "single" | "multiple";

export interface SelectionState {
  all: boolean;
  selected: Set<RowId>;
  excluded: Set<RowId>;
}

export interface DataMutations<TData> {
  onDelete?: (rows: TData[]) => Promise<void> | void;
  onUpdate?: (
    row: TData,
    patch: Partial<TData>,
  ) => Promise<TData | void> | TData | void;
  onReorder?: (newOrder: TData[]) => Promise<void> | void;
}

export interface SearchConfig {
  mode: "global" | "per-column" | "both";
  placeholder?: string;
  debounceMs?: number;
  columns?: string[];
}

export type RetryBackoff = "linear" | "exponential";

export interface RequestConfig {
  debounceMs?: number;
  retry?: { count: number; backoff?: RetryBackoff; baseDelayMs?: number };
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  keepPreviousData?: boolean;
}

export type RequestStatus = "idle" | "loading" | "success" | "error";

export interface RequestState<TData> {
  status: RequestStatus;
  data: FetchResult<TData> | null;
  error: unknown;
  isFetching: boolean;
}

export interface SchemaCellContext {
  rowIndex: number;
  rowId: RowId;
  refresh: () => void;
}

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

export interface AddedColumnDef<TData> {
  field: string;
  type?: "data" | "select" | "drag" | "actions" | "expander";
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

export type UrlRouterAdapter = "next-app" | "next-pages" | "react-router" | "manual";

export interface UrlSyncConfig {
  enabled?: boolean;
  paramPrefix?: string;
  router?: UrlRouterAdapter;
  onChange?: (params: URLSearchParams) => void;
  initialParams?: URLSearchParams;
}

export type SchemaFilterType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "enum"
  | "date"
  | "datetime";

export type SchemaFilterOperator =
  | "exact"
  | "partial"
  | "scope"
  | "fulltext"
  | "gte"
  | "lte"
  | "gt"
  | "lt"
  | "in"
  | "not_in";

export interface SchemaFilter {
  field: string;
  type: SchemaFilterType;
  operator: SchemaFilterOperator;
  values?: (string | number | boolean)[];
}

export interface SchemaPagination {
  strategy?: string;
  size_parameter?: string;
  number_parameter?: string;
  default_size?: number;
  max_size?: number;
}

export interface ResourceSchema {
  type: string;
  filters: SchemaFilter[];
  sorts: string[];
  default_sort?: string;
  includes: string[];
  default_includes: string[];
  fields: string[];
  pagination: SchemaPagination;
  validation?: Record<string, unknown>;
  operations?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
