import type {
  DataSource,
  FetchResult,
  TableQueryState,
} from "../components/data-table/types";
import {
  buildUrl,
  defaultFetcher,
  flattenSorts,
  jsonFetch,
  paginationParams,
  valueToParam,
  type Fetcher,
} from "./shared";

export interface LaravelPaginationOptions {
  currentPage?: string;
  lastPage?: string;
  perPage?: string;
  total?: string;
  path?: string;
  from?: string;
  to?: string;
  links?: string;
}

export interface LaravelAdapterOptions {
  endpoint: string;
  fetcher?: Fetcher;
  paramNames?: {
    page?: string;
    pageSize?: string;
    sort?: string;
    search?: string;
    include?: string;
  };
  headers?: Record<string, string> | (() => Record<string, string>);
  responseShape?: {
    rows?: string;
  };
  paginationOptions?: LaravelPaginationOptions;
  sparseFields?: Record<string, string[]>;
}

export function laravelAdapter<TData>(
  options: LaravelAdapterOptions,
): DataSource<TData> {
  const fetcher = options.fetcher ?? defaultFetcher;
  const names = options.paramNames ?? {};
  const shape = options.responseShape ?? {};
  const paginationPaths = options.paginationOptions ?? {};
  return {
    capabilities: {
      serverSort: true,
      serverFilter: true,
      serverSearch: true,
      serverPagination: "offset",
      multiSort: true,
    },
    async fetch(state: TableQueryState, signal: AbortSignal) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(
        paginationParams(state, {
          page: names.page,
          pageSize: names.pageSize,
        }),
      )) {
        sp.set(k, v);
      }
      if (state.sorting.length > 0) {
        sp.set(names.sort ?? "sort", flattenSorts(state.sorting));
      }
      if (state.search.trim()) {
        sp.set(names.search ?? "q", state.search.trim());
      }
      for (const f of state.filters) {
        if (f.operator === "is_true") {
          sp.append(`filter[${f.column}]`, "1");
          continue;
        }
        if (f.operator === "is_false") {
          sp.append(`filter[${f.column}]`, "0");
          continue;
        }
        if (f.operator === "is_null") {
          sp.append(`filter[${f.column}]`, "null");
          continue;
        }
        if (f.operator === "is_not_null") {
          sp.append(`filter[${f.column}][not_null]`, "1");
          continue;
        }
        sp.append(`filter[${f.column}]`, valueToParam(f.value));
      }
      if (state.includes.length > 0) {
        sp.set(names.include ?? "include", state.includes.join(","));
      }
      if (options.sparseFields) {
        for (const [resource, fields] of Object.entries(options.sparseFields)) {
          if (fields.length > 0) {
            sp.set(`fields[${resource}]`, fields.join(","));
          }
        }
      }
      const url = buildUrl({ endpoint: options.endpoint, params: sp });
      const headers =
        typeof options.headers === "function"
          ? options.headers()
          : options.headers;
      const body = await jsonFetch<Record<string, unknown>>(
        fetcher,
        url,
        signal,
        { headers },
      );
      const rowsPath = shape.rows ?? "data";
      const totalPath = paginationPaths.total ?? "meta.total";
      const rows = pickAt(body, rowsPath) as TData[];
      const total = pickAt(body, totalPath);
      return {
        rows: Array.isArray(rows) ? rows : [],
        total: typeof total === "number" ? total : undefined,
        meta: (body.meta as Record<string, unknown>) ?? undefined,
      } satisfies FetchResult<TData>;
    },
  };
}

function pickAt(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (cur, seg) => (cur == null ? cur : (cur as Record<string, unknown>)[seg]),
      obj,
    );
}
