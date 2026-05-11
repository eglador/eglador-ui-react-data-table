"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useDataTableContext } from "../context";
import {
  EyeIcon,
  LoaderIcon,
  RefreshIcon,
  Rows2Icon,
  Rows3Icon,
  Rows4Icon,
  SearchIcon,
  XIcon,
} from "../icons";
import { Popover } from "./popover";
import type { TableDensity } from "../types";

// === Toolbar (container) ===========================================

export interface DataTableToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const DataTableToolbar = React.forwardRef<
  HTMLDivElement,
  DataTableToolbarProps
>(function DataTableToolbar({ className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      data-data-table-toolbar=""
      className={cn("flex items-center gap-2 flex-wrap", className)}
      {...rest}
    >
      {children}
    </div>
  );
});
DataTableToolbar.displayName = "DataTable.Toolbar";

// === Search ========================================================

export interface DataTableSearchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  placeholder?: string;
  debounceMs?: number;
}

export const DataTableSearch = React.forwardRef<
  HTMLInputElement,
  DataTableSearchProps
>(function DataTableSearch(
  { className, placeholder = "Search…", debounceMs = 300, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const [local, setLocal] = React.useState(table.search.value);

  React.useEffect(() => {
    setLocal(table.search.value);
  }, [table.search.value]);

  React.useEffect(() => {
    if (local === table.search.value) return;
    const id = window.setTimeout(() => {
      table.search.set(local);
    }, debounceMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div
      data-data-table-search=""
      className={cn(
        "relative inline-flex items-center min-w-[220px]",
        className,
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="absolute left-3 size-4 text-zinc-400 pointer-events-none"
      />
      <input
        ref={ref}
        type="search"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        className={cn(
          "w-full h-9 pl-9 pr-3 text-sm rounded-sm",
          "border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
        )}
        {...rest}
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            table.search.set("");
          }}
          className="absolute right-2 size-5 inline-flex items-center justify-center rounded-sm text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
});
DataTableSearch.displayName = "DataTable.Search";

// === Refresh ========================================================

export interface DataTableRefreshButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {}

export const DataTableRefreshButton = React.forwardRef<
  HTMLButtonElement,
  DataTableRefreshButtonProps
>(function DataTableRefreshButton(
  { className, onClick, "aria-label": ariaLabel, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const isLoading = table.request.isFetching;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel ?? "Refresh"}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) table.refresh();
      }}
      className={cn(
        "inline-flex items-center justify-center size-9 rounded-sm",
        "border border-zinc-200 bg-white text-zinc-700",
        "hover:bg-zinc-50 hover:text-zinc-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
        "cursor-pointer transition-colors",
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <LoaderIcon className="size-4 eglador-dt-spin" />
      ) : (
        <RefreshIcon className="size-4" />
      )}
    </button>
  );
});
DataTableRefreshButton.displayName = "DataTable.RefreshButton";

// === Density toggle =================================================

const DENSITY_OPTIONS: {
  value: TableDensity;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "spacious", label: "Spacious", icon: <Rows2Icon className="size-4" /> },
  { value: "comfortable", label: "Comfortable", icon: <Rows3Icon className="size-4" /> },
  { value: "compact", label: "Compact", icon: <Rows4Icon className="size-4" /> },
];

export interface DataTableDensityToggleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {}

export const DataTableDensityToggle = React.forwardRef<
  HTMLDivElement,
  DataTableDensityToggleProps
>(function DataTableDensityToggle({ className, ...rest }, ref) {
  const table = useDataTableContext();
  const current =
    DENSITY_OPTIONS.find((o) => o.value === table.density) ??
    DENSITY_OPTIONS[1];
  return (
    <Popover
      trigger={
        <button
          type="button"
          aria-label="Density"
          className={cn(
            "inline-flex items-center justify-center size-9 rounded-sm",
            "border border-zinc-200 bg-white text-zinc-700",
            "hover:bg-zinc-50 hover:text-zinc-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
            "cursor-pointer transition-colors",
          )}
        >
          {current.icon}
        </button>
      }
      align="end"
    >
      {(close) => (
        <div ref={ref} className={cn("py-1 min-w-[10rem]", className)} {...rest}>
          {DENSITY_OPTIONS.map((opt) => {
            const active = table.density === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  table.setDensity(opt.value);
                  close();
                }}
                className={cn(
                  "w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm cursor-pointer",
                  active
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-700 hover:bg-zinc-50",
                )}
              >
                <span className="text-zinc-500">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
});
DataTableDensityToggle.displayName = "DataTable.DensityToggle";

// === Column visibility menu =========================================

export interface DataTableColumnVisibilityMenuProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Trigger label / element. Defaults to the eye icon. */
  trigger?: React.ReactNode;
}

export const DataTableColumnVisibilityMenu = React.forwardRef<
  HTMLDivElement,
  DataTableColumnVisibilityMenuProps
>(function DataTableColumnVisibilityMenu(
  { className, trigger, ...rest },
  ref,
) {
  const table = useDataTableContext();
  const hideableColumns = table.columns.filter(
    (c) =>
      c.type !== "select" &&
      c.type !== "drag" &&
      c.type !== "actions" &&
      c.type !== "expander" &&
      (c as { hideable?: boolean }).hideable !== false,
  );

  return (
    <Popover
      align="end"
      trigger={
        trigger ?? (
          <button
            type="button"
            aria-label="Column visibility"
            className={cn(
              "inline-flex items-center justify-center size-9 rounded-sm",
              "border border-zinc-200 bg-white text-zinc-700",
              "hover:bg-zinc-50 hover:text-zinc-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
              "cursor-pointer transition-colors",
            )}
          >
            <EyeIcon className="size-4" />
          </button>
        )
      }
    >
      <div
        ref={ref}
        className={cn("py-1 min-w-[14rem] max-h-72 overflow-auto", className)}
        {...rest}
      >
        <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Columns
        </div>
        {hideableColumns.map((col) => {
          const visible = table.isColumnVisible(col.id);
          const headerLabel =
            (col as { header?: React.ReactNode }).header ?? col.id;
          return (
            <label
              key={col.id}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={() => table.toggleColumnVisibility(col.id)}
                className="size-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="flex-1 truncate">
                {typeof headerLabel === "string" ? headerLabel : col.id}
              </span>
            </label>
          );
        })}
      </div>
    </Popover>
  );
});
DataTableColumnVisibilityMenu.displayName = "DataTable.ColumnVisibilityMenu";
