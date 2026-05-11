import {
  DataTableAddFilter,
  DataTableBody,
  DataTableBulkActions,
  DataTableCell,
  DataTableColumnVisibilityMenu,
  DataTableContainer,
  DataTableDensityToggle,
  DataTableEmpty,
  DataTableError,
  DataTableFilterBar,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableLoading,
  DataTablePagination,
  DataTableRefreshButton,
  DataTableRoot,
  DataTableRow,
  DataTableSearch,
  DataTableTable,
  DataTableToolbar,
} from "./parts";
import { DataTableSchema } from "./DataTableSchema";

export const DataTable = Object.assign(DataTableSchema, {
  Root: DataTableRoot,
  Toolbar: DataTableToolbar,
  Search: DataTableSearch,
  RefreshButton: DataTableRefreshButton,
  DensityToggle: DataTableDensityToggle,
  ColumnVisibilityMenu: DataTableColumnVisibilityMenu,
  FilterBar: DataTableFilterBar,
  AddFilter: DataTableAddFilter,
  BulkActions: DataTableBulkActions,
  Container: DataTableContainer,
  Table: DataTableTable,
  Header: DataTableHeader,
  HeaderCell: DataTableHeaderCell,
  Body: DataTableBody,
  Footer: DataTableFooter,
  Row: DataTableRow,
  Cell: DataTableCell,
  Empty: DataTableEmpty,
  Error: DataTableError,
  Loading: DataTableLoading,
  Pagination: DataTablePagination,
});

export { DataTableSchema };
export type {
  BulkActionsContext,
  DataTableSchemaProps,
  PaginationConfigInput,
  RetryConfigInput,
  SearchConfigInput,
  SelectionConfigInput,
  UrlSyncConfigInput,
} from "./DataTableSchema";

export { useAutoColumns } from "./use-auto-columns";
export type { UseAutoColumnsOptions } from "./use-auto-columns";

export {
  DataTableAddFilter,
  DataTableBody,
  DataTableBulkActions,
  DataTableCell,
  DataTableColumnVisibilityMenu,
  DataTableContainer,
  DataTableDensityToggle,
  DataTableEmpty,
  DataTableError,
  DataTableFilterBar,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableLoading,
  DataTablePagination,
  DataTableRefreshButton,
  DataTableRoot,
  DataTableRow,
  DataTableSearch,
  DataTableTable,
  DataTableToolbar,
};

export { Popover } from "./parts";
export type { PopoverProps } from "./parts";

export { useDataTable } from "./use-data-table";
export type {
  UseDataTableOptions,
  DataTableInstance,
} from "./use-data-table";

export { DataTableContext, useDataTableContext } from "./context";

export {
  createInitialState,
  queryReducer,
  serializeQueryState,
  DEFAULT_PAGE_SIZE,
} from "./state";
export type { QueryAction } from "./state";

export { useDataSource } from "./request";
export type { UseDataSourceReturn } from "./request";

export { ensureDataTableStyles } from "./styles";

export { useSchema, inferSchemaEndpoint } from "./use-schema";
export type { UseSchemaResult } from "./use-schema";

export {
  useUrlSyncedState,
  parseQueryFromUrl,
  writeQueryToUrl,
} from "./url-sync";
export type { UrlSyncOptions, UrlSyncReturn } from "./url-sync";

export type {
  DataTableBodyProps,
  DataTableBulkActionsProps,
  DataTableCellProps,
  DataTableColumnVisibilityMenuProps,
  DataTableContainerProps,
  DataTableDensityToggleProps,
  DataTableEmptyProps,
  DataTableErrorProps,
  DataTableFilterBarProps,
  DataTableHeaderCellProps,
  DataTableHeaderProps,
  DataTableLoadingProps,
  DataTablePaginationProps,
  DataTableRefreshButtonProps,
  DataTableRootProps,
  DataTableRowProps,
  DataTableSearchProps,
  DataTableTableProps,
  DataTableToolbarProps,
} from "./parts";

export type {
  AccessorKey,
  ActionsColumnDef,
  AddedColumnDef,
  BaseColumnDef,
  BooleanOperator,
  CellContext,
  ColumnAlign,
  ColumnDef,
  ColumnFilterConfig,
  CursorPagination,
  CustomColumnDef,
  DataColumnDef,
  DataMutations,
  DataSource,
  DataSourceCapabilities,
  DateOperator,
  DragColumnDef,
  ExpanderColumnDef,
  FetchResult,
  FilterOperator,
  FilterOption,
  FilterOptionsResolver,
  FilterRenderProps,
  FilterValue,
  GetRowId,
  HeaderContext,
  NumberOperator,
  OffsetPagination,
  PageInfo,
  PaginationValue,
  RequestConfig,
  RequestState,
  RequestStatus,
  RetryBackoff,
  RowId,
  SchemaCellContext,
  SearchConfig,
  SelectColumnDef,
  SelectionMode,
  SelectionState,
  ResourceSchema,
  SchemaFilter,
  SchemaFilterOperator,
  SchemaFilterType,
  SchemaListView,
  SchemaPagination,
  SelectOperator,
  SortDirection,
  SortValue,
  TableDensity,
  TableQueryState,
  TextOperator,
  UrlRouterAdapter,
  UrlSyncConfig,
} from "./types";
