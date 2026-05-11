"use client";

import * as React from "react";
import type {
  DataSource,
  FetchResult,
  RequestConfig,
  RequestState,
  RequestStatus,
  TableQueryState,
} from "./types";
import { serializeQueryState } from "./state";

const DEFAULT_REQUEST_CONFIG: Required<
  Pick<RequestConfig, "debounceMs" | "keepPreviousData" | "refetchOnWindowFocus" | "refetchOnReconnect">
> = {
  debounceMs: 300,
  keepPreviousData: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

export interface UseDataSourceReturn<TData> extends RequestState<TData> {
  /** Refetch the current state without changing it. */
  refresh: () => void;
}

/** Drives the fetch lifecycle for a remote (or static) `DataSource`. */
export function useDataSource<TData>(
  source: DataSource<TData>,
  state: TableQueryState,
  config: RequestConfig = {},
): UseDataSourceReturn<TData> {
  const merged = { ...DEFAULT_REQUEST_CONFIG, ...config };
  const sourceRef = React.useRef(source);
  sourceRef.current = source;

  const [status, setStatus] = React.useState<RequestStatus>("idle");
  const [data, setData] = React.useState<FetchResult<TData> | null>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const queryKey = serializeQueryState(state);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  const runFetch = React.useCallback(
    async (current: TableQueryState) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsFetching(true);
      if (!merged.keepPreviousData) {
        setStatus("loading");
        setData(null);
      } else if (data == null) {
        setStatus("loading");
      }

      const retryCfg = merged.retry;
      let attempt = 0;
      const maxAttempts = retryCfg ? Math.max(1, retryCfg.count + 1) : 1;
      const baseDelay = retryCfg?.baseDelayMs ?? 400;
      const backoff = retryCfg?.backoff ?? "exponential";

      while (attempt < maxAttempts) {
        try {
          const result = await sourceRef.current.fetch(current, controller.signal);
          if (controller.signal.aborted) return;
          setData(result);
          setError(null);
          setStatus("success");
          setIsFetching(false);
          return;
        } catch (err) {
          if (controller.signal.aborted) return;
          attempt += 1;
          if (attempt >= maxAttempts) {
            setError(err);
            setStatus("error");
            setIsFetching(false);
            return;
          }
          const delay =
            backoff === "exponential"
              ? baseDelay * 2 ** (attempt - 1)
              : baseDelay * attempt;
          await sleep(delay, controller.signal);
          if (controller.signal.aborted) return;
        }
      }
    },
    [merged.keepPreviousData, merged.retry, data],
  );

  React.useEffect(() => {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const debounce = merged.debounceMs;
    if (debounce > 0) {
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        void runFetch(stateRef.current);
      }, debounce);
    } else {
      void runFetch(stateRef.current);
    }

    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
    // Refetch when the source identity changes (e.g. endpoint switched).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, refreshTick, merged.debounceMs, source]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    if (!merged.refetchOnWindowFocus) return;
    const onFocus = () => setRefreshTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [merged.refetchOnWindowFocus]);

  React.useEffect(() => {
    if (!merged.refetchOnReconnect) return;
    const onOnline = () => setRefreshTick((t) => t + 1);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [merged.refetchOnReconnect]);

  React.useEffect(() => {
    const interval = config.refetchInterval;
    if (!interval || interval <= 0) return;
    const id = window.setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, interval);
    return () => window.clearInterval(id);
  }, [config.refetchInterval]);

  const refresh = React.useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return { status, data, error, isFetching, refresh };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
  });
}
