"use client";

import * as React from "react";
import type {
  AddedColumnDef,
  CellContext,
  ColumnDef,
  CustomColumnDef,
  DataColumnDef,
  SchemaCellContext,
} from "./types";

export interface UseAutoColumnsOptions<TData> {
  fields: string[];
  visibleColumns?: string[];
  hideColumns?: string[];
  customColumns?: CustomColumnDef<TData>[];
  addColumns?: AddedColumnDef<TData>[];
  sortable?: boolean;
  allowedSorts?: string[];
  allowedFilters?: string[];
  refresh: () => void;
}

export function useAutoColumns<TData>(
  options: UseAutoColumnsOptions<TData>,
): ColumnDef<TData>[] {
  return React.useMemo(() => {
    const visible = options.visibleColumns;
    const hide = options.hideColumns;
    const discovered = options.fields;
    let fields: string[];
    if (visible && visible.length > 0) {
      fields = visible;
    } else if (discovered.length > 0) {
      fields = hide && hide.length > 0
        ? discovered.filter((f) => !hide.includes(f))
        : discovered;
    } else {
      fields = [];
    }
    const customMap = new Map<string, CustomColumnDef<TData>>();
    for (const c of options.customColumns ?? []) {
      customMap.set(c.field, c);
    }
    const sortAllow = options.allowedSorts
      ? new Set(options.allowedSorts)
      : null;
    const filterAllow = options.allowedFilters
      ? new Set(options.allowedFilters)
      : null;
    const cols: ColumnDef<TData>[] = fields.map((field) => {
      const custom = customMap.get(field);
      return buildDataColumn<TData>(
        field,
        custom,
        options.sortable ?? false,
        sortAllow,
        filterAllow,
        options.refresh,
      );
    });
    for (const add of options.addColumns ?? []) {
      const col = buildAddedColumn<TData>(add, options.refresh);
      if (add.position === "start") {
        cols.unshift(col);
      } else if (typeof add.position === "number") {
        const idx = Math.max(0, Math.min(cols.length, add.position));
        cols.splice(idx, 0, col);
      } else {
        cols.push(col);
      }
    }
    return cols;
  }, [
    options.fields,
    options.visibleColumns,
    options.hideColumns,
    options.customColumns,
    options.addColumns,
    options.sortable,
    options.allowedSorts,
    options.allowedFilters,
    options.refresh,
  ]);
}

function buildDataColumn<TData>(
  field: string,
  custom: CustomColumnDef<TData> | undefined,
  defaultSortable: boolean,
  sortAllow: Set<string> | null,
  filterAllow: Set<string> | null,
  refresh: () => void,
): DataColumnDef<TData> {
  const sortKey = custom?.sortKey ?? field;
  const filterKey = custom?.filterKey ?? field;
  const sortableInherited =
    defaultSortable && (sortAllow ? sortAllow.has(sortKey) : true);
  const sortable =
    custom?.sortable !== undefined ? custom.sortable : sortableInherited;
  const filterPermitted =
    !filterAllow || filterAllow.has(filterKey);
  const filterableInherited = custom?.filterable !== false && filterPermitted;
  const filter = filterableInherited ? custom?.filter : undefined;
  const col: DataColumnDef<TData> = {
    id: field,
    type: "data",
    header: custom?.label ?? humanize(field),
    width: custom?.width,
    minWidth: custom?.minWidth,
    maxWidth: custom?.maxWidth,
    align: custom?.align,
    sticky: custom?.sticky,
    hideable: custom?.hideable,
    visible: custom?.visible,
    sortable,
    sortKey: custom?.sortKey,
    filter,
    filterKey: custom?.filterKey,
    searchable: custom?.searchable,
    className: custom?.className,
    headerClassName: custom?.headerClassName,
    cellClassName: custom?.cellClassName,
  };
  if (custom?.accessor) {
    col.accessorFn = custom.accessor;
  } else {
    col.accessorKey = field as keyof TData & string;
  }
  if (custom?.render) {
    const userRender = custom.render;
    col.cell = (ctx: CellContext<TData>) =>
      userRender(ctx.value, ctx.row, {
        rowId: ctx.rowId,
        rowIndex: ctx.rowIndex,
        refresh,
      });
  }
  return col;
}

function buildAddedColumn<TData>(
  add: AddedColumnDef<TData>,
  refresh: () => void,
): ColumnDef<TData> {
  const type = add.type ?? "data";
  if (type === "select") {
    return {
      id: add.field,
      type: "select",
      header: add.label,
      width: add.width,
      minWidth: add.minWidth,
      maxWidth: add.maxWidth,
      align: add.align,
      sticky: add.sticky,
      className: add.className,
      headerClassName: add.headerClassName,
      cellClassName: add.cellClassName,
    };
  }
  if (type === "drag") {
    return {
      id: add.field,
      type: "drag",
      header: add.label,
      width: add.width,
      sticky: add.sticky,
    };
  }
  if (type === "expander") {
    return {
      id: add.field,
      type: "expander",
      header: add.label,
      width: add.width,
    };
  }
  if (type === "actions") {
    return {
      id: add.field,
      type: "actions",
      header: add.label,
      width: add.width ?? 56,
      sticky: add.sticky ?? "right",
      align: add.align ?? "right",
      cellClassName: add.cellClassName,
      cell: (ctx: CellContext<TData>) =>
        add.render
          ? add.render(undefined, ctx.row, makeSchemaCtx(ctx, refresh))
          : null,
    };
  }
  const col: DataColumnDef<TData> = {
    id: add.field,
    type: "data",
    accessorFn: add.accessor,
    header: add.label ?? humanize(add.field),
    width: add.width,
    minWidth: add.minWidth,
    maxWidth: add.maxWidth,
    align: add.align,
    sticky: add.sticky,
    sortable: add.sortable ?? false,
    hideable: add.hideable,
  };
  if (add.render) {
    const userRender = add.render;
    col.cell = (ctx: CellContext<TData>) =>
      userRender(ctx.value, ctx.row, makeSchemaCtx(ctx, refresh));
  }
  return col;
}

function makeSchemaCtx<TData>(
  ctx: CellContext<TData>,
  refresh: () => void,
): SchemaCellContext {
  return {
    rowId: ctx.rowId,
    rowIndex: ctx.rowIndex,
    refresh,
  };
}

function humanize(field: string): string {
  return field
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
