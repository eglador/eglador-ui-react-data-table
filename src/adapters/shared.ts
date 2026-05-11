import type {
  SortValue,
  TableQueryState,
} from "../components/data-table/types";

export type Fetcher = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export const defaultFetcher: Fetcher = (url, init) => fetch(url, init);

export function buildUrl(options: {
  endpoint: string;
  params: URLSearchParams | string[][] | Record<string, string>;
}): string {
  const sp =
    options.params instanceof URLSearchParams
      ? options.params
      : new URLSearchParams(options.params as Record<string, string>);
  const qs = sp.toString();
  if (!qs) return options.endpoint;
  const join = options.endpoint.includes("?") ? "&" : "?";
  return options.endpoint + join + qs;
}

export async function jsonFetch<T>(
  fetcher: Fetcher,
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<T> {
  const res = await fetcher(url, {
    ...init,
    signal,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AdapterError(
      `Request failed (${res.status} ${res.statusText})`,
      res.status,
      text,
    );
  }
  return (await res.json()) as T;
}

export class AdapterError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "AdapterError";
    this.status = status;
    this.body = body;
  }
}

export function flattenSorts(sorting: SortValue[]): string {
  return sorting
    .map((s) => (s.direction === "desc" ? `-${s.column}` : s.column))
    .join(",");
}

export function paginationParams(
  state: TableQueryState,
  names: { page?: string; pageSize?: string } = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.pagination.mode === "offset") {
    out[names.page ?? "page"] = String(state.pagination.page);
    out[names.pageSize ?? "per_page"] = String(state.pagination.pageSize);
  }
  return out;
}

export function valueToParam(value: unknown): string {
  if (Array.isArray(value)) return value.map(valueToParam).join(",");
  if (value instanceof Date) return value.toISOString();
  if (value == null) return "";
  return String(value);
}
