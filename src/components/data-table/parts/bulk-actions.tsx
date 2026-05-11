"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useDataTableContext } from "../context";
import { XIcon } from "../icons";

export interface DataTableBulkActionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  hideWhenEmpty?: boolean;
  label?: (count: number, isAll: boolean) => React.ReactNode;
}

export function DataTableBulkActions({
  className,
  hideWhenEmpty = true,
  label,
  children,
  ...rest
}: DataTableBulkActionsProps) {
  const table = useDataTableContext();
  const count = table.selection.selectedCount;
  if (hideWhenEmpty && count === 0) return null;
  const defaultLabel = label
    ? label(count, table.selection.state.all)
    : `${count} selected`;
  return (
    <div
      data-data-table-bulk-actions=""
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-sm",
        "bg-zinc-900 text-white",
        className,
      )}
      {...rest}
    >
      <span className="text-xs font-medium tabular-nums">{defaultLabel}</span>
      <div className="flex items-center gap-1.5 ml-auto">
        {children}
        <button
          type="button"
          onClick={() => table.selection.clear()}
          aria-label="Clear selection"
          className="inline-flex items-center justify-center size-6 rounded-sm text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
DataTableBulkActions.displayName = "DataTable.BulkActions";
