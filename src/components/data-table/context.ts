"use client";

import * as React from "react";
import type { DataTableInstance } from "./use-data-table";

export const DataTableContext = React.createContext<DataTableInstance<unknown> | null>(
  null,
);

export function useDataTableContext<TData = unknown>(): DataTableInstance<TData> {
  const ctx = React.useContext(DataTableContext);
  if (!ctx) {
    throw new Error(
      "DataTable subcomponents must be rendered inside a <DataTable> wrapper.",
    );
  }
  return ctx as DataTableInstance<TData>;
}
