"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useDataTableContext } from "../context";
import { FilterIcon, PlusIcon, XIcon } from "../icons";
import { Popover } from "./popover";
import type {
  ColumnDef,
  ColumnFilterConfig,
  DataColumnDef,
  FilterOperator,
  FilterOption,
  FilterValue,
} from "../types";

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "is",
  neq: "is not",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contains",
  starts_with: "starts with",
  ends_with: "ends with",
  in: "is any of",
  not_in: "is none of",
  between: "between",
  is_null: "is empty",
  is_not_null: "is not empty",
  is_true: "is true",
  is_false: "is false",
};

const OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  text: ["contains", "eq", "neq", "starts_with", "ends_with", "is_null", "is_not_null"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_null", "is_not_null"],
  date: ["eq", "gt", "gte", "lt", "lte", "between", "is_null", "is_not_null"],
  select: ["eq", "neq", "in", "not_in", "is_null", "is_not_null"],
  "multi-select": ["in", "not_in"],
  boolean: ["is_true", "is_false", "is_null", "is_not_null"],
};

function getFilterableColumns(
  columns: ColumnDef<unknown>[],
): DataColumnDef<unknown>[] {
  return columns.filter(
    (c): c is DataColumnDef<unknown> =>
      c.type !== "select" &&
      c.type !== "drag" &&
      c.type !== "actions" &&
      c.type !== "expander" &&
      (c as DataColumnDef<unknown>).filter != null,
  );
}

function defaultOperatorFor(config: ColumnFilterConfig): FilterOperator {
  if ("defaultOperator" in config && config.defaultOperator) {
    return config.defaultOperator;
  }
  switch (config.type) {
    case "text":
      return "contains";
    case "number":
      return "eq";
    case "date":
      return "eq";
    case "select":
      return "eq";
    case "multi-select":
      return "in";
    case "boolean":
      return "is_true";
    case "custom":
      return "eq";
  }
}

function allowedOperatorsFor(config: ColumnFilterConfig): FilterOperator[] {
  if (
    "allowedOperators" in config &&
    config.allowedOperators &&
    config.allowedOperators.length > 0
  ) {
    return config.allowedOperators;
  }
  return OPERATORS_BY_TYPE[config.type] ?? ["eq"];
}

export interface DataTableFilterBarProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DataTableFilterBar({
  className,
  ...rest
}: DataTableFilterBarProps) {
  const table = useDataTableContext();
  const filterableColumns = getFilterableColumns(table.columns);
  if (filterableColumns.length === 0) return null;
  return (
    <div
      data-data-table-filter-bar=""
      className={cn(
        "flex items-center gap-1.5 flex-wrap",
        className,
      )}
      {...rest}
    >
      {table.filters.value.map((filter) => (
        <FilterChip key={filter.id} filter={filter} />
      ))}
      <DataTableAddFilter />
      {table.filters.value.length > 0 && (
        <button
          type="button"
          onClick={() => table.filters.clear()}
          className="ml-1 px-2 h-7 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
DataTableFilterBar.displayName = "DataTable.FilterBar";

function FilterChip({ filter }: { filter: FilterValue }) {
  const table = useDataTableContext();
  const column = table.columns.find(
    (c) =>
      c.id === filter.column ||
      ((c as DataColumnDef<unknown>).filterKey ?? c.id) === filter.column,
  ) as DataColumnDef<unknown> | undefined;
  const config = column?.filter;
  const headerLabel =
    typeof column?.header === "string"
      ? (column.header as string)
      : (filter.column);
  return (
    <Popover
      align="start"
      contentClassName="p-3 min-w-[18rem]"
      trigger={
        <span
          role="button"
          tabIndex={0}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 pl-2 pr-1 text-xs rounded-sm",
            "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
            "cursor-pointer",
          )}
        >
          <span className="font-medium text-zinc-900">{headerLabel}</span>
          <span className="text-zinc-500">{OPERATOR_LABELS[filter.operator]}</span>
          {!isUnaryOperator(filter.operator) && (
            <span className="text-zinc-700 truncate max-w-[8rem]">
              {formatFilterValue(filter, config)}
            </span>
          )}
          <button
            type="button"
            aria-label="Remove filter"
            onClick={(e) => {
              e.stopPropagation();
              table.filters.remove(filter.id);
            }}
            className="inline-flex items-center justify-center size-5 rounded-sm text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      }
    >
      {(close) =>
        config ? (
          <FilterEditor
            column={column!}
            filter={filter}
            onSave={(patch) => {
              table.filters.update(filter.id, patch);
              close();
            }}
            onCancel={close}
          />
        ) : null
      }
    </Popover>
  );
}

export function DataTableAddFilter() {
  const table = useDataTableContext();
  const filterableColumns = getFilterableColumns(table.columns);
  const [pickedColumn, setPickedColumn] =
    React.useState<DataColumnDef<unknown> | null>(null);
  return (
    <Popover
      align="start"
      contentClassName="p-2 min-w-[14rem]"
      onOpenChange={(open) => {
        if (!open) setPickedColumn(null);
      }}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 text-xs rounded-sm",
            "border border-dashed border-zinc-300 bg-white text-zinc-700",
            "hover:bg-zinc-50 hover:border-zinc-400 hover:text-zinc-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
            "cursor-pointer transition-colors",
          )}
        >
          <PlusIcon className="size-3.5" />
          <span>Add filter</span>
        </button>
      }
    >
      {(close) => {
        if (!pickedColumn) {
          return (
            <div className="py-1">
              <div className="px-2 py-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                <FilterIcon className="size-3" />
                Filter by
              </div>
              <div className="max-h-72 overflow-auto">
                {filterableColumns.map((col) => {
                  const label =
                    typeof col.header === "string" ? (col.header as string) : col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setPickedColumn(col)}
                      className="w-full text-left px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-sm cursor-pointer"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <FilterEditor
            column={pickedColumn}
            filter={null}
            onSave={(patch) => {
              const filterKey =
                pickedColumn.filterKey ?? pickedColumn.id;
              table.filters.add({
                column: filterKey,
                operator: patch.operator!,
                value: patch.value,
              });
              setPickedColumn(null);
              close();
            }}
            onCancel={() => {
              setPickedColumn(null);
              close();
            }}
          />
        );
      }}
    </Popover>
  );
}
DataTableAddFilter.displayName = "DataTable.AddFilter";

interface FilterEditorProps {
  column: DataColumnDef<unknown>;
  filter: FilterValue | null;
  onSave: (patch: Partial<Omit<FilterValue, "id">>) => void;
  onCancel: () => void;
}

function FilterEditor({ column, filter, onSave, onCancel }: FilterEditorProps) {
  const config = column.filter!;
  const allowed = allowedOperatorsFor(config);
  const [operator, setOperator] = React.useState<FilterOperator>(
    filter?.operator ?? defaultOperatorFor(config),
  );
  const [value, setValue] = React.useState<unknown>(filter?.value ?? defaultValueFor(config, operator));
  const onOperatorChange = (op: FilterOperator) => {
    setOperator(op);
    if (op !== operator) {
      setValue(defaultValueFor(config, op));
    }
  };
  const headerLabel =
    typeof column.header === "string" ? (column.header as string) : column.id;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-zinc-700">{headerLabel}</div>
      <div className="flex items-center gap-2">
        <select
          value={operator}
          onChange={(e) => onOperatorChange(e.target.value as FilterOperator)}
          className="h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 cursor-pointer"
        >
          {allowed.map((op) => (
            <option key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </option>
          ))}
        </select>
        {!isUnaryOperator(operator) && (
          <FilterValueInput
            config={config}
            operator={operator}
            value={value}
            onChange={setValue}
          />
        )}
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 h-7 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave({ operator, value })}
          disabled={!isUnaryOperator(operator) && isEmptyValue(value)}
          className="px-2 h-7 text-xs rounded-sm bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {filter ? "Update" : "Apply"}
        </button>
      </div>
    </div>
  );
}

function FilterValueInput({
  config,
  operator,
  value,
  onChange,
}: {
  config: ColumnFilterConfig;
  operator: FilterOperator;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (config.type === "text") {
    return (
      <input
        type="text"
        value={(value as string) ?? ""}
        placeholder={config.placeholder ?? "Value"}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
      />
    );
  }
  if (config.type === "number") {
    if (operator === "between") {
      const [min, max] = Array.isArray(value)
        ? (value as [unknown, unknown])
        : ["", ""];
      return (
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="number"
            value={(min as number | string) ?? ""}
            onChange={(e) =>
              onChange([
                e.target.value === "" ? "" : Number(e.target.value),
                max,
              ])
            }
            className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white"
          />
          <span className="text-xs text-zinc-400">…</span>
          <input
            type="number"
            value={(max as number | string) ?? ""}
            onChange={(e) =>
              onChange([
                min,
                e.target.value === "" ? "" : Number(e.target.value),
              ])
            }
            className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white"
          />
        </div>
      );
    }
    return (
      <input
        type="number"
        value={(value as number | string) ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
      />
    );
  }
  if (config.type === "date") {
    if (operator === "between") {
      const [min, max] = Array.isArray(value)
        ? (value as [string, string])
        : ["", ""];
      return (
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="date"
            value={min ?? ""}
            onChange={(e) => onChange([e.target.value, max])}
            className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white"
          />
          <span className="text-xs text-zinc-400">…</span>
          <input
            type="date"
            value={max ?? ""}
            onChange={(e) => onChange([min, e.target.value])}
            className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white"
          />
        </div>
      );
    }
    return (
      <input
        type="date"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
      />
    );
  }
  if (config.type === "select" || config.type === "multi-select") {
    return (
      <SelectFilterInput
        config={config}
        operator={operator}
        value={value}
        onChange={onChange}
      />
    );
  }
  if (config.type === "boolean") {
    return null;
  }
  if (config.type === "custom") {
    return (
      <>
        {config.render({
          value,
          operator,
          onChange,
          onOperatorChange: () => {},
        })}
      </>
    );
  }
  return null;
}

function SelectFilterInput({
  config,
  operator,
  value,
  onChange,
}: {
  config: Extract<ColumnFilterConfig, { type: "select" | "multi-select" }>;
  operator: FilterOperator;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [options, setOptions] = React.useState<FilterOption[]>(() =>
    Array.isArray(config.options) ? config.options : [],
  );
  React.useEffect(() => {
    if (Array.isArray(config.options)) {
      setOptions(config.options);
      return;
    }
    let cancelled = false;
    Promise.resolve(config.options()).then((opts) => {
      if (!cancelled) setOptions(opts);
    });
    return () => {
      cancelled = true;
    };
  }, [config.options]);
  const isMulti =
    config.type === "multi-select" || operator === "in" || operator === "not_in";
  if (isMulti) {
    const arr = Array.isArray(value) ? (value as (string | number | boolean)[]) : [];
    return (
      <div className="flex flex-col gap-1 flex-1 max-h-44 overflow-auto rounded-sm border border-zinc-200 p-1.5 bg-white">
        {options.map((opt) => {
          const selected = arr.some((v) => looseEq(v, opt.value));
          return (
            <label
              key={String(opt.value)}
              className="flex items-center gap-2 px-1.5 py-1 text-xs rounded-sm hover:bg-zinc-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => {
                  const next = selected
                    ? arr.filter((v) => !looseEq(v, opt.value))
                    : [...arr, opt.value];
                  onChange(next);
                }}
                className="size-3.5 rounded-sm border-zinc-300"
              />
              <span className="flex-1 truncate text-zinc-700">{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }
  return (
    <select
      value={(value as string | number) ?? ""}
      onChange={(e) => onChange(coerceOptionValue(e.target.value, options))}
      className="flex-1 h-8 px-2 text-xs rounded-sm border border-zinc-200 bg-white text-zinc-900 cursor-pointer"
    >
      <option value="">—</option>
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {typeof opt.label === "string" ? opt.label : String(opt.value)}
        </option>
      ))}
    </select>
  );
}

function isUnaryOperator(op: FilterOperator): boolean {
  return op === "is_null" || op === "is_not_null" || op === "is_true" || op === "is_false";
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (value === "") return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.every(isEmptyValue);
  }
  return false;
}

function defaultValueFor(config: ColumnFilterConfig, operator: FilterOperator): unknown {
  if (operator === "between") return ["", ""];
  if (operator === "in" || operator === "not_in") return [];
  if (config.type === "number") return "";
  if (config.type === "multi-select") return [];
  return "";
}

function looseEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function coerceOptionValue(
  raw: string,
  options: FilterOption[],
): string | number | boolean {
  const match = options.find((o) => String(o.value) === raw);
  return match ? match.value : raw;
}

function formatFilterValue(
  filter: FilterValue,
  config?: ColumnFilterConfig,
): string {
  const v = filter.value;
  if (v == null) return "";
  if (Array.isArray(v)) {
    if (filter.operator === "between") return `${v[0] ?? ""} – ${v[1] ?? ""}`;
    if (
      (config?.type === "select" || config?.type === "multi-select") &&
      Array.isArray(config.options)
    ) {
      return v
        .map((x) => {
          const opt = (config.options as FilterOption[]).find((o) =>
            looseEq(o.value, x),
          );
          return opt && typeof opt.label === "string"
            ? (opt.label as string)
            : String(x);
        })
        .join(", ");
    }
    return v.map((x) => String(x)).join(", ");
  }
  if (config?.type === "select" && Array.isArray(config.options)) {
    const opt = config.options.find((o) => looseEq(o.value, v));
    if (opt && typeof opt.label === "string") return opt.label as string;
  }
  return String(v);
}
