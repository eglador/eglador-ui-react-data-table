"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { DataTableContext } from "../context";
import { ensureDataTableStyles } from "../styles";
import type { DataTableInstance } from "../use-data-table";

export interface DataTableRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: DataTableInstance<any>;
  children?: React.ReactNode;
}

export const DataTableRoot = React.forwardRef<
  HTMLDivElement,
  DataTableRootProps
>(function DataTableRoot({ table, className, children, ...rest }, ref) {
  React.useEffect(() => {
    ensureDataTableStyles();
  }, []);
  return (
    <DataTableContext.Provider value={table}>
      <div
        ref={ref}
        data-data-table=""
        data-density={table.density}
        className={cn("flex flex-col gap-3 w-full", className)}
        {...rest}
      >
        {children}
      </div>
    </DataTableContext.Provider>
  );
});
DataTableRoot.displayName = "DataTable";
