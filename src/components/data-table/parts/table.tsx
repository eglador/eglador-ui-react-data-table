"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useDataTableContext } from "../context";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  GripVerticalIcon,
  InboxIcon,
  MinusIcon,
} from "../icons";
import type {
  ActionsColumnDef,
  CellContext,
  ColumnDef,
  DataColumnDef,
  HeaderContext,
  RowId,
} from "../types";

export interface DataTableContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stickyHeader?: boolean;
  maxHeight?: number | string;
}

export const DataTableContainer = React.forwardRef<
  HTMLDivElement,
  DataTableContainerProps
>(function DataTableContainer(
  { className, children, stickyHeader = true, maxHeight, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-data-table-container=""
      data-sticky-header={stickyHeader || undefined}
      style={{ maxHeight, ...style }}
      className={cn(
        "relative w-full rounded-sm border border-zinc-200 bg-white",
        maxHeight ? "overflow-auto" : "overflow-x-auto",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
DataTableContainer.displayName = "DataTable.Container";

export interface DataTableTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {}

export const DataTableTable = React.forwardRef<
  HTMLTableElement,
  DataTableTableProps
>(function DataTableTable({ className, children, ...rest }, ref) {
  return (
    <table
      ref={ref}
      data-data-table-table=""
      className={cn(
        "w-full text-sm text-zinc-700 border-separate border-spacing-0",
        className,
      )}
      {...rest}
    >
      {children}
    </table>
  );
});
DataTableTable.displayName = "DataTable.Table";

export interface DataTableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const DataTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  DataTableHeaderProps
>(function DataTableHeader({ className, children, ...rest }, ref) {
  const table = useDataTableContext();
  return (
    <thead
      ref={ref}
      data-data-table-header=""
      className={cn(
        "bg-zinc-50 text-zinc-700 text-xs uppercase tracking-wide",
        "sticky top-0 z-10",
        className,
      )}
      {...rest}
    >
      {children ?? (
        <tr>
          {table.visibleColumns.map((col) => (
            <DataTableHeaderCell key={col.id} column={col} />
          ))}
        </tr>
      )}
    </thead>
  );
});
DataTableHeader.displayName = "DataTable.Header";

export interface DataTableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const DataTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  DataTableFooterProps
>(function DataTableFooter({ className, children, ...rest }, ref) {
  const table = useDataTableContext();
  return (
    <tfoot
      ref={ref}
      data-data-table-footer=""
      className={cn(
        "bg-zinc-50 text-zinc-700 text-xs uppercase tracking-wide",
        "sticky bottom-0 z-10",
        className,
      )}
      {...rest}
    >
      {children ?? (
        <tr>
          {table.visibleColumns.map((col) => (
            <DataTableHeaderCell key={col.id} column={col} />
          ))}
        </tr>
      )}
    </tfoot>
  );
});
DataTableFooter.displayName = "DataTable.Footer";

export interface DataTableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  column: ColumnDef<unknown>;
}

export const DataTableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  DataTableHeaderCellProps
>(function DataTableHeaderCell(
  { column, className, children, style, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const colWidth = (column as { width?: number | string }).width;
  const minWidth = (column as { minWidth?: number }).minWidth;
  const maxWidth = (column as { maxWidth?: number }).maxWidth;
  const align = (column as { align?: "left" | "center" | "right" }).align ?? "left";
  const sticky = (column as { sticky?: "left" | "right" }).sticky;
  const headerCls = (column as { headerClassName?: string }).headerClassName;
  if (column.type === "select") {
    const customHeader = (column as { header?: React.ReactNode }).header;
    return (
      <th
        ref={ref}
        data-column-id={column.id}
        data-column-type="select"
        scope="col"
        style={{ width: colWidth ?? 44, minWidth, maxWidth, ...style }}
        className={cn(
          "px-3 py-2 text-left font-medium align-middle border-b border-zinc-200",
          sticky && stickyClasses(sticky),
          headerCls,
          className,
        )}
        {...rest}
      >
        {customHeader ?? <SelectAllCheckbox />}
      </th>
    );
  }
  if (column.type === "drag" || column.type === "expander") {
    const customHeader = (column as { header?: React.ReactNode }).header;
    return (
      <th
        ref={ref}
        data-column-id={column.id}
        data-column-type={column.type}
        scope="col"
        aria-label={
          customHeader == null
            ? column.type === "drag"
              ? "Reorder"
              : "Expand"
            : undefined
        }
        style={{ width: colWidth ?? 36, minWidth, maxWidth, ...style }}
        className={cn(
          "px-2 py-2 align-middle border-b border-zinc-200",
          sticky && stickyClasses(sticky),
          headerCls,
          className,
        )}
        {...rest}
      >
        {customHeader}
      </th>
    );
  }
  if (column.type === "actions") {
    const customHeader = (column as { header?: React.ReactNode }).header;
    return (
      <th
        ref={ref}
        data-column-id={column.id}
        data-column-type="actions"
        scope="col"
        aria-label={customHeader == null ? "Actions" : undefined}
        style={{ width: colWidth ?? 56, minWidth, maxWidth, ...style }}
        className={cn(
          "px-2 py-2 align-middle text-right font-medium text-xs uppercase tracking-wide border-b border-zinc-200",
          sticky && stickyClasses(sticky ?? "right"),
          headerCls,
          className,
        )}
        {...rest}
      >
        {customHeader}
      </th>
    );
  }
  const dataCol = column as DataColumnDef<unknown>;
  const sortKey = dataCol.sortKey ?? column.id;
  const sortable = dataCol.sortable !== false && dataCol.sortable;
  const sortInfo = sortable ? table.sorting.get(sortKey) : null;
  const ctx: HeaderContext<unknown> = {
    column,
    sort: {
      direction: sortInfo?.direction ?? null,
      index: sortInfo?.index ?? null,
      toggle: (multi) => table.sorting.toggle(sortKey, multi),
    },
  };
  const headerNode =
    typeof dataCol.header === "function"
      ? dataCol.header(ctx)
      : (dataCol.header ?? column.id);
  const onSortClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!sortable) return;
    const multi = e.shiftKey || e.metaKey || e.ctrlKey;
    table.sorting.toggle(sortKey, multi);
  };
  return (
    <th
      ref={ref}
      data-column-id={column.id}
      scope="col"
      aria-sort={
        sortInfo?.direction === "asc"
          ? "ascending"
          : sortInfo?.direction === "desc"
            ? "descending"
            : sortable
              ? "none"
              : undefined
      }
      style={{ width: colWidth, minWidth, maxWidth, ...style }}
      className={cn(
        "px-3 py-2 font-medium align-middle whitespace-nowrap border-b border-zinc-200",
        align === "center" && "text-center",
        align === "right" && "text-right",
        sticky && stickyClasses(sticky),
        headerCls,
        className,
      )}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSortClick}
          className={cn(
            "inline-flex items-center gap-1.5 cursor-pointer rounded-sm",
            "hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
            align === "right" && "ml-auto",
          )}
        >
          <span>{children ?? headerNode}</span>
          {sortInfo?.direction === "asc" ? (
            <ChevronUpIcon className="size-3.5" />
          ) : sortInfo?.direction === "desc" ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronsUpDownIcon className="size-3.5 opacity-50" />
          )}
          {sortInfo && sortInfo.index != null && table.sorting.value.length > 1 && (
            <span className="text-[10px] font-semibold text-zinc-500 tabular-nums">
              {sortInfo.index + 1}
            </span>
          )}
        </button>
      ) : (
        <>{children ?? headerNode}</>
      )}
    </th>
  );
});
DataTableHeaderCell.displayName = "DataTable.HeaderCell";

export interface DataTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  emptyState?:
    | React.ReactNode
    | ((ctx: { search: string; hasFilters: boolean }) => React.ReactNode);
  loadingState?: React.ReactNode;
  errorState?:
    | React.ReactNode
    | ((error: unknown, retry: () => void) => React.ReactNode);
}

export const DataTableBody = React.forwardRef<
  HTMLTableSectionElement,
  DataTableBodyProps
>(function DataTableBody(
  { className, children, emptyState, loadingState, errorState, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const status = table.request.status;
  const isInitialLoading = status === "loading" && table.rows.length === 0;
  const isError = status === "error" && table.rows.length === 0;
  const isEmpty = status === "success" && table.rows.length === 0;
  const colSpan = table.visibleColumns.length || 1;
  return (
    <tbody
      ref={ref}
      data-data-table-body=""
      className={cn(className)}
      {...rest}
    >
      {isInitialLoading ? (
        loadingState != null ? (
          <tr>
            <td colSpan={colSpan} className="p-0">
              {loadingState}
            </td>
          </tr>
        ) : (
          <DataTableLoadingRow colSpan={colSpan} />
        )
      ) : isError ? (
        <tr>
          <td colSpan={colSpan} className="p-0">
            {typeof errorState === "function"
              ? errorState(table.request.error, table.refresh)
              : (errorState ?? <DataTableError />)}
          </td>
        </tr>
      ) : isEmpty ? (
        <tr>
          <td colSpan={colSpan} className="p-0">
            {typeof emptyState === "function"
              ? emptyState({
                  search: table.search.value,
                  hasFilters: table.filters.value.length > 0,
                })
              : (emptyState ?? <DataTableEmpty />)}
          </td>
        </tr>
      ) : (
        (children ??
          table.rows.map((row, rowIndex) => {
            const rowId = table.getRowId(row, rowIndex);
            return (
              <DataTableRow key={String(rowId)} row={row} rowIndex={rowIndex}>
                {table.visibleColumns.map((col) => (
                  <DataTableCell
                    key={col.id}
                    column={col}
                    row={row}
                    rowIndex={rowIndex}
                  />
                ))}
              </DataTableRow>
            );
          }))
      )}
    </tbody>
  );
});
DataTableBody.displayName = "DataTable.Body";

export interface DataTableRowProps<TData = unknown>
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, "children"> {
  row: TData;
  rowIndex: number;
  children?: React.ReactNode;
}

export const DataTableRow = React.forwardRef<
  HTMLTableRowElement,
  DataTableRowProps
>(function DataTableRow(
  { row, rowIndex, className, children, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const rowId = table.getRowId(row, rowIndex);
  const selected = table.selection.isSelected(rowId);
  const density = table.density;
  return (
    <tr
      ref={ref}
      data-data-table-row=""
      data-row-id={String(rowId)}
      data-selected={selected || undefined}
      data-density={density}
      className={cn(
        "transition-colors",
        "hover:bg-zinc-50",
        "data-[selected]:bg-zinc-100/70",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
});
DataTableRow.displayName = "DataTable.Row";

export interface DataTableCellProps<TData = unknown>
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "children"> {
  column: ColumnDef<TData>;
  row: TData;
  rowIndex: number;
  children?: React.ReactNode;
}

export const DataTableCell = React.forwardRef<
  HTMLTableCellElement,
  DataTableCellProps
>(function DataTableCell(
  { column, row, rowIndex, className, children, style, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const rowId = table.getRowId(row, rowIndex);
  const align = (column as { align?: "left" | "center" | "right" }).align ?? "left";
  const sticky = (column as { sticky?: "left" | "right" }).sticky;
  const cellCls = (column as { cellClassName?: string }).cellClassName;
  const density = table.density;
  const padding =
    density === "compact"
      ? "px-3 py-1.5"
      : density === "spacious"
        ? "px-3 py-4"
        : "px-3 py-2.5";
  const baseClasses = cn(
    "align-middle text-zinc-700 whitespace-nowrap",
    "border-b border-zinc-200",
    align === "center" && "text-center",
    align === "right" && "text-right",
    sticky && stickyClasses(sticky),
    cellCls,
    className,
  );
  if (column.type === "select") {
    return (
      <td
        ref={ref}
        data-column-id={column.id}
        data-column-type="select"
        style={style}
        className={cn(padding, baseClasses)}
        {...rest}
      >
        <RowSelectCheckbox rowId={rowId} />
      </td>
    );
  }
  if (column.type === "drag") {
    return (
      <td
        ref={ref}
        data-column-id={column.id}
        data-column-type="drag"
        style={style}
        className={cn("px-2 py-2", baseClasses)}
        {...rest}
      >
        <span
          className="inline-flex items-center justify-center size-6 text-zinc-400 cursor-grab active:cursor-grabbing"
          aria-label="Drag handle"
          role="button"
        >
          <GripVerticalIcon className="size-4" />
        </span>
      </td>
    );
  }
  if (column.type === "expander") {
    return (
      <td
        ref={ref}
        data-column-id={column.id}
        data-column-type="expander"
        style={style}
        className={cn("px-2 py-2", baseClasses)}
        {...rest}
      >
        {children}
      </td>
    );
  }
  if (column.type === "actions") {
    const actionsCol = column as ActionsColumnDef<unknown>;
    const ctx: CellContext<unknown> = {
      row,
      rowId,
      rowIndex,
      value: undefined,
      column,
    };
    return (
      <td
        ref={ref}
        data-column-id={column.id}
        data-column-type="actions"
        style={style}
        className={cn("px-2 py-2 text-right", baseClasses)}
        {...rest}
      >
        {actionsCol.cell(ctx)}
      </td>
    );
  }
  const dataCol = column as DataColumnDef<unknown>;
  const value = extractValue(row, dataCol);
  const ctx: CellContext<unknown> = {
    row,
    rowId,
    rowIndex,
    value,
    column,
  };
  const cellNode = dataCol.cell ? dataCol.cell(ctx) : (value as React.ReactNode);
  return (
    <td
      ref={ref}
      data-column-id={column.id}
      style={style}
      className={cn(padding, baseClasses)}
      {...rest}
    >
      {children ?? cellNode}
    </td>
  );
});
DataTableCell.displayName = "DataTable.Cell";

export interface DataTableEmptyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const DataTableEmpty = React.forwardRef<
  HTMLDivElement,
  DataTableEmptyProps
>(function DataTableEmpty(
  { title = "No results", description, icon, action, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
        className,
      )}
      {...rest}
    >
      <div className="size-10 inline-flex items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-900">{title}</div>
        {description && (
          <div className="mt-1 text-sm text-zinc-500">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
});
DataTableEmpty.displayName = "DataTable.Empty";

export interface DataTableErrorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  retry?: React.ReactNode;
}

export const DataTableError = React.forwardRef<
  HTMLDivElement,
  DataTableErrorProps
>(function DataTableError(
  { title = "Couldn't load data", description, retry, className, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const errorMessage =
    description ??
    (table.request.error instanceof Error
      ? table.request.error.message
      : "An unexpected error occurred.");
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
        className,
      )}
      {...rest}
    >
      <div className="size-10 inline-flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <AlertCircleIcon className="size-5" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-900">{title}</div>
        <div className="mt-1 text-sm text-zinc-500">{errorMessage}</div>
      </div>
      {retry ?? (
        <button
          type="button"
          onClick={() => table.refresh()}
          className="inline-flex items-center px-3 h-8 text-xs font-medium rounded-sm border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
});
DataTableError.displayName = "DataTable.Error";

export interface DataTableLoadingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
}

export const DataTableLoading = React.forwardRef<
  HTMLDivElement,
  DataTableLoadingProps
>(function DataTableLoading({ rows = 6, className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn("flex flex-col gap-2 p-3", className)}
      {...rest}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-8 rounded-sm bg-zinc-100 eglador-dt-pulse"
        />
      ))}
    </div>
  );
});
DataTableLoading.displayName = "DataTable.Loading";

function DataTableLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t border-zinc-200">
          <td colSpan={colSpan} className="px-3 py-2.5">
            <div className="h-5 rounded-sm bg-zinc-100 eglador-dt-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SelectAllCheckbox() {
  const table = useDataTableContext();
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = table.selection.isSomeSelected;
    }
  }, [table.selection.isSomeSelected]);
  if (table.selection.mode !== "multiple") return null;
  return (
    <label className="inline-flex items-center justify-center cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        checked={table.selection.isAllSelected}
        onChange={() => table.selection.toggleAll()}
        aria-label="Select all rows"
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center size-4 rounded-sm border transition-colors",
          table.selection.isAllSelected
            ? "border-zinc-900 bg-zinc-900 text-white"
            : table.selection.isSomeSelected
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900 peer-focus-visible:ring-offset-1",
        )}
      >
        {table.selection.isAllSelected ? (
          <CheckIcon className="size-3" />
        ) : table.selection.isSomeSelected ? (
          <MinusIcon className="size-3" />
        ) : null}
      </span>
    </label>
  );
}

function RowSelectCheckbox({ rowId }: { rowId: RowId }) {
  const table = useDataTableContext();
  if (table.selection.mode === "none") return null;
  const checked = table.selection.isSelected(rowId);
  return (
    <label className="inline-flex items-center justify-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => table.selection.toggle(rowId)}
        aria-label="Select row"
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center size-4 rounded-sm border transition-colors",
          checked
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900 peer-focus-visible:ring-offset-1",
        )}
      >
        {checked && <CheckIcon className="size-3" />}
      </span>
    </label>
  );
}

function stickyClasses(side: "left" | "right"): string {
  if (side === "left") return "sticky left-0 bg-white z-[1]";
  return "sticky right-0 bg-white z-[1]";
}

function extractValue<TData>(row: TData, column: DataColumnDef<TData>): unknown {
  if (column.accessorFn) return column.accessorFn(row);
  if (column.accessorKey) {
    return (row as Record<string, unknown>)[column.accessorKey];
  }
  return undefined;
}
