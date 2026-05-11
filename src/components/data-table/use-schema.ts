"use client";

import * as React from "react";
import type { ResourceSchema } from "./types";

const inflight = new Map<string, Promise<ResourceSchema>>();
const resolved = new Map<string, ResourceSchema>();

export interface UseSchemaResult {
  schema: ResourceSchema | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useSchema(
  endpoint: string | null | undefined,
  headers?: Record<string, string> | (() => Record<string, string>),
): UseSchemaResult {
  const [schema, setSchema] = React.useState<ResourceSchema | null>(() =>
    endpoint ? resolved.get(endpoint) ?? null : null,
  );
  const [isLoading, setIsLoading] = React.useState(
    !!endpoint && !resolved.has(endpoint),
  );
  const [error, setError] = React.useState<unknown>(null);
  const [tick, setTick] = React.useState(0);

  const headersRef = React.useRef(headers);
  headersRef.current = headers;

  React.useEffect(() => {
    if (!endpoint) {
      setSchema(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = resolved.get(endpoint);
    if (cached && tick === 0) {
      setSchema(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (tick > 0) {
      inflight.delete(endpoint);
      resolved.delete(endpoint);
    }

    setIsLoading(true);
    setError(null);
    let cancelled = false;

    let promise = inflight.get(endpoint);
    if (!promise) {
      const h = headersRef.current;
      const resolvedHeaders = typeof h === "function" ? h() : h;
      promise = fetch(endpoint, {
        headers: { Accept: "application/json", ...(resolvedHeaders ?? {}) },
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `Schema fetch failed (${res.status} ${res.statusText})`,
          );
        }
        const body = (await res.json()) as { data?: ResourceSchema } | ResourceSchema;
        const data =
          (body as { data?: ResourceSchema }).data ?? (body as ResourceSchema);
        resolved.set(endpoint, data);
        return data;
      });
      inflight.set(endpoint, promise);
    }

    promise
      .then((data) => {
        if (cancelled) return;
        setSchema(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        inflight.delete(endpoint);
        setError(err);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  return { schema, isLoading, error, refresh };
}

export function inferSchemaEndpoint(endpoint: string): string {
  const queryIndex = endpoint.indexOf("?");
  const path = queryIndex === -1 ? endpoint : endpoint.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : endpoint.slice(queryIndex);
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return `schema/${path}${query}`;
  return path.slice(0, lastSlash) + "/schema" + path.slice(lastSlash) + query;
}
