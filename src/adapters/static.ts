import type {
  DataSource,
  FetchResult,
  FilterValue,
  RowId,
  SortValue,
  TableQueryState,
} from "../components/data-table/types";

export interface StaticAdapterOptions<TData> {
  data: TData[];
  getRowId?: (row: TData, index: number) => RowId;
  searchFields?: (keyof TData & string)[];
  sortFns?: Record<string, (a: TData, b: TData) => number>;
  filterFns?: Record<string, (row: TData, filter: FilterValue) => boolean>;
}

export function staticAdapter<TData>(
  options: StaticAdapterOptions<TData>,
): DataSource<TData> {
  const {
    data,
    searchFields,
    sortFns = {},
    filterFns = {},
  } = options;
  return {
    capabilities: {
      serverSort: false,
      serverFilter: false,
      serverSearch: false,
      serverPagination: "offset",
      multiSort: true,
      includes: false,
    },
    async fetch(state: TableQueryState): Promise<FetchResult<TData>> {
      let rows = data.slice();
      if (state.filters.length > 0) {
        rows = rows.filter((row) =>
          state.filters.every((f) => {
            const custom = filterFns[f.column];
            if (custom) return custom(row, f);
            const value = (row as Record<string, unknown>)[f.column];
            return matchOperator(value, f);
          }),
        );
      }
      if (state.search.trim()) {
        const needle = state.search.trim().toLowerCase();
        const fields =
          searchFields ??
          (rows.length > 0
            ? (Object.keys(rows[0] as Record<string, unknown>) as (keyof TData & string)[])
            : []);
        rows = rows.filter((row) =>
          fields.some((field) => {
            const value = (row as Record<string, unknown>)[field];
            return value != null && String(value).toLowerCase().includes(needle);
          }),
        );
      }
      if (state.sorting.length > 0) {
        rows.sort((a, b) => compareWithSorts(a, b, state.sorting, sortFns));
      }
      const total = rows.length;
      let pageRows = rows;
      if (state.pagination.mode === "offset") {
        const { page, pageSize } = state.pagination;
        const start = (Math.max(1, page) - 1) * pageSize;
        pageRows = rows.slice(start, start + pageSize);
      }
      return { rows: pageRows, total };
    },
  };
}

function compareWithSorts<TData>(
  a: TData,
  b: TData,
  sorting: SortValue[],
  customSortFns: Record<string, (a: TData, b: TData) => number>,
): number {
  for (const sort of sorting) {
    const custom = customSortFns[sort.column];
    let cmp: number;
    if (custom) {
      cmp = custom(a, b);
    } else {
      const av = (a as Record<string, unknown>)[sort.column];
      const bv = (b as Record<string, unknown>)[sort.column];
      cmp = compareValues(av, bv);
    }
    if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
  }
  return 0;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function matchOperator(value: unknown, filter: FilterValue): boolean {
  switch (filter.operator) {
    case "eq":
      return looseEquals(value, filter.value);
    case "neq":
      return !looseEquals(value, filter.value);
    case "gt":
      return compareValues(value, filter.value) > 0;
    case "gte":
      return compareValues(value, filter.value) >= 0;
    case "lt":
      return compareValues(value, filter.value) < 0;
    case "lte":
      return compareValues(value, filter.value) <= 0;
    case "contains":
      return value != null &&
        String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case "starts_with":
      return value != null &&
        String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
    case "ends_with":
      return value != null &&
        String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
    case "in":
      return Array.isArray(filter.value) &&
        filter.value.some((v) => looseEquals(value, v));
    case "not_in":
      return Array.isArray(filter.value) &&
        !filter.value.some((v) => looseEquals(value, v));
    case "between": {
      if (!Array.isArray(filter.value) || filter.value.length !== 2) return true;
      const [min, max] = filter.value;
      return (
        compareValues(value, min) >= 0 && compareValues(value, max) <= 0
      );
    }
    case "is_null":
      return value == null;
    case "is_not_null":
      return value != null;
    case "is_true":
      return value === true;
    case "is_false":
      return value === false;
    default:
      return true;
  }
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}
