import type {
  DataSource,
  FetchResult,
  TableQueryState,
} from "../components/data-table/types";
import {
  buildUrl,
  defaultFetcher,
  flattenSorts,
  isUnaryOperator,
  jsonFetch,
  paginationParams,
  valueToParam,
  type Fetcher,
} from "./shared";

/** Path mapping for Laravel ResourceCollection pagination meta. Every key
 *  defaults to the `LengthAwarePaginator` convention; override only the
 *  paths that differ in your API. */
export interface LaravelPaginationOptions {
  /** Default `"meta.current_page"`. */
  currentPage?: string;
  /** Default `"meta.last_page"`. */
  lastPage?: string;
  /** Default `"meta.per_page"`. */
  perPage?: string;
  /** Default `"meta.total"`. */
  total?: string;
  /** Default `"meta.path"`. */
  path?: string;
  /** Default `"meta.from"`. */
  from?: string;
  /** Default `"meta.to"`. */
  to?: string;
  /** Default `"links"`. */
  links?: string;
}

export interface LaravelAdapterOptions {
  /** Endpoint that returns a Laravel ResourceCollection (`{ data, meta }`). */
  endpoint: string;
  /** Custom fetcher (axios, ky, fetch wrapper). Defaults to `fetch`. */
  fetcher?: Fetcher;
  /** Override the query-string param names. */
  paramNames?: {
    /** Default `"page"`. For Spatie bracketed pagination use `"page[number]"`. */
    page?: string;
    /** Default `"per_page"`. For Spatie bracketed pagination use `"page[size]"`. */
    pageSize?: string;
    /** Default `"sort"`. Comma-separated, `-` prefix for desc. */
    sort?: string;
    /** Default `"q"`. For Spatie global search use `"filter[search]"`. */
    search?: string;
    /** Default `"include"`. Eager-load relations. */
    include?: string;
  };
  /** Headers attached to every request (auth, CSRF, …). */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** Override how the row array is extracted from the response. */
  responseShape?: {
    /** Default `"data"`. */
    rows?: string;
  };
  /** Override the response paths the table reads for pagination meta. */
  paginationOptions?: LaravelPaginationOptions;
  /** Sparse fieldsets: `?fields[articles]=id,title,slug`. Map of resource
   *  name → field list. */
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
        if (isUnaryOperator(f.operator)) {
          sp.append(`filter[${f.column}][${f.operator}]`, "1");
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
